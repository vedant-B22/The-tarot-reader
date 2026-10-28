import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getSettings, updateSettings } from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  // Non-super-admins can only toggle queue pause if authorized
  if (admin.role !== 'super_admin' && !admin.can_override_queue) {
    return NextResponse.json({ error: 'Permission denied: Cannot edit settings' }, { status: 403 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle multipart form (e.g. uploading new UPI QR image)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const qrFile = formData.get('upi_qr_file') as File | null;

      let upi_qr_url: string | undefined = undefined;

      if (qrFile && qrFile.size > 0) {
        const ext = qrFile.type === 'image/png' ? 'png' : 'jpg';
        const filename = `stall_qr_${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const buffer = Buffer.from(await qrFile.arrayBuffer());
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        upi_qr_url = `/uploads/${filename}`;
      }

      const updates: any = {};
      if (upi_qr_url) updates.upi_qr_url = upi_qr_url;

      formData.forEach((val, key) => {
        if (key !== 'upi_qr_file') {
          if (val === 'true') updates[key] = true;
          else if (val === 'false') updates[key] = false;
          else if (!isNaN(Number(val)) && val !== '') updates[key] = Number(val);
          else updates[key] = val;
        }
      });

      const updated = updateSettings(updates, admin.id, admin.name);
      broadcastRealtimeEvent('settings_updated', { settings: updated });
      return NextResponse.json({ success: true, settings: updated });
    }

    const json = await req.json();
    const updated = updateSettings(json, admin.id, admin.name);
    broadcastRealtimeEvent('settings_updated', { settings: updated });
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
