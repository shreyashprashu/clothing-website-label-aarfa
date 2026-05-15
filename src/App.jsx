import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { ShoppingBag, Heart, Search, User, X, Menu, ChevronRight, ChevronLeft, Plus, Minus, Truck, ShieldCheck, RotateCcw, Hash, Globe2, Video, MapPin, Phone, Mail, Check, ArrowRight, SlidersHorizontal, Sparkles, Globe } from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabase';
import { api, loadRazorpay } from './lib/api';

const IMG = `${import.meta.env.BASE_URL}images/products/`;

/* ================================================================
   PRODUCTS — every image from labelaarfa.com/all-products
   ================================================================ */
const PRODUCTS = [
  { id: 1, name: 'Luxury Wine Rayon Tunic with Printed Palazzo', category: 'stitched', price: 2999, salePrice: 1499, images: [IMG + 'Luxury-Wine-Rayon-Tunic-Printed-Palazzo.jpeg',IMG + 'Luxury-Wine-Rayon-Tunic-with-Printed-Palazzo.jpeg'], fabric: 'Rayon', colors: ['#722F37','#1a1a1a'], sizes: ['S','M','L','XL'], isNew: true, description: 'A regal wine-toned tunic crafted in soft rayon, paired with a printed palazzo. Tailored for fluid drape and evening elegance.' },
  { id: 2, name: 'Brown Kurta with Cream Heart Printed Palazzo', category: 'coords', price: 2499, salePrice: 1499, images: [IMG + 'Brown-Kurta-with-Cream-Heart-Printed-Palazzo-Set-for-Women.jpeg',IMG + 'Brown-Kurta-with-Cream-Heart-Printed-Palazzo.jpeg'], fabric: 'Cotton', colors: ['#6F4E37','#F5E6D3'], sizes: ['XS','S','M','L','XL'], isNew: false, description: 'Earthy brown kurta paired with a whimsical cream heart-printed palazzo. Romantic, refined, and quietly playful.' },
  { id: 3, name: 'Stitched Red and Black Coord Set', category: 'stitched', price: 2899, salePrice: 1499, images: [IMG + 'stitched-Red-and-Black-women-clothes.jpeg',IMG + 'Red-and-Black-women-clothes.jpeg',IMG + 'Best-stitched-Red-and-Black-women-clothes.jpeg',IMG + 'Premium-stitched-Red-and-Black-women-clothes.jpeg'], fabric: 'Crepe', colors: ['#B91C1C','#1A1A1A'], sizes: ['S','M','L','XL','XXL'], isNew: true, description: 'A striking red and black ensemble — bold contrast, impeccable stitching, designed to make an entrance.' },
  { id: 4, name: 'Designer Cords Set for Women', category: 'coords', price: 2999, salePrice: 1750, images: [IMG + 'Designer-Cords-Set-For-Women-in-Delhi.jpeg',IMG + 'Best-Designer-Cords-Set-For-Women.jpeg',IMG + 'Label-Aarfa-Designer-Cords-Set-For-Women.jpeg',IMG + 'Designer-Cords-Set-For-Women.jpeg'], fabric: 'Cotton Blend', colors: ['#8B7355','#D4AF37'], sizes: ['S','M','L','XL'], isNew: true, description: 'A modern coord set with timeless silhouette — soft drape, considered details, made for everyday luxury.' },
  { id: 5, name: 'Coffee Shaded Embroidered Cotton Suit', category: 'stitched', price: 2999, salePrice: 1750, images: [IMG + 'Coffee-Shaded-Embroidered-Cotton-Suit-Set.jpeg',IMG + 'Label-Aarfa-Coffee-Shaded-Embroidered-Cotton-Suit-Set.jpeg',IMG + 'Coffee-Shaded-Embroidered-Cotton-Suit-Set-Price.jpeg',IMG + 'Coffee-Shaded-Embroidered-Cotton-Suit-Set-for-Women.jpeg'], fabric: 'Cotton', colors: ['#6F4E37','#3E2723'], sizes: ['S','M','L','XL'], isNew: false, description: 'Deep coffee tones meet intricate embroidery. A suit set that whispers craftsmanship in every thread.' },
  { id: 6, name: 'Jaipur Royal Blue Cotton Handloom Kurta', category: 'newarrivals', price: 2499, salePrice: 1499, images: [IMG + 'Label-Aarfa-Jaipur-Royal-blue-Cotton-handloom-kurta.jpeg',IMG + 'Jaipur-Royal-blue-Cotton-handloom-kurta.jpeg'], fabric: 'Handloom Cotton', colors: ['#1E3A8A','#FFFFFF'], sizes: ['XS','S','M','L','XL'], isNew: true, description: 'Hand-woven in Jaipur — royal blue cotton with breathable structure and heritage in every weave.' },
  { id: 7, name: 'Yellow Pashmina A-line Kurta with Salwar', category: 'newarrivals', price: 2999, salePrice: 1750, images: [IMG + 'Label-Aarfa-Yellow-Pashmina-A-line-Kurta-with-Salwar-and-Shawl-.jpeg',IMG + 'Yellow-Pashmina-A-line-Kurta.jpeg',IMG + 'Yellow-Pashmina-A-line-Kurta-with-Salwar-and-Shawl-.jpeg'], fabric: 'Pashmina', colors: ['#EAB308','#FCD34D'], sizes: ['S','M','L','XL'], isNew: true, description: 'Sunlit yellow pashmina with a graceful A-line silhouette. Includes coordinated salwar and shawl.' },
  { id: 8, name: 'Stitched Soft Crepe Kurta with Tissue Silk Dupatta', category: 'stitched', price: 3499, salePrice: 1999, images: [IMG + 'Premium-soft-crepe-fabric.jpeg',IMG + 'Stiched-soft-crepe-fabric-with-Tissue-Silk-Dupatta.jpeg',IMG + 'women-Premium-soft-crepe-fabric-with-Tissue-Silk-Dupatta.jpeg',IMG + 'Premium-soft-crepe-fabric-with-Tissue-Silk.jpeg'], fabric: 'Soft Crepe', colors: ['#B8860B','#F5DEB3'], sizes: ['S','M','L','XL'], isNew: false, description: 'A premium soft crepe kurta finished with a luminous tissue silk dupatta. Drape that flows like poetry.' },
  { id: 9, name: 'Elegant Viscose Muslin Embroidered Suit', category: 'stitched', price: 3499, salePrice: 1999, images: [IMG + 'Elegant-Viscose-Muslin-Embroidered-Suit-Set.jpeg',IMG + 'Elegant-Viscose-Muslin-Embroidered-Suit.jpeg',IMG + 'Viscose-Muslin-Embroidered-Suit-Set.jpeg'], fabric: 'Viscose Muslin', colors: ['#A78BFA','#E9D5FF'], sizes: ['S','M','L','XL'], isNew: false, description: 'Cloud-soft viscose muslin embroidered with restraint and intention. Light to wear, lasting to remember.' },
  { id: 10, name: 'Office Wear Baby Pink Cotton Kurta Set', category: 'newarrivals', price: 3299, salePrice: 1999, images: [IMG + 'Office-Wear-Kurta-Sets-for-Women-Affordable-Cotton.jpeg',IMG + 'Office-Wear-Kurta-Sets-for-Women-Baby-pink.jpeg',IMG + 'Kurta-Sets-for-Women-Affordable-Cotton.jpeg',IMG + 'Office-Wear-Kurta-Sets-for-Women.jpeg'], fabric: 'Cotton', colors: ['#FCE7F3','#F9A8D4'], sizes: ['XS','S','M','L','XL'], isNew: false, description: 'A workwear kurta set in tender baby pink — composed, breathable, and quietly powerful.' },
  { id: 11, name: 'Floral Cotton Kurti Set with Dupatta', category: 'newarrivals', price: 3499, salePrice: 1999, images: [IMG + 'Floral-Cotton-Kurti-Set-with-Dupatta-for-women.jpeg',IMG + 'Best-Floral-Cotton-Kurti-Set-with-Dupatta.jpeg',IMG + 'Label-Aarfa-Floral-Cotton-Kurti-Set-with-Dupatta.jpeg',IMG + 'Floral-Cotton-Kurti-Set-with-Dupatta.jpeg'], fabric: 'Cotton', colors: ['#FBBF24','#10B981'], sizes: ['S','M','L','XL'], isNew: false, description: 'A garden in motion — floral prints on breathable cotton, finished with a flowing dupatta.' },
  { id: 12, name: 'Designer Shirt & Dupatta Casual Set', category: 'coords', price: 3299, salePrice: 1999, images: [IMG + 'Best-Designer-Shirt-Dupatta-Casual-Collection.jpeg',IMG + 'Designer-Shirt-Dupatta-Casual-Muslim-Collection.jpeg',IMG + 'Designer-Shirt-Dupatta-Casual-Collection.jpeg',IMG + 'Shirt-Dupatta-Casual-Collection.jpeg'], fabric: 'Cotton Blend', colors: ['#374151','#9CA3AF'], sizes: ['S','M','L','XL'], isNew: false, description: 'A relaxed shirt paired with a soft dupatta — fluid, modern, effortlessly put-together.' },
  { id: 13, name: 'Floral Silk Suit for Women', category: 'sale', price: 3499, salePrice: 1999, images: [IMG + 'silk-suits-for-women-sale-Online-at-Best-Price.jpeg',IMG + 'Buy-silk-suits-for-women-sale-Online-at-Best-Price.jpeg'], fabric: 'Silk', colors: ['#7C3AED','#EDE9FE'], sizes: ['S','M','L','XL'], isNew: false, description: 'Silk suit blooming with floral motifs — luminous, ceremonial, and worth keeping forever.' },
  { id: 14, name: 'Ivory Kurta Set with Blue Floral Embroidery', category: 'newarrivals', price: 3499, salePrice: 1999, images: [IMG + 'Ivory-Kurta-Set-with-Blue-Floral-Embroidery-Dupatta.jpeg',IMG + 'Ivory-Kurta-Set-with-Blue-Floral-Embroidery.jpeg',IMG + 'Ivory-Kurta-Set-with-Blue-Floral.jpeg',IMG + 'Label-AarfaIvory-Kurta-Set-with-Blue-Floral-Embroidery-Dupatta.jpeg'], fabric: 'Cotton', colors: ['#FAF7F2','#1E40AF'], sizes: ['XS','S','M','L','XL'], isNew: true, description: 'Ivory canvas with cobalt embroidery — a study in restraint and contrast.' },
  { id: 15, name: 'Original Long Pakistani Cordset', category: 'coords', price: 3499, salePrice: 1999, images: [IMG + 'orignal-long-pakistani-Cordset.jpeg',IMG + 'Premium-orignal-long-pakistani-Cordset-in-Delhi.jpeg',IMG + 'Premium-orignal-long-pakistani-Cordset.jpeg'], fabric: 'Lawn', colors: ['#065F46','#A7F3D0'], sizes: ['S','M','L','XL'], isNew: false, description: 'Long Pakistani coordset with authentic detailing — a long-line silhouette for graceful presence.' },
  { id: 16, name: 'Lavender 3-Piece Stitched Dress', category: 'stitched', price: 3299, salePrice: 1999, images: [IMG + 'Lavender-3-Piece-Dress-Stitched.jpeg',IMG + 'Label-Aarfa-Lavender-3-Piece-Dress.jpeg'], fabric: 'Georgette', colors: ['#C4B5FD','#EDE9FE'], sizes: ['S','M','L','XL'], isNew: true, description: 'A three-piece in soft lavender — modern proportions, romantic palette, ready-to-wear.' },
];

/* ================================================================
   PALETTE — warm pearl whites, eggshell layers, deep wine accent
   ================================================================
   --bg-base:    #FBF8F3  warm pearl (page background)
   --bg-soft:    #F6F0E5  champagne (elevated surfaces, sale strip)
   --bg-card:    #FFFFFF  pure white card on warm bg = morphous lift
   --bg-cream:   #EFE6D6  cream (filter panel, sidebar)
   --ink:        #1F1A14  soft black (text)
   --ink-soft:   #6B5F4F  warm muted
   --line:       #E8DDC9  warm cream border
   --accent:     #7B1E28  deep wine (sale, hover)
   --gold:       #B8924A  muted antique gold (highlights)
   ================================================================ */

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  GBP: { symbol: '£', rate: 0.0095 },
  EUR: { symbol: '€', rate: 0.011 },
  AED: { symbol: 'AED ', rate: 0.044 },
  CAD: { symbol: 'C$', rate: 0.016 },
  AUD: { symbol: 'A$', rate: 0.018 },
};
const formatPrice = (inr, c) => {
  const x = inr * CURRENCIES[c].rate;
  return c === 'INR' ? `${CURRENCIES[c].symbol}${Math.round(x).toLocaleString('en-IN')}` : `${CURRENCIES[c].symbol}${x.toFixed(2)}`;
};

/* ================================================================
   CONTEXT
   ================================================================ */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function AppProvider({ children }) {
  const [page, setPage] = useState({ name: 'home', data: null });
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('INR');
  const [toast, setToast] = useState(null);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2400); };
  const navigate = (name, data = null) => { setPage({ name, data }); window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); };

  const addToCart = (product, size, color, quantity = 1) => {
    const key = `${product.id}-${size}-${color}`;
    setCart((prev) => {
      const e = prev.find((i) => i.key === key);
      if (e) return prev.map((i) => i.key === key ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { key, product, size, color, quantity }];
    });
    showToast('Added to bag');
    setCartOpen(true);
  };
  const updateQty = (key, d) => setCart((p) => p.map((i) => i.key === key ? { ...i, quantity: Math.max(0, i.quantity + d) } : i).filter((i) => i.quantity > 0));
  const removeFromCart = (key) => setCart((p) => p.filter((i) => i.key !== key));
  const toggleWishlist = (id) => setWishlist((p) => {
    if (p.includes(id)) { showToast('Removed from wishlist'); return p.filter((x) => x !== id); }
    showToast('Saved to wishlist'); return [...p, id];
  });

  // Hydrate Supabase session and subscribe to auth changes
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!supabase) { setUser(null); return; }
    await supabase.auth.signOut();
    showToast('Signed out');
  };

  useEffect(() => { applySeo(page); }, [page]);

  return (
    <AppCtx.Provider value={{ page, navigate, cart, addToCart, updateQty, removeFromCart, setCart, wishlist, toggleWishlist, cartOpen, setCartOpen, searchOpen, setSearchOpen, mobileMenuOpen, setMobileMenuOpen, authOpen, setAuthOpen, user, setUser, signOut, currency, setCurrency, toast, showToast }}>
      {children}
    </AppCtx.Provider>
  );
}

/* ================================================================
   SEO — per-page title, meta description, canonical, JSON-LD
   ================================================================ */
const SITE_URL = 'https://labelaarfa.com';
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CATEGORY_SEO = {
  newarrivals: { title: 'New Arrivals — Label Aarfa', desc: 'Fresh designs from our Delhi atelier — new kurtas, coord sets, and stitched suits in handloom cotton, soft crepe, and silk.', path: '/collections/new-arrivals' },
  stitched:    { title: 'Stitched Collection — Ready-to-Wear Ethnic Suits | Label Aarfa', desc: 'Ready-to-wear stitched kurtas and suits, finished by hand in our Delhi atelier. Sizes XS–XXL, free shipping over ₹2,999.', path: '/collections/stitched' },
  coords:      { title: 'Coord Sets — Matching Kurta & Palazzo Sets | Label Aarfa', desc: 'Matching coord sets in coordinated fabrics and prints — kurta with palazzo or pants. Handcrafted, ready to wear.', path: '/collections/coords' },
  sale:        { title: 'Sale — Ethnic Wear at Gentle Prices | Label Aarfa', desc: 'Selected pieces from the Label Aarfa atelier at gentle prices. Handcrafted stitched suits, coord sets, and kurtas.', path: '/collections/sale' },
  all:         { title: 'All Products — Label Aarfa Couture', desc: 'The complete Label Aarfa collection — 16 handcrafted pieces from our Delhi atelier.', path: '/collections/all' },
};

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}
function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('script'); el.id = id; el.type = 'application/ld+json'; document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
}
function clearJsonLd(id) { document.getElementById(id)?.remove(); }

function applySeo(page) {
  const home = { title: 'Label Aarfa — Handcrafted Ethnic Wear from Delhi | Est. 2019', desc: 'Label Aarfa is a Delhi atelier crafting handmade kurtas, coord sets, and stitched suits since 2019. Slow couture in handloom cotton, soft crepe, silk, and pashmina.', url: SITE_URL + '/', image: IMG + 'Premium-soft-crepe-fabric-with-Tissue-Silk.jpeg' };
  let cur = { ...home };

  clearJsonLd('ld-product');
  clearJsonLd('ld-breadcrumb');
  clearJsonLd('ld-itemlist');

  if (page.name === 'category') {
    const c = CATEGORY_SEO[page.data] || CATEGORY_SEO.all;
    cur = { title: c.title, desc: c.desc, url: SITE_URL + c.path, image: home.image };
    setJsonLd('ld-breadcrumb', {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: c.title.split(' — ')[0], item: cur.url },
      ],
    });
  } else if (page.name === 'product') {
    const p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find((x) => x.id === page.data) : null;
    if (p) {
      const url = `${SITE_URL}/products/${slugify(p.name)}`;
      cur = {
        title: `${p.name} — Label Aarfa`,
        desc: p.description.length > 155 ? p.description.slice(0, 152) + '…' : p.description,
        url, image: p.images[0],
      };
      const onSale = p.salePrice && p.salePrice < p.price;
      setJsonLd('ld-product', {
        '@context': 'https://schema.org', '@type': 'Product',
        name: p.name, image: p.images, description: p.description,
        sku: `LA-${p.id}`,
        brand: { '@type': 'Brand', name: 'Label Aarfa' },
        material: p.fabric,
        offers: {
          '@type': 'Offer', url, priceCurrency: 'INR',
          price: (onSale ? p.salePrice : p.price).toString(),
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
          ...(onSale && { priceValidUntil: '2025-12-31' }),
        },
      });
      setJsonLd('ld-breadcrumb', {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: p.category, item: `${SITE_URL}/collections/${p.category}` },
          { '@type': 'ListItem', position: 3, name: p.name, item: url },
        ],
      });
    }
  } else if (page.name === 'about') {
    cur = { ...home, title: 'About Label Aarfa — Our Story | Founded 2019, Delhi', desc: 'Founded in 2019 by Aarfa, our Delhi atelier works with master artisans across Jaipur, Delhi, and Lucknow to make ethnic wear with intention.', url: SITE_URL + '/about' };
  } else if (page.name === 'contact') {
    cur = { ...home, title: 'Contact Label Aarfa — Atelier in New Delhi', desc: 'Visit our atelier at 28/132 West Patel Nagar, New Delhi. Email care@labelaarfa.com or call +91 98xxx xxx00.', url: SITE_URL + '/contact' };
  } else if (page.name === 'wishlist') {
    cur = { ...home, title: 'Wishlist — Label Aarfa', desc: 'Pieces you have saved from the Label Aarfa collection.', url: SITE_URL + '/wishlist' };
  }

  const absImage = cur.image.startsWith('http') ? cur.image : window.location.origin + cur.image;

  document.title = cur.title;
  setMeta('description', cur.desc);
  setCanonical(cur.url);
  setMeta('og:title', cur.title, 'property');
  setMeta('og:description', cur.desc, 'property');
  setMeta('og:url', cur.url, 'property');
  setMeta('og:image', absImage, 'property');
  setMeta('twitter:title', cur.title);
  setMeta('twitter:description', cur.desc);
  setMeta('twitter:image', absImage);
}

/* ================================================================
   PRICE + BADGE
   ================================================================ */
function Price({ priceInr, salePriceInr, size = 'md', showSaved = false }) {
  const { currency } = useApp();
  const sized = { sm: 'text-[13px]', md: 'text-sm', lg: 'text-lg', xl: 'text-xl sm:text-2xl' }[size];
  if (salePriceInr && salePriceInr < priceInr) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`${sized} line-through font-light`} style={{ color: '#A89888' }}>{formatPrice(priceInr, currency)}</span>
        <span className={`${sized} font-semibold tracking-tight`} style={{ color: '#1F1A14' }}>{formatPrice(salePriceInr, currency)}</span>
        {showSaved && <span className="block w-full text-[11px] font-medium mt-0.5" style={{ color: '#2F6B3E' }}>You save {formatPrice(priceInr - salePriceInr, currency)}</span>}
      </div>
    );
  }
  return <span className={`${sized} font-medium`} style={{ color: '#1F1A14' }}>{formatPrice(priceInr, currency)}</span>;
}

function DiscountBadge({ priceInr, salePriceInr }) {
  if (!salePriceInr || salePriceInr >= priceInr) return null;
  const pct = Math.round(((priceInr - salePriceInr) / priceInr) * 100);
  return (
    <div className="absolute top-3 left-3 px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold tracking-wider text-white z-10 shadow-sm" style={{ backgroundColor: '#7B1E28', borderRadius: '6px' }}>
      −{pct}%
    </div>
  );
}

/* ================================================================
   HEADER
   ================================================================ */
function AnnouncementBar() {
  const msgs = ['Free shipping on orders above ₹2,999', 'Cash on delivery available', 'Use WELCOME10 for 10% off your first order'];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % msgs.length), 4000); return () => clearInterval(t); }, []);
  return (
    <div className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-light overflow-hidden h-9 flex items-center justify-center px-4" style={{ backgroundColor: '#1F1A14', color: '#F6F0E5' }}>
      <div key={i} className="animate-fadeIn truncate">{msgs[i]}</div>
    </div>
  );
}

function Header() {
  const { navigate, page, cart, wishlist, setCartOpen, setSearchOpen, setAuthOpen, setMobileMenuOpen, user, signOut } = useApp();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  useEffect(() => {
    if (!accountOpen) return;
    const onDocClick = (e) => { if (!accountRef.current?.contains(e.target)) setAccountOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [accountOpen]);
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  const links = [
    { key: 'category', label: 'New', data: 'newarrivals' },
    { key: 'category', label: 'Stitched', data: 'stitched' },
    { key: 'category', label: 'Coords', data: 'coords' },
    { key: 'category', label: 'All', data: 'all' },
    { key: 'category', label: 'Sale', data: 'sale' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40" style={{ backgroundColor: '#FBF8F3', borderBottom: '1px solid #E8DDC9' }}>
      <AnnouncementBar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-3 items-center h-16 sm:h-20 gap-2">
          {/* Left */}
          <div className="flex items-center gap-1 justify-self-start">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
              {links.slice(0, 3).map((l, i) => (
                <button key={i} onClick={() => navigate(l.key, l.data)}
                  className={`text-[11px] xl:text-xs tracking-[0.22em] uppercase font-light hover:opacity-100 transition-opacity ${page.data === l.data ? 'opacity-100' : 'opacity-70'}`}
                  style={{ color: '#1F1A14' }}>
                  {l.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Logo center */}
          <button onClick={() => navigate('home')} className="justify-self-center text-center flex items-center gap-2 sm:gap-3" aria-label="Label Aarfa — Home">
            <img src={`${import.meta.env.BASE_URL}logo-mark.svg`} alt="" aria-hidden="true" className="h-7 sm:h-9 lg:h-10 w-auto" />
            <div>
              <div className="font-serif text-xl sm:text-2xl lg:text-[28px] tracking-[0.18em] leading-none" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, color: '#1F1A14' }}>
                LABEL AARFA
              </div>
              <div className="hidden sm:block text-[8px] sm:text-[9px] tracking-[0.42em] uppercase font-light mt-1" style={{ color: '#7B1E28' }}>Fashion Redefined · Est. 2019</div>
            </div>
          </button>

          {/* Right */}
          <div className="flex items-center gap-1 justify-self-end">
            <nav className="hidden lg:flex items-center gap-7 xl:gap-9 mr-3">
              {links.slice(3, 6).map((l, i) => (
                <button key={i} onClick={() => navigate(l.key, l.data)}
                  className={`text-[11px] xl:text-xs tracking-[0.22em] uppercase font-light hover:opacity-100 transition-opacity ${page.data === l.data ? 'opacity-100' : 'opacity-70'}`}
                  style={{ color: l.label === 'Sale' ? '#7B1E28' : '#1F1A14' }}>
                  {l.label}
                </button>
              ))}
            </nav>
            <IconBtn onClick={() => setSearchOpen(true)} aria="Search"><Search className="w-[18px] h-[18px]" strokeWidth={1.5} /></IconBtn>
            <div className="relative" ref={accountRef}>
              <IconBtn onClick={() => user ? setAccountOpen((v) => !v) : setAuthOpen(true)} aria={user ? 'Account menu' : 'Sign in'} hide>
                <User className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ color: user ? '#7B1E28' : '#1F1A14' }} />
              </IconBtn>
              {accountOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-64 z-50 overflow-hidden animate-fadeIn" style={{ backgroundColor: '#FBF8F3', border: '1px solid #E8DDC9', borderRadius: '10px', boxShadow: '0 12px 28px -10px rgba(31, 26, 20, 0.22)' }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8DDC9' }}>
                    <div className="text-[10px] tracking-[0.22em] uppercase font-light mb-1" style={{ color: '#6B5F4F' }}>Signed in as</div>
                    <div className="text-sm font-light truncate" style={{ color: '#1F1A14' }}>{user.email}</div>
                  </div>
                  <button onClick={() => { setAccountOpen(false); signOut(); }} className="w-full px-4 py-3 text-left text-[11px] tracking-[0.22em] uppercase font-light transition-colors hover:bg-[#F6F0E5]" style={{ color: '#1F1A14' }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
            <IconBtn onClick={() => navigate('wishlist')} aria="Wishlist" badge={wishlist.length}><Heart className="w-[18px] h-[18px]" strokeWidth={1.5} /></IconBtn>
            <IconBtn onClick={() => setCartOpen(true)} aria="Cart" badge={cartCount}><ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} /></IconBtn>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, badge, aria, hide = false, ...rest }) {
  return (
    <button aria-label={aria} className={`relative p-2 transition-opacity hover:opacity-100 opacity-80 ${hide ? 'hidden sm:flex' : ''}`} style={{ color: '#1F1A14' }} {...rest}>
      {children}
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center px-1" style={{ backgroundColor: '#7B1E28' }}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ================================================================
   MOBILE MENU
   ================================================================ */
function MobileMenu() {
  const { mobileMenuOpen, setMobileMenuOpen, navigate, currency, setCurrency, setAuthOpen, user, signOut } = useApp();
  if (!mobileMenuOpen) return null;
  const links = [
    { key: 'home', label: 'Home' },
    { key: 'category', label: 'New Arrivals', data: 'newarrivals' },
    { key: 'category', label: 'Stitched Collection', data: 'stitched' },
    { key: 'category', label: 'Coords', data: 'coords' },
    { key: 'category', label: 'All Products', data: 'all' },
    { key: 'category', label: 'Sale', data: 'sale' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ];
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(31, 26, 20, 0.55)' }} onClick={() => setMobileMenuOpen(false)} />
      <div className="absolute left-0 top-0 bottom-0 w-[88%] max-w-sm flex flex-col animate-slideInLeft" style={{ backgroundColor: '#FBF8F3' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #E8DDC9' }}>
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo-mark.svg`} alt="" aria-hidden="true" className="h-6 w-auto" />
            <div className="font-serif text-lg tracking-[0.18em]" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1F1A14' }}>LABEL AARFA</div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2" aria-label="Close menu"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {links.map((l, i) => (
            <button key={i} onClick={() => navigate(l.key, l.data)}
              className="w-full text-left px-6 py-4 text-sm tracking-[0.14em] uppercase font-light transition-colors hover:bg-[#F6F0E5]"
              style={{ borderBottom: '1px solid rgba(232, 221, 201, 0.5)', color: l.label === 'Sale' ? '#7B1E28' : '#1F1A14' }}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="p-5 space-y-4" style={{ borderTop: '1px solid #E8DDC9', backgroundColor: '#F6F0E5' }}>
          {user ? (
            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase font-light mb-1" style={{ color: '#6B5F4F' }}>Signed in as</div>
              <div className="text-sm font-light mb-3 truncate" style={{ color: '#1F1A14' }}>{user.email}</div>
              <button onClick={() => { setMobileMenuOpen(false); signOut(); }}
                className="w-full py-3 text-xs tracking-[0.22em] uppercase font-light transition-colors flex items-center justify-center gap-2"
                style={{ border: '1px solid #1F1A14', color: '#1F1A14', borderRadius: '4px', backgroundColor: 'transparent' }}>
                <User className="w-4 h-4" strokeWidth={1.5} /> Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); setAuthOpen(true); }}
              className="w-full py-3 text-xs tracking-[0.22em] uppercase font-light transition-colors flex items-center justify-center gap-2 hover:text-white"
              style={{ border: '1px solid #1F1A14', color: '#1F1A14', borderRadius: '4px', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1F1A14'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1F1A14'; }}>
              <User className="w-4 h-4" strokeWidth={1.5} /> Sign In
            </button>
          )}
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase mb-2 flex items-center gap-1.5" style={{ color: '#6B5F4F' }}><Globe className="w-3 h-3" /> Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-3 text-sm" style={{ border: '1px solid #E8DDC9', backgroundColor: '#FBF8F3', borderRadius: '4px' }}>
              {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   HERO — side-by-side with solid card panel (no transparency)
   ================================================================ */
function Hero() {
  const { navigate } = useApp();
  const slides = [
    { image: IMG + 'Premium-soft-crepe-fabric-with-Tissue-Silk.jpeg', eyebrow: 'New Edit · 2025', title: 'Crafted', accent: 'Elegance', sub: 'A collection composed in silk, breath, and stillness.' },
    { image: IMG + 'Label-Aarfa-Yellow-Pashmina-A-line-Kurta-with-Salwar-and-Shawl-.jpeg', eyebrow: 'Heritage Weaves', title: 'Hand-loomed', accent: 'Stories', sub: 'Each thread carries the memory of the loom that made it.' },
    { image: IMG + 'Ivory-Kurta-Set-with-Blue-Floral-Embroidery-Dupatta.jpeg', eyebrow: 'Festive 2025', title: 'Quietly', accent: 'Regal', sub: 'Pieces meant for moments you want to remember.' },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 6500); return () => clearInterval(t); }, []);

  return (
    <section className="relative" style={{ backgroundColor: '#FBF8F3' }}>
      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-0 items-stretch min-h-[560px] lg:min-h-[680px]">
        {/* Image panel */}
        <div className="lg:col-span-7 relative aspect-[4/5] lg:aspect-auto overflow-hidden order-1 lg:order-2">
          {slides.map((s, i) => (
            <div key={i} className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: i === active ? 1 : 0 }}>
              <img src={s.image} alt={s.title} className="w-full h-full object-cover object-top" loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
          {/* Slide indicators on image */}
          <div className="absolute bottom-6 right-6 flex gap-1.5 px-3 py-2 shadow-md" style={{ backgroundColor: '#FBF8F3', borderRadius: '20px' }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`Slide ${i + 1}`} className="h-1.5 rounded-full transition-all duration-500" style={{ width: i === active ? '24px' : '6px', backgroundColor: i === active ? '#7B1E28' : '#D6C9B0' }} />
            ))}
          </div>
        </div>

        {/* Text panel — pure solid */}
        <div className="lg:col-span-5 flex items-center order-2 lg:order-1 px-6 sm:px-10 lg:px-14 py-14 lg:py-20" style={{ backgroundColor: '#FBF8F3' }}>
          <div key={active} className="max-w-md">
            <div className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase font-light mb-5 animate-slideUp" style={{ color: '#7B1E28' }}>
              {slides[active].eyebrow}
            </div>
            <h1 className="font-serif leading-[0.95] mb-6 text-5xl sm:text-6xl lg:text-7xl animate-slideUp" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14', animationDelay: '120ms', animationFillMode: 'both' }}>
              {slides[active].title}<br />
              <em className="italic font-light" style={{ color: '#7B1E28' }}>{slides[active].accent}</em>
            </h1>
            <p className="text-base font-light max-w-md mb-9 leading-relaxed animate-slideUp" style={{ color: '#6B5F4F', animationDelay: '240ms', animationFillMode: 'both' }}>
              {slides[active].sub}
            </p>
            <div className="flex flex-wrap gap-3 animate-slideUp" style={{ animationDelay: '360ms', animationFillMode: 'both' }}>
              <button onClick={() => navigate('category', 'all')} className="px-8 py-4 text-white text-[11px] tracking-[0.25em] uppercase font-medium transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
                Shop Now
              </button>
              <button onClick={() => navigate('category', 'newarrivals')} className="px-8 py-4 text-[11px] tracking-[0.25em] uppercase font-light transition-all duration-300" style={{ border: '1px solid #1F1A14', color: '#1F1A14', borderRadius: '4px' }}>
                Explore Collection
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   PRODUCT CARD — morphous done right: card sits on warm bg with
   subtle shadow + 12px corners. Image is contained, not cropped.
   ================================================================ */
function ProductCard({ product }) {
  const { navigate, toggleWishlist, wishlist, addToCart } = useApp();
  const [hover, setHover] = useState(false);
  const isWished = wishlist.includes(product.id);
  const hasSale = product.salePrice && product.salePrice < product.price;

  return (
    <div className="group cursor-pointer" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative overflow-hidden transition-shadow duration-500" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: hover ? '0 12px 28px -10px rgba(31, 26, 20, 0.18)' : '0 2px 8px -2px rgba(31, 26, 20, 0.06)',
      }}>
        <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: '#F6F0E5' }}>
          <DiscountBadge priceInr={product.price} salePriceInr={product.salePrice} />
          {product.isNew && !hasSale && (
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 text-white text-[10px] tracking-[0.2em] uppercase font-light" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
              New
            </div>
          )}
          <img
            src={product.images[0]}
            alt={product.name}
            onClick={() => navigate('product', product.id)}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-all duration-[1100ms] group-hover:scale-[1.04]"
            style={{ opacity: hover && product.images[1] ? 0 : 1 }}
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt=""
              loading="lazy"
              onClick={() => navigate('product', product.id)}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-[1100ms]"
              style={{ opacity: hover ? 1 : 0 }}
            />
          )}

          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
            style={{ backgroundColor: '#FBF8F3', borderRadius: '50%' }}
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4" style={{ fill: isWished ? '#7B1E28' : 'none', stroke: isWished ? '#7B1E28' : '#1F1A14' }} strokeWidth={1.5} />
          </button>

          {/* Quick add — desktop only */}
          <div className="absolute bottom-3 inset-x-3 transition-all duration-500 hidden sm:block" style={{ transform: hover ? 'translateY(0)' : 'translateY(calc(100% + 16px))', opacity: hover ? 1 : 0 }}>
            <button onClick={(e) => { e.stopPropagation(); addToCart(product, product.sizes[1] || product.sizes[0], product.colors[0]); }}
              className="w-full py-3 text-white text-[11px] tracking-[0.22em] uppercase font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
              Quick Add
            </button>
          </div>
        </div>

        <div onClick={() => navigate('product', product.id)} className="p-3 sm:p-4 space-y-1">
          <h3 className="text-[13px] sm:text-sm font-light leading-snug line-clamp-2 transition-colors group-hover:text-[#7B1E28]" style={{ color: '#1F1A14' }}>
            {product.name}
          </h3>
          <div className="text-[10px] sm:text-[11px] tracking-[0.14em] uppercase font-light" style={{ color: '#A89888' }}>{product.fabric}</div>
          <Price priceInr={product.price} salePriceInr={product.salePrice} size="sm" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   HOMEPAGE SECTIONS
   ================================================================ */
function CategoryPreview({ title, sub, products, target }) {
  const { navigate } = useApp();
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
      <div className="flex items-end justify-between mb-8 sm:mb-12 gap-4">
        <div>
          <div className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase font-light mb-2 sm:mb-3" style={{ color: '#7B1E28' }}>{sub}</div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>{title}</h2>
        </div>
        <button onClick={() => navigate('category', target)} className="group flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs tracking-[0.22em] uppercase font-light transition-opacity hover:opacity-60 whitespace-nowrap shrink-0" style={{ color: '#1F1A14' }}>
          <span className="hidden sm:inline">View All</span>
          <span className="sm:hidden">All</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function EditorialBanner() {
  const { navigate } = useApp();
  return (
    <section style={{ backgroundColor: '#1F1A14' }}>
      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 min-h-[440px] sm:min-h-[500px] lg:min-h-[560px]">
        <div className="relative h-[320px] sm:h-[400px] lg:h-auto order-1 lg:order-none overflow-hidden">
          <img src={IMG + 'Coffee-Shaded-Embroidered-Cotton-Suit-Set.jpeg'} alt="Editorial" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="flex items-center justify-center px-6 py-12 sm:p-12 lg:p-20 order-2" style={{ color: '#F6F0E5' }}>
          <div className="max-w-md">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mb-4 sm:mb-6" style={{ color: '#B8924A' }} strokeWidth={1.2} />
            <div className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase mb-3 sm:mb-5 font-light" style={{ color: '#B8924A' }}>The Atelier</div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5 sm:mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
              Where every stitch holds <em className="italic" style={{ color: '#B8924A' }}>intention</em>.
            </h2>
            <p className="text-sm sm:text-base font-light leading-relaxed mb-7 sm:mb-9" style={{ color: 'rgba(246, 240, 229, 0.7)' }}>
              Our atelier is a slow space. Fabrics are chosen with care, embroidered by master artisans, and finished by hand — one piece at a time.
            </p>
            <button onClick={() => navigate('about')} className="px-7 sm:px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs tracking-[0.22em] uppercase font-light transition-all duration-300 hover:text-[#1F1A14]" style={{ border: '1px solid #B8924A', color: '#B8924A', backgroundColor: 'transparent', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8924A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              Our Story
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SaleStrip({ products }) {
  const { navigate } = useApp();
  return (
    <section className="py-14 sm:py-20" style={{ backgroundColor: '#F6F0E5' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block px-4 py-1.5 text-white text-[10px] tracking-[0.28em] uppercase mb-5 font-medium shadow-sm" style={{ backgroundColor: '#7B1E28', borderRadius: '20px' }}>Limited Time</div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>
            The <em className="italic" style={{ color: '#7B1E28' }}>Sale</em> Edit
          </h2>
          <p className="font-light text-sm" style={{ color: '#6B5F4F' }}>Selected pieces, gently priced</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-10 sm:mt-12">
          <button onClick={() => navigate('category', 'sale')} className="px-9 sm:px-10 py-3.5 sm:py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
            Shop Sale
          </button>
        </div>
      </div>
    </section>
  );
}

function ValueProps() {
  const items = [
    { icon: Truck, title: 'Free Shipping', sub: 'On orders above ₹2,999' },
    { icon: RotateCcw, title: 'Easy Returns', sub: '7-day return window' },
    { icon: ShieldCheck, title: 'Secure Checkout', sub: 'COD & online payments' },
    { icon: Sparkles, title: 'Made by Hand', sub: 'In our Delhi atelier' },
  ];
  return (
    <section style={{ backgroundColor: '#FBF8F3', borderTop: '1px solid #E8DDC9', borderBottom: '1px solid #E8DDC9' }}>
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-10 py-10 sm:py-14 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F6F0E5', borderRadius: '12px' }}>
              <it.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#7B1E28' }} strokeWidth={1.4} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-medium tracking-wide" style={{ color: '#1F1A14' }}>{it.title}</div>
              <div className="text-[10px] sm:text-xs font-light mt-0.5 truncate" style={{ color: '#6B5F4F' }}>{it.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const { showToast } = useApp();
  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    try {
      await api.newsletter({ email });
      setDone(true); showToast('Welcome to the list');
      setTimeout(() => { setDone(false); setEmail(''); }, 3000);
    } catch (err) {
      showToast(err.message || 'Could not subscribe');
    }
  };
  return (
    <section className="py-14 sm:py-20 lg:py-24" style={{ backgroundColor: '#1F1A14', color: '#F6F0E5' }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-6 text-center">
        <div className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase mb-4 sm:mb-5 font-light" style={{ color: '#B8924A' }}>The List</div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
          Subscribe for <em className="italic" style={{ color: '#B8924A' }}>10% off</em>
        </h2>
        <p className="text-sm sm:text-base font-light mb-7 sm:mb-9 leading-relaxed" style={{ color: 'rgba(246, 240, 229, 0.7)' }}>
          Be the first to know about new arrivals, private edits, and limited releases.
        </p>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address"
            className="flex-1 px-5 py-4 text-sm focus:outline-none"
            style={{ backgroundColor: 'transparent', border: '1px solid rgba(246, 240, 229, 0.3)', color: '#F6F0E5', borderRadius: '4px' }} />
          <button type="submit" className="px-8 py-4 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-colors flex items-center justify-center shadow-sm" style={{ backgroundColor: '#B8924A', color: '#1F1A14', borderRadius: '4px' }}>
            {done ? <Check className="w-4 h-4" /> : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}

function HomePage() {
  const newArrivals = useMemo(() => PRODUCTS.filter((p) => p.isNew), []);
  const coords = useMemo(() => PRODUCTS.filter((p) => p.category === 'coords'), []);
  const stitched = useMemo(() => PRODUCTS.filter((p) => p.category === 'stitched'), []);
  const sale = useMemo(() => PRODUCTS.filter((p) => p.salePrice && p.salePrice < p.price), []);
  return (
    <main>
      <Hero />
      <CategoryPreview title="New Arrivals" sub="Fresh from the atelier" products={newArrivals} target="newarrivals" />
      <EditorialBanner />
      <CategoryPreview title="The Coord Edit" sub="Matching sets" products={coords} target="coords" />
      <SaleStrip products={sale} />
      <CategoryPreview title="Stitched Collection" sub="Ready to wear" products={stitched} target="stitched" />
      <ValueProps />
      <Newsletter />
    </main>
  );
}

/* ================================================================
   CATEGORY PAGE
   ================================================================ */
function CategoryPage({ slug }) {
  const { navigate } = useApp();
  const [sortBy, setSortBy] = useState('featured');
  const [sizeFilter, setSizeFilter] = useState(null);
  const [priceMax, setPriceMax] = useState(5000);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...PRODUCTS];
    if (slug === 'newarrivals') list = list.filter((p) => p.isNew);
    else if (slug === 'sale') list = list.filter((p) => p.salePrice && p.salePrice < p.price);
    else if (slug !== 'all') list = list.filter((p) => p.category === slug);
    if (sizeFilter) list = list.filter((p) => p.sizes.includes(sizeFilter));
    list = list.filter((p) => (p.salePrice || p.price) <= priceMax);
    if (sortBy === 'price-asc') list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    if (sortBy === 'price-desc') list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    if (sortBy === 'newest') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    return list;
  }, [slug, sortBy, sizeFilter, priceMax]);

  const titles = { stitched: 'Stitched Collection', newarrivals: 'New Arrivals', coords: 'Coords', sale: 'The Sale Edit', all: 'All Products' };
  const subs = { stitched: 'Ready to wear, made with care', newarrivals: 'Fresh from the atelier', coords: 'Matching sets, effortlessly composed', sale: 'Selected pieces, gently priced', all: `Every piece in the Label Aarfa collection (${PRODUCTS.length})` };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 lg:py-14">
      <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-light mb-5 sm:mb-6 flex items-center gap-2" style={{ color: '#6B5F4F' }}>
        <button onClick={() => navigate('home')} className="hover:opacity-70 transition-opacity">Home</button>
        <span>/</span>
        <span style={{ color: '#1F1A14' }}>{titles[slug] || 'Shop'}</span>
      </div>

      <div className="mb-8 sm:mb-10 pb-8 sm:pb-10" style={{ borderBottom: '1px solid #E8DDC9' }}>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>{titles[slug] || 'Shop'}</h1>
        <p className="font-light text-sm" style={{ color: '#6B5F4F' }}>{subs[slug] || 'Discover our collection'}</p>
      </div>

      <div className="flex gap-6 lg:gap-10">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-32 p-6 space-y-8" style={{ backgroundColor: '#F6F0E5', borderRadius: '12px' }}>
            <FilterContent sizeFilter={sizeFilter} setSizeFilter={setSizeFilter} priceMax={priceMax} setPriceMax={setPriceMax} />
          </div>
        </aside>

        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(31, 26, 20, 0.55)' }} onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm overflow-y-auto animate-slideInRight" style={{ backgroundColor: '#FBF8F3' }}>
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #E8DDC9' }}>
                <div className="font-serif text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1F1A14' }}>Filters</div>
                <button onClick={() => setShowFilters(false)} className="p-2 -mr-2"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-8">
                <FilterContent sizeFilter={sizeFilter} setSizeFilter={setSizeFilter} priceMax={priceMax} setPriceMax={setPriceMax} />
                <button onClick={() => setShowFilters(false)} className="w-full py-4 text-white text-xs tracking-[0.22em] uppercase shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
                  Show {filtered.length} pieces
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
            <button onClick={() => setShowFilters(true)} className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 text-[11px] tracking-[0.18em] uppercase font-light" style={{ border: '1px solid #E8DDC9', borderRadius: '4px', color: '#1F1A14', backgroundColor: '#FBF8F3' }}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
            </button>
            <div className="text-[11px] sm:text-xs font-light hidden sm:block" style={{ color: '#6B5F4F' }}>{filtered.length} pieces</div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-[11px] sm:text-xs px-4 py-2.5 cursor-pointer font-light tracking-wider focus:outline-none" style={{ border: '1px solid #E8DDC9', borderRadius: '4px', color: '#1F1A14', backgroundColor: '#FBF8F3' }}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-light mb-4 text-sm" style={{ color: '#6B5F4F' }}>No pieces match these filters.</p>
              <button onClick={() => { setSizeFilter(null); setPriceMax(5000); }} className="text-[11px] tracking-[0.22em] uppercase underline" style={{ color: '#7B1E28' }}>Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FilterContent({ sizeFilter, setSizeFilter, priceMax, setPriceMax }) {
  return (
    <>
      <div>
        <div className="text-[11px] tracking-[0.22em] uppercase font-medium mb-4" style={{ color: '#1F1A14' }}>Size</div>
        <div className="flex flex-wrap gap-2">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
            <button key={s} onClick={() => setSizeFilter(sizeFilter === s ? null : s)}
              className="w-10 h-10 text-xs transition-all shadow-sm"
              style={{
                backgroundColor: sizeFilter === s ? '#1F1A14' : '#FBF8F3',
                color: sizeFilter === s ? 'white' : '#1F1A14',
                border: '1px solid ' + (sizeFilter === s ? '#1F1A14' : '#E8DDC9'),
                borderRadius: '8px',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] tracking-[0.22em] uppercase font-medium mb-4" style={{ color: '#1F1A14' }}>Price (Max)</div>
        <input type="range" min="500" max="5000" step="100" value={priceMax} onChange={(e) => setPriceMax(+e.target.value)} className="w-full" style={{ accentColor: '#7B1E28' }} />
        <div className="text-xs mt-2 font-light" style={{ color: '#6B5F4F' }}>Up to ₹{priceMax.toLocaleString('en-IN')}</div>
      </div>
      <button onClick={() => { setSizeFilter(null); setPriceMax(5000); }} className="text-xs underline transition-colors" style={{ color: '#6B5F4F' }}>Clear filters</button>
    </>
  );
}

/* ================================================================
   PRODUCT PAGE
   ================================================================ */
function ProductPage({ id }) {
  const { navigate, addToCart, toggleWishlist, wishlist, setCartOpen } = useApp();
  const product = PRODUCTS.find((p) => p.id === id);
  const [mainImage, setMainImage] = useState(0);
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(product?.colors[0]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [sizeError, setSizeError] = useState(false);

  if (!product) return <div className="py-20 text-center">Product not found.</div>;
  const isWished = wishlist.includes(product.id);
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAdd = () => { if (!size) { setSizeError(true); return; } addToCart(product, size, color, qty); };
  const handleBuyNow = () => { if (!size) { setSizeError(true); return; } addToCart(product, size, color, qty); setTimeout(() => { setCartOpen(false); navigate('checkout'); }, 200); };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8 lg:py-12">
      <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-light mb-5 sm:mb-6" style={{ color: '#6B5F4F' }}>
        <button onClick={() => navigate('home')} className="hover:opacity-70">Home</button>
        <span className="mx-2">/</span>
        <button onClick={() => navigate('category', product.category)} className="hover:opacity-70">{product.category}</button>
        <span className="mx-2">/</span>
        <span style={{ color: '#1F1A14' }}>{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14">
        <div className="space-y-3 sm:space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: '#F6F0E5', borderRadius: '12px' }}>
            <DiscountBadge priceInr={product.price} salePriceInr={product.salePrice} />
            <img src={product.images[mainImage]} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            {product.images.length > 1 && (
              <>
                <button onClick={() => setMainImage((mainImage - 1 + product.images.length) % product.images.length)} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shadow-md transition-colors" style={{ backgroundColor: '#FBF8F3', borderRadius: '50%' }} aria-label="Previous">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setMainImage((mainImage + 1) % product.images.length)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shadow-md transition-colors" style={{ backgroundColor: '#FBF8F3', borderRadius: '50%' }} aria-label="Next">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setMainImage(i)} className="aspect-[4/5] overflow-hidden transition-all" style={{
                  border: mainImage === i ? '2px solid #7B1E28' : '2px solid transparent',
                  opacity: mainImage === i ? 1 : 0.7,
                  borderRadius: '8px',
                }}>
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start space-y-5 sm:space-y-7">
          {product.isNew && <div className="inline-block px-3 py-1.5 text-white text-[10px] tracking-[0.22em] uppercase font-light" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>New Arrival</div>}
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>{product.name}</h1>
            <div className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-light" style={{ color: '#A89888' }}>{product.fabric}</div>
          </div>

          <div className="py-4 sm:py-5" style={{ borderTop: '1px solid #E8DDC9', borderBottom: '1px solid #E8DDC9' }}>
            <Price priceInr={product.price} salePriceInr={product.salePrice} size="xl" showSaved />
            <div className="text-[10px] sm:text-[11px] mt-2 font-light" style={{ color: '#6B5F4F' }}>Inclusive of all taxes</div>
          </div>

          <p className="text-sm leading-relaxed font-light" style={{ color: '#6B5F4F' }}>{product.description}</p>

          <div>
            <div className="text-[11px] tracking-[0.22em] uppercase font-medium mb-3" style={{ color: '#1F1A14' }}>Color</div>
            <div className="flex gap-3">
              {product.colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} className="w-10 h-10 sm:w-11 sm:h-11 transition-all shadow-sm" style={{
                  backgroundColor: c,
                  border: color === c ? '2px solid #1F1A14' : '2px solid #E8DDC9',
                  borderRadius: '50%',
                  transform: color === c ? 'scale(1.1)' : 'scale(1)',
                }} aria-label={`Color ${c}`} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.22em] uppercase font-medium" style={{ color: '#1F1A14' }}>Size</div>
              <button className="text-[11px] underline" style={{ color: '#6B5F4F' }}>Size guide</button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => { setSize(s); setSizeError(false); }} className="py-3 text-xs tracking-wider transition-all" style={{
                  backgroundColor: size === s ? '#1F1A14' : '#FBF8F3',
                  color: size === s ? 'white' : '#1F1A14',
                  border: '1px solid ' + (size === s ? '#1F1A14' : '#E8DDC9'),
                  borderRadius: '8px',
                  boxShadow: size === s ? '0 2px 8px -2px rgba(31,26,20,0.15)' : 'none',
                }}>
                  {s}
                </button>
              ))}
            </div>
            {sizeError && <div className="text-[11px] mt-2" style={{ color: '#7B1E28' }}>Please select a size</div>}
          </div>

          <div>
            <div className="text-[11px] tracking-[0.22em] uppercase font-medium mb-3" style={{ color: '#1F1A14' }}>Quantity</div>
            <div className="inline-flex items-center overflow-hidden" style={{ border: '1px solid #E8DDC9', borderRadius: '8px', backgroundColor: '#FBF8F3' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 sm:w-11 sm:h-11 hover:bg-[#F6F0E5] transition-colors"><Minus className="w-4 h-4 mx-auto" /></button>
              <div className="w-12 text-center font-medium">{qty}</div>
              <button onClick={() => setQty(qty + 1)} className="w-10 h-10 sm:w-11 sm:h-11 hover:bg-[#F6F0E5] transition-colors"><Plus className="w-4 h-4 mx-auto" /></button>
            </div>
          </div>

          <div className="space-y-3 pt-2 sm:pt-4">
            <button onClick={handleAdd} className="w-full py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
              Add to Bag
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleBuyNow} className="py-4 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-colors shadow-sm" style={{ backgroundColor: '#B8924A', color: '#1F1A14', borderRadius: '4px' }}>
                Buy Now
              </button>
              <button onClick={() => toggleWishlist(product.id)} className="py-4 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-light transition-all flex items-center justify-center gap-2" style={{ border: '1px solid #1F1A14', color: '#1F1A14', backgroundColor: 'transparent', borderRadius: '4px' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1F1A14'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1F1A14'; }}>
                <Heart className="w-4 h-4" style={{ fill: isWished ? '#7B1E28' : 'none' }} strokeWidth={1.5} />
                <span className="hidden sm:inline">{isWished ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>
          </div>

          <div className="pt-6 sm:pt-7 space-y-3" style={{ borderTop: '1px solid #E8DDC9' }}>
            <div className="flex items-center gap-3 text-xs font-light" style={{ color: '#6B5F4F' }}><Truck className="w-4 h-4 shrink-0" style={{ color: '#7B1E28' }} strokeWidth={1.2} /> Free shipping on orders above ₹2,999</div>
            <div className="flex items-center gap-3 text-xs font-light" style={{ color: '#6B5F4F' }}><RotateCcw className="w-4 h-4 shrink-0" style={{ color: '#7B1E28' }} strokeWidth={1.2} /> Easy 7-day returns</div>
            <div className="flex items-center gap-3 text-xs font-light" style={{ color: '#6B5F4F' }}><ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#7B1E28' }} strokeWidth={1.2} /> Cash on delivery available</div>
          </div>
        </div>
      </div>

      <div className="mt-16 sm:mt-20 lg:mt-24">
        <div className="flex gap-6 sm:gap-8 mb-6 sm:mb-8 overflow-x-auto" style={{ borderBottom: '1px solid #E8DDC9' }}>
          {['description', 'fabric', 'shipping'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className="pb-3 sm:pb-4 text-[11px] sm:text-xs tracking-[0.22em] uppercase font-light transition-colors whitespace-nowrap" style={{
              color: tab === t ? '#7B1E28' : '#6B5F4F',
              borderBottom: tab === t ? '2px solid #7B1E28' : '2px solid transparent',
            }}>
              {t === 'description' ? 'Description' : t === 'fabric' ? 'Fabric & Care' : 'Shipping & Returns'}
            </button>
          ))}
        </div>
        <div className="max-w-3xl font-light leading-relaxed text-sm sm:text-base" style={{ color: '#6B5F4F' }}>
          {tab === 'description' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <p>Each piece is finished by hand in our Delhi atelier. Slight variations in print, embroidery, and tone are part of the character of handcrafted clothing.</p>
            </div>
          )}
          {tab === 'fabric' && (
            <div className="space-y-3">
              <p><strong className="font-medium" style={{ color: '#1F1A14' }}>Composition:</strong> {product.fabric}</p>
              <p><strong className="font-medium" style={{ color: '#1F1A14' }}>Care:</strong> Dry clean recommended for first wash. Subsequently, hand wash gently in cold water. Iron at low temperature.</p>
              <p><strong className="font-medium" style={{ color: '#1F1A14' }}>Origin:</strong> Crafted in India</p>
            </div>
          )}
          {tab === 'shipping' && (
            <div className="space-y-3">
              <p><strong className="font-medium" style={{ color: '#1F1A14' }}>Shipping:</strong> Dispatched within 2 business days. India: 4–7 days. International: 7–14 days.</p>
              <p><strong className="font-medium" style={{ color: '#1F1A14' }}>Returns:</strong> 7-day return window from delivery. Items must be unworn, unwashed, with tags.</p>
              <p><strong className="font-medium" style={{ color: '#1F1A14' }}>Refunds:</strong> Processed within 5–7 business days after receipt of return.</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16 sm:mt-20 lg:mt-24">
          <h2 className="font-serif text-2xl sm:text-3xl mb-8 sm:mb-10" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>You may also love</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </main>
  );
}

/* ================================================================
   CART DRAWER
   ================================================================ */
function CartDrawer() {
  const { cartOpen, setCartOpen, cart, updateQty, removeFromCart, currency, navigate } = useApp();
  if (!cartOpen) return null;
  const subtotal = cart.reduce((a, b) => a + (b.product.salePrice || b.product.price) * b.quantity, 0);
  const shipping = subtotal >= 2999 || subtotal === 0 ? 0 : 99;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(31, 26, 20, 0.55)' }} onClick={() => setCartOpen(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md flex flex-col animate-slideInRight" style={{ backgroundColor: '#FBF8F3' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #E8DDC9' }}>
          <div className="font-serif text-xl tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1F1A14' }}>Your Bag ({cart.length})</div>
          <button onClick={() => setCartOpen(false)} className="p-2 -mr-2"><X className="w-5 h-5" /></button>
        </div>
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-12 h-12 mb-5" style={{ color: '#D6C9B0' }} strokeWidth={1} />
            <div className="font-serif text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1F1A14' }}>Your bag is empty</div>
            <div className="text-sm font-light mb-6" style={{ color: '#6B5F4F' }}>Pieces you add will appear here.</div>
            <button onClick={() => { setCartOpen(false); navigate('category', 'all'); }} className="px-8 py-3.5 text-white text-xs tracking-[0.22em] uppercase transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {cart.map((item) => (
                <div key={item.key} className="flex gap-3 sm:gap-4 p-3 sm:p-4" style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', boxShadow: '0 1px 4px -1px rgba(31, 26, 20, 0.05)' }}>
                  <div className="w-16 h-20 sm:w-20 sm:h-24 shrink-0 overflow-hidden" style={{ backgroundColor: '#F6F0E5', borderRadius: '6px' }}>
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] sm:text-sm font-light leading-snug mb-1 truncate" style={{ color: '#1F1A14' }}>{item.product.name}</div>
                    <div className="text-[10px] sm:text-[11px] mb-2 tracking-wide" style={{ color: '#6B5F4F' }}>Size {item.size}</div>
                    <Price priceInr={item.product.price} salePriceInr={item.product.salePrice} size="sm" />
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center overflow-hidden" style={{ border: '1px solid #E8DDC9', borderRadius: '6px' }}>
                        <button onClick={() => updateQty(item.key, -1)} className="w-7 h-7 hover:bg-[#F6F0E5]"><Minus className="w-3 h-3 mx-auto" /></button>
                        <div className="w-8 text-center text-xs">{item.quantity}</div>
                        <button onClick={() => updateQty(item.key, 1)} className="w-7 h-7 hover:bg-[#F6F0E5]"><Plus className="w-3 h-3 mx-auto" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.key)} className="text-[11px] underline" style={{ color: '#6B5F4F' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 space-y-3" style={{ borderTop: '1px solid #E8DDC9', backgroundColor: '#F6F0E5' }}>
              <div className="flex justify-between text-sm"><span className="font-light" style={{ color: '#6B5F4F' }}>Subtotal</span><span className="font-medium" style={{ color: '#1F1A14' }}>{formatPrice(subtotal, currency)}</span></div>
              <div className="flex justify-between text-sm"><span className="font-light" style={{ color: '#6B5F4F' }}>Shipping</span><span className="font-medium" style={{ color: '#1F1A14' }}>{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</span></div>
              <div className="flex justify-between pt-3" style={{ borderTop: '1px solid #E8DDC9' }}><span className="font-medium tracking-[0.18em] uppercase text-xs" style={{ color: '#1F1A14' }}>Total</span><span className="font-semibold" style={{ color: '#1F1A14' }}>{formatPrice(subtotal + shipping, currency)}</span></div>
              <button onClick={() => { setCartOpen(false); navigate('checkout'); }} className="w-full py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   SEARCH OVERLAY
   ================================================================ */
function SearchOverlay() {
  const { searchOpen, setSearchOpen, navigate } = useApp();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (searchOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [searchOpen]);
  if (!searchOpen) return null;
  const results = q.trim() ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.fabric.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  return (
    <div className="fixed inset-0 z-50 animate-fadeIn overflow-y-auto" style={{ backgroundColor: '#FBF8F3' }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-10 sm:pt-16 pb-20">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="font-serif text-xl tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1F1A14' }}>Search</div>
          <button onClick={() => { setSearchOpen(false); setQ(''); }} className="p-2 -mr-2"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative pb-3" style={{ borderBottom: '2px solid #1F1A14' }}>
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 -mt-1.5" style={{ color: '#6B5F4F' }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="What are you looking for?" className="w-full pl-9 text-xl sm:text-2xl bg-transparent font-light focus:outline-none" style={{ color: '#1F1A14' }} />
        </div>

        {q.trim() && (
          <div className="mt-8 sm:mt-10">
            {results.length === 0 ? (
              <p className="font-light text-sm" style={{ color: '#6B5F4F' }}>No pieces match "{q}".</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {results.map((p) => (
                  <button key={p.id} onClick={() => { navigate('product', p.id); setSearchOpen(false); setQ(''); }} className="text-left group">
                    <div className="aspect-[4/5] mb-2 overflow-hidden shadow-sm" style={{ backgroundColor: '#F6F0E5', borderRadius: '8px' }}>
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="text-[13px] sm:text-sm font-light leading-snug line-clamp-2" style={{ color: '#1F1A14' }}>{p.name}</div>
                    <Price priceInr={p.price} salePriceInr={p.salePrice} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!q.trim() && (
          <div className="mt-8 sm:mt-10">
            <div className="text-[11px] tracking-[0.22em] uppercase font-light mb-4" style={{ color: '#6B5F4F' }}>Popular</div>
            <div className="flex flex-wrap gap-2">
              {['Kurta', 'Coords', 'Cotton', 'Silk', 'Embroidered', 'Lavender'].map((t) => (
                <button key={t} onClick={() => setQ(t)} className="px-5 py-2.5 text-xs transition-all" style={{ border: '1px solid #E8DDC9', borderRadius: '20px', color: '#1F1A14', backgroundColor: '#FFFFFF' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1F1A14'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#1F1A14'; }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   AUTH MODAL — EMAIL + PHONE OTP
   ================================================================ */
function AuthModal() {
  const { authOpen, setAuthOpen, showToast } = useApp();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');   // single string — supports 6–10 digit codes
  const [timer, setTimer] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (step === 2 && timer === 0) setTimer(60); }, [step]);
  useEffect(() => { if (timer > 0) { const t = setTimeout(() => setTimer(timer - 1), 1000); return () => clearTimeout(t); } }, [timer]);

  if (!authOpen) return null;
  const isValid = method === 'phone' ? phone.length === 10 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const credentials = () => method === 'phone'
    ? { phone: `+91${phone}` }
    : { email };

  const sendOtp = async () => {
    if (!isValid || busy) return;
    if (!supabase) { showToast('Auth not configured (set Supabase env vars)'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ ...credentials(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) { showToast(error.message); return; }
    setStep(2);
    showToast(`OTP sent to your ${method === 'phone' ? 'phone' : 'email'}`);
  };

  const verify = async () => {
    const token = otp.trim();
    if (token.length < 6 || busy) return;
    if (!supabase) { showToast('Auth not configured'); return; }
    setBusy(true);
    let result;
    if (method === 'phone') {
      result = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token, type: 'sms' });
    } else {
      result = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (result.error) result = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    }
    setBusy(false);
    if (result.error) { showToast(result.error.message || 'Invalid OTP'); return; }
    showToast('Signed in successfully');
    reset();
  };

  const resend = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ ...credentials(), options: { shouldCreateUser: true } });
    if (error) { showToast(error.message); return; }
    setTimer(60); showToast('OTP resent');
  };

  const reset = () => { setStep(1); setPhone(''); setEmail(''); setOtp(''); setTimer(0); setAuthOpen(false); setMethod('email'); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(31, 26, 20, 0.65)' }} onClick={reset} />
      <div className="relative w-full max-w-md p-7 sm:p-9 animate-scaleIn max-h-[calc(100svh-2rem)] overflow-y-auto shadow-2xl" style={{ backgroundColor: '#FBF8F3', borderRadius: '16px' }}>
        <button onClick={reset} className="absolute top-3 right-3 p-2"><X className="w-5 h-5" /></button>

        <div className="text-center mb-6 sm:mb-7">
          <div className="font-serif text-lg tracking-[0.18em] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1F1A14' }}>LABEL AARFA</div>
          <div className="text-[9px] tracking-[0.4em] uppercase font-light" style={{ color: '#7B1E28' }}>Couture</div>
        </div>

        {step === 1 ? (
          <>
            <h2 className="font-serif text-2xl mb-2 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Welcome</h2>
            <p className="text-[13px] sm:text-sm font-light text-center mb-6" style={{ color: '#6B5F4F' }}>Sign in or create an account</p>

            {/* Method toggle */}
            <div className="flex p-1 mb-5" style={{ backgroundColor: '#F6F0E5', borderRadius: '10px' }}>
              <button onClick={() => setMethod('phone')}
                className="flex-1 py-2.5 text-[11px] tracking-[0.18em] uppercase font-light transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: method === 'phone' ? '#1F1A14' : 'transparent',
                  color: method === 'phone' ? 'white' : '#6B5F4F',
                  borderRadius: '8px',
                  boxShadow: method === 'phone' ? '0 2px 8px -2px rgba(31, 26, 20, 0.15)' : 'none',
                }}>
                <Phone className="w-3.5 h-3.5" strokeWidth={1.5} /> Phone
              </button>
              <button onClick={() => setMethod('email')}
                className="flex-1 py-2.5 text-[11px] tracking-[0.18em] uppercase font-light transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: method === 'email' ? '#1F1A14' : 'transparent',
                  color: method === 'email' ? 'white' : '#6B5F4F',
                  borderRadius: '8px',
                  boxShadow: method === 'email' ? '0 2px 8px -2px rgba(31, 26, 20, 0.15)' : 'none',
                }}>
                <Mail className="w-3.5 h-3.5" strokeWidth={1.5} /> Email
              </button>
            </div>

            {method === 'phone' ? (
              <>
                <label className="block text-[11px] tracking-[0.22em] uppercase font-medium mb-2" style={{ color: '#1F1A14' }}>Mobile Number</label>
                <div className="flex">
                  <div className="px-4 py-3 text-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRight: 'none', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', color: '#1F1A14' }}>+91</div>
                  <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number"
                    className="flex-1 min-w-0 px-4 py-3 text-sm focus:outline-none"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', color: '#1F1A14' }} />
                </div>
              </>
            ) : (
              <>
                <label className="block text-[11px] tracking-[0.22em] uppercase font-medium mb-2" style={{ color: '#1F1A14' }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRadius: '8px', color: '#1F1A14' }} />
              </>
            )}

            <button onClick={sendOtp} disabled={!isValid || busy} className="w-full mt-6 py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
              {busy ? 'Sending…' : 'Send OTP'}
            </button>

            <div className="text-[10px] sm:text-[11px] text-center mt-5 font-light" style={{ color: '#6B5F4F' }}>
              By continuing, you agree to our Terms & Privacy Policy
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif text-2xl mb-2 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Verify</h2>
            <p className="text-[13px] sm:text-sm font-light text-center mb-6" style={{ color: '#6B5F4F' }}>
              OTP sent to {method === 'phone' ? `+91 ${phone}` : email}
            </p>

            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={(e) => { if (e.key === 'Enter' && otp.length >= 6 && !busy) verify(); }}
              placeholder="000000"
              className="w-full px-4 py-4 mb-6 text-center text-2xl sm:text-3xl font-medium focus:outline-none shadow-sm"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRadius: '10px', color: '#1F1A14', letterSpacing: '0.3em', fontVariantNumeric: 'tabular-nums' }}
            />

            <button onClick={verify} disabled={otp.length < 6 || busy} className="w-full py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
              {busy ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <div className="text-center mt-5 text-[11px] sm:text-xs font-light">
              {timer > 0 ? (
                <span style={{ color: '#6B5F4F' }}>Resend in {timer}s</span>
              ) : (
                <button onClick={resend} className="underline" style={{ color: '#7B1E28' }}>Resend OTP</button>
              )}
            </div>
            <button onClick={() => setStep(1)} className="block mx-auto mt-3 text-[11px] sm:text-xs" style={{ color: '#6B5F4F' }}>
              ← Change {method === 'phone' ? 'number' : 'email'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   WISHLIST PAGE
   ================================================================ */
function WishlistPage() {
  const { wishlist, navigate } = useApp();
  const items = PRODUCTS.filter((p) => wishlist.includes(p.id));
  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-16">
      <div className="text-center mb-10 sm:mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Wishlist</h1>
        <p className="font-light text-sm" style={{ color: '#6B5F4F' }}>Pieces you've saved</p>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <Heart className="w-12 h-12 mx-auto mb-5" style={{ color: '#D6C9B0' }} strokeWidth={1} />
          <p className="font-light mb-6 text-sm" style={{ color: '#6B5F4F' }}>Your wishlist is empty.</p>
          <button onClick={() => navigate('category', 'all')} className="px-8 py-3.5 text-white text-xs tracking-[0.22em] uppercase transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>Discover the Collection</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </main>
  );
}

/* ================================================================
   CHECKOUT
   ================================================================ */
function Input({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.18em] uppercase font-medium mb-1.5" style={{ color: '#1F1A14' }}>{label}{required && ' *'}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-4 py-3 text-sm focus:outline-none transition-colors"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRadius: '8px', color: '#1F1A14' }} />
    </div>
  );
}

function Row({ label, value, bold = false }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? 'font-medium text-xs tracking-[0.18em] uppercase' : 'font-light'} style={{ color: bold ? '#1F1A14' : '#6B5F4F' }}>{label}</span>
      <span className={bold ? 'font-semibold' : 'font-medium'} style={{ color: '#1F1A14' }}>{value}</span>
    </div>
  );
}

function CheckoutPage() {
  const { cart, currency, navigate, setCart, showToast, user } = useApp();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({ name: '', phone: '', pincode: '', line1: '', city: '', state: '', email: '' });
  const [payment, setPayment] = useState('cod');
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const subtotal = cart.reduce((a, b) => a + (b.product.salePrice || b.product.price) * b.quantity, 0);
  const shipping = subtotal >= 2999 ? 0 : 99;
  const total = subtotal + shipping;

  const goToPayment = (e) => { e.preventDefault(); setStep(2); };

  const buildItems = () => cart.map((c) => ({
    productId: c.product.id, size: c.size, color: c.color, quantity: c.quantity,
  }));

  const finishOrder = (id) => {
    setOrderId(id.slice(0, 8).toUpperCase());
    setCart([]); setStep(3);
    showToast('Order placed successfully');
  };

  const placeOrder = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const shippingAddress = { ...address, email: address.email || user?.email };
      const payload = {
        items: buildItems(),
        shippingAddress,
        userId: user?.id || null,
        guestEmail: user ? null : shippingAddress.email,
        paymentMethod: payment === 'cod' ? 'cod' : 'razorpay',
      };

      const result = await api.createOrder(payload);

      if (result.paymentMethod === 'cod') {
        finishOrder(result.order.id);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) { showToast('Could not load payment gateway'); return; }

      const rzp = new window.Razorpay({
        key: result.keyId,
        amount: result.amount,
        currency: result.currency,
        order_id: result.razorpayOrderId,
        name: 'Label Aarfa',
        description: `Order ${result.orderId.slice(0, 8)}`,
        prefill: { name: address.name, email: shippingAddress.email || '', contact: address.phone },
        theme: { color: '#7B1E28' },
        handler: async (rsp) => {
          try {
            await api.verifyOrder({
              razorpay_order_id: rsp.razorpay_order_id,
              razorpay_payment_id: rsp.razorpay_payment_id,
              razorpay_signature: rsp.razorpay_signature,
            });
            finishOrder(result.orderId);
          } catch (e) {
            showToast(e.message || 'Verification failed');
          } finally {
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.on('payment.failed', (resp) => {
        showToast(resp.error?.description || 'Payment failed');
        setProcessing(false);
      });
      rzp.open();
    } catch (e) {
      showToast(e.message || 'Could not place order');
      setProcessing(false);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="py-20 text-center">
        <p className="font-light mb-5" style={{ color: '#6B5F4F' }}>Your bag is empty.</p>
        <button onClick={() => navigate('category', 'all')} className="px-8 py-3.5 text-white text-xs tracking-[0.22em] uppercase shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>Continue Shopping</button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-6 sm:mb-7 animate-scaleIn" style={{ backgroundColor: '#E8F5EC', borderRadius: '50%' }}>
          <Check className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#2F6B3E' }} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl mb-2 sm:mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Thank you</h1>
        <p className="font-light mb-2 text-sm" style={{ color: '#6B5F4F' }}>Your order has been placed</p>
        <p className="text-[11px] sm:text-xs tracking-[0.18em] uppercase mb-8 sm:mb-10" style={{ color: '#1F1A14' }}>Order ID: <strong>{orderId}</strong></p>

        <div className="p-6 sm:p-8 text-left mb-7 sm:mb-8 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRadius: '12px' }}>
          <div className="text-[11px] tracking-[0.22em] uppercase font-medium mb-4" style={{ color: '#1F1A14' }}>What's next</div>
          <div className="space-y-3 text-[13px] sm:text-sm font-light" style={{ color: '#6B5F4F' }}>
            <div className="flex gap-3"><span style={{ color: '#7B1E28' }}>●</span> Confirmation sent to your registered contact</div>
            <div className="flex gap-3"><span style={{ color: '#7B1E28' }}>●</span> Your order will be dispatched within 2 business days</div>
            <div className="flex gap-3"><span style={{ color: '#7B1E28' }}>●</span> Track your order from your account</div>
          </div>
        </div>

        <button onClick={() => navigate('home')} className="px-9 py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>Continue Shopping</button>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-14">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Checkout</h1>
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-light">
          <span style={{ color: step >= 1 ? '#7B1E28' : '#6B5F4F' }}>Address</span>
          <span style={{ color: '#D6C9B0' }}>—</span>
          <span style={{ color: step >= 2 ? '#7B1E28' : '#6B5F4F' }}>Payment</span>
          <span style={{ color: '#D6C9B0' }}>—</span>
          <span style={{ color: step >= 3 ? '#7B1E28' : '#6B5F4F' }}>Confirm</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <form onSubmit={goToPayment} className="p-5 sm:p-6 lg:p-8 space-y-5 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRadius: '12px' }}>
              <h2 className="font-serif text-xl sm:text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" required value={address.name} onChange={(v) => setAddress({...address, name: v})} />
                <Input label="Phone" type="tel" required value={address.phone} onChange={(v) => setAddress({...address, phone: v})} />
              </div>
              <Input label="Email" type="email" required={!user} placeholder={user?.email || 'you@example.com'} value={address.email} onChange={(v) => setAddress({...address, email: v})} />
              <Input label="Address Line" required value={address.line1} onChange={(v) => setAddress({...address, line1: v})} />
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="City" required value={address.city} onChange={(v) => setAddress({...address, city: v})} />
                <Input label="State" required value={address.state} onChange={(v) => setAddress({...address, state: v})} />
                <Input label="Pincode" required value={address.pincode} onChange={(v) => setAddress({...address, pincode: v})} />
              </div>
              <button type="submit" className="w-full py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>Continue to Payment</button>
            </form>
          )}

          {step === 2 && (
            <div className="p-5 sm:p-6 lg:p-8 space-y-5 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRadius: '12px' }}>
              <h2 className="font-serif text-xl sm:text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
                  { id: 'upi', label: 'UPI', sub: 'Pay via any UPI app' },
                  { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
                  { id: 'wallet', label: 'Wallets', sub: 'Paytm, PhonePe, GPay' },
                ].map((m) => (
                  <label key={m.id} className="block p-4 sm:p-5 cursor-pointer transition-all" style={{
                    border: payment === m.id ? '2px solid #7B1E28' : '2px solid #E8DDC9',
                    backgroundColor: payment === m.id ? '#FBF8F3' : '#FFFFFF',
                    borderRadius: '10px',
                  }}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="pay" checked={payment === m.id} onChange={() => setPayment(m.id)} style={{ accentColor: '#7B1E28' }} />
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#1F1A14' }}>{m.label}</div>
                        <div className="text-xs font-light" style={{ color: '#6B5F4F' }}>{m.sub}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {payment !== 'cod' && (
                <div className="p-4 sm:p-5 flex gap-3 items-start" style={{ backgroundColor: '#F6F0E5', border: '1px solid #E8DDC9', borderRadius: '10px' }}>
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#7B1E28' }} strokeWidth={1.5} />
                  <div className="text-[12px] sm:text-[13px] font-light leading-relaxed" style={{ color: '#6B5F4F' }}>
                    You will complete your payment securely on <strong style={{ color: '#1F1A14' }}>Razorpay</strong>. UPI, cards, wallets, and netbanking are all available there.
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-light transition-colors" style={{ border: '1px solid #1F1A14', color: '#1F1A14', backgroundColor: 'transparent', borderRadius: '4px' }}>Back</button>
                <button onClick={placeOrder} disabled={processing} className="flex-1 py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-90 disabled:opacity-50 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>
                  {processing ? 'Processing…' : `Pay ${formatPrice(total, currency)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="p-5 sm:p-6 h-fit lg:sticky lg:top-32 shadow-sm" style={{ backgroundColor: '#F6F0E5', border: '1px solid #E8DDC9', borderRadius: '12px' }}>
          <h3 className="font-serif text-lg sm:text-xl mb-4 sm:mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Order Summary</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.key} className="flex gap-3 p-2" style={{ backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
                <div className="w-12 h-14 sm:w-14 sm:h-16 shrink-0 overflow-hidden" style={{ backgroundColor: '#FBF8F3', borderRadius: '4px' }}>
                  <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] sm:text-xs font-light leading-snug truncate" style={{ color: '#1F1A14' }}>{item.product.name}</div>
                  <div className="text-[10px] sm:text-[11px] my-0.5" style={{ color: '#6B5F4F' }}>Size {item.size} · Qty {item.quantity}</div>
                  <div className="text-[11px] sm:text-xs font-medium" style={{ color: '#1F1A14' }}>{formatPrice((item.product.salePrice || item.product.price) * item.quantity, currency)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 space-y-2" style={{ borderTop: '1px solid #E8DDC9' }}>
            <Row label="Subtotal" value={formatPrice(subtotal, currency)} />
            <Row label="Shipping" value={shipping === 0 ? 'Free' : formatPrice(shipping, currency)} />
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E8DDC9' }}>
            <Row label="Total" value={formatPrice(total, currency)} bold />
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ================================================================
   ABOUT & CONTACT
   ================================================================ */
function AboutPage() {
  return (
    <main>
      <div className="relative h-[50vh] sm:h-[60vh] min-h-[340px] sm:min-h-[400px] overflow-hidden" style={{ backgroundColor: '#1F1A14' }}>
        <img src={IMG + 'Premium-orignal-long-pakistani-Cordset.jpeg'} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(31,26,20,0.35) 0%, rgba(31,26,20,0.6) 100%)' }} />
        <div className="absolute inset-0 flex items-center justify-center text-center px-5">
          <div className="max-w-2xl" style={{ color: '#F6F0E5' }}>
            <div className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase mb-3 sm:mb-4 font-light" style={{ color: '#B8924A' }}>Our Story</div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
              A house of <em className="italic" style={{ color: '#B8924A' }}>slow couture</em>
            </h1>
          </div>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-14 sm:py-20 text-center">
        <p className="font-serif text-xl sm:text-2xl lg:text-3xl leading-relaxed font-light italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1F1A14' }}>
          "We believe clothing should arrive thoughtfully — chosen, not collected. Every piece in our atelier is made for the woman who knows the difference."
        </p>
        <div className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase font-light mt-5 sm:mt-6" style={{ color: '#6B5F4F' }}>— Aarfa, Founder · Est. 2019</div>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-6 pb-10 sm:pb-14 text-left space-y-5 font-light leading-relaxed text-base sm:text-lg" style={{ color: '#6B5F4F' }}>
        <p>Label Aarfa was founded in <strong style={{ color: '#1F1A14', fontWeight: 500 }}>2019</strong> in New Delhi, born from a quiet conviction: that ethnic wear could feel personal again — that a kurta, a coord set, a stitched suit could be made the way it used to be, slowly and by hand, while still belonging to a modern wardrobe.</p>
        <p>Aarfa, our founder, started the house with a small team of pattern-makers and embroiderers working out of a single room in West Patel Nagar. Six years on, the atelier has grown — but the philosophy has not. Every garment is still cut, stitched, and finished by hand. Fabrics are sourced from handloom clusters in Jaipur and weaving cooperatives in Lucknow. Embroidery is done in small batches, not in factories.</p>
        <p>We make ethnic wear for women who want to wear something that was actually made for them — not pressed out of a mould of a thousand identical pieces. Our coord sets, kurtas, palazzos, and Pakistani-inspired cordsets are designed to be worn often, kept for years, and remembered fondly when they are.</p>
      </section>

      <section className="py-14 sm:py-20" style={{ backgroundColor: '#F6F0E5' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6 grid sm:grid-cols-3 gap-10 sm:gap-12 text-center">
          {[
            { title: 'Heritage', body: 'Working with master artisans across Jaipur, Delhi, and Lucknow — keeping handloom and embroidery traditions alive since 2019.' },
            { title: 'Craft', body: 'Every garment is finished by hand. Slight irregularities are signatures of the maker, not flaws.' },
            { title: 'Care', body: 'Small batches. Considered fabrics. Designed to be worn often and kept for years.' },
          ].map((v) => (
            <article key={v.title}>
              <h2 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>{v.title}</h2>
              <p className="font-light leading-relaxed text-sm" style={{ color: '#6B5F4F' }}>{v.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ContactPage() {
  const { showToast } = useApp();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api.contact(form);
      showToast("Message sent — we'll be in touch");
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      showToast(err.message || 'Could not send message');
    } finally { setBusy(false); }
  };

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 lg:py-20">
      <div className="text-center mb-10 sm:mb-14">
        <div className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase mb-3 sm:mb-4 font-light" style={{ color: '#7B1E28' }}>Get in Touch</div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: '#1F1A14' }}>Contact</h1>
        <p className="font-light text-sm" style={{ color: '#6B5F4F' }}>We'd love to hear from you</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <form onSubmit={submit} className="space-y-5">
          <Input label="Your Name" value={form.name} onChange={(v) => setForm({...form, name: v})} required />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({...form, email: v})} required />
          <div>
            <label className="block text-[11px] tracking-[0.18em] uppercase font-medium mb-1.5" style={{ color: '#1F1A14' }}>Message *</label>
            <textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} rows="6" required
              className="w-full px-4 py-3 text-sm focus:outline-none transition-colors resize-none"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDC9', borderRadius: '8px', color: '#1F1A14' }} />
          </div>
          <button type="submit" disabled={busy} className="px-9 py-4 text-white text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-90 disabled:opacity-60 shadow-sm" style={{ backgroundColor: '#1F1A14', borderRadius: '4px' }}>{busy ? 'Sending…' : 'Send Message'}</button>
        </form>

        <div className="space-y-6 sm:space-y-7 lg:pl-8" style={{ borderLeft: 'none' }}>
          <div className="lg:pl-0 space-y-6 sm:space-y-7">
            <ContactItem icon={MapPin} title="Atelier" body={<>Label Aarfa<br />28/132 West Patel Nagar<br />New Delhi 110008, India</>} />
            <ContactItem icon={Phone} title="Phone" body="+91 98xxx xxx00" />
            <ContactItem icon={Mail} title="Email" body="care@labelaarfa.com" />
            <ContactItem icon={null} title="Hours" body={<>Monday – Saturday<br />11:00 AM – 8:00 PM IST</>} />
          </div>
          <div className="flex gap-3 pt-2">
            {[Hash, Globe2, Video].map((Icon, i) => (
              <a key={i} href="#" className="w-11 h-11 flex items-center justify-center transition-colors" style={{ border: '1px solid #E8DDC9', borderRadius: '50%', color: '#1F1A14', backgroundColor: '#FFFFFF' }}>
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ContactItem({ icon: Icon, title, body }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.22em] uppercase font-medium mb-3 flex items-center gap-2" style={{ color: '#1F1A14' }}>
        {Icon && <Icon className="w-4 h-4" style={{ color: '#7B1E28' }} strokeWidth={1.5} />} {title}
      </div>
      <p className="text-sm font-light leading-relaxed" style={{ color: '#6B5F4F' }}>{body}</p>
    </div>
  );
}

/* ================================================================
   FOOTER
   ================================================================ */
function FooterCol({ title, links }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.28em] uppercase mb-4 sm:mb-5 font-light" style={{ color: '#B8924A' }}>{title}</div>
      <ul className="space-y-2.5 sm:space-y-3">
        {links.map((l, i) => (
          <li key={i}><button onClick={l.onClick} className="text-sm font-light transition-colors text-left hover:text-white" style={{ color: 'rgba(246, 240, 229, 0.7)' }}>{l.label}</button></li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  const { navigate } = useApp();
  return (
    <footer className="mt-16 sm:mt-20" style={{ backgroundColor: '#1F1A14', color: '#F6F0E5' }}>
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          <div>
            <div className="font-serif text-xl sm:text-2xl tracking-[0.18em] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>LABEL AARFA</div>
            <div className="text-[10px] tracking-[0.4em] uppercase font-light mb-5" style={{ color: '#B8924A' }}>Fashion Redefined · Est. 2019</div>
            <p className="text-sm font-light leading-relaxed mb-6" style={{ color: 'rgba(246, 240, 229, 0.65)' }}>Handcrafted ethnic wear from our Delhi atelier since 2019. Made slowly, made with care.</p>
            <div className="flex gap-3">
              {[Hash, Globe2, Video].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 flex items-center justify-center transition-colors" style={{ border: '1px solid rgba(246, 240, 229, 0.2)', borderRadius: '50%' }}>
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Shop" links={[
            { label: 'New Arrivals', onClick: () => navigate('category', 'newarrivals') },
            { label: 'Stitched Collection', onClick: () => navigate('category', 'stitched') },
            { label: 'Coords', onClick: () => navigate('category', 'coords') },
            { label: 'All Products', onClick: () => navigate('category', 'all') },
            { label: 'Sale', onClick: () => navigate('category', 'sale') },
          ]} />
          <FooterCol title="Customer Care" links={[
            { label: 'Contact Us', onClick: () => navigate('contact') },
            { label: 'Shipping Policy', onClick: () => {} },
            { label: 'Returns & Refunds', onClick: () => {} },
            { label: 'Size Guide', onClick: () => {} },
            { label: 'Track Order', onClick: () => {} },
          ]} />
          <FooterCol title="About" links={[
            { label: 'Our Story', onClick: () => navigate('about') },
            { label: 'Atelier', onClick: () => navigate('about') },
            { label: 'Sustainability', onClick: () => {} },
            { label: 'Privacy Policy', onClick: () => {} },
            { label: 'Terms of Service', onClick: () => {} },
          ]} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(246, 240, 229, 0.1)' }}>
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-10 py-5 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] tracking-wider" style={{ color: 'rgba(246, 240, 229, 0.5)' }}>
          <div>© 2019–{new Date().getFullYear()} Label Aarfa. All rights reserved.</div>
          <div className="flex gap-2 sm:gap-3 items-center">
            {['VISA', 'MC', 'UPI', 'COD'].map((p) => (
              <div key={p} className="px-2.5 py-1 font-medium text-[9px] sm:text-[10px] tracking-wider" style={{ border: '1px solid rgba(246, 240, 229, 0.15)', borderRadius: '4px' }}>{p}</div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ================================================================
   TOAST
   ================================================================ */
function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3.5 text-white text-[11px] sm:text-xs tracking-[0.2em] uppercase font-light shadow-xl animate-slideUp max-w-[calc(100vw-2rem)] text-center" style={{ backgroundColor: '#1F1A14', borderRadius: '6px' }}>
      {toast}
    </div>
  );
}

/* ================================================================
   ROUTER + APP
   ================================================================ */
function Router() {
  const { page } = useApp();
  switch (page.name) {
    case 'home': return <HomePage />;
    case 'category': return <CategoryPage slug={page.data || 'all'} />;
    case 'product': return <ProductPage id={page.data} />;
    case 'wishlist': return <WishlistPage />;
    case 'checkout': return <CheckoutPage />;
    case 'about': return <AboutPage />;
    case 'contact': return <ContactPage />;
    default: return <HomePage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

        body { font-family: 'Inter', system-ui, sans-serif; color: #1F1A14; -webkit-font-smoothing: antialiased; background-color: #FBF8F3; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }

        .animate-fadeIn { animation: fadeIn 500ms ease-out both; }
        .animate-slideUp { animation: slideUp 700ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-slideInRight { animation: slideInRight 380ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-slideInLeft { animation: slideInLeft 380ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-scaleIn { animation: scaleIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both; }

        html { scroll-behavior: smooth; }
        ::selection { background: #7B1E28; color: #F6F0E5; }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        input, select, textarea, button { font-family: inherit; }
        input:focus, textarea:focus { border-color: #1F1A14 !important; }
      `}</style>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FBF8F3' }}>
        <Header />
        <MobileMenu />
        <div className="flex-1">
          <Router />
        </div>
        <Footer />
        <CartDrawer />
        <SearchOverlay />
        <AuthModal />
        <Toast />
      </div>
    </AppProvider>
  );
}
