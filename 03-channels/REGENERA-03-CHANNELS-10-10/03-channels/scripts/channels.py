from __future__ import annotations
import argparse, csv, hashlib, json, os, re, shutil, subprocess, sys, tempfile, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEM_NAMES={'.DS_Store','__MACOSX','__pycache__','node_modules','.gradle','.build'}
FORBIDDEN_EXT={'.pyc','.pyo','.p12','.pfx','.jks','.keystore','.mobileprovision'}
REQUIRED=['README.md','CHANNEL-REGISTRY.yaml','CONTROL-MATRIX.csv','RACI.csv','OWNERS.yaml','RELEASE-MANIFEST.yaml','architecture/CHANNEL-BOUNDARIES.md','architecture/THREAT-MODEL.md','architecture/SLO.md','shared/contract-pins.json']
TEXT_EXT={'.md','.yaml','.yml','.json','.csv','.ts','.js','.kt','.swift','.py','.sh','.command','.txt','.xml','.plist','.cs','.xaml'}


def sha256(p:Path)->str:
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def files(root:Path):
    for p in sorted(root.rglob('*')):
        if p.is_file() and 'dist' not in p.relative_to(root).parts and 'evidence' not in p.relative_to(root).parts:
            yield p

def validate_root(root:Path=ROOT):
    errors=[]; warnings=[]
    for rel in REQUIRED:
        if not (root/rel).is_file(): errors.append(f'missing:{rel}')
    for p in root.rglob('*'):
        rel=p.relative_to(root)
        if any(part in SYSTEM_NAMES for part in rel.parts): errors.append(f'system-artifact:{rel}')
        if p.is_file() and p.suffix.lower() in FORBIDDEN_EXT: errors.append(f'forbidden-extension:{rel}')
        if p.is_file() and p.suffix.lower()=='.zip': errors.append(f'nested-zip:{rel}')
        if p.is_symlink(): errors.append(f'symlink:{rel}')
    registry=(root/'CHANNEL-REGISTRY.yaml').read_text(encoding='utf-8') if (root/'CHANNEL-REGISTRY.yaml').exists() else ''
    for ch in ['web-banking','android','ios','windows-operations','partner-portal']:
        if f'id: {ch}' not in registry: errors.append(f'channel-missing:{ch}')
    if 'react-native-legacy' not in registry: errors.append('legacy-ban-missing')
    with (root/'CONTROL-MATRIX.csv').open(encoding='utf-8',newline='') as f:
        rows=list(csv.DictReader(f))
    if len(rows)<30: errors.append(f'control-depth:{len(rows)}')
    if len(rows)!=len({r['control_id'] for r in rows}): errors.append('control-id-duplicate')
    if any(not r['expected_evidence'].strip() for r in rows): errors.append('control-evidence-empty')
    allowed_status={'VERIFIED_IN_REFERENCE','VERIFIED_STATIC','PARTIAL_REFERENCE','SPECIFIED_PENDING_PLATFORM','DECLARED_PENDING_INSTITUTIONAL','SPECIFIED_PENDING_INSTITUTIONAL','PENDING_EXTERNAL_SIGNATURE','SPECIFIED_PENDING_EXERCISE'}
    unknown_status=sorted({r['status'] for r in rows}-allowed_status)
    if unknown_status: errors.append('control-status-invalid:'+','.join(unknown_status))
    return sorted(set(errors)),warnings

def run(cmd,cwd=ROOT):
    return subprocess.run(cmd,cwd=cwd,text=True,capture_output=True)

def compile_and_test(out:Path):
    out.mkdir(parents=True,exist_ok=True)
    results=[]
    for ch in ['web-banking','partner-portal','windows-operations']:
        p=run(['tsc','-p','tsconfig.json'],ROOT/ch)
        results.append((f'{ch}:compile',p))
        if p.returncode==0:
            p=run(['node','--test','tests/channel.test.js'],ROOT/ch)
            results.append((f'{ch}:test',p))
    android_jar=out/'android-tests.jar'
    p=run(['kotlinc','src/ChannelCore.kt','tests/Main.kt','-include-runtime','-d',str(android_jar)],ROOT/'android')
    results.append(('android:compile',p))
    if p.returncode==0:
        p=run(['java','-jar',str(android_jar)],ROOT/'android'); results.append(('android:test',p))
    ios_bin=out/'ios-tests'
    p=run(['swiftc','Sources/ChannelCore.swift','Tests/main.swift','-o',str(ios_bin)],ROOT/'ios')
    results.append(('ios:compile',p))
    if p.returncode==0:
        p=run([str(ios_bin)],ROOT/'ios'); results.append(('ios:test',p))
    log=[]; ok=True
    for name,p in results:
        ok &= p.returncode==0
        log.append(f'[{name}] exit={p.returncode}\n{p.stdout}{p.stderr}')
    (out/'PLATFORM-TESTS.log').write_text('\n'.join(log),encoding='utf-8')
    summary={'commands':len(results),'passed':sum(1 for _,p in results if p.returncode==0),'failed':sum(1 for _,p in results if p.returncode!=0)}
    (out/'PLATFORM-TESTS.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print(json.dumps(summary))
    return 0 if ok else 1

def security(root:Path=ROOT):
    findings=[]
    secret_res=[re.compile(x,re.I) for x in [r'BEGIN (RSA|EC|OPENSSH) PRIVATE KEY',r'aws_secret_access_key\s*[:=]\s*[A-Za-z0-9/+=]{20,}',r'client_secret\s*[:=]\s*["\'][^"\']{8,}',r'password\s*[:=]\s*["\'][^"\']{8,}']]
    external=re.compile(r'(src|href)=["\']https?://|fetch\(["\']https?://|import\s+.*["\']https?://',re.I)
    for p in files(root):
        if p.suffix.lower() not in TEXT_EXT: continue
        text=p.read_text(encoding='utf-8',errors='ignore')
        rel=p.relative_to(root)
        for r in secret_res:
            if r.search(text): findings.append(f'secret-pattern:{rel}')
        if external.search(text): findings.append(f'external-runtime-resource:{rel}')
    for f in findings: print(f)
    return 1 if findings else 0

def clean(out:Path):
    if out.exists(): shutil.rmtree(out)
    for ch in ['web-banking','partner-portal','windows-operations']:
        shutil.rmtree(ROOT/ch/'dist',ignore_errors=True)
    return 0

def payload_files():
    for p in files(ROOT):
        rel=p.relative_to(ROOT)
        if rel.parts[0]=='dist': continue
        yield p,rel

def build(out:Path):
    errors,_=validate_root(ROOT)
    if errors:
        print('\n'.join(errors)); return 1
    test_json=out/'PLATFORM-TESTS.json'
    if not test_json.exists(): print('missing:dist/PLATFORM-TESTS.json'); return 1
    summary=json.loads(test_json.read_text())
    if summary.get('failed')!=0: print('platform-tests-failed'); return 1
    out.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for p,rel in payload_files(): manifest.append({'path':str(rel),'size':p.stat().st_size,'sha256':sha256(p)})
    with (out/'PAYLOAD-MANIFEST.csv').open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['path','size','sha256']); w.writeheader(); w.writerows(manifest)
    (out/'PAYLOAD-CHECKSUMS.sha256').write_text(''.join(f"{r['sha256']}  {r['path']}\n" for r in manifest),encoding='utf-8')
    sbom={'bomFormat':'CycloneDX','specVersion':'1.5','version':1,'metadata':{'component':{'type':'application','name':'regenera-channels','version':'1.0.0'}},'components':[
      {'type':'application','name':'web-banking','version':'1.0.0','properties':[{'name':'runtime','value':'TypeScript'}]},
      {'type':'application','name':'android','version':'1.0.0','properties':[{'name':'runtime','value':'Kotlin'}]},
      {'type':'application','name':'ios','version':'1.0.0','properties':[{'name':'runtime','value':'Swift'}]},
      {'type':'application','name':'windows-operations','version':'1.0.0','properties':[{'name':'runtime','value':'TypeScript'}]},
      {'type':'application','name':'partner-portal','version':'1.0.0','properties':[{'name':'runtime','value':'TypeScript'}]},
    ]}
    (out/'SBOM.cyclonedx.json').write_text(json.dumps(sbom,indent=2),encoding='utf-8')
    provenance={'artifact':'external-release-zip','payload_files':len(manifest),'platform_tests':summary,'source_date_epoch':'2026-06-26T00:00:00Z','external_signature':'pending','internal_archive':False}
    (out/'BUILD-PROVENANCE.json').write_text(json.dumps(provenance,indent=2),encoding='utf-8')
    return 0

def verify_release(out:Path):
    required=['PAYLOAD-MANIFEST.csv','PAYLOAD-CHECKSUMS.sha256','SBOM.cyclonedx.json','BUILD-PROVENANCE.json','PLATFORM-TESTS.json','PLATFORM-TESTS.log']
    for name in required:
        if not (out/name).is_file(): print(f'missing:{name}'); return 1
    with (out/'PAYLOAD-MANIFEST.csv').open(encoding='utf-8',newline='') as handle:
        rows=list(csv.DictReader(handle))
    current={str(rel):(p.stat().st_size,sha256(p)) for p,rel in payload_files()}
    if set(current)!={r['path'] for r in rows}:
        print('payload-set-drift'); return 1
    for r in rows:
        if current[r['path']]!=(int(r['size']),r['sha256']): print(f'payload-drift:{r["path"]}'); return 1
    checks=(out/'PAYLOAD-CHECKSUMS.sha256').read_text(encoding='utf-8').splitlines()
    expected=[f"{r['sha256']}  {r['path']}" for r in rows]
    if checks!=expected: print('checksums-drift'); return 1
    if any('.DS_Store' in r['path'] or '__MACOSX' in r['path'] or '__pycache__' in r['path'] or r['path'].endswith('.pyc') or r['path'].endswith('.zip') for r in rows):
        print('payload-forbidden-artifact'); return 1
    print(json.dumps({'status':'PASS','payload_files':len(rows),'internal_archive':False}))
    return 0

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('command',choices=['clean','validate','test','security','build','verify-release']); ap.add_argument('--out',default='dist'); a=ap.parse_args(); out=ROOT/a.out
    if a.command=='clean': rc=clean(out)
    elif a.command=='validate':
        errors,warnings=validate_root(); [print(x) for x in errors+warnings]; rc=1 if errors else 0
    elif a.command=='test': rc=compile_and_test(out)
    elif a.command=='security': rc=security()
    elif a.command=='build': rc=build(out)
    else: rc=verify_release(out)
    raise SystemExit(rc)
if __name__=='__main__': main()
