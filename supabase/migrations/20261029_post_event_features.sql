-- ==============================================================================
-- The Tarot Reader – Post-Event Landing, Online Bookings & Leads Migration
-- Target: Live Website (Post-Halloween 2026 Event Transition)
-- ==============================================================================

-- 1. Alter Settings with Post-Event & Branding Columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS is_event_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_title TEXT NOT NULL DEFAULT 'The Tarot Reader';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_tagline TEXT NOT NULL DEFAULT 'Clarity through the cards';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '+91 92266 34637';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_prefill_message TEXT NOT NULL DEFAULT 'Hi, I''d like a tarot reading';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram_handle TEXT NOT NULL DEFAULT 'this.is_vedant_12';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tarot_handle TEXT NOT NULL DEFAULT 'the_arcane_diaries';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS bio_text TEXT NOT NULL DEFAULT 'Intuitive Tarot Reader & Guide with The Arcane Diaries. Uncovering patterns in love, career, and personal destiny through the sacred symbolism of the cards.';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS bio_photo_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS announcement_banner_active BOOLEAN NOT NULL DEFAULT true;

-- Update defaults for existing settings row
UPDATE settings SET
  stall_name = 'The Tarot Reader',
  theme_subtext = 'Clarity through the cards',
  is_event_mode = false,
  whatsapp_helpline = '+919226634637'
WHERE id = 1;

-- 2. Create Booking Requests Table
CREATE TABLE IF NOT EXISTS booking_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  note TEXT,
  promo_code TEXT,
  discount_inr INT NOT NULL DEFAULT 0,
  final_price_inr INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'booked', 'completed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Leads & Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS leads_subscribers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('newsletter', 'event_interest', 'booking')),
  event_id TEXT,
  event_title TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  is_opted_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Public & Moderated Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  service_name TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  token_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Upcoming Pop-Up Events Table
CREATE TABLE IF NOT EXISTS upcoming_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date_text TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create First-Party Privacy-Friendly Aggregate Click Counter Table
CREATE TABLE IF NOT EXISTS click_stats (
  event_key TEXT PRIMARY KEY,
  click_count INT NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Speed
CREATE INDEX IF NOT EXISTS idx_bookings_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON booking_requests(phone);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads_subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(is_approved);

-- Enable RLS
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_stats ENABLE ROW LEVEL SECURITY;
