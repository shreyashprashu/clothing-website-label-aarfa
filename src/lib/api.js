// Tiny fetch wrappers for the /api/* serverless endpoints.

async function post(path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${path} failed (${res.status})`);
  return data;
}

async function get(path) {
  const res = await fetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${path} failed (${res.status})`);
  return data;
}

export const api = {
  createOrder: (payload, token) => post('/api/orders/create', payload, token),
  verifyOrder: (payload) => post('/api/orders/verify', payload),
  contact:     (payload) => post('/api/contact', payload),
  newsletter:  (payload) => post('/api/newsletter', payload),
  inventory:   () => get('/api/inventory'),
};

// Load the Razorpay Checkout JS — script-tag based, cached after first load.
let _rzpPromise;
export function loadRazorpay() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (_rzpPromise) return _rzpPromise;
  _rzpPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => { _rzpPromise = null; resolve(false); };
    document.head.appendChild(s);
  });
  return _rzpPromise;
}
