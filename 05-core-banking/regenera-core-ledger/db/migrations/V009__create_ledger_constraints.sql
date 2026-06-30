CREATE OR REPLACE FUNCTION reject_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'ledger is append-only'; END $$;
CREATE TRIGGER journal_entry_no_update BEFORE UPDATE OR DELETE ON journal_entry FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
CREATE TRIGGER posting_no_update BEFORE UPDATE OR DELETE ON posting FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();

CREATE OR REPLACE FUNCTION assert_journal_balanced(p_entry UUID) RETURNS void LANGUAGE plpgsql AS $$
DECLARE d BIGINT; c BIGINT;
BEGIN
  SELECT COALESCE(sum(minor_units),0) INTO d FROM posting WHERE journal_entry_id=p_entry AND side='D';
  SELECT COALESCE(sum(minor_units),0) INTO c FROM posting WHERE journal_entry_id=p_entry AND side='C';
  IF d <> c THEN RAISE EXCEPTION 'journal entry % is not balanced: debit %, credit %', p_entry, d, c; END IF;
END $$;
