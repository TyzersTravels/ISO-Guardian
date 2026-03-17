-- ============================================================
-- PayFast Payment Integration Migration
-- ISOGuardian — Self-service subscriptions, referral credits,
--               and reseller commission tracking
-- ============================================================

-- ─── 1. Extend subscriptions table with PayFast fields ───

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payfast_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS payfast_token text,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'payfast',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_billing_date date,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS partner_code text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure status uses consistent values
-- Valid: trial, active, past_due, cancelled, expired, pending
COMMENT ON COLUMN subscriptions.status IS 'trial | active | past_due | cancelled | expired | pending';

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_id
  ON subscriptions(payfast_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company_status
  ON subscriptions(company_id, status);

-- ─── 2. Payment history table ───

CREATE TABLE IF NOT EXISTS payment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  subscription_id uuid REFERENCES subscriptions(id),
  payfast_payment_id text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'ZAR',
  status text NOT NULL DEFAULT 'complete',
  payment_method text DEFAULT 'payfast',
  billing_email text,
  description text,
  raw_itn jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view own payments"
  ON payment_history FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Super admin can view all payments"
  ON payment_history FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Service role can insert payments"
  ON payment_history FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payment_history_company
  ON payment_history(company_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_payfast_id
  ON payment_history(payfast_payment_id);

-- ─── 3. Invoices table (auto-generated) ───

CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  subscription_id uuid REFERENCES subscriptions(id),
  payment_id uuid REFERENCES payment_history(id),
  invoice_number text NOT NULL UNIQUE,
  amount decimal(10,2) NOT NULL,
  vat_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'ZAR',
  status text NOT NULL DEFAULT 'paid',
  billing_name text,
  billing_email text,
  billing_address text,
  line_items jsonb DEFAULT '[]'::jsonb,
  issued_at timestamptz DEFAULT now(),
  due_at timestamptz,
  paid_at timestamptz
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view own invoices"
  ON invoices FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Super admin can view all invoices"
  ON invoices FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Service role can manage invoices"
  ON invoices FOR ALL
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_invoices_company
  ON invoices(company_id);

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

-- ─── 4. Extend commissions table for PayFast tracking ───

-- Ensure commissions table has the right columns for reseller tracking
ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES subscriptions(id),
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES payment_history(id),
  ADD COLUMN IF NOT EXISTS reseller_company_id uuid REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS client_company_id uuid REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS amount decimal(10,2),
  ADD COLUMN IF NOT EXISTS percentage decimal(5,2) DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

COMMENT ON COLUMN commissions.percentage IS 'Reseller commission rate — default 25%';
COMMENT ON COLUMN commissions.status IS 'pending | approved | paid';

CREATE INDEX IF NOT EXISTS idx_commissions_reseller
  ON commissions(reseller_company_id);

CREATE INDEX IF NOT EXISTS idx_commissions_status
  ON commissions(status);

-- ─── 5. Helper function: get active subscription for a company ───

CREATE OR REPLACE FUNCTION public.get_subscription_status(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', s.id,
    'tier', s.tier,
    'status', s.status,
    'trial_ends_at', s.trial_ends_at,
    'grace_period_end', s.grace_period_end,
    'next_billing_date', s.next_billing_date,
    'max_users', s.max_users,
    'storage_limit', s.storage_limit,
    'is_active', CASE
      WHEN s.status = 'active' THEN true
      WHEN s.status = 'trial' AND s.trial_ends_at > now() THEN true
      WHEN s.status = 'past_due' AND s.grace_period_end > now() THEN true
      ELSE false
    END,
    'days_remaining', CASE
      WHEN s.status = 'trial' THEN GREATEST(0, EXTRACT(DAY FROM s.trial_ends_at - now()))
      WHEN s.status = 'past_due' THEN GREATEST(0, EXTRACT(DAY FROM s.grace_period_end - now()))
      ELSE null
    END
  ) INTO result
  FROM subscriptions s
  WHERE s.company_id = p_company_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(result, jsonb_build_object(
    'status', 'none',
    'is_active', false,
    'tier', null
  ));
END;
$$;

-- ─── 6. Function to generate invoice numbers ───

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'IG-INV-' || LPAD(nextval('invoice_number_seq')::text, 5, '0');
END;
$$;

-- ─── 7. Trigger: auto-update updated_at on subscriptions ───

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();
