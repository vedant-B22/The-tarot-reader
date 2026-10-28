import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getPaymentProofFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return new NextResponse('Unauthorized: Payment screenshots are restricted to admins', { status: 401 });
  }

  const result = getPaymentProofFile(params.filename);
  if (!result) {
    return new NextResponse('Screenshot not found', { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      'Content-Type': result.mimeType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
