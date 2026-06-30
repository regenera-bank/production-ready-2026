#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[3]
errors=[]
for p in root.glob("05-core-banking/*/db/migrations/*.sql"):
    text=p.read_text()
    if text.lstrip().startswith("##"): errors.append(str(p))
    if "name: " in text and "jobs:" in text: errors.append(str(p))
if errors:
    print("invalid migration",*errors,sep="\n"); sys.exit(1)
print("migrations: structural validation passed")
