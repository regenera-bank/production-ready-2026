CREATE TABLE person (party_id UUID PRIMARY KEY REFERENCES party(party_id), legal_name TEXT NOT NULL, birth_date DATE NOT NULL, nationality CHAR(2) NOT NULL);
