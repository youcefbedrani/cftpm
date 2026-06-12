import { q, q1 } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id: invoiceId, status, amount, firstname, lastname, email, phone, address } = body || {};

    console.log('SlickPay webhook received:', { invoiceId, status });

    if (status === 'completed' || status === 'success') {
      const existing = await q1('SELECT id FROM payments WHERE invoice_number = $1', [`SP-${invoiceId}`]);
      if (existing) {
        return NextResponse.json({ received: true });
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ received: true });
  }
}
