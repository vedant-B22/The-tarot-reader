import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.VERCEL ? '/tmp/payment_proofs' : path.join(process.cwd(), 'data', 'payment_proofs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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
  const filePath = path.join(UPLOAD_DIR, filename);

  fs.writeFileSync(filePath, fileBuffer);

  return {
    path: `/api/admin/payments/screenshot/${filename}`,
    hash,
  };
}

export function getPaymentProofFile(filename: string): { buffer: Buffer; mimeType: string } | null {
  // Path traversal guard
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
