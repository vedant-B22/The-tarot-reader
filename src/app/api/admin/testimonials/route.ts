import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllTestimonials, updateTestimonialApproval, deleteTestimonial, createTestimonial, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const testimonials = getAllTestimonials(false);
  return NextResponse.json({ testimonials });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customer_name, service_name, rating, feedback_text, is_approved } = await req.json();
    if (!customer_name || !feedback_text) {
      return NextResponse.json({ error: 'Name and review text required' }, { status: 400 });
    }

    const t = createTestimonial({
      customer_name,
      service_name: service_name || 'Tarot Reading',
      rating: Number(rating) || 5,
      feedback_text,
      is_approved: is_approved !== false,
    });

    logAudit({
      admin_id: admin.id,
      admin_name: admin.name,
      action: 'ADMIN_CREATE_TESTIMONIAL',
      entity_type: 'testimonial',
      entity_id: (t as any)?.id,
    });

    return NextResponse.json({ success: true, testimonial: t });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Creation failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, is_approved } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = updateTestimonialApproval(id, Boolean(is_approved));
    logAudit({
      admin_id: admin.id,
      admin_name: admin.name,
      action: 'MODERATE_TESTIMONIAL',
      entity_type: 'testimonial',
      entity_id: id,
      new_values: JSON.stringify({ is_approved }),
    });

    return NextResponse.json({ success: true, testimonial: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  deleteTestimonial(id);
  logAudit({
    admin_id: admin.id,
    admin_name: admin.name,
    action: 'DELETE_TESTIMONIAL',
    entity_type: 'testimonial',
    entity_id: id,
  });

  return NextResponse.json({ success: true });
}
