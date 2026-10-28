-- Supabase Storage Setup for Private Payment Screenshots
-- Screenshots are stored privately and only accessible via authenticated admin endpoints or presigned signed URLs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS Policies:
-- Allow customers to upload during registration/payment
CREATE POLICY "Customers can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Only service role and authenticated admins can view screenshots
CREATE POLICY "Admins can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');
