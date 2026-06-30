# Regenera Bank Enterprise System - Incident Response Plan (IRP)

**Date:** June 2026
**Compliance:** BACEN / ISO 27001

## 1. Incident Classification
- **SEV-1 (Critical):** Core Ledger down, mass Pix failure, suspected data breach. Resolution target: < 30 minutes.
- **SEV-2 (Major):** Specific module offline (e.g., Open Finance timeout), performance degradation. Resolution target: < 2 hours.
- **SEV-3 (Minor):** Non-critical bug, cosmetic issue. Resolution target: Next sprint.

## 2. Escalation Procedures
1. **L1 Support (NOC):** Receives Datadog PagerDuty alerts. Attempts initial mitigation via known Runbooks.
2. **L2 Engineering:** Called via PagerDuty if L1 cannot resolve within 15 mins. (DevOps / SRE team).
3. **L3 Core Team:** Lead Architects and Security Officers engaged for SEV-1 incidents.

## 3. Communication Plan
- **Internal:** `#incident-sev1` Slack channel automatically created.
- **External (BACEN):** If the DICT network connectivity drops for more than 10 minutes, the Compliance Officer must notify the Central Bank officially.
- **Clients:** Status page updated automatically. Push notifications sent if the app experience is severely degraded.

## 4. Post-Incident Review (PIR)
Every SEV-1 and SEV-2 requires a blameless PIR document within 48 hours containing:
- Root cause analysis (5 Whys).
- Timeline of events.
- Action items to prevent recurrence.
