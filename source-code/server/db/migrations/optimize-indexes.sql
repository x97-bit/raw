-- ============================================================================
-- Performance Optimization Indexes for Alrawi v0.8
-- ============================================================================
-- These indexes are designed to optimize the most common query patterns:
-- 1. Transaction listing by port + account type (main port page)
-- 2. Account statement queries (by accountId + date range)
-- 3. Summary aggregation queries (direction-based calculations)
-- 4. Search queries (ref_no, notes, trader_note)
-- ============================================================================

-- Primary composite index for port-based transaction listing
-- Covers: WHERE port_id = ? AND account_type = ? ORDER BY id ASC
CREATE INDEX IF NOT EXISTS idx_transactions_port_type_id
  ON transactions (port_id, account_type, id);

-- Composite index for account statement queries
-- Covers: WHERE account_id = ? AND trans_date >= ? AND trans_date <= ?
CREATE INDEX IF NOT EXISTS idx_transactions_account_date
  ON transactions (account_id, trans_date, id);

-- Composite index for carrier-based statement queries
-- Covers: WHERE carrier_id = ? AND trans_date >= ? AND trans_date <= ?
CREATE INDEX IF NOT EXISTS idx_transactions_carrier_date
  ON transactions (carrier_id, trans_date, id);

-- Index for direction-based aggregation queries (summary calculations)
-- Covers: SUM(CASE WHEN direction IN (...) ...) patterns
CREATE INDEX IF NOT EXISTS idx_transactions_direction_amounts
  ON transactions (port_id, account_type, direction, record_type, amount_usd, amount_iqd, cost_usd, cost_iqd);

-- Index for text search on ref_no
CREATE INDEX IF NOT EXISTS idx_transactions_ref_no
  ON transactions (ref_no);

-- Index for expenses by account and date (account statement)
CREATE INDEX IF NOT EXISTS idx_expenses_account_date
  ON expenses (account_id, expense_date, id);

-- Index for expenses by port (port-level expense queries)
CREATE INDEX IF NOT EXISTS idx_expenses_port_date
  ON expenses (port_id, expense_date, id);

-- Index for debts by account
CREATE INDEX IF NOT EXISTS idx_debts_account
  ON debts (account_id, created_at);

-- Index for audit logs by timestamp (recent activity queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON audit_logs (created_at DESC);

-- Index for audit logs by user (user activity tracking)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs (user_id, created_at DESC);
