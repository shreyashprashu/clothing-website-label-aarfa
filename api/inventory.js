// GET /api/inventory — returns live stock for every product known to the
// server. Used by the client to overlay the hardcoded `stock` values in
// PRODUCTS so cards/PDP show "Sold Out" / "Only N left" based on what's
// actually in the database.
//
// Shape: { stock: { "<product_id>": <int>, ... } }
//
// Caching: a short edge cache (60s) takes the load off Supabase during
// traffic bursts. Stock changes infrequently enough that 60s of staleness
// is fine for display purposes — actual decrement is server-authoritative
// at order time, so a stale "in stock" reading never causes oversell.
import { getServiceClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const sb = getServiceClient();
    const { data, error } = await sb.from('product_stock').select('product_id, stock');
    if (error) throw error;
    const stock = {};
    for (const row of (data || [])) stock[row.product_id] = row.stock;
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ stock });
  } catch (e) {
    console.error('[inventory] read failed', e?.message);
    return res.status(500).json({ error: e?.message || 'Inventory unavailable' });
  }
}
