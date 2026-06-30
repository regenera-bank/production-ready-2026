-- |---------------------------------------------------------------------------------------|
-- |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
-- |---------------------------------------------------------------------------------------|
--
-- PROJECT:       Regenera Bank
-- CEO:           Raphaela Cerveski
-- DEVELOPER:     Don Paulo Ricardo
-- ID:            2098233287
-- COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
--
-- LICENSE:       EULA (End-User License Agreement)
-- PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
--
-- WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
--                engenharia reversa ou modificação não autorizada.
--
-- |---------------------------------------------------------------------------------------|
-- |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
-- |---------------------------------------------------------------------------------------|

/**
 * REGENERA BANK · ENTERPRISE v4.0
 * Database Schema (PostgreSQL / Cloud SQL)
 * Implements high-consistency structures for core banking and investments.
 */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS: Neural Identity Core
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neural_id VARCHAR(50) UNIQUE NOT NULL, -- "DOW-PAULO-AGI-01"
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    tier VARCHAR(20) DEFAULT 'Plus', -- Plus, Premium, Metal, Enterprise, Ultra
    status VARCHAR(20) DEFAULT 'active', -- active, locked, pending_kyc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACCOUNTS: Financial Ledger
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agency VARCHAR(10) NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(19, 4) DEFAULT 0.0000,
    currency VARCHAR(3) DEFAULT 'BRL',
    is_blocked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRANSACTIONS: Immutable Audit Trail
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id),
    amount DECIMAL(19, 4) NOT NULL,
    type VARCHAR(20) NOT NULL, -- PIX_IN, PIX_OUT, TRANSFER, PAYMENT, TRADE
    status VARCHAR(20) DEFAULT 'PENDING', -- COMPLETED, FAILED, REVERSED
    counterparty_name VARCHAR(255),
    counterparty_key VARCHAR(255),
    end_to_end_id VARCHAR(100), -- SPI/BCB Reference
    idempotency_key VARCHAR(100) UNIQUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CUSTODY: Investment Portfolio
CREATE TABLE custody (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    symbol VARCHAR(15) NOT NULL, -- PETR4, BTC, IVVB11
    asset_type VARCHAR(20) NOT NULL, -- STOCK, CRYPTO, ETF
    quantity DECIMAL(20, 8) NOT NULL,
    average_price DECIMAL(19, 4) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- 5. DEVICE SESSIONS: Security Management
CREATE TABLE device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    device_name VARCHAR(100),
    device_type VARCHAR(50), -- mobile, desktop, tablet
    ip_address INET,
    location_city VARCHAR(100),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Indices for performance at scale
CREATE INDEX idx_users_neural ON users(neural_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_custody_user ON custody(user_id);
CREATE INDEX idx_sessions_user ON device_sessions(user_id);
