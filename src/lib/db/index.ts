import db from './sqlite';
import crypto from 'crypto';
import { 
  AdminUser, 
  Service, 
  DiscountCode, 
  Reader, 
  Customer, 
  QueueToken, 
  Payment, 
  StallSettings, 
  AuditLog, 
  QueueLiveMetrics 
} from '@/types';

// Helper to sanitize boolean conversions from SQLite 0/1
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

function mapService(row: any): Service {
  return {
    ...row,
    is_group: Boolean(row.is_group),
    is_active: Boolean(row.is_active),
  };
}

function mapCustomer(row: any): Customer {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
  };
}

function mapToken(row: any): QueueToken {
  return {
    ...row,
    is_priority: Boolean(row.is_priority),
    is_walkin: Boolean(row.is_walkin),
    reading_summary_published: Boolean(row.reading_summary_published),
    cards_drawn: JSON.parse(row.cards_drawn || '[]'),
  };
}

function mapPayment(row: any): Payment {
  return {
    ...row,
    matched_with_bank_statement: Boolean(row.matched_with_bank_statement),
  };
}

function mapSettings(row: any): StallSettings {
  if (!row) {
    return {
      id: 1,
      stall_name: 'The Tarot Reader',
      theme_subtext: 'Clarity through the cards',
      announcement_banner: '✨ Live Halloween Stall Event Concluded! Online bookings & 1-on-1 private readings are now open.',
      is_queue_open: false,
      queue_paused_message: 'Queue is temporarily paused.',
      max_queue_cap: 60,
      scheduled_opening_time: '10:00',
      scheduled_closing_time: '22:00',
      upi_id: '9527318721@ybl',
      upi_qr_url: '/uploads/stall_upi_qr.jpg',
      allow_pay_later: false,
      auto_noshow_minutes: 5,
      whatsapp_helpline: '+919226634637',
      disclaimer_text: 'Tarot readings are for personal guidance, self-reflection, and entertainment, not a substitute for professional, medical, legal or financial advice.',
      first_timer_discount_inr: 0,
      group_discount_inr: 20,
      happy_hour_enabled: false,
      happy_hour_start: '17:00',
      happy_hour_end: '19:00',
      happy_hour_percent: 15,
      referrer_reward_inr: 25,
      referee_discount_inr: 15,
      referral_reward_on_completed_only: true,
      admin_manual_discount_threshold_inr: 50,
      data_retention_days: 30,
      updated_at: new Date().toISOString(),
      is_event_mode: false,
      hero_title: 'The Tarot Reader',
      hero_tagline: 'Clarity through the cards',
      whatsapp_number: '+91 92266 34637',
      whatsapp_prefill_message: 'Hi, I\'d like a tarot reading',
      instagram_handle: 'this.is_vedant_12',
      tarot_handle: 'the_arcane_diaries',
      bio_text: 'Intuitive Tarot Reader & Guide with The Arcane Diaries. Uncovering patterns in love, career, and personal destiny through the sacred symbolism of the cards.',
      bio_photo_url: '',
      announcement_banner_active: true,
    };
  }

  return {
    ...row,
    stall_name: row.stall_name || 'The Tarot Reader',
    theme_subtext: row.theme_subtext || 'Clarity through the cards',
    is_queue_open: Boolean(row.is_queue_open),
    allow_pay_later: Boolean(row.allow_pay_later),
    happy_hour_enabled: Boolean(row.happy_hour_enabled),
    referral_reward_on_completed_only: Boolean(row.referral_reward_on_completed_only),
    is_event_mode: Boolean(row.is_event_mode),
    hero_title: row.hero_title || 'The Tarot Reader',
    hero_tagline: row.hero_tagline || 'Clarity through the cards',
    whatsapp_number: row.whatsapp_number || '+91 92266 34637',
    whatsapp_prefill_message: row.whatsapp_prefill_message || 'Hi, I\'d like a tarot reading',
    instagram_handle: row.instagram_handle || 'this.is_vedant_12',
    tarot_handle: row.tarot_handle || 'the_arcane_diaries',
    bio_text: row.bio_text || 'Intuitive Tarot Reader & Guide with The Arcane Diaries. Uncovering patterns in love, career, and personal destiny through the sacred symbolism of the cards.',
    bio_photo_url: row.bio_photo_url || '',
    announcement_banner_active: row.announcement_banner_active !== undefined ? Boolean(row.announcement_banner_active) : true,
  };
}

// -------------------------------------------------------------
// SETTINGS REPOSITORY
// -------------------------------------------------------------
export function getSettings(): StallSettings {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  return mapSettings(row);
}

export function updateSettings(data: Partial<StallSettings>, adminId?: string, adminName?: string): StallSettings {
  const current = getSettings();
  const updated = { ...current, ...data, updated_at: new Date().toISOString() };

  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'updated_at');
  if (fields.length > 0) {
    const setClause = fields.map(f => `${f} = @${f}`).join(', ') + ', updated_at = @updated_at';
    db.prepare(`UPDATE settings SET ${setClause} WHERE id = 1`).run({
      ...updated,
      is_queue_open: updated.is_queue_open ? 1 : 0,
      allow_pay_later: updated.allow_pay_later ? 1 : 0,
      happy_hour_enabled: updated.happy_hour_enabled ? 1 : 0,
      referral_reward_on_completed_only: updated.referral_reward_on_completed_only ? 1 : 0,
      is_event_mode: updated.is_event_mode ? 1 : 0,
      announcement_banner_active: updated.announcement_banner_active ? 1 : 0,
    });

    logAudit({
      admin_id: adminId || null,
      admin_name: adminName || 'System',
      action: 'UPDATE_SETTINGS',
      entity_type: 'settings',
      entity_id: '1',
      old_values: JSON.stringify(current),
      new_values: JSON.stringify(updated),
    });
  }

  return getSettings();
}

// -------------------------------------------------------------
// ADMIN USERS REPOSITORY
// -------------------------------------------------------------
export function getAdminCount(): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  return row.count;
}

export function getAdminByEmail(email: string): AdminUser | null {
  const row = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email.toLowerCase().trim());
  return row ? mapAdmin(row) : null;
}

export function getAdminById(id: string): AdminUser | null {
  const row = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id);
  return row ? mapAdmin(row) : null;
}

export function getAllAdmins(): AdminUser[] {
  const rows = db.prepare('SELECT * FROM admin_users ORDER BY role DESC, created_at ASC').all();
  return rows.map(mapAdmin);
}

export function createAdmin(admin: {
  id?: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'super_admin' | 'admin';
  can_edit_prices?: boolean;
  can_create_discounts?: boolean;
  can_issue_refunds?: boolean;
  can_override_queue?: boolean;
}, actorName?: string): AdminUser {
  const id = admin.id || crypto.randomUUID();
  db.prepare(`
    INSERT INTO admin_users (
      id, email, password_hash, name, role, is_active,
      can_edit_prices, can_create_discounts, can_issue_refunds, can_override_queue
    ) VALUES (
      @id, @email, @password_hash, @name, @role, 1,
      @can_edit_prices, @can_create_discounts, @can_issue_refunds, @can_override_queue
    )
  `).run({
    id,
    email: admin.email.toLowerCase().trim(),
    password_hash: admin.password_hash,
    name: admin.name.trim(),
    role: admin.role,
    can_edit_prices: admin.can_edit_prices ? 1 : 0,
    can_create_discounts: admin.can_create_discounts ? 1 : 0,
    can_issue_refunds: admin.can_issue_refunds ? 1 : 0,
    can_override_queue: admin.can_override_queue !== undefined ? (admin.can_override_queue ? 1 : 0) : 1,
  });

  logAudit({
    admin_id: null,
    admin_name: actorName || 'Super Admin',
    action: 'CREATE_ADMIN',
    entity_type: 'admin_users',
    entity_id: id,
    old_values: null,
    new_values: JSON.stringify({ email: admin.email, name: admin.name, role: admin.role }),
  });

  return getAdminById(id)!;
}

export function updateAdmin(id: string, updates: Partial<AdminUser>, actorName?: string): AdminUser | null {
  const current = getAdminById(id);
  if (!current) return null;

  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length > 0) {
    const params: any = { id };
    const setClauses: string[] = [];

    for (const field of fields) {
      const val = (updates as any)[field];
      if (typeof val === 'boolean') {
        params[field] = val ? 1 : 0;
      } else {
        params[field] = val;
      }
      setClauses.push(`${field} = @${field}`);
    }

    db.prepare(`UPDATE admin_users SET ${setClauses.join(', ')} WHERE id = @id`).run(params);

    logAudit({
      admin_id: null,
      admin_name: actorName || 'Super Admin',
      action: 'UPDATE_ADMIN',
      entity_type: 'admin_users',
      entity_id: id,
      old_values: JSON.stringify(current),
      new_values: JSON.stringify(updates),
    });
  }

  return getAdminById(id);
}

export function deleteAdmin(id: string, actorName?: string): boolean {
  const current = getAdminById(id);
  if (!current || current.role === 'super_admin') return false;

  db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);

  logAudit({
    admin_id: null,
    admin_name: actorName || 'Super Admin',
    action: 'DELETE_ADMIN',
    entity_type: 'admin_users',
    entity_id: id,
    old_values: JSON.stringify(current),
    new_values: null,
  });

  return true;
}

export function touchAdminActive(id: string) {
  db.prepare("UPDATE admin_users SET last_active_at = datetime('now') WHERE id = ?").run(id);
}

// -------------------------------------------------------------
// SERVICES REPOSITORY
// -------------------------------------------------------------
export function getAllServices(activeOnly = false): Service[] {
  let query = 'SELECT * FROM services';
  if (activeOnly) {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY sort_order ASC, price_inr ASC';
  const rows = db.prepare(query).all();
  return rows.map(mapService);
}

export function getServiceById(id: string): Service | null {
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  return row ? mapService(row) : null;
}

export function createService(service: Omit<Service, 'id' | 'created_at'>, actorName?: string): Service {
  const id = 'srv-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO services (id, name, description, card_count, duration_minutes, price_inr, is_group, group_size, is_active, sort_order)
    VALUES (@id, @name, @description, @card_count, @duration_minutes, @price_inr, @is_group, @group_size, @is_active, @sort_order)
  `).run({
    ...service,
    id,
    is_group: service.is_group ? 1 : 0,
    is_active: service.is_active ? 1 : 0,
  });

  logAudit({
    admin_name: actorName || 'Admin',
    action: 'CREATE_SERVICE',
    entity_type: 'services',
    entity_id: id,
    old_values: null,
    new_values: JSON.stringify(service),
  });

  return getServiceById(id)!;
}

export function updateService(id: string, updates: Partial<Service>, actorName?: string): Service | null {
  const current = getServiceById(id);
  if (!current) return null;

  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length > 0) {
    const params: any = { id };
    const setClauses: string[] = [];

    for (const field of fields) {
      const val = (updates as any)[field];
      if (typeof val === 'boolean') {
        params[field] = val ? 1 : 0;
      } else {
        params[field] = val;
      }
      setClauses.push(`${field} = @${field}`);
    }

    db.prepare(`UPDATE services SET ${setClauses.join(', ')} WHERE id = @id`).run(params);

    logAudit({
      admin_name: actorName || 'Admin',
      action: 'UPDATE_SERVICE',
      entity_type: 'services',
      entity_id: id,
      old_values: JSON.stringify(current),
      new_values: JSON.stringify(updates),
    });
  }

  return getServiceById(id);
}

export function deleteService(id: string, actorName?: string): boolean {
  const current = getServiceById(id);
  if (!current) return false;

  db.prepare('DELETE FROM services WHERE id = ?').run(id);

  logAudit({
    admin_name: actorName || 'Admin',
    action: 'DELETE_SERVICE',
    entity_type: 'services',
    entity_id: id,
    old_values: JSON.stringify(current),
    new_values: null,
  });

  return true;
}

// -------------------------------------------------------------
// DISCOUNT CODES REPOSITORY
// -------------------------------------------------------------
export function getAllDiscountCodes(): DiscountCode[] {
  const rows = db.prepare('SELECT * FROM discount_codes ORDER BY created_at DESC').all();
  return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
}

export function getDiscountCodeByCode(code: string): DiscountCode | null {
  const row = db.prepare('SELECT * FROM discount_codes WHERE UPPER(code) = UPPER(?)').get(code.trim());
  return row ? { ...(row as any), is_active: Boolean((row as any).is_active) } : null;
}

export function createDiscountCode(discount: Omit<DiscountCode, 'id' | 'current_uses' | 'created_at'>, actorName?: string): DiscountCode {
  const id = 'dsc-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO discount_codes (
      id, code, discount_type, discount_value, min_order_inr, max_discount_inr,
      valid_from, valid_until, max_total_uses, max_uses_per_customer,
      applicable_service_ids, is_active, created_by_admin_id
    ) VALUES (
      @id, @code, @discount_type, @discount_value, @min_order_inr, @max_discount_inr,
      @valid_from, @valid_until, @max_total_uses, @max_uses_per_customer,
      @applicable_service_ids, @is_active, @created_by_admin_id
    )
  `).run({
    ...discount,
    id,
    code: discount.code.toUpperCase().trim(),
    is_active: discount.is_active ? 1 : 0,
  });

  logAudit({
    admin_name: actorName || 'Admin',
    action: 'CREATE_DISCOUNT_CODE',
    entity_type: 'discount_codes',
    entity_id: id,
    old_values: null,
    new_values: JSON.stringify(discount),
  });

  const row = db.prepare('SELECT * FROM discount_codes WHERE id = ?').get(id);
  return { ...(row as any), is_active: Boolean((row as any).is_active) };
}

export function updateDiscountCode(id: string, updates: Partial<DiscountCode>, actorName?: string): DiscountCode | null {
  const row = db.prepare('SELECT * FROM discount_codes WHERE id = ?').get(id);
  if (!row) return null;

  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length > 0) {
    const params: any = { id };
    const setClauses: string[] = [];

    for (const field of fields) {
      const val = (updates as any)[field];
      if (typeof val === 'boolean') {
        params[field] = val ? 1 : 0;
      } else {
        params[field] = val;
      }
      setClauses.push(`${field} = @${field}`);
    }

    db.prepare(`UPDATE discount_codes SET ${setClauses.join(', ')} WHERE id = @id`).run(params);

    logAudit({
      admin_name: actorName || 'Admin',
      action: 'UPDATE_DISCOUNT_CODE',
      entity_type: 'discount_codes',
      entity_id: id,
      old_values: JSON.stringify(row),
      new_values: JSON.stringify(updates),
    });
  }

  const updatedRow = db.prepare('SELECT * FROM discount_codes WHERE id = ?').get(id);
  return { ...(updatedRow as any), is_active: Boolean((updatedRow as any).is_active) };
}

export function incrementDiscountCodeUsage(code: string) {
  db.prepare('UPDATE discount_codes SET current_uses = current_uses + 1 WHERE UPPER(code) = UPPER(?)').run(code.trim());
}

// -------------------------------------------------------------
// READERS / TABLES REPOSITORY
// -------------------------------------------------------------
export function getAllReaders(): Reader[] {
  const rows = db.prepare('SELECT * FROM readers ORDER BY created_at ASC').all();
  return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
}

export function getReaderById(id: string): Reader | null {
  const row = db.prepare('SELECT * FROM readers WHERE id = ?').get(id);
  return row ? { ...(row as any), is_active: Boolean((row as any).is_active) } : null;
}

export function createReader(name: string, actorName?: string): Reader {
  const id = 'rdr-' + crypto.randomBytes(4).toString('hex');
  db.prepare('INSERT INTO readers (id, name, is_active) VALUES (?, ?, 1)').run(id, name.trim());

  logAudit({
    admin_name: actorName || 'Admin',
    action: 'CREATE_READER',
    entity_type: 'readers',
    entity_id: id,
    old_values: null,
    new_values: JSON.stringify({ name }),
  });

  return getReaderById(id)!;
}

export function updateReader(id: string, updates: Partial<Reader>, actorName?: string): Reader | null {
  const current = getReaderById(id);
  if (!current) return null;

  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length > 0) {
    const params: any = { id };
    const setClauses: string[] = [];

    for (const field of fields) {
      const val = (updates as any)[field];
      if (typeof val === 'boolean') {
        params[field] = val ? 1 : 0;
      } else {
        params[field] = val;
      }
      setClauses.push(`${field} = @${field}`);
    }

    db.prepare(`UPDATE readers SET ${setClauses.join(', ')} WHERE id = @id`).run(params);

    logAudit({
      admin_name: actorName || 'Admin',
      action: 'UPDATE_READER',
      entity_type: 'readers',
      entity_id: id,
      old_values: JSON.stringify(current),
      new_values: JSON.stringify(updates),
    });
  }

  return getReaderById(id);
}

export function setReaderCurrentToken(readerId: string, tokenId: string | null) {
  db.prepare('UPDATE readers SET current_token_id = ? WHERE id = ?').run(tokenId, readerId);
}

// -------------------------------------------------------------
// CUSTOMERS REPOSITORY
// -------------------------------------------------------------
export function getCustomerById(id: string): Customer | null {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  return row ? mapCustomer(row) : null;
}

export function getCustomerByPhone(phone: string): Customer | null {
  const normalized = phone.replace(/\D/g, '');
  const row = db.prepare('SELECT * FROM customers WHERE phone = ?').get(normalized);
  return row ? mapCustomer(row) : null;
}

export function getCustomerByReferralCode(code: string): Customer | null {
  const row = db.prepare('SELECT * FROM customers WHERE UPPER(referral_code) = UPPER(?)').get(code.trim());
  return row ? mapCustomer(row) : null;
}

export function getAllCustomers(): Customer[] {
  const rows = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  return rows.map(mapCustomer);
}

export function generateUniqueReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'MOON';
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${cleanName}-${rand}`;
}

export function getOrCreateCustomer(data: {
  phone: string;
  name: string;
  course_year: string;
  referred_by_code?: string;
}): { customer: Customer; isNew: boolean } {
  const normalizedPhone = data.phone.replace(/\D/g, '');
  const existing = getCustomerByPhone(normalizedPhone);

  if (existing) {
    // Update name or course_year if provided
    db.prepare('UPDATE customers SET name = ?, course_year = ? WHERE id = ?')
      .run(data.name.trim(), data.course_year.trim(), existing.id);
    return { customer: getCustomerById(existing.id)!, isNew: false };
  }

  let referredById: string | null = null;
  if (data.referred_by_code) {
    const referrer = getCustomerByReferralCode(data.referred_by_code);
    if (referrer) {
      referredById = referrer.id;
    }
  }

  const id = crypto.randomUUID();
  const referral_code = generateUniqueReferralCode(data.name);

  db.prepare(`
    INSERT INTO customers (id, phone, name, course_year, referral_code, referred_by_customer_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, normalizedPhone, data.name.trim(), data.course_year.trim(), referral_code, referredById);

  return { customer: getCustomerById(id)!, isNew: true };
}

export function updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
  const current = getCustomerById(id);
  if (!current) return null;

  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length > 0) {
    const params: any = { id };
    const setClauses: string[] = [];

    for (const field of fields) {
      const val = (updates as any)[field];
      if (field === 'tags') {
        params[field] = JSON.stringify(val || []);
      } else {
        params[field] = val;
      }
      setClauses.push(`${field} = @${field}`);
    }

    db.prepare(`UPDATE customers SET ${setClauses.join(', ')} WHERE id = @id`).run(params);
  }

  return getCustomerById(id);
}

export function addCustomerReferralCredits(customerId: string, creditsInr: number) {
  db.prepare('UPDATE customers SET referral_credits_inr = referral_credits_inr + ? WHERE id = ?')
    .run(creditsInr, customerId);
}

export function deleteCustomerData(customerId: string, actorName?: string): boolean {
  const customer = getCustomerById(customerId);
  if (!customer) return false;

  // Anonymize / delete DPDP compliant
  db.transaction(() => {
    db.prepare('DELETE FROM payments WHERE customer_id = ?').run(customerId);
    db.prepare('DELETE FROM queue_tokens WHERE customer_id = ?').run(customerId);
    db.prepare('DELETE FROM customers WHERE id = ?').run(customerId);
  })();

  logAudit({
    admin_name: actorName || 'Admin',
    action: 'DELETE_CUSTOMER_DATA',
    entity_type: 'customers',
    entity_id: customerId,
    old_values: JSON.stringify({ name: customer.name, phone: customer.phone }),
    new_values: null,
  });

  return true;
}

// -------------------------------------------------------------
// QUEUE TOKENS & ATOMIC CONCURRENCY REPOSITORY
// -------------------------------------------------------------
export function getNextTokenNumber(): number {
  const row = db.prepare('SELECT COALESCE(MAX(token_number), 0) + 1 AS next_num FROM queue_tokens').get() as { next_num: number };
  return row.next_num;
}

export function formatTokenDisplay(num: number): string {
  return '#' + String(num).padStart(3, '0');
}

export function createQueueToken(data: {
  customer_id: string;
  service_id: string;
  focus_topic: 'love' | 'career' | 'life' | 'general' | 'other';
  custom_focus_text?: string | null;
  is_priority?: boolean;
  priority_reason?: string | null;
  is_walkin?: boolean;
}): QueueToken {
  const id = crypto.randomUUID();

  // Atomic sequential token generation inside transaction
  const insertToken = db.transaction(() => {
    const nextNum = getNextTokenNumber();
    const tokenDisplay = formatTokenDisplay(nextNum);

    // Current queue position (count of waiting/called ahead)
    const posRow = db.prepare("SELECT COUNT(*) AS count FROM queue_tokens WHERE status IN ('waiting', 'called')").get() as { count: number };
    const position = posRow.count + 1;

    db.prepare(`
      INSERT INTO queue_tokens (
        id, token_number, token_display, customer_id, service_id,
        focus_topic, custom_focus_text, status, position,
        is_priority, priority_reason, is_walkin
      ) VALUES (
        @id, @token_number, @token_display, @customer_id, @service_id,
        @focus_topic, @custom_focus_text, 'waiting', @position,
        @is_priority, @priority_reason, @is_walkin
      )
    `).run({
      id,
      token_number: nextNum,
      token_display: tokenDisplay,
      customer_id: data.customer_id,
      service_id: data.service_id,
      focus_topic: data.focus_topic,
      custom_focus_text: data.custom_focus_text || null,
      position,
      is_priority: data.is_priority ? 1 : 0,
      priority_reason: data.priority_reason || null,
      is_walkin: data.is_walkin ? 1 : 0,
    });

    return id;
  });

  const createdId = insertToken();
  return getTokenById(createdId)!;
}

export function getTokenById(id: string): QueueToken | null {
  const query = `
    SELECT 
      qt.*,
      c.name as customer_name,
      c.phone as customer_phone,
      s.name as service_name,
      s.duration_minutes as service_duration,
      s.card_count as service_cards,
      p.status as payment_status,
      p.payment_method as payment_method,
      p.final_amount_inr as final_amount_inr
    FROM queue_tokens qt
    JOIN customers c ON qt.customer_id = c.id
    JOIN services s ON qt.service_id = s.id
    LEFT JOIN payments p ON qt.id = p.token_id
    WHERE qt.id = ?
  `;
  const row = db.prepare(query).get(id);
  return row ? mapToken(row) : null;
}

export function getActiveTokenForCustomer(customerId: string): QueueToken | null {
  const query = `
    SELECT 
      qt.*,
      c.name as customer_name,
      c.phone as customer_phone,
      s.name as service_name,
      s.duration_minutes as service_duration,
      s.card_count as service_cards,
      p.status as payment_status,
      p.payment_method as payment_method,
      p.final_amount_inr as final_amount_inr
    FROM queue_tokens qt
    JOIN customers c ON qt.customer_id = c.id
    JOIN services s ON qt.service_id = s.id
    LEFT JOIN payments p ON qt.id = p.token_id
    WHERE qt.customer_id = ? AND qt.status IN ('waiting', 'called', 'in_session')
    ORDER BY qt.created_at DESC
    LIMIT 1
  `;
  const row = db.prepare(query).get(customerId);
  return row ? mapToken(row) : null;
}

export function getAllQueueTokens(statusFilter?: string): QueueToken[] {
  let query = `
    SELECT 
      qt.*,
      c.name as customer_name,
      c.phone as customer_phone,
      s.name as service_name,
      s.duration_minutes as service_duration,
      s.card_count as service_cards,
      p.status as payment_status,
      p.payment_method as payment_method,
      p.final_amount_inr as final_amount_inr
    FROM queue_tokens qt
    JOIN customers c ON qt.customer_id = c.id
    JOIN services s ON qt.service_id = s.id
    LEFT JOIN payments p ON qt.id = p.token_id
  `;

  if (statusFilter && statusFilter !== 'all') {
    query += ` WHERE qt.status = '${statusFilter}'`;
  }
  query += ' ORDER BY qt.is_priority DESC, qt.token_number ASC';

  const rows = db.prepare(query).all();
  return rows.map(mapToken);
}

export function getActiveQueueTokens(): QueueToken[] {
  const query = `
    SELECT 
      qt.*,
      c.name as customer_name,
      c.phone as customer_phone,
      s.name as service_name,
      s.duration_minutes as service_duration,
      s.card_count as service_cards,
      p.status as payment_status,
      p.payment_method as payment_method,
      p.final_amount_inr as final_amount_inr
    FROM queue_tokens qt
    JOIN customers c ON qt.customer_id = c.id
    JOIN services s ON qt.service_id = s.id
    LEFT JOIN payments p ON qt.id = p.token_id
    WHERE qt.status IN ('waiting', 'called', 'in_session')
    ORDER BY qt.is_priority DESC, qt.token_number ASC
  `;
  const rows = db.prepare(query).all();
  return rows.map(mapToken);
}

export function updateTokenStatus(tokenId: string, status: QueueToken['status'], extra?: {
  assigned_reader_id?: string | null;
  assigned_reader_name?: string | null;
  notes?: string | null;
  cards_drawn?: any[];
  reading_summary_published?: boolean;
}, actorName?: string): QueueToken | null {
  const current = getTokenById(tokenId);
  if (!current) return null;

  const updates: any = {
    id: tokenId,
    status,
  };

  let extraClauses = '';

  if (status === 'called') {
    extraClauses += ", called_at = datetime('now')";
  } else if (status === 'in_session') {
    extraClauses += ", session_started_at = datetime('now')";
  } else if (status === 'completed') {
    extraClauses += ", session_ended_at = datetime('now')";
    if (current.session_started_at) {
      const startTime = new Date(current.session_started_at).getTime();
      const endTime = Date.now();
      const actualDuration = Math.max(60, Math.round((endTime - startTime) / 1000));
      extraClauses += `, actual_duration_seconds = ${actualDuration}`;
    } else {
      extraClauses += `, actual_duration_seconds = ${ (current.service_duration || 10) * 60 }`;
    }

    // Customer completed a reading -> increment customer readings
    db.prepare('UPDATE customers SET total_readings = total_readings + 1 WHERE id = ?').run(current.customer_id);

    // If customer was referred and referral reward is configure on completion, credit referrer
    const cust = getCustomerById(current.customer_id);
    const settings = getSettings();
    if (cust?.referred_by_customer_id && settings.referrer_reward_inr > 0) {
      addCustomerReferralCredits(cust.referred_by_customer_id, settings.referrer_reward_inr);
    }
  }

  if (extra?.assigned_reader_id !== undefined) {
    updates.assigned_reader_id = extra.assigned_reader_id;
    updates.assigned_reader_name = extra.assigned_reader_name;
    extraClauses += ', assigned_reader_id = @assigned_reader_id, assigned_reader_name = @assigned_reader_name';

    // If reader assigned, update reader's current_token_id
    if (extra.assigned_reader_id) {
      setReaderCurrentToken(extra.assigned_reader_id, tokenId);
    }
  }

  if (status === 'completed' || status === 'noshow' || status === 'cancelled') {
    if (current.assigned_reader_id) {
      setReaderCurrentToken(current.assigned_reader_id, null);
    }
  }

  if (extra?.notes !== undefined) {
    updates.notes = extra.notes;
    extraClauses += ', notes = @notes';
  }

  if (extra?.cards_drawn !== undefined) {
    updates.cards_drawn = JSON.stringify(extra.cards_drawn);
    extraClauses += ', cards_drawn = @cards_drawn';
  }

  if (extra?.reading_summary_published !== undefined) {
    updates.reading_summary_published = extra.reading_summary_published ? 1 : 0;
    extraClauses += ', reading_summary_published = @reading_summary_published';
  }

  db.prepare(`UPDATE queue_tokens SET status = @status ${extraClauses} WHERE id = @id`).run(updates);

  // Recalculate positions for waiting tokens
  recalculateQueuePositions();

  logAudit({
    admin_name: actorName || 'Admin',
    action: `TOKEN_STATUS_${status.toUpperCase()}`,
    entity_type: 'queue_tokens',
    entity_id: tokenId,
    old_values: JSON.stringify({ status: current.status, reader: current.assigned_reader_name }),
    new_values: JSON.stringify({ status, ...extra }),
  });

  return getTokenById(tokenId);
}

export function recalculateQueuePositions() {
  const waitingTokens = db.prepare("SELECT id FROM queue_tokens WHERE status = 'waiting' ORDER BY is_priority DESC, token_number ASC").all() as { id: string }[];
  const updateStmt = db.prepare('UPDATE queue_tokens SET position = ? WHERE id = ?');
  
  db.transaction(() => {
    waitingTokens.forEach((t, idx) => {
      updateStmt.run(idx + 1, t.id);
    });
  })();
}

export function setTokenPriority(tokenId: string, isPriority: boolean, reason?: string, actorName?: string) {
  const current = getTokenById(tokenId);
  if (!current) return;

  db.prepare('UPDATE queue_tokens SET is_priority = ?, priority_reason = ? WHERE id = ?')
    .run(isPriority ? 1 : 0, reason || null, tokenId);

  recalculateQueuePositions();

  logAudit({
    admin_name: actorName || 'Admin',
    action: isPriority ? 'TOKEN_SET_PRIORITY' : 'TOKEN_REMOVE_PRIORITY',
    entity_type: 'queue_tokens',
    entity_id: tokenId,
    old_values: JSON.stringify({ is_priority: current.is_priority }),
    new_values: JSON.stringify({ is_priority: isPriority, reason }),
  });
}

export function submitCustomerFeedback(tokenId: string, stars: number, comment?: string) {
  db.prepare(`
    UPDATE queue_tokens 
    SET customer_feedback_stars = ?, customer_feedback_comment = ?, feedback_submitted_at = datetime('now')
    WHERE id = ?
  `).run(stars, comment || null, tokenId);
}

// -------------------------------------------------------------
// PAYMENTS REPOSITORY
// -------------------------------------------------------------
export function createPayment(payment: {
  token_id: string;
  customer_id: string;
  payment_method: 'upi_qr' | 'cash';
  status: 'pending' | 'verified';
  base_amount_inr: number;
  discount_amount_inr?: number;
  referral_discount_inr?: number;
  final_amount_inr: number;
  discount_code_used?: string | null;
  referral_code_used?: string | null;
  manual_discount_reason?: string | null;
  screenshot_path?: string | null;
  screenshot_hash?: string | null;
  utr_number?: string | null;
}): Payment {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO payments (
      id, token_id, customer_id, payment_method, status,
      base_amount_inr, discount_amount_inr, referral_discount_inr, final_amount_inr,
      discount_code_used, referral_code_used, manual_discount_reason,
      screenshot_path, screenshot_hash, utr_number
    ) VALUES (
      @id, @token_id, @customer_id, @payment_method, @status,
      @base_amount_inr, @discount_amount_inr, @referral_discount_inr, @final_amount_inr,
      @discount_code_used, @referral_code_used, @manual_discount_reason,
      @screenshot_path, @screenshot_hash, @utr_number
    )
  `).run({
    id,
    token_id: payment.token_id,
    customer_id: payment.customer_id,
    payment_method: payment.payment_method,
    status: payment.status,
    base_amount_inr: payment.base_amount_inr,
    discount_amount_inr: payment.discount_amount_inr || 0,
    referral_discount_inr: payment.referral_discount_inr || 0,
    final_amount_inr: payment.final_amount_inr,
    discount_code_used: payment.discount_code_used || null,
    referral_code_used: payment.referral_code_used || null,
    manual_discount_reason: payment.manual_discount_reason || null,
    screenshot_path: payment.screenshot_path || null,
    screenshot_hash: payment.screenshot_hash || null,
    utr_number: payment.utr_number ? payment.utr_number.trim() : null,
  });

  return getPaymentById(id)!;
}

export function getPaymentById(id: string): Payment | null {
  const query = `
    SELECT 
      p.*,
      c.name as customer_name,
      c.phone as customer_phone,
      qt.token_display as token_display,
      s.name as service_name,
      au.name as verified_by_name
    FROM payments p
    JOIN customers c ON p.customer_id = c.id
    JOIN queue_tokens qt ON p.token_id = qt.id
    JOIN services s ON qt.service_id = s.id
    LEFT JOIN admin_users au ON p.verified_by_admin_id = au.id
    WHERE p.id = ?
  `;
  const row = db.prepare(query).get(id);
  return row ? mapPayment(row) : null;
}

export function getPaymentByTokenId(tokenId: string): Payment | null {
  const row = db.prepare('SELECT * FROM payments WHERE token_id = ?').get(tokenId);
  return row ? mapPayment(row) : null;
}

export function getAllPayments(statusFilter?: string): Payment[] {
  let query = `
    SELECT 
      p.*,
      c.name as customer_name,
      c.phone as customer_phone,
      qt.token_display as token_display,
      s.name as service_name,
      au.name as verified_by_name
    FROM payments p
    JOIN customers c ON p.customer_id = c.id
    JOIN queue_tokens qt ON p.token_id = qt.id
    JOIN services s ON qt.service_id = s.id
    LEFT JOIN admin_users au ON p.verified_by_admin_id = au.id
  `;

  if (statusFilter && statusFilter !== 'all') {
    query += ` WHERE p.status = '${statusFilter}'`;
  }
  query += ' ORDER BY p.created_at DESC';

  const rows = db.prepare(query).all();
  return rows.map(mapPayment);
}

export function checkDuplicateUtr(utr: string, excludePaymentId?: string): Payment | null {
  if (!utr || utr.trim().length === 0) return null;
  let query = 'SELECT * FROM payments WHERE UPPER(utr_number) = UPPER(?)';
  const params: any[] = [utr.trim()];
  if (excludePaymentId) {
    query += ' AND id != ?';
    params.push(excludePaymentId);
  }
  const row = db.prepare(query).get(...params);
  return row ? mapPayment(row) : null;
}

export function checkDuplicateScreenshotHash(hash: string, excludePaymentId?: string): Payment | null {
  if (!hash || hash.trim().length === 0) return null;
  let query = 'SELECT * FROM payments WHERE screenshot_hash = ?';
  const params: any[] = [hash.trim()];
  if (excludePaymentId) {
    query += ' AND id != ?';
    params.push(excludePaymentId);
  }
  const row = db.prepare(query).get(...params);
  return row ? mapPayment(row) : null;
}

export function verifyPayment(paymentId: string, adminId: string, adminName: string): Payment | null {
  const current = getPaymentById(paymentId);
  if (!current) return null;

  db.prepare(`
    UPDATE payments 
    SET status = 'verified', verified_by_admin_id = ?, verified_at = datetime('now')
    WHERE id = ?
  `).run(adminId, paymentId);

  logAudit({
    admin_id: adminId,
    admin_name: adminName,
    action: 'VERIFY_PAYMENT',
    entity_type: 'payments',
    entity_id: paymentId,
    old_values: JSON.stringify({ status: current.status }),
    new_values: JSON.stringify({ status: 'verified', amount: current.final_amount_inr }),
  });

  return getPaymentById(paymentId);
}

export function rejectPayment(paymentId: string, reason: string, adminId: string, adminName: string): Payment | null {
  const current = getPaymentById(paymentId);
  if (!current) return null;

  db.prepare(`
    UPDATE payments 
    SET status = 'rejected', rejection_reason = ?, verified_by_admin_id = ?, verified_at = datetime('now')
    WHERE id = ?
  `).run(reason, adminId, paymentId);

  // Mark associated token cancelled or rejected
  db.prepare("UPDATE queue_tokens SET status = 'cancelled' WHERE id = ?").run(current.token_id);

  logAudit({
    admin_id: adminId,
    admin_name: adminName,
    action: 'REJECT_PAYMENT',
    entity_type: 'payments',
    entity_id: paymentId,
    old_values: JSON.stringify({ status: current.status }),
    new_values: JSON.stringify({ status: 'rejected', reason }),
  });

  return getPaymentById(paymentId);
}

export function requestPaymentReupload(paymentId: string, reason: string, adminId: string, adminName: string): Payment | null {
  const current = getPaymentById(paymentId);
  if (!current) return null;

  db.prepare(`
    UPDATE payments 
    SET status = 'reupload_requested', rejection_reason = ?
    WHERE id = ?
  `).run(reason, paymentId);

  logAudit({
    admin_id: adminId,
    admin_name: adminName,
    action: 'REQUEST_PAYMENT_REUPLOAD',
    entity_type: 'payments',
    entity_id: paymentId,
    old_values: JSON.stringify({ status: current.status }),
    new_values: JSON.stringify({ status: 'reupload_requested', reason }),
  });

  return getPaymentById(paymentId);
}

export function toggleBankMatched(paymentId: string, adminName: string): Payment | null {
  const current = getPaymentById(paymentId);
  if (!current) return null;

  const newMatched = !current.matched_with_bank_statement;
  db.prepare(`
    UPDATE payments 
    SET matched_with_bank_statement = ?, matched_at = ${newMatched ? "datetime('now')" : "NULL"}
    WHERE id = ?
  `).run(newMatched ? 1 : 0, paymentId);

  logAudit({
    admin_name: adminName,
    action: newMatched ? 'PAYMENT_MATCHED_BANK' : 'PAYMENT_UNMATCHED_BANK',
    entity_type: 'payments',
    entity_id: paymentId,
    old_values: JSON.stringify({ matched: current.matched_with_bank_statement }),
    new_values: JSON.stringify({ matched: newMatched }),
  });

  return getPaymentById(paymentId);
}

export function recordCashReceived(paymentId: string, cashGiven: number, adminId: string, adminName: string): Payment | null {
  const current = getPaymentById(paymentId);
  if (!current) return null;

  const changeReturned = Math.max(0, cashGiven - current.final_amount_inr);

  db.prepare(`
    UPDATE payments 
    SET status = 'verified', 
        cash_received_by_admin_id = ?, 
        cash_amount_given = ?, 
        cash_change_returned = ?, 
        verified_by_admin_id = ?, 
        verified_at = datetime('now')
    WHERE id = ?
  `).run(adminId, cashGiven, changeReturned, adminId, paymentId);

  logAudit({
    admin_id: adminId,
    admin_name: adminName,
    action: 'RECORD_CASH_RECEIVED',
    entity_type: 'payments',
    entity_id: paymentId,
    old_values: JSON.stringify({ status: current.status }),
    new_values: JSON.stringify({ cashGiven, changeReturned, finalAmount: current.final_amount_inr }),
  });

  return getPaymentById(paymentId);
}

export function issueRefund(paymentId: string, reason: string, adminId: string, adminName: string): Payment | null {
  const current = getPaymentById(paymentId);
  if (!current) return null;

  db.prepare(`
    UPDATE payments 
    SET status = 'refunded', refund_reason = ?, refunded_by_admin_id = ?, refunded_at = datetime('now')
    WHERE id = ?
  `).run(reason, adminId, paymentId);

  // Mark token refunded
  db.prepare("UPDATE queue_tokens SET status = 'refunded' WHERE id = ?").run(current.token_id);

  logAudit({
    admin_id: adminId,
    admin_name: adminName,
    action: 'ISSUE_REFUND',
    entity_type: 'payments',
    entity_id: paymentId,
    old_values: JSON.stringify({ status: current.status }),
    new_values: JSON.stringify({ status: 'refunded', reason, amount: current.final_amount_inr }),
  });

  return getPaymentById(paymentId);
}

// -------------------------------------------------------------
// LIVE METRICS & AUDIT LOGS REPOSITORY
// -------------------------------------------------------------
export function getLiveMetrics(): QueueLiveMetrics {
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM queue_tokens 
    GROUP BY status
  `).all() as { status: string; count: number }[];

  const counts: Record<string, number> = {};
  statusCounts.forEach(r => counts[r.status] = r.count);

  // Actual average session duration from REAL completed sessions
  const avgSessionRow = db.prepare(`
    SELECT AVG(actual_duration_seconds) as avg_sec 
    FROM queue_tokens 
    WHERE status = 'completed' AND actual_duration_seconds IS NOT NULL AND actual_duration_seconds > 0
  `).get() as { avg_sec: number | null };

  const avgSessionMinutes = avgSessionRow.avg_sec ? Math.round(avgSessionRow.avg_sec / 60) : null;

  // Average wait duration from real tokens called/completed
  const avgWaitRow = db.prepare(`
    SELECT AVG((strftime('%s', called_at) - strftime('%s', created_at)) / 60.0) as avg_wait
    FROM queue_tokens
    WHERE called_at IS NOT NULL
  `).get() as { avg_wait: number | null };

  const avgWaitMinutes = avgWaitRow.avg_wait ? Math.max(1, Math.round(avgWaitRow.avg_wait)) : null;

  // Real verified revenue
  const revenueRow = db.prepare(`
    SELECT 
      COALESCE(SUM(final_amount_inr), 0) as total,
      COALESCE(SUM(CASE WHEN payment_method = 'upi_qr' THEN final_amount_inr ELSE 0 END), 0) as online,
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN final_amount_inr ELSE 0 END), 0) as cash
    FROM payments
    WHERE status = 'verified'
  `).get() as { total: number; online: number; cash: number };

  const pendingVerificationRow = db.prepare(`
    SELECT COUNT(*) as count FROM payments WHERE status = 'pending' AND payment_method = 'upi_qr'
  `).get() as { count: number };

  return {
    totalWaiting: counts['waiting'] || 0,
    totalCalled: counts['called'] || 0,
    totalInSession: counts['in_session'] || 0,
    totalCompleted: counts['completed'] || 0,
    totalNoShows: counts['noshow'] || 0,
    totalCancelled: counts['cancelled'] || 0,
    avgWaitMinutes,
    avgSessionMinutes,
    totalRevenueInr: revenueRow.total,
    onlineRevenueInr: revenueRow.online,
    cashRevenueInr: revenueRow.cash,
    pendingVerificationCount: pendingVerificationRow.count,
  };
}

export function logAudit(entry: {
  admin_id?: string | null;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: string | null;
  new_values?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}) {
  const id = crypto.randomUUID();
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, admin_id, admin_name, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.admin_id || null,
      entry.admin_name,
      entry.action,
      entry.entity_type,
      entry.entity_id || null,
      entry.old_values || null,
      entry.new_values || null,
      entry.ip_address || null,
      entry.user_agent || null
    );
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}

export function getAuditLogs(limit = 100): AuditLog[] {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  return rows as AuditLog[];
}

export function resetEvent(confirmationText: string, actorName: string): boolean {
  if (confirmationText.trim() !== 'RESET-EVENT-SSPU-CONFIRM') {
    return false;
  }

  db.transaction(() => {
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM queue_tokens').run();
    db.prepare('UPDATE readers SET current_token_id = NULL').run();
  })();

  logAudit({
    admin_name: actorName,
    action: 'DANGER_RESET_EVENT',
    entity_type: 'event',
    entity_id: 'all',
    old_values: 'Queue & Payments cleared',
    new_values: 'Clean slate for new event session',
  });

  return true;
}

// -------------------------------------------------------------
// POST-EVENT: BOOKING REQUESTS REPOSITORY
// -------------------------------------------------------------
export function createBookingRequest(data: {
  name: string;
  phone: string;
  service_id: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  note?: string;
  promo_code?: string;
  discount_inr?: number;
  final_price_inr: number;
}): { id: string; name: string; phone: string; service_name: string } {
  const id = 'bk_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO booking_requests (
      id, name, phone, service_id, service_name, preferred_date, preferred_time,
      note, promo_code, discount_inr, final_price_inr, status, created_at, updated_at
    ) VALUES (
      @id, @name, @phone, @service_id, @service_name, @preferred_date, @preferred_time,
      @note, @promo_code, @discount_inr, @final_price_inr, 'new', @created_at, @updated_at
    )
  `).run({
    id,
    name: data.name.trim(),
    phone: data.phone.trim(),
    service_id: data.service_id,
    service_name: data.service_name,
    preferred_date: data.preferred_date,
    preferred_time: data.preferred_time,
    note: data.note?.trim() || null,
    promo_code: data.promo_code?.trim().toUpperCase() || null,
    discount_inr: data.discount_inr || 0,
    final_price_inr: data.final_price_inr,
    created_at: now,
    updated_at: now,
  });

  // Track as customer / lead as well
  try {
    createLeadSubscriber({
      name: data.name,
      phone: data.phone,
      source: 'booking',
      consent_given: true,
    });
  } catch {}

  return { id, name: data.name, phone: data.phone, service_name: data.service_name };
}

export function getAllBookingRequests(statusFilter?: string) {
  let query = 'SELECT * FROM booking_requests';
  const params: any[] = [];
  if (statusFilter && statusFilter !== 'all') {
    query += ' WHERE status = ?';
    params.push(statusFilter);
  }
  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params) as any[];
}

export function getBookingRequestById(id: string) {
  return db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(id) as any;
}

export function updateBookingStatus(id: string, status: string, adminNotes?: string) {
  const now = new Date().toISOString();
  if (adminNotes !== undefined) {
    db.prepare(`
      UPDATE booking_requests 
      SET status = ?, admin_notes = ?, updated_at = ? 
      WHERE id = ?
    `).run(status, adminNotes, now, id);
  } else {
    db.prepare(`
      UPDATE booking_requests 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `).run(status, now, id);
  }
  return getBookingRequestById(id);
}

export function deleteBookingRequest(id: string): boolean {
  const res = db.prepare('DELETE FROM booking_requests WHERE id = ?').run(id);
  return res.changes > 0;
}

// -------------------------------------------------------------
// POST-EVENT: LEADS & NEWSLETTER SUBSCRIBERS REPOSITORY
// -------------------------------------------------------------
export function createLeadSubscriber(data: {
  name: string;
  phone: string;
  source: 'newsletter' | 'event_interest' | 'booking';
  event_id?: string;
  event_title?: string;
  consent_given?: boolean;
}) {
  const existing = db.prepare('SELECT * FROM leads_subscribers WHERE phone = ?').get(data.phone.trim()) as any;
  if (existing) {
    if (existing.is_opted_out) {
      db.prepare('UPDATE leads_subscribers SET is_opted_out = 0 WHERE id = ?').run(existing.id);
    }
    return existing;
  }

  const id = 'lead_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO leads_subscribers (
      id, name, phone, source, event_id, event_title, consent_given, is_opted_out, created_at
    ) VALUES (
      @id, @name, @phone, @source, @event_id, @event_title, @consent_given, 0, @created_at
    )
  `).run({
    id,
    name: data.name.trim(),
    phone: data.phone.trim(),
    source: data.source,
    event_id: data.event_id || null,
    event_title: data.event_title || null,
    consent_given: data.consent_given !== false ? 1 : 0,
    created_at: now,
  });

  return { id, name: data.name, phone: data.phone, source: data.source };
}

export function getAllLeadsSubscribers() {
  return db.prepare('SELECT * FROM leads_subscribers ORDER BY created_at DESC').all() as any[];
}

export function toggleLeadOptOut(id: string, isOptedOut: boolean) {
  db.prepare('UPDATE leads_subscribers SET is_opted_out = ? WHERE id = ?').run(isOptedOut ? 1 : 0, id);
  return db.prepare('SELECT * FROM leads_subscribers WHERE id = ?').get(id);
}

export function deleteLeadSubscriber(id: string): boolean {
  const res = db.prepare('DELETE FROM leads_subscribers WHERE id = ?').run(id);
  return res.changes > 0;
}

// -------------------------------------------------------------
// POST-EVENT: TESTIMONIALS & FEEDBACK REPOSITORY
// -------------------------------------------------------------
export function createTestimonial(data: {
  customer_name: string;
  service_name?: string;
  rating: number;
  feedback_text: string;
  token_id?: string;
  is_approved?: boolean;
}) {
  const id = 'tst_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO testimonials (
      id, customer_name, service_name, rating, feedback_text, is_approved, token_id, created_at
    ) VALUES (
      @id, @customer_name, @service_name, @rating, @feedback_text, @is_approved, @token_id, @created_at
    )
  `).run({
    id,
    customer_name: data.customer_name.trim(),
    service_name: data.service_name?.trim() || 'Tarot Reading',
    rating: Math.max(1, Math.min(5, Math.round(data.rating))),
    feedback_text: data.feedback_text.trim(),
    is_approved: data.is_approved ? 1 : 0,
    token_id: data.token_id || null,
    created_at: now,
  });

  return db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
}

export function getAllTestimonials(approvedOnly = false) {
  let query = 'SELECT * FROM testimonials';
  if (approvedOnly) {
    query += ' WHERE is_approved = 1';
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all() as any[];
  return rows.map(r => ({
    ...r,
    is_approved: Boolean(r.is_approved),
  }));
}

export function updateTestimonialApproval(id: string, isApproved: boolean) {
  db.prepare('UPDATE testimonials SET is_approved = ? WHERE id = ?').run(isApproved ? 1 : 0, id);
  return db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
}

export function deleteTestimonial(id: string): boolean {
  const res = db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
  return res.changes > 0;
}

// -------------------------------------------------------------
// POST-EVENT: UPCOMING EVENTS REPOSITORY
// -------------------------------------------------------------
export function getAllUpcomingEvents(activeOnly = false) {
  let query = 'SELECT * FROM upcoming_events';
  if (activeOnly) {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY sort_order ASC, created_at ASC';
  const rows = db.prepare(query).all() as any[];
  return rows.map(r => ({
    ...r,
    is_active: Boolean(r.is_active),
  }));
}

export function createUpcomingEvent(data: {
  title: string;
  description: string;
  date_text: string;
  location: string;
  is_active?: boolean;
  sort_order?: number;
}) {
  const id = 'evt_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO upcoming_events (
      id, title, description, date_text, location, is_active, sort_order, created_at
    ) VALUES (
      @id, @title, @description, @date_text, @location, @is_active, @sort_order, @created_at
    )
  `).run({
    id,
    title: data.title.trim(),
    description: data.description.trim(),
    date_text: data.date_text.trim(),
    location: data.location.trim(),
    is_active: data.is_active !== false ? 1 : 0,
    sort_order: data.sort_order || 0,
    created_at: now,
  });

  return db.prepare('SELECT * FROM upcoming_events WHERE id = ?').get(id);
}

export function updateUpcomingEvent(id: string, updates: Partial<{
  title: string;
  description: string;
  date_text: string;
  location: string;
  is_active: boolean;
  sort_order: number;
}>) {
  const current = db.prepare('SELECT * FROM upcoming_events WHERE id = ?').get(id) as any;
  if (!current) return null;

  const updated = {
    ...current,
    ...updates,
    is_active: updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : current.is_active,
  };

  db.prepare(`
    UPDATE upcoming_events 
    SET title = @title, description = @description, date_text = @date_text,
        location = @location, is_active = @is_active, sort_order = @sort_order
    WHERE id = @id
  `).run(updated);

  return db.prepare('SELECT * FROM upcoming_events WHERE id = ?').get(id);
}

export function deleteUpcomingEvent(id: string): boolean {
  const res = db.prepare('DELETE FROM upcoming_events WHERE id = ?').run(id);
  return res.changes > 0;
}

// -------------------------------------------------------------
// POST-EVENT: GALLERY IMAGES REPOSITORY
// -------------------------------------------------------------
export function getAllGalleryImages() {
  return db.prepare('SELECT * FROM gallery_images ORDER BY sort_order ASC, created_at DESC').all() as any[];
}

export function createGalleryImage(data: { image_url: string; caption: string; sort_order?: number }) {
  const id = 'img_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO gallery_images (id, image_url, caption, sort_order, created_at)
    VALUES (@id, @image_url, @caption, @sort_order, @created_at)
  `).run({
    id,
    image_url: data.image_url.trim(),
    caption: data.caption.trim(),
    sort_order: data.sort_order || 0,
    created_at: now,
  });

  return db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(id);
}

export function deleteGalleryImage(id: string): boolean {
  const res = db.prepare('DELETE FROM gallery_images WHERE id = ?').run(id);
  return res.changes > 0;
}

// -------------------------------------------------------------
// POST-EVENT: FIRST-PARTY CLICK TRACKING REPOSITORY
// -------------------------------------------------------------
export function incrementClickStat(eventKey: string) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO click_stats (event_key, click_count, last_clicked_at)
    VALUES (?, 1, ?)
    ON CONFLICT(event_key) DO UPDATE SET
      click_count = click_count + 1,
      last_clicked_at = excluded.last_clicked_at
  `).run(eventKey, now);

  return db.prepare('SELECT * FROM click_stats WHERE event_key = ?').get(eventKey);
}

export function getAllClickStats() {
  return db.prepare('SELECT * FROM click_stats ORDER BY click_count DESC').all() as any[];
}

// -------------------------------------------------------------
// POST-EVENT: READ-ONLY EVENT ARCHIVE
// -------------------------------------------------------------
export function getArchivedEventData() {
  const tokens = getAllQueueTokens();
  const payments = getAllPayments();
  const customers = getAllCustomers();
  const metrics = getLiveMetrics();
  const feedback = tokens.filter(t => t.customer_feedback_stars !== null).map(t => ({
    id: t.id,
    token_display: t.token_display,
    customer_name: t.customer_name,
    stars: t.customer_feedback_stars,
    comment: t.customer_feedback_comment,
    submitted_at: t.feedback_submitted_at,
  }));

  return {
    metrics,
    totalTokens: tokens.length,
    tokens,
    payments,
    customers,
    feedback,
  };
}
