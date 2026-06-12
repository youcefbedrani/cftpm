const BASE = 'https://prodapi.slick-pay.com/api/v2';

export function getPublicKey() {
  return process.env.SLICKPAY_PUBLIC_KEY;
}

export function getSecretKey() {
  return process.env.SLICKPAY_SECRET_KEY;
}

function isConfigured() {
  return !!getPublicKey();
}

async function apiPost(endpoint, data) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${getPublicKey()}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { ok: res.ok, ...json };
}

export async function createInvoice({ amount, firstname, lastname, phone, email, address, items, url, webhook_url }) {
  if (!isConfigured()) return null;
  const body = {
    amount: Math.round(amount),
    firstname,
    lastname,
    phone,
    email,
    address: address || '',
    url: url || '',
    webhook_url: webhook_url || '',
    items: items || [{ name: 'Course Enrollment', price: Math.round(amount), quantity: 1 }],
  };
  return apiPost('/users/invoices', body);
}

export function getCallbackUrl(baseUrl) {
  return `${baseUrl}/api/slickpay/callback`;
}

export function getWebhookUrl(baseUrl) {
  return `${baseUrl}/api/slickpay/webhook`;
}
