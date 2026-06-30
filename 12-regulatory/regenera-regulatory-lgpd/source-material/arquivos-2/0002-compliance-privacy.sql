name: Bank Grade CI — dinheiro não aceita erro

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: bank-grade-ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  NODE_VERSION: "20"
  POSTGRES_DB: regenera_test
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  DATABASE_URL: postgres://postgres:postgres@localhost:5432/regenera_test
  NODE_ENV: test
  CI: true

jobs:
  backend_validation:
    name: backend — se passar aqui, pode mexer com dinheiro
    runs-on: ubuntu-latest
    timeout-minutes: 25

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: regenera_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d regenera_test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: instalar dependências
        run: npm ci

      # --------------------------------------------------
      # PORTA DE ENTRADA
      # --------------------------------------------------
      - name: repo gate
        run: |
          set -euo pipefail

          # repo sem regra vira incidente silencioso
          ./scripts/repo-gates.sh

      # --------------------------------------------------
      # BANCO OU NADA
      # --------------------------------------------------
      - name: esperar postgres
        env:
          PGPASSWORD: ${{ env.POSTGRES_PASSWORD }}
        run: |
          set -euo pipefail

          for i in {1..40}; do
            if pg_isready -h localhost -U postgres -d regenera_test; then
              exit 0
            fi
            sleep 1
          done

          echo "banco não respondeu. sem banco, sem verdade."
          exit 1

      # --------------------------------------------------
      # MIGRATION
      # --------------------------------------------------
      - name: aplicar migrations
        env:
          PGPASSWORD: ${{ env.POSTGRES_PASSWORD }}
        run: |
          set -euo pipefail

          shopt -s nullglob
          files=(migrations/*.sql)

          if [ ${#files[@]} -eq 0 ]; then
            echo "nenhuma migration. schema sem origem é mentira."
            exit 1
          fi

          for f in "${files[@]}"; do
            echo "executando $f"

            psql -v ON_ERROR_STOP=1 \
              -h localhost \
              -U postgres \
              -d regenera_test \
              -f "$f"
          done

      - name: reaplicar migrations
        env:
          PGPASSWORD: ${{ env.POSTGRES_PASSWORD }}
        run: |
          set -euo pipefail

          # migration que não roda duas vezes
          # quebra no primeiro deploy sério
          for f in migrations/*.sql; do
            psql -v ON_ERROR_STOP=1 \
              -h localhost \
              -U postgres \
              -d regenera_test \
              -f "$f"
          done

      # --------------------------------------------------
      # BASE
      # --------------------------------------------------
      - name: typecheck
        run: npm run typecheck --if-present

      - name: lint
        run: npm run lint --if-present

      - name: testes unitários
        run: npm test -- --runInBand

      # --------------------------------------------------
      # CONCORRÊNCIA
      # --------------------------------------------------
      - name: teste de concorrência
        run: |
          set -euo pipefail

          # duas requisições iguais não é edge case
          # é o padrão
          node scripts/test-concurrency.js

      # --------------------------------------------------
      # IDEMPOTÊNCIA
      # --------------------------------------------------
      - name: teste de idempotência
        run: |
          set -euo pipefail

          # mesma request não pode gerar dois efeitos
          node scripts/test-idempotency.js

      # --------------------------------------------------
      # REPLAY
      # --------------------------------------------------
      - name: teste de replay
        run: |
          set -euo pipefail

          # se passar duas vezes, não é retry
          # é dinheiro duplicado
          node scripts/test-replay.js

      # --------------------------------------------------
      # CRASH
      # --------------------------------------------------
      - name: teste de crash
        run: |
          set -euo pipefail

          # processo morre no meio
          # sistema precisa sobreviver
          node scripts/test-crash.js

      # --------------------------------------------------
      # LEDGER
      # --------------------------------------------------
      - name: auditoria ledger
        env:
          PGPASSWORD: ${{ env.POSTGRES_PASSWORD }}
        run: |
          set -euo pipefail

          psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d regenera_test <<'SQL'
          DO $$
          DECLARE broken bigint;
          BEGIN

            -- entrada sem linha não existe
            SELECT COUNT(*) INTO broken
            FROM ledger_entries e
            WHERE NOT EXISTS (
              SELECT 1 FROM ledger_lines l WHERE l.entry_id = e.id
            );

            IF broken > 0 THEN
              RAISE EXCEPTION 'entries sem linhas: %', broken;
            END IF;

            -- dinheiro não aceita erro de soma
            SELECT COUNT(*) INTO broken
            FROM (
              SELECT entry_id,
                SUM(CASE WHEN direction='DEBIT' THEN amount ELSE -amount END) s
              FROM ledger_lines
              GROUP BY entry_id
              HAVING SUM(CASE WHEN direction='DEBIT' THEN amount ELSE -amount END) <> 0
            ) x;

            IF broken > 0 THEN
              RAISE EXCEPTION 'ledger desbalanceado: %', broken;
            END IF;

          END $$;
          SQL

      # --------------------------------------------------
      # REBUILD
      # --------------------------------------------------
      - name: reconstrução
        run: |
          set -euo pipefail

          # se não reconstrói
          # nunca foi consistente
          node scripts/rebuild-ledger.js
          