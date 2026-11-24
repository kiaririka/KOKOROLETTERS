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
    description: "Receive a small-batch postal kit every month celebrating one of Japan's 12 scenic regions that inspired Studio Ghibli. Textured art print, spirit stickers, collectible region map stamp, and wax-sealed creator letter.",
    perks: [
      "🖼️ Textured scenic art print (inspired by Ghibli landscapes)",
      "✨ Custom collectible spirit sticker",
      "🏷️ Collectible region stamp for your map",
      "📜 Wax-sealed creator lore letter",
      "🎁 Month 1 Bonus: Foldout map of Japan"
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
    description: "Reserve the full 12-month expedition across Japan. Includes all 12 monthly dispatches, priority batch packaging, and a planned collector's keepsake box.",
    perks: [
      "📦 All 12 monthly dispatches included",
      "🌲 Collector's wooden keepsake storage box",
      "💮 Complete 12-stamp collection",
      "💌 Personalized dedication note in Month 1",
      "✨ Priority dispatch worldwide"
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
    description: "Single collector envelope concept featuring rural Sayama Hills just outside Tokyo. Includes a country hills art print, forest spirit sticker, tea plantation map stamp, and the story of Miyazaki's conservation trust.",
    perks: [
      "Country road & tea fields art print",
      "Sleeping forest spirit collectible sticker",
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
    description: "Single collector kit concept exploring Yakushima's ancient mossy cedar biospheres. Includes a mist valley art print, Kodama spirit sticker, Jomon Sugi tree stamp, and creator field journal.",
    perks: [
      "Deep forest valley textured art print",
      "Matte Kodama spirit collectible sticker",
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
    description: "Single collector kit concept celebrating the peaceful Edo-period fishing village on the Seto Inland Sea. Includes a cliffside ocean art print, goldfish spirit sticker, and stone lighthouse stamp.",
    perks: [
      "Lighthouse & quiet harbor art print",
      "Magical goldfish spirit collectible sticker",
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
    tagline: "Traditional concertina-folded pilgrimage stamp book",
    description: "An accordion-folded keepsake stamp book bound in deep botanical linen tones, designed to hold all 12 regional stamps and notes from your Kokoro journey.",
    perks: [
      "Accordion-folded heavy pages for stamps",
      "Indigo-toned fabric cover",
      "Protective corner accents",
      "Designed to hold all 12 region stamps"
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
    tagline: "Vintage-illustrated cartography on heavy textured paper",
    description: "A display wall map detailing the 12 cultural regions of Japan, historic postal highways (Tokaido and Nakasendo), mountain ranges, and shrine gates. Ready to frame or receive your monthly region stickers.",
    perks: [
      "Large foldout / wall display format",
      "Warm cream textured fine-art paper",
      "Packaged flat or rolled to prevent creases",
      "Included free in Month 1 subscriptions"
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
