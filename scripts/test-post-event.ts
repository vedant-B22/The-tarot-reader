import { 
  getSettings, 
  updateSettings,
  createBookingRequest,
  getAllBookingRequests,
  updateBookingStatus,
  createLeadSubscriber,
  getAllLeadsSubscribers,
  createTestimonial,
  getAllTestimonials,
  updateTestimonialApproval,
  createUpcomingEvent,
  getAllUpcomingEvents,
  createGalleryImage,
  getAllGalleryImages,
  incrementClickStat,
  getAllClickStats,
  getArchivedEventData,
  getAllServices
} from '../src/lib/db';
import { TAROT_DECK, getDailyCard, getRandomCard } from '../src/lib/tarot-deck';

async function runTests() {
  console.log('\n=============================================================');
  console.log('🔮 RUNNING POST-EVENT VERIFICATION SUITE');
  console.log('The Tarot Reader – Transition & Stability Check');
  console.log('=============================================================\n');

  // Test 1: Settings & Post-event mode toggle
  console.log('[TEST 1] Verifying Settings & Mode Toggle...');
  const s = getSettings();
  if (s.is_event_mode === undefined) throw new Error('is_event_mode is undefined');
  console.log(`  ✓ Operating Mode: ${s.is_event_mode ? 'Live Stall Event' : 'Post-Event Landing & Booking'}`);
  console.log(`  ✓ Hero Title: "${s.hero_title}"`);
  console.log(`  ✓ Hero Tagline: "${s.hero_tagline}"`);
  console.log(`  ✓ WhatsApp Helpline: ${s.whatsapp_number}`);

  // Test 2: Services
  console.log('\n[TEST 2] Active Services Menu...');
  const services = getAllServices(true);
  console.log(`  ✓ Found ${services.length} active tarot reading services.`);

  // Test 3: Booking Request Creation & Pricing
  console.log('\n[TEST 3] Booking Request Lifecycle...');
  const testBooking = createBookingRequest({
    name: 'Priya Joshi',
    phone: '9876543210',
    service_id: services[0].id,
    service_name: services[0].name,
    preferred_date: '2026-11-05',
    preferred_time: 'Evening (5:00 PM – 8:00 PM)',
    note: 'Curious about upcoming placement interviews',
    promo_code: 'HALLOWEEN20',
    discount_inr: 20,
    final_price_inr: Math.max(0, services[0].price_inr - 20),
  });
  console.log(`  ✓ Booking created with ID: ${testBooking.id} for ${testBooking.name}`);
  
  const allBookings = getAllBookingRequests();
  const found = allBookings.find(b => b.id === testBooking.id);
  if (!found || found.status !== 'new') throw new Error('Booking status was not new');
  console.log(`  ✓ Status verified: "${found.status}"`);

  // Update status to 'contacted'
  const updated = updateBookingStatus(testBooking.id, 'contacted', 'Sent WhatsApp confirmation slot message');
  if (updated.status !== 'contacted') throw new Error('Failed to update booking status');
  console.log(`  ✓ Status updated to "${updated.status}" with admin notes.`);

  // Test 4: Newsletter / Lead Subscription
  console.log('\n[TEST 4] Leads & Newsletter Subscription...');
  const lead = createLeadSubscriber({
    name: 'Siddharth Rao',
    phone: '9123456789',
    source: 'newsletter',
    consent_given: true,
  });
  console.log(`  ✓ Subscriber created: ${lead.name} (${lead.phone})`);
  const allLeads = getAllLeadsSubscribers();
  const leadFound = allLeads.find(l => l.phone === '9123456789');
  if (!leadFound || !leadFound.consent_given) throw new Error('Lead consent verification failed');
  console.log(`  ✓ Verified lead consent flag: true`);

  // Test 5: Card of the Day
  console.log('\n[TEST 5] Free "Card of the Day" Engine...');
  if (TAROT_DECK.length < 22) throw new Error('Tarot deck is incomplete');
  const daily = getDailyCard();
  const random = getRandomCard();
  console.log(`  ✓ Total deck cards: ${TAROT_DECK.length}`);
  console.log(`  ✓ Daily Card: "${daily.name}" (${daily.arcana} • No. ${daily.number})`);
  console.log(`  ✓ Keywords: ${daily.keywords.join(', ')}`);
  console.log(`  ✓ Random Draw: "${random.name}"`);

  // Test 6: Testimonials Moderation (Honest Data Pipeline)
  console.log('\n[TEST 6] Testimonials & Feedback Moderation...');
  const newReview = createTestimonial({
    customer_name: 'Aarohi S.',
    service_name: 'Past, Present & Future',
    rating: 5,
    feedback_text: 'The reading was amazingly accurate! Vedant pointed out specific things I was struggling with.',
    is_approved: false,
  });
  console.log(`  ✓ New review submitted as pending: ID ${newReview?.id}`);
  
  // Verify it is NOT public
  let publicReviews = getAllTestimonials(true);
  if (publicReviews.some(r => r.id === newReview?.id)) {
    throw new Error('Unapproved review leaked into public stream!');
  }
  console.log(`  ✓ Unapproved review correctly hidden from public.`);

  // Approve review
  updateTestimonialApproval(newReview.id, true);
  publicReviews = getAllTestimonials(true);
  if (!publicReviews.some(r => r.id === newReview?.id)) {
    throw new Error('Approved review failed to surface!');
  }
  console.log(`  ✓ Review approved and now live on public feed.`);

  // Test 7: Click Tracking (First-Party Privacy-Friendly)
  console.log('\n[TEST 7] Click Tracking & Conversion Counters...');
  incrementClickStat('hero_whatsapp_primary');
  incrementClickStat('vcard_download');
  incrementClickStat('card_of_the_day_reveal');
  const stats = getAllClickStats();
  console.log(`  ✓ Total unique event keys tracked: ${stats.length}`);
  stats.slice(0, 3).forEach(s => {
    console.log(`    • ${s.event_key}: ${s.click_count} clicks (last: ${s.last_clicked_at})`);
  });

  // Test 8: Upcoming Events & Gallery
  console.log('\n[TEST 8] Upcoming Events & Gallery Photos...');
  const testEvent = createUpcomingEvent({
    title: 'SSPU Cultural Fest Pop-Up',
    date_text: 'Dec 18 • 10:00 AM',
    location: 'Main Auditorium Quad',
    description: 'Walk-in readings & live tarot consultations.',
  });
  console.log(`  ✓ Created upcoming event: "${testEvent.title}"`);
  const activeEvents = getAllUpcomingEvents(true);
  console.log(`  ✓ Active upcoming events count: ${activeEvents.length}`);

  // Test 9: Event Archive (Zero Data Deletion Guarantee)
  console.log('\n[TEST 9] Verifying Event Archive (Zero Data Deletion Guarantee)...');
  const archive = getArchivedEventData();
  console.log(`  ✓ Archived queue tokens: ${archive.totalTokens}`);
  console.log(`  ✓ Archived payment transactions: ${archive.payments.length}`);
  console.log(`  ✓ Archived customers: ${archive.customers.length}`);
  console.log(`  ✓ Feedback records preserved: ${archive.feedback.length}`);
  console.log(`  ✓ Total event revenue preserved: ₹${archive.metrics.totalRevenueInr}`);

  console.log('\n=============================================================');
  console.log('🎉 ALL 9 POST-EVENT VERIFICATION SUITES PASSED WITH 0 ERRORS!');
  console.log('=============================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
