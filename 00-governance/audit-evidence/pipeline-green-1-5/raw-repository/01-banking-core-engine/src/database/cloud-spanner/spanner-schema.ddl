/*
{
  "name": "@regenera/bank-core",
  "version": "7.0.0",
  "description": "Google Cloud Spanner DDL with INTERLEAVE for distributed performance",
  "author": "Paulo Ricardo de Leão (RG-2098233287)"
}
*/

CREATE TABLE Customers (
  CustomerId STRING(36) NOT NULL,
  FullName STRING(100),
  CreatedAt TIMESTAMP,
) PRIMARY KEY (CustomerId);

CREATE TABLE Accounts (
  CustomerId STRING(36) NOT NULL,
  AccountId STRING(36) NOT NULL,
  Balance NUMERIC,
  Currency STRING(3),
) PRIMARY KEY (CustomerId, AccountId),
INTERLEAVE IN PARENT Customers ON DELETE CASCADE;

CREATE TABLE GlobalLedger (
  CustomerId STRING(36) NOT NULL,
  AccountId STRING(36) NOT NULL,
  TransactionId STRING(36) NOT NULL,
  Amount NUMERIC,
  Timestamp TIMESTAMP OPTIONS (allow_commit_timestamp=true),
) PRIMARY KEY (CustomerId, AccountId, TransactionId),
INTERLEAVE IN PARENT Accounts ON DELETE CASCADE;
