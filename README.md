# 🔮 The Tarot Reader – Event Manager
### Live Tarot Card Reading Stall & Queue Management System
**SSPU Pune • Halloween 2026 Live Event**

A production-ready web application built for live tarot card reading stalls, real customer queue tracking, and UPI payment verification.

---

## ⚡ Key Highlights
- **Zero Fake Data**: Strictly honest empty states. Live average session durations calculated only from real completed readings.
- **100% Business Logic Editable in Admin**: Services menu, prices, discounts, referral rewards, UPI QR image, stall name, and queue rules are editable live without redeploying code.
- **Mobile-First & Weak 4G Resilient**: Under 100 KB initial JavaScript load. Client-side canvas compression reduces payment screenshots to ~80–120 KB before upload.
- **Realtime Queue Sync**: Reactive Server-Sent Events (SSE) with an automatic 6-second polling fallback so stall TV displays and mobile tokens never freeze.
- **Synthesized Web Audio**: Mystical singing bowl chimes and call alerts are generated natively via Web Audio API oscillators (zero external MP3 downloads).

---

## 🏛 Roles & Access Control
- **Super Admin**: Master control. Manages admin assistants (up to 5), pricing, discounts, refunds, audit trail, settings, and danger-zone event resets. Can toggle individual assistant rights (*Can edit prices*, *Can create discounts*, *Can issue refunds*).
- **Admin**: Runs the stall queue, calls tokens, marks session starts/completions, records reader notes and cards drawn, registers walk-in visitors, and verifies payments.
- **Customer**: No password required. Identified via phone number and cryptographic signed session cookie, with 1-tap phone lookup to recover active tokens.

---

## 🚀 Live Routes
- `/`: Customer landing page with live queue wait time, active announcement banner, and service menu.
- `/register`: Registration form with service selector, focus area, promo codes, UPI QR display with deep link, client screenshot compressor, and disclaimer consent.
- `/token/[id]`: Live real-time token tracking page. Shows queue position, estimated wait time, reader table, vibration/chimes when called, and reading summaries.
- `/display`: Dedicated Public Live Display screen for TV/laptop at the stall ("Now Serving" table cards, "Up Next" queue, large fonts, zero customer PII).
- `/admin/login`: Admin login and first-run Super Admin setup wizard.
- `/admin`: Live queue board, quick call-next, session timers, and walk-in customer creation.
- `/admin/payments`: Payment verification with zoomable screenshots, duplicate UTR detection, duplicate image hash detection, cash calculator, and bank statement matching.
- `/admin/services`: Service spread CRUD and group/duo pricing.
- `/admin/discounts`: Promo codes CRUD, automatic deal rules (happy hour, group discounts), and referral configuration.
- `/admin/customers`: Customer database, reading history, and DPDP-compliant data deletion.
- `/admin/settings`: Live editable branding, announcement marquee, UPI QR upload, and event reset.
- `/admin/team`: Super Admin team management and permission toggles.
- `/admin/audit`: Tamper-resistant chronological audit trail.
- `/admin/poster`: Printable A4 QR poster page for the live stall.

---

## 🛠 Local Setup & Development

1. Clone the repository:
   ```bash
   git clone https://github.com/vedant-B22/The-tarot-reader.git
   cd The-tarot-reader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Run the pre-launch verification suite:
   ```bash
   npx tsx scripts/test-prelaunch.ts
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## 🚢 Deployment to Vercel & Supabase

1. Push this repository to GitHub.
2. In Supabase:
   - Run `supabase/migrations/20261028_tarot_init.sql` in the SQL Editor.
   - Run `supabase/storage_setup.sql` to configure the private `payment-proofs` bucket.
3. In Vercel:
   - Import the GitHub repository.
   - Add the environment variables from `.env.example`.
   - Deploy!

---

## 📜 License
Created for Symbiosis Skills & Professional University (SSPU), Pune.
All rights reserved.
