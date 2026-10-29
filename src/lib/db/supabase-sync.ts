import { createClient } from '@supabase/supabase-js';
import db from './sqlite';
import { AdminUser, StallSettings, Customer, QueueToken, Payment } from '@/types';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    return createClient(url, key, { auth: { persistSession: false } });
  }
  return null;
}

// Helper to map DB row to AdminUser
function mapAdmin(row: any): AdminUser {
  return {
    ...row,
    is_active: Boolean(row.is_active),
    can_edit_prices: Boolean(row.can_edit_prices),
    can_create_discounts: Boolean(row.can_create_discounts),
    can_issue_refunds: Boolean(row.can_issue_refunds),
    can_override_queue: Boolean(row.can_override_queue),
  };
}

// Upsert admin into local SQLite cache
export function upsertLocalAdmin(admin: AdminUser) {
  try {
    db.prepare(`
      INSERT INTO admin_users (
        id, email, password_hash, name, role, is_active,
        can_edit_prices, can_create_discounts, can_issue_refunds, can_override_queue,
        last_active_at, created_at
      ) VALUES (
        @id, @email, @password_hash, @name, @role, @is_active,
        @can_edit_prices, @can_create_discounts, @can_issue_refunds, @can_override_queue,
        @last_active_at, @created_at
      )
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        role = excluded.role,
        is_active = excluded.is_active,
        can_edit_prices = excluded.can_edit_prices,
        can_create_discounts = excluded.can_create_discounts,
        can_issue_refunds = excluded.can_issue_refunds,
        can_override_queue = excluded.can_override_queue,
        last_active_at = excluded.last_active_at;
    `).run({
      id: admin.id,
      email: admin.email.toLowerCase().trim(),
      password_hash: admin.password_hash || '',
      name: admin.name,
      role: admin.role,
      is_active: admin.is_active ? 1 : 0,
      can_edit_prices: admin.can_edit_prices ? 1 : 0,
      can_create_discounts: admin.can_create_discounts ? 1 : 0,
      can_issue_refunds: admin.can_issue_refunds ? 1 : 0,
      can_override_queue: admin.can_override_queue ? 1 : 0,
      last_active_at: admin.last_active_at || null,
      created_at: admin.created_at || new Date().toISOString(),
    });
  } catch (err) {
    console.error('[SUPABASE_SYNC] Error upserting local admin:', err);
  }
}

// Fetch single admin by ID from Supabase and cache locally
export async function fetchAdminFromSupabase(id: string): Promise<AdminUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    const admin = mapAdmin(data);
    upsertLocalAdmin(admin);
    return admin;
  } catch (err) {
    console.error('[SUPABASE_SYNC] Error fetching admin by ID:', err);
    return null;
  }
}

// Fetch single admin by Email from Supabase and cache locally
export async function fetchAdminFromSupabaseByEmail(email: string): Promise<AdminUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !data) return null;

    const admin = mapAdmin(data);
    upsertLocalAdmin(admin);
    return admin;
  } catch (err) {
    console.error('[SUPABASE_SYNC] Error fetching admin by Email:', err);
    return null;
  }
}

// Sync all admins from Supabase to local SQLite cache
export async function syncAdminsFromSupabase(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) {
    const row = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
    return row.count;
  }

  try {
    const { data, error } = await supabase.from('admin_users').select('*');
    if (error || !data) {
      const row = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
      return row.count;
    }

    for (const item of data) {
      upsertLocalAdmin(mapAdmin(item));
    }

    return data.length;
  } catch (err) {
    console.error('[SUPABASE_SYNC] Error syncing all admins from Supabase:', err);
    const row = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
    return row.count;
  }
}

// Push admin to Supabase
export async function pushAdminToSupabase(admin: AdminUser): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('admin_users').upsert({
      id: admin.id,
      email: admin.email.toLowerCase().trim(),
      password_hash: admin.password_hash,
      name: admin.name,
      role: admin.role,
      is_active: admin.is_active,
      can_edit_prices: admin.can_edit_prices,
      can_create_discounts: admin.can_create_discounts,
      can_issue_refunds: admin.can_issue_refunds,
      can_override_queue: admin.can_override_queue,
      last_active_at: admin.last_active_at || null,
      created_at: admin.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error('[SUPABASE_SYNC] Error pushing admin to Supabase:', error);
    }
  } catch (err) {
    console.error('[SUPABASE_SYNC] Exception pushing admin to Supabase:', err);
  }
}

// Delete admin from Supabase
export async function deleteAdminFromSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('admin_users').delete().eq('id', id);
  } catch (err) {
    console.error('[SUPABASE_SYNC] Error deleting admin from Supabase:', err);
  }
}

// Push settings to Supabase
export async function pushSettingsToSupabase(settings: StallSettings): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('settings').upsert({
      id: 1,
      stall_name: settings.stall_name,
      theme_subtext: settings.theme_subtext,
      announcement_banner: settings.announcement_banner,
      is_queue_open: settings.is_queue_open,
      queue_paused_message: settings.queue_paused_message,
      max_queue_cap: settings.max_queue_cap,
      scheduled_opening_time: settings.scheduled_opening_time,
      scheduled_closing_time: settings.scheduled_closing_time,
      upi_id: settings.upi_id,
      upi_qr_url: settings.upi_qr_url,
      allow_pay_later: settings.allow_pay_later,
      auto_noshow_minutes: settings.auto_noshow_minutes,
      whatsapp_helpline: settings.whatsapp_helpline,
      disclaimer_text: settings.disclaimer_text,
      first_timer_discount_inr: settings.first_timer_discount_inr,
      group_discount_inr: settings.group_discount_inr,
      happy_hour_enabled: settings.happy_hour_enabled,
      happy_hour_start: settings.happy_hour_start,
      happy_hour_end: settings.happy_hour_end,
      happy_hour_percent: settings.happy_hour_percent,
      referrer_reward_inr: settings.referrer_reward_inr,
      referee_discount_inr: settings.referee_discount_inr,
      referral_reward_on_completed_only: settings.referral_reward_on_completed_only,
      admin_manual_discount_threshold_inr: settings.admin_manual_discount_threshold_inr,
      data_retention_days: settings.data_retention_days,
      is_event_mode: settings.is_event_mode,
      hero_title: settings.hero_title,
      hero_tagline: settings.hero_tagline,
      whatsapp_number: settings.whatsapp_number,
      whatsapp_prefill_message: settings.whatsapp_prefill_message,
      instagram_handle: settings.instagram_handle,
      tarot_handle: settings.tarot_handle,
      bio_text: settings.bio_text,
      bio_photo_url: settings.bio_photo_url,
      announcement_banner_active: settings.announcement_banner_active,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[SUPABASE_SYNC] Error pushing settings to Supabase:', err);
  }
}
