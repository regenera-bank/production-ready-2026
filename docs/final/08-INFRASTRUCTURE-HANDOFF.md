# 08 — Infrastructure Handoff

| Artefato | Path |
|----------|------|
| Dockerfiles (7 serviços, non-root) | `platform/docker/Dockerfile.*` |
| Compose full stack | `platform/docker/docker-compose.full.yml` |
| Kubernetes | `platform/kubernetes/` |
| Terraform skeleton | `platform/terraform/` |
| Observability | `platform/observability/prometheus.yml` |

Validação container: `EXTERNAL_EXECUTION_REQUIRED` (Docker daemon indisponível). Script: `platform/docker/validate-builds.sh`.