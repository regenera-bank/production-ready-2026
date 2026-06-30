CREATE TABLE account_product (product_id UUID PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, currency CHAR(3) NOT NULL, enabled BOOLEAN NOT NULL);
