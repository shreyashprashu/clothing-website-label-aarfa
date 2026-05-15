// Promo code registry. The server is the source of truth — the client mirrors
// this list in src/App.jsx for instant feedback while the customer types,
// but `validatePromo` here is what actually applies the discount on the order.
//
// Rules:
//   percent: value is %, discount = floor(subtotal * value / 100)
//   fixed:   value is INR, discount = min(value, subtotal)
//   intlAllowed: false → code is INR-only
//   firstOrderOnly: true → blocked if the logged-in user has any prior paid
//     or COD-confirmed order. Cannot be enforced for guests (no identity).
//   minSubtotalInr: minimum cart subtotal before discount (in rupees).

export const PROMOS = {
  WELCOME10: {
    type: 'percent',
    value: 10,
    minSubtotalInr: 0,
    intlAllowed: false,
    firstOrderOnly: true,
    description: '10% off your first order',
  },
};

// `priorOrderCount` is only consulted for firstOrderOnly; pass 0 for guests.
// Returns { code, discountInr } on success or { error } on failure.
export function validatePromo({ code, subtotalInr, isIntl, priorOrderCount = 0 }) {
  if (!code) return { discountInr: 0 };
  const key = String(code).trim().toUpperCase();
  if (!key) return { discountInr: 0 };
  const promo = PROMOS[key];
  if (!promo) return { error: 'Invalid promo code' };
  if (isIntl && !promo.intlAllowed) return { error: 'This code is for India orders only' };
  if (subtotalInr < promo.minSubtotalInr) {
    return { error: `Minimum order ₹${promo.minSubtotalInr.toLocaleString('en-IN')}` };
  }
  if (promo.firstOrderOnly && priorOrderCount > 0) {
    return { error: 'This code is valid on first orders only' };
  }
  const discountInr = promo.type === 'percent'
    ? Math.floor((subtotalInr * promo.value) / 100)
    : Math.min(promo.value, subtotalInr);
  return { code: key, discountInr, promo };
}
