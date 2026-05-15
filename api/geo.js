// Returns the visitor's country (from Vercel's geo header), the matching currency,
// the latest INR-base FX rates (cached for 6h), and the international markup amount.

const COUNTRY_TO_CURRENCY = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP', UK: 'GBP',
  AE: 'AED',
  CA: 'CAD',
  AU: 'AUD',
  // Eurozone
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
  SI: 'EUR', SK: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR',
  CY: 'EUR', HR: 'EUR',
};

const SUPPORTED = ['USD', 'GBP', 'EUR', 'AED', 'CAD', 'AUD'];
const FALLBACK_RATES = { USD: 0.012, GBP: 0.0095, EUR: 0.011, AED: 0.044, CAD: 0.016, AUD: 0.018 };
const MARKUP_INR = 5000;
const CACHE_MS = 6 * 60 * 60 * 1000;

let _rates = null;
let _ratesAt = 0;

async function getRates() {
  if (_rates && Date.now() - _ratesAt < CACHE_MS) return { rates: _rates, fresh: false };
  try {
    const r = await fetch(`https://api.frankfurter.app/latest?from=INR&to=${SUPPORTED.join(',')}`, {
      headers: { accept: 'application/json' },
    });
    if (!r.ok) throw new Error(`frankfurter ${r.status}`);
    const data = await r.json();
    if (data?.rates) {
      _rates = data.rates;
      _ratesAt = Date.now();
      return { rates: _rates, fresh: true, asOf: data.date };
    }
    throw new Error('no rates in response');
  } catch (err) {
    console.error('geo rates fetch failed', err);
    return { rates: _rates || FALLBACK_RATES, fresh: false, fallback: true };
  }
}

export default async function handler(req, res) {
  const country = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const currency = COUNTRY_TO_CURRENCY[country] || 'USD';
  const { rates, fresh, asOf, fallback } = await getRates();

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({
    country: country || null,
    currency,
    rates,
    markupInr: MARKUP_INR,
    ratesAsOf: asOf || null,
    fresh: Boolean(fresh),
    fallback: Boolean(fallback),
  });
}
