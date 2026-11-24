/**
 * Currency detection and pricing configuration for Kokoro Letters.
 * Provides localized currency presentation for international travelers.
 */

export type SupportedCurrency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR";

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  standardMonthly: number;
  bundleYearly: number;
  standardFormatted: string;
  bundleFormatted: string;
}

export const INTERNATIONAL_CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  USD: {
    code: "USD",
    symbol: "$",
    label: "USD ($)",
    standardMonthly: 12,
    bundleYearly: 120,
    standardFormatted: "$12",
    bundleFormatted: "$120"
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "EUR (€)",
    standardMonthly: 11,
    bundleYearly: 110,
    standardFormatted: "€11",
    bundleFormatted: "€110"
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "GBP (£)",
    standardMonthly: 10,
    bundleYearly: 100,
    standardFormatted: "£10",
    bundleFormatted: "£100"
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    label: "CAD (CA$)",
    standardMonthly: 17,
    bundleYearly: 170,
    standardFormatted: "CA$17",
    bundleFormatted: "CA$170"
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    label: "AUD (A$)",
    standardMonthly: 19,
    bundleYearly: 190,
    standardFormatted: "A$19",
    bundleFormatted: "A$190"
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    label: "JPY (¥)",
    standardMonthly: 1800,
    bundleYearly: 18000,
    standardFormatted: "¥1,800",
    bundleFormatted: "¥18,000"
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    label: "SGD (S$)",
    standardMonthly: 16,
    bundleYearly: 160,
    standardFormatted: "S$16",
    bundleFormatted: "S$160"
  },
  INR: {
    code: "INR",
    symbol: "₹",
    label: "INR (₹)",
    standardMonthly: 899,
    bundleYearly: 8990,
    standardFormatted: "₹899",
    bundleFormatted: "₹8,990"
  }
};

/**
 * Detects visitor's local currency based on browser time zone and language settings.
 */
export function detectLocalCurrency(): SupportedCurrency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = (navigator.language || "").toLowerCase();

    if (tz.includes("Kolkata") || tz.includes("Calcutta") || lang.includes("en-in")) {
      return "INR";
    }
    if (tz.includes("London") || lang.includes("en-gb")) {
      return "GBP";
    }
    if (tz.includes("Tokyo") || lang.includes("ja")) {
      return "JPY";
    }
    if (
      tz.includes("Toronto") || 
      tz.includes("Vancouver") || 
      tz.includes("Montreal") || 
      tz.includes("Edmonton") || 
      lang.includes("en-ca") || 
      lang.includes("fr-ca")
    ) {
      return "CAD";
    }
    if (
      tz.includes("Sydney") || 
      tz.includes("Melbourne") || 
      tz.includes("Brisbane") || 
      tz.includes("Perth") || 
      tz.includes("Adelaide") || 
      lang.includes("en-au")
    ) {
      return "AUD";
    }
    if (tz.includes("Singapore") || lang.includes("en-sg")) {
      return "SGD";
    }
    if (
      tz.startsWith("Europe/") || 
      ["de", "fr", "es", "it", "nl", "pt", "el", "fi", "at", "be", "ie", "lu"].some(l => lang.startsWith(l))
    ) {
      return "EUR";
    }
    if (tz.startsWith("America/") || lang.includes("en-us")) {
      return "USD";
    }
  } catch (err) {
    console.warn("Currency detection notice:", err);
  }
  return "USD";
}

/**
 * Returns formatted total price string for the given destination, tier, and selected currency.
 */
export function getPlanPriceString(
  destination: "India" | "International",
  tier: "Standard" | "Bundle",
  currency: SupportedCurrency = "USD"
): string {
  if (destination === "India") {
    return tier === "Bundle" ? "₹8,990 / year" : "₹899 / month";
  }
  const intlCurrency = currency === "INR" ? "USD" : currency;
  const curr = INTERNATIONAL_CURRENCIES[intlCurrency] || INTERNATIONAL_CURRENCIES.USD;
  return tier === "Bundle" ? `${curr.bundleFormatted} / year` : `${curr.standardFormatted} / month`;
}

/**
 * Returns formatted optional tracked airmail add-on price per international dispatch (+$6 USD base).
 */
export function getTrackedUpgradePriceString(currency: SupportedCurrency = "USD"): string {
  const intlCurrency = currency === "INR" ? "USD" : currency;
  const curr = INTERNATIONAL_CURRENCIES[intlCurrency] || INTERNATIONAL_CURRENCIES.USD;
  const ratio = (curr.standardMonthly || 12) / 12;
  const trackedFee = Math.round(6 * ratio);
  return `+${curr.symbol}${trackedFee.toLocaleString()} / dispatch`;
}
