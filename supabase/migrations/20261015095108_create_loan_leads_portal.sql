/*
# Create loan leads portal storage

1. New Tables
- `loan_leads` stores every customer lead, assigned advisor, loan details, status, disbursement details, and payout figures.
- `id` uniquely identifies a lead.
- `lead_date`, `customer_name`, `contact_no`, `customer_address`, `loan_type`, `loan_amount`, `advisor_name`, `lead_owner`, `file_sent_to`, and `status` capture the lead entry form.
- `disbursed_amount`, `disbursed_date`, and `bank_name` capture optional disbursement information.
- `payout_received`, `payout_to_advisor`, and `net_payout` capture payout accounting.
- `created_at` and `updated_at` provide audit timestamps.

2. Security
- Row level security is enabled.
- This is an intentionally single-tenant consultancy portal without a sign-in screen, so anon and authenticated roles receive separate CRUD policies for shared workspace access.

3. Important Notes
- `net_payout` is generated from payout received minus payout to advisor, preventing inconsistent totals.
- Status is constrained to the six workflow stages requested for the portal.
*/

CREATE TABLE IF NOT EXISTS public.loan_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_name text NOT NULL,
  contact_no text NOT NULL,
  customer_address text NOT NULL DEFAULT '',
  loan_type text NOT NULL,
  loan_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (loan_amount >= 0),
  advisor_name text NOT NULL DEFAULT '',
  lead_owner text NOT NULL DEFAULT '',
  file_sent_to text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'New Lead' CHECK (status IN ('New Lead', 'Contacted', 'Under Review', 'Under Process', 'Approved', 'Disbursed', 'Rejected')),
  disbursed_amount numeric(14,2) CHECK (disbursed_amount IS NULL OR disbursed_amount >= 0),
  disbursed_date date,
  bank_name text NOT NULL DEFAULT '',
  payout_received numeric(14,2) NOT NULL DEFAULT 0 CHECK (payout_received >= 0),
  payout_to_advisor numeric(14,2) NOT NULL DEFAULT 0 CHECK (payout_to_advisor >= 0),
  net_payout numeric(14,2) GENERATED ALWAYS AS (payout_received - payout_to_advisor) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_select_loan_leads" ON public.loan_leads;
CREATE POLICY "shared_select_loan_leads" ON public.loan_leads FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_insert_loan_leads" ON public.loan_leads;
CREATE POLICY "shared_insert_loan_leads" ON public.loan_leads FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "shared_update_loan_leads" ON public.loan_leads;
CREATE POLICY "shared_update_loan_leads" ON public.loan_leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "shared_delete_loan_leads" ON public.loan_leads;
CREATE POLICY "shared_delete_loan_leads" ON public.loan_leads FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS loan_leads_status_idx ON public.loan_leads(status);
CREATE INDEX IF NOT EXISTS loan_leads_lead_date_idx ON public.loan_leads(lead_date DESC);
