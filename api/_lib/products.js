// Server-side authoritative product pricing + image lookup. KEEP IN SYNC with
// PRODUCTS in src/App.jsx. Used by /api/orders/create to validate the amounts
// the client sends, and by /api/_lib/email to attach a thumbnail to each line.
//
// `image` is just the bare file name under public/images/products (no leading
// slash). The email builder prepends https://www.labelaarfa.com/images/products/
// when it needs an absolute URL.
export const PRODUCTS = [
  // ----- Legacy (sold out, kept for historical orders / share-links) -----
  { id: 1,  name: 'Luxury Wine Rayon Tunic with Printed Palazzo',     price: 2999, salePrice: 1499, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Luxury-Wine-Rayon-Tunic-Printed-Palazzo.jpeg' },
  { id: 2,  name: 'Brown Kurta with Cream Heart Printed Palazzo',     price: 2499, salePrice: 1499, sizes: ['XS','S','M','L','XL','XXL'], stock: 0, image: 'Brown-Kurta-with-Cream-Heart-Printed-Palazzo-Set-for-Women.jpeg' },
  { id: 3,  name: 'Stitched Red and Black Coord Set',                 price: 2899, salePrice: 1499, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'stitched-Red-and-Black-women-clothes.jpeg' },
  { id: 4,  name: 'Designer Cords Set for Women',                     price: 2999, salePrice: 1750, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Designer-Cords-Set-For-Women-in-Delhi.jpeg' },
  { id: 5,  name: 'Coffee Shaded Embroidered Cotton Suit',            price: 2999, salePrice: 1750, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Coffee-Shaded-Embroidered-Cotton-Suit-Set.jpeg' },
  { id: 6,  name: 'Jaipur Royal Blue Cotton Handloom Kurta',          price: 2499, salePrice: 1499, sizes: ['XS','S','M','L','XL','XXL'], stock: 0, image: 'Label-Aarfa-Jaipur-Royal-blue-Cotton-handloom-kurta.jpeg' },
  { id: 7,  name: 'Yellow Pashmina A-line Kurta with Salwar',         price: 2999, salePrice: 1750, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Label-Aarfa-Yellow-Pashmina-A-line-Kurta-with-Salwar-and-Shawl-.jpeg' },
  { id: 8,  name: 'Stitched Soft Crepe Kurta with Tissue Silk Dupatta', price: 3499, salePrice: 1999, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Premium-soft-crepe-fabric.jpeg' },
  { id: 9,  name: 'Elegant Viscose Muslin Embroidered Suit',          price: 3499, salePrice: 1999, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Elegant-Viscose-Muslin-Embroidered-Suit-Set.jpeg' },
  { id: 10, name: 'Office Wear Baby Pink Cotton Kurta Set',           price: 3299, salePrice: 1999, sizes: ['XS','S','M','L','XL','XXL'], stock: 0, image: 'Office-Wear-Kurta-Sets-for-Women-Affordable-Cotton.jpeg' },
  { id: 11, name: 'Floral Cotton Kurti Set with Dupatta',             price: 3499, salePrice: 1999, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Floral-Cotton-Kurti-Set-with-Dupatta-for-women.jpeg' },
  { id: 12, name: 'Designer Shirt & Dupatta Casual Set',              price: 3299, salePrice: 1999, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Best-Designer-Shirt-Dupatta-Casual-Collection.jpeg' },
  { id: 13, name: 'Floral Silk Suit for Women',                       price: 3499, salePrice: 1999, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'silk-suits-for-women-sale-Online-at-Best-Price.jpeg' },
  { id: 14, name: 'Ivory Kurta Set with Blue Floral Embroidery',      price: 3499, salePrice: 1999, sizes: ['XS','S','M','L','XL','XXL'], stock: 0, image: 'Ivory-Kurta-Set-with-Blue-Floral-Embroidery-Dupatta.jpeg' },
  { id: 15, name: 'Original Long Pakistani Cordset',                  price: 3499, salePrice: 1999, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'orignal-long-pakistani-Cordset.jpeg' },
  { id: 16, name: 'Lavender 3-Piece Stitched Dress',                  price: 3299, salePrice: 1999, sizes: ['S','M','L','XL','XXL'], stock: 0, image: 'Lavender-3-Piece-Dress-Stitched.jpeg' },

  // ----- Premium Collection (active) -----
  { id: 101, name: 'Sabrina Maroon Co-Ord Set',           price: 1999, sizes: ['S','M','L','XL','XXL'], stock: 8,  image: 'premium-1-1.jpg' },
  { id: 102, name: 'Mehnaaz Co-ord Set with Dupatta',     price: 2499, sizes: ['S','M','L','XL','XXL'], stock: 3,  image: 'premium-2-1.jpg' },
  { id: 103, name: 'Ayra Studded Co-Ord Set',             price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 4,  image: 'premium-3-1.jpg' },
  { id: 104, name: 'Farinah Co-Ord Set',                  price: 1999, sizes: ['S','M','L','XL','XXL'], stock: 5,  image: 'premium-4-1.jpg' },
  { id: 105, name: 'Raha Co-Ord Set',                     price: 1999, sizes: ['S','M','L','XL','XXL'], stock: 3,  image: 'premium-5a-1.jpg' },
  { id: 106, name: 'Raha Co-Ord Set',                     price: 1999, sizes: ['S','M','L','XL','XXL'], stock: 3,  image: 'premium-5b-1.jpg' },
  { id: 107, name: 'Aliza Co-ord Set',                    price: 1999, sizes: ['S','M','L','XL','XXL'], stock: 3,  image: 'premium-6a-1.jpg' },
  { id: 108, name: 'Aliza Co-ord Set',                    price: 1999, sizes: ['S','M','L','XL','XXL'], stock: 3,  image: 'premium-6b-1.jpg' },
  { id: 109, name: 'Renee Printed Co-Ord Set',            price: 1550, sizes: ['S','M','L','XL','XXL'], stock: 4,  image: 'premium-7-1.jpg' },
  { id: 110, name: 'Mia Co-ord Set',                      price: 1650, sizes: ['S','M','L','XL','XXL'], stock: 5,  image: 'premium-8-1.jpg' },
  { id: 111, name: 'Rebecca Co-ord Set',                  price: 1999, sizes: ['S','M','L','XL','XXL'], stock: 1,  image: 'premium-9-1.jpg' },
  { id: 112, name: 'Ambrina Embroidered Co-ord Set',      price: 1850, sizes: ['S','M','L','XL','XXL'], stock: 10, image: 'premium-10-1.jpg' },
  { id: 113, name: 'Lyra Co-ord Set with Dupatta',        price: 2350, sizes: ['S','M','L','XL','XXL'], stock: 3,  image: 'premium-11-1.jpg' },
  { id: 114, name: 'Myra Polka Co-Ord Set',               price: 1750, sizes: ['S','M','L','XL','XXL'], stock: 5,  image: 'premium-12-1.jpg' },
  { id: 115, name: 'Faizah Royal Blue Lounge Co-ord Set', price: 1650, sizes: ['S','M','L','XL','XXL'], stock: 10, image: 'premium-13-1.jpg' },

  // ----- Co-ord Sets (Solid Farshi Salwar, 5 colour variants) -----
  { id: 201, name: 'Solid Farshi Salwar Co-ord Set', price: 1250, sizes: ['S','M','L','XL','XXL'], stock: 10, image: 'coord-1a-1.jpg' },
  { id: 202, name: 'Solid Farshi Salwar Co-ord Set', price: 1250, sizes: ['S','M','L','XL','XXL'], stock: 10, image: 'coord-1b-1.jpg' },
  { id: 203, name: 'Solid Farshi Salwar Co-ord Set', price: 1250, sizes: ['S','M','L','XL','XXL'], stock: 10, image: 'coord-1c-1.jpg' },
  { id: 204, name: 'Solid Farshi Salwar Co-ord Set', price: 1250, sizes: ['S','M','L','XL','XXL'], stock: 10, image: 'coord-1d-1.jpg' },
  { id: 205, name: 'Solid Farshi Salwar Co-ord Set', price: 1250, sizes: ['S','M','L','XL','XXL'], stock: 10, image: 'coord-1e-1.jpg' },

  // ----- Pakistani Ready-to-Wear -----
  { id: 301, name: 'Designer Ajrakh Print Suit Set',          price: 1250, sizes: ['S','M','L','XL','XXL'], stock: 8, image: 'pakistani-1-1.jpg' },
  { id: 302, name: 'Ombre Luxury Suit',                       price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 6, image: 'pakistani-2-1.jpg' },
  { id: 303, name: 'Pakistani Turkish Coord Set · Edit 01',   price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-3-1.jpg' },
  { id: 304, name: 'Pakistani Turkish Coord Set · Edit 02',   price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-4-1.jpg' },
  { id: 305, name: 'Pakistani Turkish Coord Set · Edit 03',   price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-5-1.jpg' },
  { id: 306, name: 'Pakistani Turkish Coord Set · Edit 04',   price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-6-1.jpg' },
  { id: 307, name: 'Pakistani Turkish Coord Set · Edit 05',   price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-7-1.jpg' },
  { id: 308, name: 'Pakistani Turkish Coord Set · Edit 06',   price: 1499, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-8-1.jpg' },
  { id: 309, name: 'Pakistani Cutwork Printed Suit',          price: 1550, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-9a-1.jpg' },
  { id: 310, name: 'Pakistani Cutwork Printed Suit',          price: 1550, sizes: ['S','M','L','XL','XXL'], stock: 7, image: 'pakistani-9b-1.jpg' },

  // ----- Unstitched Collection -----
  { id: 401, name: 'Unstitched Karachi-Print Suit · Edit 01', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-1-1.jpg' },
  { id: 402, name: 'Unstitched Karachi-Print Suit · Edit 02', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-2-1.jpg' },
  { id: 403, name: 'Unstitched Karachi-Print Suit · Edit 03', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-3-1.jpg' },
  { id: 404, name: 'Unstitched Karachi-Print Suit · Edit 04', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-4-1.jpg' },
  { id: 405, name: 'Unstitched Karachi-Print Suit · Edit 05', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-5-1.jpg' },
  { id: 406, name: 'Unstitched Karachi-Print Suit · Edit 06', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-6-1.jpg' },
  { id: 407, name: 'Unstitched Karachi-Print Suit · Edit 07', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-7-1.jpg' },
  { id: 408, name: 'Unstitched Karachi-Print Suit · Edit 08', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-8-1.jpg' },
  { id: 409, name: 'Unstitched Karachi-Print Suit · Edit 09', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-9-1.jpg' },
  { id: 410, name: 'Unstitched Karachi-Print Suit · Edit 10', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-10-1.jpg' },
  { id: 411, name: 'Unstitched Karachi-Print Suit · Edit 11', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-11-1.jpg' },
  { id: 412, name: 'Unstitched Karachi-Print Suit · Edit 12', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-12-1.jpg' },
  { id: 413, name: 'Unstitched Karachi-Print Suit · Edit 13', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-13-1.jpg' },
  { id: 414, name: 'Unstitched Karachi-Print Suit · Edit 14', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-14-1.jpg' },
  { id: 415, name: 'Unstitched Karachi-Print Suit · Edit 15', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-15-1.jpg' },
  { id: 416, name: 'Unstitched Karachi-Print Suit · Edit 16', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-16-1.jpg' },
  { id: 417, name: 'Unstitched Karachi-Print Suit · Edit 17', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-17-1.jpg' },
  { id: 418, name: 'Unstitched Karachi-Print Suit · Edit 18', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-18-1.jpg' },
  { id: 419, name: 'Unstitched Karachi-Print Suit · Edit 19', price: 999, sizes: ['Free Size'], stock: 5, image: 'unstitched-19-1.jpg' },
  { id: 420, name: 'Unstitched Party Wear Suit',              price: 1600, sizes: ['Free Size'], stock: 3, image: 'unstitched-20a-1.jpg' },
  { id: 421, name: 'Unstitched Party Wear Suit',              price: 1600, sizes: ['Free Size'], stock: 3, image: 'unstitched-20b-1.jpg' },
];

export const productById = (id) => PRODUCTS.find((p) => p.id === Number(id));
export const effectivePriceInr = (p) => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);

// Absolute URL of a product's hero image — used by email templates so the
// thumbnail renders in the inbox without needing the recipient to fetch from
// a different origin. The path must match the static asset published by Vite.
const SITE_URL = (process.env.SITE_URL || 'https://www.labelaarfa.com').replace(/\/$/, '');
export const productImageUrl = (idOrFile) => {
  const file = typeof idOrFile === 'number'
    ? productById(idOrFile)?.image
    : idOrFile;
  if (!file) return '';
  return `${SITE_URL}/images/products/${file}`;
};
