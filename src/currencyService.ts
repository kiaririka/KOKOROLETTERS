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
    standardMonthly: 26,
    bundleYearly: 286,
    standardFormatted: "$26",
    bundleFormatted: "$286"
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "EUR (€)",
    standardMonthly: 24,
    bundleYearly: 264,
    standardFormatted: "€24",
    bundleFormatted: "€264"
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "GBP (£)",
    standardMonthly: 21,
    bundleYearly: 231,
    standardFormatted: "£21",
    bundleFormatted: "£231"
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    label: "CAD (CA$)",
    standardMonthly: 36,
    bundleYearly: 396,
    standardFormatted: "CA$36",
    bundleFormatted: "CA$396"
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    label: "AUD (A$)",
    standardMonthly: 40,
    bundleYearly: 440,
    standardFormatted: "A$40",
    bundleFormatted: "A$440"
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    label: "JPY (¥)",
    standardMonthly: 3900,
    bundleYearly: 42900,
    standardFormatted: "¥3,900",
    bundleFormatted: "¥42,900"
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    label: "SGD (S$)",
    standardMonthly: 35,
    bundleYearly: 385,
    standardFormatted: "S$35",
    bundleFormatted: "S$385"
  },
  INR: {
    code: "INR",
    symbol: "₹",
    label: "INR (₹)",
    standardMonthly: 2200,
    bundleYearly: 24200,
    standardFormatted: "₹2,200",
    bundleFormatted: "₹24,200"
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
    return tier === "Bundle" ? "₹10,000 / year" : "₹999 / month";
  }
  const curr = INTERNATIONAL_CURRENCIES[currency] || INTERNATIONAL_CURRENCIES.USD;
  return tier === "Bundle" ? `${curr.bundleFormatted} / year` : `${curr.standardFormatted} / month`;
}
