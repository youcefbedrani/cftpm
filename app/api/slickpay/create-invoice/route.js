import { withAuth, ok, bad } from '@/lib/authServer';
import { createInvoice, getCallbackUrl, getWebhookUrl } from '@/lib/slickpay';

export const POST = withAuth(async (req, { session }) => {
  const { courseId, courseTitle, amount, phone, wilaya, motivation, name } = await req.json();
  if (!courseId || !courseTitle || !amount) return bad('missing fields');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;
  const nameParts = (name || session.name || 'Student').split(' ');
  const firstname = nameParts[0];
  const lastname = nameParts.slice(1).join(' ') || 'Student';

  const result = await createInvoice({
    amount,
    firstname,
    lastname,
    phone: phone || '',
    email: session.email,
    address: wilaya || '',
    items: [{ name: courseTitle, price: Math.round(amount), quantity: 1 }],
    url: getCallbackUrl(baseUrl) + `?courseId=${courseId}&courseTitle=${encodeURIComponent(courseTitle)}&amount=${amount}&phone=${encodeURIComponent(phone||'')}&wilaya=${encodeURIComponent(wilaya||'')}&motivation=${encodeURIComponent(motivation||'')}`,
    webhook_url: getWebhookUrl(baseUrl),
  });

  if (!result) {
    return bad('Payment service not configured', 503);
  }

  if (!result.ok || !result.success) {
    console.error('SlickPay error:', result);
    return bad('Payment service error', 502);
  }

  return ok({ paymentUrl: result.url, invoiceId: result.id });
});
