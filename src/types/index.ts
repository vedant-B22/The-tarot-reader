export type AdminRole = 'super_admin' | 'admin';

export interface AdminPermissions {
  can_edit_prices: boolean;
  can_create_discounts: boolean;
  can_issue_refunds: boolean;
  can_override_queue: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  can_edit_prices: boolean;
  can_create_discounts: boolean;
  can_issue_refunds: boolean;
  can_override_queue: boolean;
  last_active_at: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  card_count: number;
  duration_minutes: number;
  price_inr: number;
  is_group: boolean;
  group_size: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  min_order_inr: number;
  max_discount_inr: number | null;
  valid_from: string | null;
  valid_until: string | null;
  max_total_uses: number | null;
  max_uses_per_customer: number;
  current_uses: number;
  applicable_service_ids: string | null; // comma separated IDs or null
  is_active: boolean;
  created_by_admin_id: string | null;
  created_at: string;
}

export interface Reader {
  id: string;
  name: string;
  is_active: boolean;
  current_token_id: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  course_year: string;
  referral_code: string;
  referred_by_customer_id: string | null;
  referral_credits_inr: number;
  total_readings: number;
  tags: string[];
  notes: string;
  created_at: string;
}

export type QueueStatus = 
  | 'waiting' 
  | 'called' 
  | 'in_session' 
  | 'completed' 
  | 'noshow' 
  | 'cancelled' 
  | 'refunded';

export interface CardDrawn {
  card: string;
  position: string;
  interpretation: string;
}

export interface QueueToken {
  id: string;
  token_number: number;
  token_display: string;
  customer_id: string;
  service_id: string;
  focus_topic: 'love' | 'career' | 'life' | 'general' | 'other';
  custom_focus_text: string | null;
  status: QueueStatus;
  position: number;
  is_priority: boolean;
  priority_reason: string | null;
  assigned_reader_id: string | null;
  assigned_reader_name: string | null;
  called_at: string | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  actual_duration_seconds: number | null;
  is_walkin: boolean;
  notes: string | null;
  cards_drawn: CardDrawn[];
  reading_summary_published: boolean;
  customer_feedback_stars: number | null;
  customer_feedback_comment: string | null;
  feedback_submitted_at: string | null;
  created_at: string;
  
  // Joined fields for display
  customer_name?: string;
  customer_phone?: string;
  service_name?: string;
  service_duration?: number;
  service_cards?: number;
  payment_status?: string;
  payment_method?: string;
  final_amount_inr?: number;
}

export interface Payment {
  id: string;
  token_id: string;
  customer_id: string;
  payment_method: 'upi_qr' | 'cash';
  status: 'pending' | 'verified' | 'rejected' | 'refunded' | 'reupload_requested';
  base_amount_inr: number;
  discount_amount_inr: number;
  referral_discount_inr: number;
  final_amount_inr: number;
  discount_code_used: string | null;
  referral_code_used: string | null;
  manual_discount_reason: string | null;
  screenshot_path: string | null;
  screenshot_hash: string | null;
  utr_number: string | null;
  rejection_reason: string | null;
  verified_by_admin_id: string | null;
  verified_at: string | null;
  matched_with_bank_statement: boolean;
  matched_at: string | null;
  cash_received_by_admin_id: string | null;
  cash_amount_given: number | null;
  cash_change_returned: number | null;
  refund_reason: string | null;
  refunded_by_admin_id: string | null;
  refunded_at: string | null;
  created_at: string;

  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  token_display?: string;
  service_name?: string;
  verified_by_name?: string;
}

export interface StallSettings {
  id: number;
  stall_name: string;
  theme_subtext: string;
  announcement_banner: string;
  is_queue_open: boolean;
  queue_paused_message: string;
  max_queue_cap: number;
  scheduled_opening_time: string;
  scheduled_closing_time: string;
  upi_id: string;
  upi_qr_url: string;
  allow_pay_later: boolean;
  auto_noshow_minutes: number;
  whatsapp_helpline: string;
  disclaimer_text: string;
  first_timer_discount_inr: number;
  group_discount_inr: number;
  happy_hour_enabled: boolean;
  happy_hour_start: string;
  happy_hour_end: string;
  happy_hour_percent: number;
  referrer_reward_inr: number;
  referee_discount_inr: number;
  referral_reward_on_completed_only: boolean;
  admin_manual_discount_threshold_inr: number;
  data_retention_days: number;
  updated_at: string;

  // Post-Event Landing & Booking additions
  is_event_mode: boolean;
  hero_title: string;
  hero_tagline: string;
  whatsapp_number: string;
  whatsapp_prefill_message: string;
  instagram_handle: string;
  tarot_handle: string;
  bio_text: string;
  bio_photo_url: string;
  announcement_banner_active: boolean;
}

export type BookingStatus = 'new' | 'contacted' | 'booked' | 'completed' | 'cancelled';

export interface BookingRequest {
  id: string;
  name: string;
  phone: string;
  service_id: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  note: string | null;
  promo_code: string | null;
  discount_inr: number;
  final_price_inr: number;
  status: BookingStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadSubscriber {
  id: string;
  name: string;
  phone: string;
  source: 'newsletter' | 'event_interest' | 'booking';
  event_id: string | null;
  event_title: string | null;
  consent_given: boolean;
  is_opted_out: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  service_name: string | null;
  rating: number; // 1 to 5
  feedback_text: string;
  is_approved: boolean;
  token_id: string | null;
  created_at: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  date_text: string;
  location: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export interface ClickStat {
  event_key: string;
  click_count: number;
  last_clicked_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface QueueLiveMetrics {
  totalWaiting: number;
  totalCalled: number;
  totalInSession: number;
  totalCompleted: number;
  totalNoShows: number;
  totalCancelled: number;
  avgWaitMinutes: number | null;
  avgSessionMinutes: number | null;
  totalRevenueInr: number;
  onlineRevenueInr: number;
  cashRevenueInr: number;
  pendingVerificationCount: number;
}
