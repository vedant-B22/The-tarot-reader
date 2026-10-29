import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'tarot.db');

// Connect with timeout to prevent multi-process locks during Next.js build
const db = new Database(DB_PATH, { timeout: 10000 });

// Pragmas for performance and concurrency
try {
  db.pragma('busy_timeout = 10000');
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
} catch (e) {
  // Ignore in case of multi-worker contention
}

let isInitialized = false;

export function initSqliteDb() {
  if (isInitialized) return;

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        stall_name TEXT NOT NULL DEFAULT 'The Tarot Reader',
        theme_subtext TEXT NOT NULL DEFAULT 'Clarity through the cards',
        announcement_banner TEXT NOT NULL DEFAULT '✨ Live Halloween Stall Event Concluded! Online bookings & 1-on-1 private readings are now open.',
        is_queue_open INTEGER NOT NULL DEFAULT 0,
        queue_paused_message TEXT NOT NULL DEFAULT 'Queue is temporarily paused.',
        max_queue_cap INTEGER NOT NULL DEFAULT 60,
        scheduled_opening_time TEXT DEFAULT '10:00',
        scheduled_closing_time TEXT DEFAULT '22:00',
        upi_id TEXT NOT NULL DEFAULT '9527318721@ybl',
        upi_qr_url TEXT NOT NULL DEFAULT '/uploads/stall_upi_qr.jpg',
        allow_pay_later INTEGER NOT NULL DEFAULT 0,
        auto_noshow_minutes INTEGER NOT NULL DEFAULT 5,
        whatsapp_helpline TEXT NOT NULL DEFAULT '+919226634637',
        disclaimer_text TEXT NOT NULL DEFAULT 'Tarot readings are for personal guidance, self-reflection, and entertainment, not a substitute for professional, medical, legal or financial advice.',
        first_timer_discount_inr INTEGER NOT NULL DEFAULT 0,
        group_discount_inr INTEGER NOT NULL DEFAULT 20,
        happy_hour_enabled INTEGER NOT NULL DEFAULT 0,
        happy_hour_start TEXT DEFAULT '17:00',
        happy_hour_end TEXT DEFAULT '19:00',
        happy_hour_percent INTEGER NOT NULL DEFAULT 15,
        referrer_reward_inr INTEGER NOT NULL DEFAULT 25,
        referee_discount_inr INTEGER NOT NULL DEFAULT 15,
        referral_reward_on_completed_only INTEGER NOT NULL DEFAULT 1,
        admin_manual_discount_threshold_inr INTEGER NOT NULL DEFAULT 50,
        data_retention_days INTEGER NOT NULL DEFAULT 30,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),

        -- Post-Event Landing & Booking additions
        is_event_mode INTEGER NOT NULL DEFAULT 0,
        hero_title TEXT NOT NULL DEFAULT 'The Tarot Reader',
        hero_tagline TEXT NOT NULL DEFAULT 'Clarity through the cards',
        whatsapp_number TEXT NOT NULL DEFAULT '+91 92266 34637',
        whatsapp_prefill_message TEXT NOT NULL DEFAULT 'Hi, I''d like a tarot reading',
        instagram_handle TEXT NOT NULL DEFAULT 'this.is_vedant_12',
        tarot_handle TEXT NOT NULL DEFAULT 'the_arcane_diaries',
        bio_text TEXT NOT NULL DEFAULT 'Intuitive Tarot Reader & Guide with The Arcane Diaries. Uncovering patterns in love, career, and personal destiny through the sacred symbolism of the cards.',
        bio_photo_url TEXT DEFAULT '',
        announcement_banner_active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active INTEGER NOT NULL DEFAULT 1,
        can_edit_prices INTEGER NOT NULL DEFAULT 0,
        can_create_discounts INTEGER NOT NULL DEFAULT 0,
        can_issue_refunds INTEGER NOT NULL DEFAULT 0,
        can_override_queue INTEGER NOT NULL DEFAULT 1,
        last_active_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        card_count INTEGER NOT NULL DEFAULT 1,
        duration_minutes INTEGER NOT NULL DEFAULT 10,
        price_inr INTEGER NOT NULL,
        is_group INTEGER NOT NULL DEFAULT 0,
        group_size INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS discount_codes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        discount_value INTEGER NOT NULL,
        min_order_inr INTEGER NOT NULL DEFAULT 0,
        max_discount_inr INTEGER,
        valid_from TEXT,
        valid_until TEXT,
        max_total_uses INTEGER,
        max_uses_per_customer INTEGER NOT NULL DEFAULT 1,
        current_uses INTEGER NOT NULL DEFAULT 0,
        applicable_service_ids TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_by_admin_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS readers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        current_token_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        course_year TEXT NOT NULL,
        referral_code TEXT NOT NULL UNIQUE,
        referred_by_customer_id TEXT,
        referral_credits_inr INTEGER NOT NULL DEFAULT 0,
        total_readings INTEGER NOT NULL DEFAULT 0,
        tags TEXT NOT NULL DEFAULT '[]',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS queue_tokens (
        id TEXT PRIMARY KEY,
        token_number INTEGER NOT NULL UNIQUE,
        token_display TEXT NOT NULL,
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        service_id TEXT NOT NULL REFERENCES services(id),
        focus_topic TEXT NOT NULL DEFAULT 'general',
        custom_focus_text TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        position INTEGER NOT NULL DEFAULT 0,
        is_priority INTEGER NOT NULL DEFAULT 0,
        priority_reason TEXT,
        assigned_reader_id TEXT REFERENCES readers(id) ON DELETE SET NULL,
        assigned_reader_name TEXT,
        called_at TEXT,
        session_started_at TEXT,
        session_ended_at TEXT,
        actual_duration_seconds INTEGER,
        is_walkin INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        cards_drawn TEXT NOT NULL DEFAULT '[]',
        reading_summary_published INTEGER NOT NULL DEFAULT 0,
        customer_feedback_stars INTEGER,
        customer_feedback_comment TEXT,
        feedback_submitted_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        token_id TEXT NOT NULL REFERENCES queue_tokens(id) ON DELETE CASCADE,
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        base_amount_inr INTEGER NOT NULL,
        discount_amount_inr INTEGER NOT NULL DEFAULT 0,
        referral_discount_inr INTEGER NOT NULL DEFAULT 0,
        final_amount_inr INTEGER NOT NULL,
        discount_code_used TEXT,
        referral_code_used TEXT,
        manual_discount_reason TEXT,
        screenshot_path TEXT,
        screenshot_hash TEXT,
        utr_number TEXT,
        rejection_reason TEXT,
        verified_by_admin_id TEXT,
        verified_at TEXT,
        matched_with_bank_statement INTEGER NOT NULL DEFAULT 0,
        matched_at TEXT,
        cash_received_by_admin_id TEXT,
        cash_amount_given INTEGER,
        cash_change_returned INTEGER,
        refund_reason TEXT,
        refunded_by_admin_id TEXT,
        refunded_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Post-Event Booking & Landing Tables
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
        discount_inr INTEGER NOT NULL DEFAULT 0,
        final_price_inr INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        admin_notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS leads_subscribers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        source TEXT NOT NULL,
        event_id TEXT,
        event_title TEXT,
        consent_given INTEGER NOT NULL DEFAULT 1,
        is_opted_out INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        service_name TEXT,
        rating INTEGER NOT NULL DEFAULT 5,
        feedback_text TEXT NOT NULL,
        is_approved INTEGER NOT NULL DEFAULT 0,
        token_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS upcoming_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date_text TEXT NOT NULL,
        location TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS gallery_images (
        id TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        caption TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS click_stats (
        event_key TEXT PRIMARY KEY,
        click_count INTEGER NOT NULL DEFAULT 0,
        last_clicked_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Seed settings if empty
      INSERT OR IGNORE INTO settings (id, stall_name) VALUES (1, 'The Tarot Reader');

      -- Seed initial editable services if empty
      INSERT OR IGNORE INTO services (id, name, description, card_count, duration_minutes, price_inr, is_group, group_size, is_active, sort_order)
      VALUES 
        ('srv-1', 'Question Specific Tarot', 'Focused insight into your immediate burning question. (Compulsory: Must complete a Destiny Card reading prior to this).', 1, 8, 49, 0, 1, 1, 1),
        ('srv-2', 'Destiny Card', 'Three cards drawn to reveal your path: one of life, one of love, and one of career.', 3, 15, 150, 0, 1, 1, 2),
        ('srv-3', 'Love Specific Cards', 'Three focused questions uncovering three deep, love life-related answers and relationship clarity.', 3, 20, 200, 0, 1, 1, 3),
        ('srv-4', 'Duo or Couple Cards', 'Side-by-side reading exploring relationship dynamics across five deep questions for couples or duos.', 5, 25, 300, 1, 2, 1, 4),
        ('srv-5', 'Customized Tarot', 'Tailored consultation crafted around your unique spread, complex situations, or bespoke multi-topic questions.', 0, 30, 0, 0, 1, 1, 5);

      -- Seed initial readers if empty
      INSERT OR IGNORE INTO readers (id, name, is_active)
      VALUES 
        ('rdr-1', 'Table 1 (Rhea)', 1),
        ('rdr-2', 'Table 2 (Aarav)', 1);
    `);

    // Safe column migrations for existing database files
    const newSettingsCols = [
      "ALTER TABLE settings ADD COLUMN is_event_mode INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE settings ADD COLUMN hero_title TEXT NOT NULL DEFAULT 'The Tarot Reader'",
      "ALTER TABLE settings ADD COLUMN hero_tagline TEXT NOT NULL DEFAULT 'Clarity through the cards'",
      "ALTER TABLE settings ADD COLUMN whatsapp_number TEXT NOT NULL DEFAULT '+91 92266 34637'",
      "ALTER TABLE settings ADD COLUMN whatsapp_prefill_message TEXT NOT NULL DEFAULT 'Hi, I''d like a tarot reading'",
      "ALTER TABLE settings ADD COLUMN instagram_handle TEXT NOT NULL DEFAULT 'this.is_vedant_12'",
      "ALTER TABLE settings ADD COLUMN tarot_handle TEXT NOT NULL DEFAULT 'the_arcane_diaries'",
      "ALTER TABLE settings ADD COLUMN bio_text TEXT NOT NULL DEFAULT 'Intuitive Tarot Reader & Guide with The Arcane Diaries. Uncovering patterns in love, career, and personal destiny through the sacred symbolism of the cards.'",
      "ALTER TABLE settings ADD COLUMN bio_photo_url TEXT DEFAULT ''",
      "ALTER TABLE settings ADD COLUMN announcement_banner_active INTEGER NOT NULL DEFAULT 1"
    ];
    for (const alterSql of newSettingsCols) {
      try { db.exec(alterSql); } catch (e) {}
    }

    // Safe upsert to ensure services table matches latest post-event offerings
    try {
      db.exec(`
        INSERT INTO services (id, name, description, card_count, duration_minutes, price_inr, is_group, group_size, is_active, sort_order)
        VALUES 
          ('srv-1', 'Question Specific Tarot', 'Focused insight into your immediate burning question. (Compulsory: Must complete a Destiny Card reading prior to this).', 1, 8, 49, 0, 1, 1, 1),
          ('srv-2', 'Destiny Card', 'Three cards drawn to reveal your path: one of life, one of love, and one of career.', 3, 15, 150, 0, 1, 1, 2),
          ('srv-3', 'Love Specific Cards', 'Three focused questions uncovering three deep, love life-related answers and relationship clarity.', 3, 20, 200, 0, 1, 1, 3),
          ('srv-4', 'Duo or Couple Cards', 'Side-by-side reading exploring relationship dynamics across five deep questions for couples or duos.', 5, 25, 300, 1, 2, 1, 4),
          ('srv-5', 'Customized Tarot', 'Tailored consultation crafted around your unique spread, complex situations, or bespoke multi-topic questions.', 0, 30, 0, 0, 1, 1, 5)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          card_count = excluded.card_count,
          duration_minutes = excluded.duration_minutes,
          price_inr = excluded.price_inr,
          is_group = excluded.is_group,
          group_size = excluded.group_size,
          is_active = excluded.is_active,
          sort_order = excluded.sort_order;
      `);
    } catch (e) {
      console.error('[SQLITE_INIT] Services upsert error:', e);
    }

    isInitialized = true;
  } catch (e) {
    // If table already exists or another thread initialized it
  }
}

// Run init safely
initSqliteDb();

export default db;
