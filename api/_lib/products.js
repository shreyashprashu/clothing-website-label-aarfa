// Server-side authoritative product pricing — keep in sync with PRODUCTS in src/App.jsx.
// Used by /api/orders/create to validate amounts the client sends.
export const PRODUCTS = [
  { id: 1,  name: 'Luxury Wine Rayon Tunic with Printed Palazzo',   price: 2999, salePrice: 1499, sizes: ['S','M','L','XL'] },
  { id: 2,  name: 'Brown Kurta with Cream Heart Printed Palazzo',   price: 2499, salePrice: 1499, sizes: ['XS','S','M','L','XL'] },
  { id: 3,  name: 'Stitched Red and Black Coord Set',               price: 2899, salePrice: 1499, sizes: ['S','M','L','XL','XXL'] },
  { id: 4,  name: 'Designer Cords Set for Women',                   price: 2999, salePrice: 1750, sizes: ['S','M','L','XL'] },
  { id: 5,  name: 'Coffee Shaded Embroidered Cotton Suit',          price: 2999, salePrice: 1750, sizes: ['S','M','L','XL'] },
  { id: 6,  name: 'Jaipur Royal Blue Cotton Handloom Kurta',        price: 2499, salePrice: 1499, sizes: ['XS','S','M','L','XL'] },
  { id: 7,  name: 'Yellow Pashmina A-line Kurta with Salwar',       price: 2999, salePrice: 1750, sizes: ['S','M','L','XL'] },
  { id: 8,  name: 'Stitched Soft Crepe Kurta with Tissue Silk Dupatta', price: 3499, salePrice: 1999, sizes: ['S','M','L','XL'] },
  { id: 9,  name: 'Elegant Viscose Muslin Embroidered Suit',        price: 3499, salePrice: 1999, sizes: ['S','M','L','XL'] },
  { id: 10, name: 'Office Wear Baby Pink Cotton Kurta Set',         price: 3299, salePrice: 1999, sizes: ['XS','S','M','L','XL'] },
  { id: 11, name: 'Floral Cotton Kurti Set with Dupatta',           price: 3499, salePrice: 1999, sizes: ['S','M','L','XL'] },
  { id: 12, name: 'Designer Shirt & Dupatta Casual Set',            price: 3299, salePrice: 1999, sizes: ['S','M','L','XL'] },
  { id: 13, name: 'Floral Silk Suit for Women',                     price: 3499, salePrice: 1999, sizes: ['S','M','L','XL'] },
  { id: 14, name: 'Ivory Kurta Set with Blue Floral Embroidery',    price: 3499, salePrice: 1999, sizes: ['XS','S','M','L','XL'] },
  { id: 15, name: 'Original Long Pakistani Cordset',                price: 3499, salePrice: 1999, sizes: ['S','M','L','XL'] },
  { id: 16, name: 'Lavender 3-Piece Stitched Dress',                price: 3299, salePrice: 1999, sizes: ['S','M','L','XL'] },
];

export const productById = (id) => PRODUCTS.find((p) => p.id === Number(id));
export const effectivePriceInr = (p) => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
