import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const courseTitle = searchParams.get('courseTitle');
  const amount = searchParams.get('amount');
  const phone = searchParams.get('phone') || '';
  const wilaya = searchParams.get('wilaya') || '';
  const motivation = searchParams.get('motivation') || '';
  const invoiceId = searchParams.get('id');
  const status = searchParams.get('status') || 'completed';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;

  if (status === 'completed' || status === 'success') {
    return NextResponse.redirect(`${baseUrl}/?payment=success&courseId=${courseId}&courseTitle=${encodeURIComponent(courseTitle)}&amount=${amount}&phone=${encodeURIComponent(phone)}&wilaya=${encodeURIComponent(wilaya)}&motivation=${encodeURIComponent(motivation)}&invoiceId=${invoiceId}`);
  }

  return NextResponse.redirect(`${baseUrl}/?payment=failed`);
}
