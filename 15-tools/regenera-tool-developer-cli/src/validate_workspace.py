#!/usr/bin/env python3
from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[3]
required=["README.md","LICENSE","CODEOWNERS","OWNERS.yaml","SECURITY.md","CONTRIBUTING.md","CHANGELOG.md","service.yaml","catalog-info.yaml","Makefile",".editorconfig",".gitignore",".gitattributes",".env.example",".tool-versions","Dockerfile","docker-compose.local.yml"]
repo_prefixes=("regenera-")
errors=[]; repos=[]
for p in root.glob("[0-1][0-9]-*/*"):
    if p.is_dir() and p.name.startswith(repo_prefixes): repos.append(p)
for p in root.glob("15-tools/*"):
    if p.is_dir() and p.name.startswith(repo_prefixes) and p not in repos: repos.append(p)
for repo in repos:
    for name in required:
        if not (repo/name).exists(): errors.append(f"{repo.relative_to(root)}: missing {name}")
    for d in ["docs/ADR","deploy/kubernetes","deploy/helm","deploy/terraform","scripts","tests/unit","tests/integration","tests/contract","tests/security","tests/performance",".github/workflows"]:
        if not (repo/d).exists(): errors.append(f"{repo.relative_to(root)}: missing {d}")
secret_patterns=[re.compile(r"AIza[0-9A-Za-z_-]{30,}"),re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),re.compile(r"(?i)(api[_-]?key|secret|password)\s*[:=]\s*['\"][^$<{][^'\"]{8,}")]
for f in root.rglob("*"):
    if not f.is_file() or f.suffix.lower() in {".zip",".png",".jpg",".pdf"}: continue
    try: txt=f.read_text(errors="ignore")
    except Exception: continue
    for pattern in secret_patterns:
        if pattern.search(txt): errors.append(f"secret pattern: {f.relative_to(root)}")
if errors:
    print("VALIDATION FAILED")
    print("\n".join(errors[:200]))
    sys.exit(1)
print(f"VALIDATION PASSED: {len(repos)} repositories")
