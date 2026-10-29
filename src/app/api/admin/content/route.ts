import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { 
  getSettings, 
  getAllUpcomingEvents, 
  createUpcomingEvent, 
  updateUpcomingEvent, 
  deleteUpcomingEvent,
  getAllGalleryImages,
  createGalleryImage,
  deleteGalleryImage,
  logAudit
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = getSettings();
  const events = getAllUpcomingEvents(false);
  const gallery = getAllGalleryImages();

  return NextResponse.json({
    settings,
    events,
    gallery,
  });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, eventData, galleryData } = body;

    if (action === 'create_event') {
      const { title, description, date_text, location, is_active } = eventData;
      if (!title || !date_text) {
        return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
      }
      const ev = createUpcomingEvent({
        title,
        description: description || '',
        date_text,
        location: location || 'TBA',
        is_active: is_active !== false,
      });
      return NextResponse.json({ success: true, event: ev });
    }

    if (action === 'update_event') {
      const { id, updates } = eventData;
      const ev = updateUpcomingEvent(id, updates);
      return NextResponse.json({ success: true, event: ev });
    }

    if (action === 'create_gallery_image') {
      const { image_url, caption } = galleryData;
      if (!image_url) {
        return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
      }
      const img = createGalleryImage({
        image_url,
        caption: caption || '',
      });
      return NextResponse.json({ success: true, image: img });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  if (type === 'event') {
    deleteUpcomingEvent(id);
    logAudit({
      admin_id: admin.id,
      admin_name: admin.name,
      action: 'DELETE_UPCOMING_EVENT',
      entity_type: 'event',
      entity_id: id,
    });
    return NextResponse.json({ success: true });
  }

  if (type === 'gallery') {
    deleteGalleryImage(id);
    logAudit({
      admin_id: admin.id,
      admin_name: admin.name,
      action: 'DELETE_GALLERY_IMAGE',
      entity_type: 'gallery',
      entity_id: id,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
}
