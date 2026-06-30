CREATE TABLE legal_entity (party_id UUID PRIMARY KEY REFERENCES party(party_id), legal_name TEXT NOT NULL, trade_name TEXT, incorporation_date DATE NOT NULL, country_code CHAR(2) NOT NULL);
