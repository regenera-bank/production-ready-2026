CREATE TABLE customer_revalidation (revalidation_id UUID PRIMARY KEY, customer_id UUID NOT NULL, due_at TIMESTAMPTZ NOT NULL, status VARCHAR(32) NOT NULL CHECK (status IN ('SCHEDULED','OPEN','COMPLETED','OVERDUE','CANCELLED')), opened_case_id UUID, completed_at TIMESTAMPTZ);
CREATE INDEX customer_revalidation_due_idx ON customer_revalidation(status, due_at);
