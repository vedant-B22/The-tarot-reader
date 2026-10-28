import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const UPLOAD_DIR = process.env.VERCEL ? '/tmp/payment_proofs' : path.join(process.cwd(), 'data', 'payment_proofs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    return createClient(url, key, { auth: { persistSession: false } });
  }
  return null;
}

export async function savePaymentProof(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<{ path: string; hash: string }> {
  // Compute SHA-256 hash for duplicate screenshot detection
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const filename = `proof_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.storage
        .from('payment-proofs')
        .upload(filename, fileBuffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (!error) {
        const { data: signed } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(filename, 60 * 60 * 24 * 7); // 7 days signed URL

        if (signed?.signedUrl) {
          return {
            path: signed.signedUrl,
            hash,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to local file storage:', err);
    }
  }

  // Local fallback
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, fileBuffer);

  return {
    path: `/api/admin/payments/screenshot/${filename}`,
    hash,
  };
}

export function getPaymentProofFile(filename: string): { buffer: Buffer; mimeType: string } | null {
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(safeFilename).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  return { buffer, mimeType };
}
