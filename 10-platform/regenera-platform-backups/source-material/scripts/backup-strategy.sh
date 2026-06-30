#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# REGENERA BANK - TRIPLE BACKUP STRATEGY SCRIPT
# Developer: Don Paulo Ricardo
#
# NOTICE: This script manages the lifeblood of our bank - the data.
# It implements a 3-tier backup strategy for our production PostgreSQL database.
# This should be run via a secure, monitored cron job on a dedicated admin host.
# ══════════════════════════════════════════════════════════════════════════════

set -e
set -o pipefail

# --- Configuration ---
# Valores devem ser injetados por um sistema seguro, não hardcoded.
readonly DB_NAME=${DB_NAME:-"regenera_bank_prod"}
readonly DB_USER=${DB_USER:-"regenera_backup_user"} # Usuário com permissões de LEITURA apenas.
readonly DB_HOST=${DB_HOST:-"localhost"}

# Tier 1: Local backup for fast recovery.
readonly LOCAL_BACKUP_DIR="/var/backups/postgres/daily"

# Tier 2: Primary cloud storage in the main region.
readonly PRIMARY_S3_BUCKET="s3://regenera-bank-prod-db-backups-us-east-1"

# Tier 3: Disaster Recovery cloud storage in a different region.
readonly DR_S3_BUCKET="s3://regenera-bank-prod-db-backups-dr-us-west-2"

# Retention policy: how many days to keep local backups. S3 has its own lifecycle policies.
readonly LOCAL_RETENTION_DAYS=7

readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly FILENAME="regenera_prod_db_backup_${TIMESTAMP}.sql.gz"
readonly LOCAL_FILE_PATH="${LOCAL_BACKUP_DIR}/${FILENAME}"

# --- Functions ---
log() {
  echo "[BACKUP-STRATEGY][$(date --iso-8601=seconds)] - $1"
}

notify_failure() {
  local message="FATAL: Regenera Bank backup process failed. Stage: $1"
  log "$message"
  # TODO: Integrate with PagerDuty.
}

# Ensure we don't proceed without essential tools.
check_dependencies() {
  log "Checking dependencies (pg_dump, aws)..."
  if ! command -v pg_dump &> /dev/null || ! command -v aws &> /dev/null; then
    notify_failure "Dependency Check"
    log "FATAL: pg_dump or aws-cli could not be found."
    exit 1
  fi
  log "Dependencies are present."
}

# Tier 1: Create a local, compressed backup.
create_local_backup() {
  log "Starting Tier 1: Local Backup."
  mkdir -p "$LOCAL_BACKUP_DIR"
  
  export PGPASSWORD=$DB_PROD_PASSWORD 
  
  log "Dumping database '${DB_NAME}' to '${LOCAL_FILE_PATH}'..."
  pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --format=c --blobs | gzip > "$LOCAL_FILE_PATH"
  
  if [ ${PIPESTATUS[0]} -ne 0 ]; then
    notify_failure "Tier 1: pg_dump"
    log "FATAL: pg_dump command failed."
    rm -f "$LOCAL_FILE_PATH" # Clean up failed artifact.
    exit 1
  fi

  unset PGPASSWORD # Unset the password immediately after use.
  log "Tier 1 complete. Local backup created. Size: $(du -h $LOCAL_FILE_PATH | cut -f1)."
}

# Tier 2: Upload to primary S3 bucket.
upload_to_primary_s3() {
  log "Starting Tier 2: Primary S3 Upload."
  aws s3 cp "$LOCAL_FILE_PATH" "$PRIMARY_S3_BUCKET/" --sse AES256
  if [ $? -ne 0 ]; then
    notify_failure "Tier 2: Primary S3 Upload"
    log "FATAL: AWS S3 upload to primary bucket failed."
    exit 1
  fi
  log "Tier 2 complete."
}

# Tier 3: Upload to disaster recovery S3 bucket.
upload_to_dr_s3() {
  log "Starting Tier 3: Disaster Recovery S3 Upload."
  aws s3 cp "$LOCAL_FILE_PATH" "$DR_S3_BUCKET/" --sse AES256
  if [ $? -ne 0 ]; then
    notify_failure "Tier 3: DR S3 Upload"
    log "FATAL: AWS S3 upload to DR bucket failed."
  else
    log "Tier 3 complete."
  fi
}

# Clean up old local backups.
cleanup_local_backups() {
  log "Cleaning up local backups older than ${LOCAL_RETENTION_DAYS} days..."
  find "$LOCAL_BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$LOCAL_RETENTION_DAYS" -exec rm -f {} \;
  log "Cleanup complete."
}

# --- Main Execution ---
main() {
    log "====== INITIATING REGENERA BANK TRIPLE BACKUP ======"
    trap 'notify_failure "Unexpected script exit at line $LINENO"' ERR

    if [ -z "$DB_PROD_PASSWORD" ]; then
        log "FATAL: DB_PROD_PASSWORD environment variable is not set."
        notify_failure "Environment Check"
        exit 1
    fi

    check_dependencies
    create_local_backup
    upload_to_primary_s3
    upload_to_dr_s3
    cleanup_local_backups

    log "====== TRIPLE BACKUP COMPLETED SUCCESSFULLY ======"

    trap - ERR
    exit 0
}

main "$@"
