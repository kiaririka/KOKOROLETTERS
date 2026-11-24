/**
 * Kokoro Letters Store Catalog
 * Physical snail-mail club subscriptions, individual past collector kits,
 * and handcrafted Japanese stationery & keepsakes.
 */

import { SupportedCurrency, INTERNATIONAL_CURRENCIES } from "../currencyService.ts";

export type ProductCategory = "all" | "subscription" | "kits" | "stationery";

export interface StoreProduct {
  id: string;
  name: string;
  category: "subscription" | "kits" | "stationery";
  priceINR: number; // Base domestic price in INR
  priceUSD: number; // Base international price in USD
  isSubscription: boolean;
  billingInterval?: "monthly" | "yearly" | "one-time";
  badge?: string;
  tagline: string;
  description: string;
  perks: string[];
  image: string;
  inStock: boolean;
}

export const STORE_PRODUCTS: StoreProduct[] = [
  // 1. Core Monthly Subscription
  {
    id: "sub-monthly",
    name: "The Monthly Passage",
    category: "subscription",
    priceINR: 999,
    priceUSD: 26,
    isSubscription: true,
    billingInterval: "monthly",
    badge: "Most Cherished",
    tagline: "Monthly slow-living snail mail dispatch",
    description: "Receive a handmade postal kit every month celebrating one of Japan's 12 scenic regions that inspired Studio Ghibli. Hand-printed art, character vinyl stickers, collectible region map stamp, and hand-sealed creator letter.",
    perks: [
      "🖼️ Hand-printed Ghibli scene art (300gsm cotton rag)",
      "✨ Custom character vinyl sticker",
      "🏷️ Collectible region stamp for your map",
      "📜 Hand-sealed creator letter with genuine wax",
      "🎁 Month 1 Bonus: Large A3 foldout map of Japan"
    ],
    image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  // 2. Annual 12-Moon Bundle
  {
    id: "sub-annual",
    name: "12-Moon Annual Expedition",
    category: "subscription",
    priceINR: 10000,
    priceUSD: 286,
    isSubscription: true,
    billingInterval: "yearly",
    badge: "Best Value • 2 Months Free",
    tagline: "The complete 12-region journey across Japan",
    description: "Prepay the entire 12-month expedition across Japan. Guaranteed fulfillment of all 12 dispatches, prioritized manual packaging, and an exclusive collector's wooden keepsake box.",
    perks: [
      "📦 All 12 monthly dispatches guaranteed",
      "🌲 Hand-carved Paulownia wooden storage box (Kiri-bako)",
      "💮 Complete 12-stamp Goshuincho collection",
      "💌 Personalized calligraphy dedication in month 1",
      "✨ Free priority tracked shipping worldwide"
    ],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  // 3. Past Dispatch: Sayama Hills (Totoro Forest)
  {
    id: "kit-sayama",
    name: "Sayama Hills Collector's Kit",
    category: "kits",
    priceINR: 1199,
    priceUSD: 30,
    isSubscription: false,
    billingInterval: "one-time",
    badge: "Archive Edition",
    tagline: "Inspired by My Neighbor Totoro (1988)",
    description: "Single collector envelope featuring rural Sayama Hills just outside Tokyo. Includes the iconic country hills art print, sleeping forest spirit sticker, tea plantation map stamp, and the story of Miyazaki's conservation trust.",
    perks: [
      "Country road & tea fields art print",
      "Giant forest spirit sleeping vinyl sticker",
      "Sayama green tea botanical stamp",
      "Personal lore letter on rural Japanese farming"
    ],
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  // 4. Past Dispatch: Yakushima (Princess Mononoke)
  {
    id: "kit-yakushima",
    name: "Yakushima Ancient Cedar Kit",
    category: "kits",
    priceINR: 1199,
    priceUSD: 30,
    isSubscription: false,
    billingInterval: "one-time",
    badge: "Archive Edition",
    tagline: "Inspired by Princess Mononoke (1997)",
    description: "Single collector kit exploring Yakushima's prehistoric mossy cedar biospheres. Includes the mist valley art print, glowing Kodama spirit sticker, Jomon Sugi tree stamp, and creator field journal.",
    perks: [
      "Deep forest valley art print on textured washi",
      "Transparent matte Kodama vinyl sticker",
      "Yakushima ancient cedar collectible stamp",
      "Handwritten reflection on nature & spirits"
    ],
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  // 5. Past Dispatch: Tomonoura (Ponyo Port)
  {
    id: "kit-tomonoura",
    name: "Tomonoura Port Collector Kit",
    category: "kits",
    priceINR: 1199,
    priceUSD: 30,
    isSubscription: false,
    billingInterval: "one-time",
    badge: "Archive Edition",
    tagline: "Inspired by Ponyo on the Cliff by the Sea (2008)",
    description: "Single collector kit celebrating the peaceful Edo-period fishing village on the Seto Inland Sea. Includes the cliffside ocean art print, swimming goldfish spirit sticker, and stone lighthouse stamp.",
    perks: [
      "Lighthouse & quiet harbor art print",
      "Magical red goldfish vinyl sticker",
      "Seto Inland Sea postal stamp",
      "Essay on coastal life and slow ocean living"
    ],
    image: "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  // 6. Artisan Keepsake: Goshuincho Stamp Book
  {
    id: "stat-goshuincho",
    name: "Hand-Bound Goshuincho Stamp Album",
    category: "stationery",
    priceINR: 1499,
    priceUSD: 38,
    isSubscription: false,
    billingInterval: "one-time",
    badge: "Handcrafted Artisan",
    tagline: "Traditional concertina-folded washi pilgrimage book",
    description: "Handmade in Kyoto using Echizen washi accordion paper and bound in indigo-dyed botanical linen. Designed to hold all 12 regional stamps and letters from your Kokoro journey.",
    perks: [
      "48 pages of double-layered absorbent washi",
      "Natural indigo-dyed cotton cover",
      "Embossed brass corner protectors",
      "Includes protective paulownia wooden sleeve"
    ],
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  // 7. Artisan Keepsake: Brass Seal & Wax Kit
  {
    id: "stat-wax-kit",
    name: "Kokoro Heart Brass Wax Seal Kit",
    category: "stationery",
    priceINR: 1299,
    priceUSD: 32,
    isSubscription: false,
    billingInterval: "one-time",
    badge: "Tactile Lettering",
    tagline: "Solid brass die engraved with the '心' kanji emblem",
    description: "Seal your own personal letters with the authentic warmth of wax. Includes a turned walnut handle, solid brass stamp head engraved with 心 (Heart/Soul), melting spoon, and 3 sticks of pine-resin sealing wax.",
    perks: [
      "Precision-milled 25mm solid brass seal head",
      "Ergonomic turned walnut hardwood handle",
      "Brass pouring spoon with rosewood grip",
      "3 sticks of supple, non-brittle vermilion wax"
    ],
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
    inStock: true
  },
  // 8. Artisan Keepsake: Large Cartography Map of Japan
  {
    id: "stat-japan-map",
    name: "12-Region Postal Map of Japan (A3)",
    category: "stationery",
    priceINR: 799,
    priceUSD: 22,
    isSubscription: false,
    billingInterval: "one-time",
    badge: "Wall Display",
    tagline: "Vintage-illustrated cartography on 260gsm cotton rag",
    description: "An archival wall map detailing the 12 cultural regions of Japan, ancient postal highways (Tokaido and Nakasendo), mountain ranges, and shrine gates. Ready to frame or receive your monthly region stickers.",
    perks: [
      "A3 format (297 x 420 mm / 11.7 x 16.5 inches)",
      "260gsm cream textured cotton rag washi",
      "Dispatched rolled in a sturdy protective postal tube",
      "Hand-numbered limited artist edition"
    ],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    inStock: true
  }
];

/**
 * Returns formatted product price based on destination and selected currency.
 */
export function formatProductPrice(
  product: StoreProduct,
  destination: "India" | "International",
  currency: SupportedCurrency = "USD"
): string {
  if (destination === "India") {
    const base = `₹${product.priceINR.toLocaleString("en-IN")}`;
    if (product.billingInterval === "monthly") return `${base} / mo`;
    if (product.billingInterval === "yearly") return `${base} / yr`;
    return base;
  }

  const currInfo = INTERNATIONAL_CURRENCIES[currency] || INTERNATIONAL_CURRENCIES.USD;
  // Conversion ratio from USD base
  const ratio = (currInfo.standardMonthly || 26) / 26;
  const converted = Math.round(product.priceUSD * ratio);
  const formatted = `${currInfo.symbol}${converted.toLocaleString()}`;

  if (product.billingInterval === "monthly") return `${formatted} / mo`;
  if (product.billingInterval === "yearly") return `${formatted} / yr`;
  return formatted;
}
