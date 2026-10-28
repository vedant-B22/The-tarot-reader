-- ==============================================================================
-- The Tarot Reader – Event Manager Database Schema & Migration
-- Production-Ready Postgres Schema for Supabase
-- Target: Live Halloween Stall at SSPU, Pune, India
-- ==============================================================================

-- 1. Create Tables

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  stall_name TEXT NOT NULL DEFAULT 'The Mystical Tarot – SSPU Halloween',
  theme_subtext TEXT NOT NULL DEFAULT 'Step past the veil. Uncover love, destiny, and the unseen.',
  announcement_banner TEXT NOT NULL DEFAULT '🎃 Halloween Stall Special: Group reading gets instant ₹20 discount!',
  is_queue_open BOOLEAN NOT NULL DEFAULT true,
  queue_paused_message TEXT NOT NULL DEFAULT 'Queue is temporarily paused for 10 minutes while our readers recharge mystical energies.',
  max_queue_cap INT NOT NULL DEFAULT 60,
  scheduled_opening_time TEXT DEFAULT '10:00',
  scheduled_closing_time TEXT DEFAULT '22:00',
  upi_id TEXT NOT NULL DEFAULT '9527318721@ybl',
  upi_qr_url TEXT NOT NULL DEFAULT '/uploads/stall_upi_qr.jpg',
  allow_pay_later BOOLEAN NOT NULL DEFAULT false,
  auto_noshow_minutes INT NOT NULL DEFAULT 5,
  whatsapp_helpline TEXT NOT NULL DEFAULT '+919527318721',
  disclaimer_text TEXT NOT NULL DEFAULT 'Tarot readings are for entertainment and guidance, not professional, medical, legal or financial advice.',
  first_timer_discount_inr INT NOT NULL DEFAULT 0,
  group_discount_inr INT NOT NULL DEFAULT 20,
  happy_hour_enabled BOOLEAN NOT NULL DEFAULT false,
  happy_hour_start TEXT DEFAULT '17:00',
  happy_hour_end TEXT DEFAULT '19:00',
  happy_hour_percent INT NOT NULL DEFAULT 15,
  referrer_reward_inr INT NOT NULL DEFAULT 25,
  referee_discount_inr INT NOT NULL DEFAULT 15,
  referral_reward_on_completed_only BOOLEAN NOT NULL DEFAULT true,
  admin_manual_discount_threshold_inr INT NOT NULL DEFAULT 50,
  data_retention_days INT NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  can_edit_prices BOOLEAN NOT NULL DEFAULT false,
  can_create_discounts BOOLEAN NOT NULL DEFAULT false,
  can_issue_refunds BOOLEAN NOT NULL DEFAULT false,
  can_override_queue BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  card_count INT NOT NULL DEFAULT 1,
  duration_minutes INT NOT NULL DEFAULT 10,
  price_inr INT NOT NULL,
  is_group BOOLEAN NOT NULL DEFAULT false,
  group_size INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value INT NOT NULL,
  min_order_inr INT NOT NULL DEFAULT 0,
  max_discount_inr INT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  max_total_uses INT,
  max_uses_per_customer INT NOT NULL DEFAULT 1,
  current_uses INT NOT NULL DEFAULT 0,
  applicable_service_ids TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_admin_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_token_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  course_year TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by_customer_id TEXT,
  referral_credits_inr INT NOT NULL DEFAULT 0,
  total_readings INT NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS queue_token_seq START 1;

CREATE TABLE IF NOT EXISTS queue_tokens (
  id TEXT PRIMARY KEY,
  token_number INT NOT NULL UNIQUE,
  token_display TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id),
  focus_topic TEXT NOT NULL DEFAULT 'general',
  custom_focus_text TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_session', 'completed', 'noshow', 'cancelled', 'refunded')),
  position INT NOT NULL DEFAULT 0,
  is_priority BOOLEAN NOT NULL DEFAULT false,
  priority_reason TEXT,
  assigned_reader_id TEXT REFERENCES readers(id) ON DELETE SET NULL,
  assigned_reader_name TEXT,
  called_at TIMESTAMPTZ,
  session_started_at TIMESTAMPTZ,
  session_ended_at TIMESTAMPTZ,
  actual_duration_seconds INT,
  is_walkin BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  cards_drawn TEXT NOT NULL DEFAULT '[]',
  reading_summary_published BOOLEAN NOT NULL DEFAULT false,
  customer_feedback_stars INT,
  customer_feedback_comment TEXT,
  feedback_submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL REFERENCES queue_tokens(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi_qr', 'cash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded', 'reupload_requested')),
  base_amount_inr INT NOT NULL,
  discount_amount_inr INT NOT NULL DEFAULT 0,
  referral_discount_inr INT NOT NULL DEFAULT 0,
  final_amount_inr INT NOT NULL,
  discount_code_used TEXT,
  referral_code_used TEXT,
  manual_discount_reason TEXT,
  screenshot_path TEXT,
  screenshot_hash TEXT,
  utr_number TEXT,
  rejection_reason TEXT,
  verified_by_admin_id TEXT,
  verified_at TIMESTAMPTZ,
  matched_with_bank_statement BOOLEAN NOT NULL DEFAULT false,
  matched_at TIMESTAMPTZ,
  cash_received_by_admin_id TEXT,
  cash_amount_given INT,
  cash_change_returned INT,
  refund_reason TEXT,
  refunded_by_admin_id TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  admin_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for High-Traffic College Concurrency
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_referral ON customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON queue_tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_customer ON queue_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_tokens_created ON queue_tokens(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON payments(utr_number);
CREATE INDEX IF NOT EXISTS idx_payments_hash ON payments(screenshot_hash);
CREATE INDEX IF NOT EXISTS idx_payments_token ON payments(token_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 3. Row Level Security (RLS) Enablement
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Initial Seed (Functional only: default editable settings & editable services)
INSERT INTO settings (id, stall_name) 
VALUES (1, 'The Mystical Tarot – SSPU Halloween')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, name, description, card_count, duration_minutes, price_inr, is_group, group_size, is_active, sort_order)
VALUES 
  ('srv-1', 'The Quick Glimpse (1 Card)', 'Quick insight into your immediate burning question or general aura for the evening.', 1, 8, 49, false, 1, true, 1),
  ('srv-2', 'Past, Present & Future (3 Cards)', 'Deep dive into your journey: where you stood, where you are, and where destiny leads.', 3, 15, 99, false, 1, true, 2),
  ('srv-3', 'Love, Romance & Twin Flame (5 Cards)', 'Unveil secrets of your heart, crush, relationships, and emotional blockages.', 5, 20, 149, false, 1, true, 3),
  ('srv-4', 'Spooky Duo / Besties Reading (2 People)', 'Bond over fate! Side-by-side reading for two best friends or couples.', 6, 25, 179, true, 2, true, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO readers (id, name, is_active)
VALUES 
  ('rdr-1', 'Table 1 (Rhea)', true),
  ('rdr-2', 'Table 2 (Aarav)', true)
ON CONFLICT (id) DO NOTHING;
