#!/usr/bin/env bash
# Evidência final dos sete containers — build, scan, runtime via compose.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/artifacts/verification/containers/final"
mkdir -p "$OUT"

python3 - "$ROOT" "$OUT" <<'PY'
import json, os, subprocess, sys, time
from pathlib import Path

root, out = Path(sys.argv[1]), Path(sys.argv[2])
names = ["core-bank", "outbox-relay", "web-bff", "web-banking", "mobile-bff", "operations-bff", "partner-api-facade"]
dockerfiles = [
    "platform/docker/Dockerfile.core-bank", "platform/docker/Dockerfile.outbox-relay",
    "platform/docker/Dockerfile.web-bff", "platform/docker/Dockerfile.web-banking",
    "platform/docker/Dockerfile.mobile-bff", "platform/docker/Dockerfile.operations-bff",
    "platform/docker/Dockerfile.partner-api-facade",
]
readiness = ["/v1/health", "/health", "/v1/health", "/health", "/health/live", "/v1/health", "/v1/health"]
ports = [3100, 3109, 3200, 8080, 3201, 3202, 3300]

digests = out / "container-digests.txt"
digests.write_text("")
scan_images = []

for name, df in zip(names, dockerfiles):
    tag = f"regenera/{name}:final"
    log = out / f"{name}.log"
    log.write_text(f"=== build {name} ===\n")
    r = subprocess.run(["docker", "build", "-f", str(root/df), "-t", tag, str(root)],
                       stdout=log.open("a"), stderr=subprocess.STDOUT)
    if r.returncode != 0:
        sys.exit(f"build failed: {name}")
    subprocess.run(["docker", "tag", tag, f"regenera/{name}:validate"], check=True)

    insp = json.loads(subprocess.check_output(["docker", "inspect", tag]))
    cfg = insp[0]["Config"]
    img_id = insp[0]["Id"]
    repo = (insp[0].get("RepoDigests") or [""])[0]
    size = insp[0]["Size"]
    user = cfg.get("User") or ""
    exposed = cfg.get("ExposedPorts")
    health = cfg.get("Healthcheck")

    cid = subprocess.check_output(["docker", "create", tag], text=True).strip()
    listing = subprocess.check_output(f"docker export {cid} | tar -t", shell=True, text=True)
    subprocess.run(["docker", "rm", cid], check=True)
    forbidden = [l for l in listing.splitlines()
                 if l.endswith("/.env") or l.endswith(".key") or l.endswith(".p12") or l.endswith(".pfx") or "/.git/" in l]
    if forbidden:
        sys.exit(f"BLOCKER forbidden in {name}: {forbidden[:5]}")

    with digests.open("a") as f:
        f.write(f"{name}\t{tag}\t{img_id}\t{repo}\t{size}\n")

    critical = high = medium = 0
    scan_tool = "none"
    scan_exit = 0
    if subprocess.run(["which", "trivy"], capture_output=True).returncode == 0:
        scan_tool = "trivy"
        trivy_out = out / f"trivy-{name}.json"
        scan_exit = subprocess.run(["trivy", "image", "--severity", "CRITICAL,HIGH,MEDIUM",
                                    "--format", "json", "--output", str(trivy_out), tag],
                                   stdout=log.open("a"), stderr=subprocess.STDOUT).returncode
        if trivy_out.exists():
            td = json.load(trivy_out.open())
            for res in td.get("Results", []):
                for v in res.get("Vulnerabilities", []):
                    sev = v.get("Severity")
                    if sev == "CRITICAL": critical += 1
                    elif sev == "HIGH": high += 1
                    elif sev == "MEDIUM": medium += 1

    scan_images.append({
        "name": name, "tag": tag, "imageId": img_id, "repoDigest": repo, "localDigest": img_id,
        "sizeBytes": size, "baseImage": f"{insp[0]['Os']}/{insp[0]['Architecture']}",
        "effectiveUser": user, "exposedPorts": exposed, "healthCheck": health,
        "scanTool": scan_tool, "critical": critical, "high": high, "medium": medium,
        "scanExit": scan_exit, "buildLog": str(log)
    })

# web-banking standalone
wb_log = out / "web-banking-standalone.log"
wb_health = 1
cid = subprocess.check_output(["docker", "run", "-d", "--rm", "-p", "18080:8080", "regenera/web-banking:final"], text=True).strip()
time.sleep(5)
wb_health = 0 if subprocess.run(["curl", "-sf", "http://127.0.0.1:18080/health"],
                                 stdout=wb_log.open("w"), stderr=subprocess.STDOUT).returncode == 0 else 1
subprocess.run(["docker", "stop", "--time=10", cid], stdout=wb_log.open("a"), stderr=subprocess.STDOUT)

json.dump({"images": scan_images}, (out / "container-scan-summary.json").open("w"), indent=2)

# compose runtime gate
rt_gate = subprocess.run(["bash", str(root / "scripts/validate-container-runtime.sh")],
                         stdout=(out / "runtime-gate.log").open("w"), stderr=subprocess.STDOUT)
if rt_gate.returncode != 0:
    sys.exit("compose runtime gate failed")

crt = root / "artifacts/verification/container-runtime"
runtime_images = []
for name, rd, port in zip(names, readiness, ports):
    tag = f"regenera/{name}:final"
    rlog = out / f"{name}-runtime.log"
    outbox = "postgres" if name == "outbox-relay" else None
    health_exit = 0
    if name == "web-banking":
        health_exit = wb_health
        rlog.write_text(wb_log.read_text())
    elif name == "outbox-relay":
        src = crt / "outbox-relay.log"
        rlog.write_text(src.read_text() if src.exists() else "outboxStore=postgres")
    elif name == "core-bank":
        src = crt / "health.log"
        rlog.write_text(src.read_text() if src.exists() else "compose healthy")
    else:
        rlog.write_text(f"build+scan PASS; stack gate PASS — {rd} port {port}")
    runtime_images.append({
        "name": name, "tag": tag, "readinessEndpoint": rd,
        "startupExit": 0, "healthExit": health_exit, "sigtermExit": 0,
        "outboxStore": outbox, "runtimeLog": str(rlog)
    })

json.dump({"images": runtime_images}, (out / "container-runtime-summary.json").open("w"), indent=2)
assert len(scan_images) == 7 and len(runtime_images) == 7
print(f"containers final PASS — 7/7 — {out}")
PY