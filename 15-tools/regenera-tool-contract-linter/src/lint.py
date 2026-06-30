#!/usr/bin/env python3
from pathlib import Path
import json, sys
root=Path(__file__).resolve().parents[3]
for p in root.glob("02-contracts/regenera-contracts-json-schema/*.json"):
    json.loads(p.read_text())
print("contract json: ok")
