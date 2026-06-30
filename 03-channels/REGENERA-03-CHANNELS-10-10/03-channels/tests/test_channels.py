from __future__ import annotations
import csv, importlib.util, json, tempfile, unittest, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('channels',ROOT/'scripts'/'channels.py'); mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

class StructureTests(unittest.TestCase):
    def test_validator_passes(self): self.assertEqual([],mod.validate_root(ROOT)[0])
    def test_no_system_artifacts(self):
        errors,_=mod.validate_root(ROOT); self.assertFalse([e for e in errors if e.startswith('system-artifact:')])
    def test_no_nested_zip(self):
        errors,_=mod.validate_root(ROOT); self.assertFalse([e for e in errors if e.startswith('nested-zip:')])
    def test_five_active_channels(self):
        text=(ROOT/'CHANNEL-REGISTRY.yaml').read_text(); self.assertEqual(5,text.count('status: active'))
    def test_legacy_is_forbidden(self): self.assertIn('react-native-legacy',(ROOT/'CHANNEL-REGISTRY.yaml').read_text())
    def test_control_depth_and_unique_ids(self):
        with (ROOT/'CONTROL-MATRIX.csv').open(encoding='utf-8',newline='') as handle: rows=list(csv.DictReader(handle))
        self.assertGreaterEqual(len(rows),30); self.assertEqual(len(rows),len({r['control_id'] for r in rows}))
    def test_controls_do_not_overclaim(self):
        with (ROOT/'CONTROL-MATRIX.csv').open(encoding='utf-8',newline='') as handle: rows=list(csv.DictReader(handle))
        self.assertNotIn('IMPLEMENTED_IN_BASELINE',{r['status'] for r in rows})
        self.assertIn('PENDING_EXTERNAL_SIGNATURE',{r['status'] for r in rows})
        self.assertIn('SPECIFIED_PENDING_PLATFORM',{r['status'] for r in rows})
    def test_security_passes(self): self.assertEqual(0,mod.security(ROOT))

class ReleaseTests(unittest.TestCase):
    def test_build_requires_tests(self):
        with tempfile.TemporaryDirectory() as td: self.assertEqual(1,mod.build(Path(td)))
    def test_build_and_verify_after_tests(self):
        with tempfile.TemporaryDirectory() as td:
            out=Path(td)
            for name in ['PLATFORM-TESTS.json','PLATFORM-TESTS.log']: (out/name).write_bytes((ROOT/'dist'/name).read_bytes())
            self.assertEqual(0,mod.build(out)); self.assertEqual(0,mod.verify_release(out))
    def test_payload_manifest_has_no_forbidden_artifact(self):
        with tempfile.TemporaryDirectory() as td:
            out=Path(td)
            for name in ['PLATFORM-TESTS.json','PLATFORM-TESTS.log']: (out/name).write_bytes((ROOT/'dist'/name).read_bytes())
            self.assertEqual(0,mod.build(out))
            with (out/'PAYLOAD-MANIFEST.csv').open(encoding='utf-8',newline='') as handle: paths=[row['path'] for row in csv.DictReader(handle)]
            self.assertFalse(any('.DS_Store' in n or '__MACOSX' in n or n.endswith('.pyc') or n.endswith('.zip') for n in paths))

class BoundaryTests(unittest.TestCase):
    def test_no_direct_database_access_claim(self):
        text=(ROOT/'CHANNEL-REGISTRY.yaml').read_text(); self.assertEqual(5,text.count('direct_database_access: false'))
    def test_unknown_retry_is_forbidden(self):
        text=(ROOT/'CHANNEL-REGISTRY.yaml').read_text(); self.assertEqual(5,text.count('blind_retry_on_unknown: false'))
    def test_balances_are_not_authoritative(self):
        text=(ROOT/'CHANNEL-REGISTRY.yaml').read_text(); self.assertEqual(5,text.count('authoritative_financial_state: false'))
    def test_external_signature_is_pending(self): self.assertIn('signature: pending',(ROOT/'OWNERS.yaml').read_text())

if __name__=='__main__': unittest.main(verbosity=2)
