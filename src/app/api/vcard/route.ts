import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = getSettings();
  const phone = (settings.whatsapp_number || '+919226634637').replace(/[^0-9+]/g, '');

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Vedant Baviskar (The Tarot Reader)',
    'N:Baviskar;Vedant;;;',
    'ORG:The Tarot Reader • The Arcane Diaries',
    'TITLE:Intuitive Tarot Reader & Guide',
    `TEL;TYPE=CELL,VOICE,PREF:${phone}`,
    'X-SOCIALPROFILE;type=instagram:https://instagram.com/this.is_vedant_12',
    'X-SOCIALPROFILE;type=instagram:https://instagram.com/the_arcane_diaries',
    'URL:https://tarot-reader-sspu.vercel.app',
    'NOTE:Tarot Readings, Relationship Spreads, Clarity & Destiny Insights. Instagram: @this.is_vedant_12 & @the_arcane_diaries',
    'END:VCARD',
  ].join('\r\n');

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="Vedant_The_Tarot_Reader.vcf"',
      'Cache-Control': 'no-cache',
    },
  });
}
