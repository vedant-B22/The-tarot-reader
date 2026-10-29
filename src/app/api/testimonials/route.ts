import { NextRequest, NextResponse } from 'next/server';
import { getAllTestimonials, createTestimonial } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const testimonials = getAllTestimonials(true);
  return NextResponse.json({ testimonials });
}

export async function POST(req: NextRequest) {
  try {
    const { customer_name, service_name, rating, feedback_text } = await req.json();

    if (!customer_name || customer_name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }

    if (!feedback_text || feedback_text.trim().length < 5) {
      return NextResponse.json({ error: 'Please enter your genuine review.' }, { status: 400 });
    }

    const numericRating = Number(rating) || 5;

    const testimonial = createTestimonial({
      customer_name,
      service_name: service_name || 'Personal Tarot Reading',
      rating: numericRating,
      feedback_text,
      is_approved: false, // Must be approved by admin before appearing publicly
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your review has been submitted and will appear on the site once verified by Vedant.',
      testimonial,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}
