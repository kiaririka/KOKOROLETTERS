import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, RefreshCw, ArrowRight, Package, Sparkles } from "lucide-react";
import { SupportedCurrency, getPlanPriceString, getTrackedUpgradePriceString } from "../currencyService.ts";
import { CartItem } from "./CartDrawer.tsx";
import { formatProductPrice } from "../data/storeProducts.ts";

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestination: "India" | "International";
  defaultTier: "Standard" | "Bundle";
  selectedCurrency: SupportedCurrency;
  cartItems?: CartItem[];
  onSubmit: (data: {
    recipientName: string;
    email: string;
    shipping_address: string;
    plan_tier: "Standard" | "Bundle";
    destination: "India" | "International";
    shippingMethod: string;
    gateway: "waitlist";
    optInNewsletter: boolean;
    acceptTerms: boolean;
    items?: Array<{
      productId: string;
      name: string;
      quantity: number;
      priceFormatted: string;
      isSubscription?: boolean;
    }>;
    totalFormatted?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  existingEmail?: string;
  existingAddress?: string;
  onOpenTerms: () => void;
}

export default function CheckoutDrawer({
  isOpen,
  onClose,
  defaultDestination,
  defaultTier,
  selectedCurrency,
  cartItems = [],
  onSubmit,
  isSubmitting,
  existingEmail = "",
  existingAddress = "",
  onOpenTerms,
}: CheckoutDrawerProps) {
  const [destination, setDestination] = useState<"India" | "International">(defaultDestination);
  const [tier, setTier] = useState<"Standard" | "Bundle">(defaultTier);
  const [intlTracked, setIntlTracked] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [email, setEmail] = useState(existingEmail);
  const [cityCountry, setCityCountry] = useState(existingAddress);
  const [optInNewsletter, setOptInNewsletter] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDestination(defaultDestination);
      setTier(defaultTier);
      setIntlTracked(false);
      if (existingEmail) setEmail(existingEmail);
      if (existingAddress) setCityCountry(existingAddress);
      setFormError("");
    }
  }, [isOpen, defaultDestination, defaultTier, existingEmail, existingAddress]);

  if (!isOpen) return null;

  const hasCart = cartItems.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid email address so we can notify you when Batch 01 opens.");
      return;
    }
    if (!acceptTerms) {
      setFormError("Please accept the Terms & Conditions to join the waitlist.");
      return;
    }

    const compiledItems = hasCart
      ? cartItems.map((ci) => ({
          productId: ci.product.id,
          name: ci.product.name,
          quantity: ci.quantity,
          priceFormatted: formatProductPrice(ci.product, destination, selectedCurrency),
          isSubscription: ci.product.isSubscription,
        }))
      : [
          {
            productId: tier === "Bundle" ? "sub-annual" : "sub-monthly",
            name: tier === "Bundle" ? "12-Moon Annual Expedition Bundle" : "The Monthly Passage",
            quantity: 1,
            priceFormatted: getPlanPriceString(destination, tier, selectedCurrency),
            isSubscription: true,
          },
        ];

    const trackedUpgradeStr = getTrackedUpgradePriceString(selectedCurrency);
    const shippingMethod =
      destination === "India"
        ? "India Speed Post (Tracked • Included)"
        : intlTracked
        ? `Tracked Airmail (${trackedUpgradeStr})`
        : "Standard Airmail (Untracked • Included)";

    onSubmit({
      recipientName: recipientName.trim() || email.split("@")[0],
      email: email.trim(),
      shipping_address: cityCountry.trim(),
      plan_tier: tier,
      destination,
      shippingMethod,
      gateway: "waitlist",
      optInNewsletter,
      acceptTerms,
      items: compiledItems,
      totalFormatted: hasCart ? `${cartItems.length} saved items` : getPlanPriceString(destination, tier, selectedCurrency),
    });
  };

  const standardPrice = getPlanPriceString(destination, "Standard", selectedCurrency);
  const bundlePrice = getPlanPriceString(destination, "Bundle", selectedCurrency);
  const trackedUpgradePrice = getTrackedUpgradePriceString(selectedCurrency);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="relative w-full max-w-lg bg-[#faf6eb] h-full shadow-2xl border-l-2 border-[#eedba5] flex flex-col z-10 overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#eedba5] flex items-center justify-between bg-white/80 backdrop-blur-xs sticky top-0 z-20">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#547365] bg-[#e3ece8] px-2.5 py-0.5 rounded-full">
                🌿 Founding Batch 01 Waitlist
              </span>
              <h3 className="font-serif font-bold text-xl text-[#1b2e24] mt-1">
                {hasCart ? "Reserve Your Satchel Picks" : "Reserve Your Founding Spot"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 text-left">
            {/* Zero-charge Pre-launch Notice */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-serif font-bold block">No payment needed today</span>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  We’re finalizing our paper stock and print process. Reserving a spot holds your place in line and helps us plan Batch 01 quantities.
                </p>
              </div>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-3.5 py-2.5 text-xs">
                {formError}
              </div>
            )}

            {/* If Cart Items are present: Show Cart Summary */}
            {hasCart ? (
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24] block">
                  Items You’re Interested In ({cartItems.length})
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cartItems.map((ci, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-[#eedba5] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Package className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                        <span className="font-serif font-bold text-[#1b2e24] truncate">
                          {ci.product.name}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">x{ci.quantity}</span>
                      </div>
                      <span className="font-serif font-bold text-xs text-[#1b2e24]">
                        {formatProductPrice(ci.product, destination, selectedCurrency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Step 2: Tier Selector (Monthly vs 12-Month Bundle) */
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24]">
                  1. Preferred Passage (Est. Launch Pricing)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTier("Standard")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      tier === "Standard"
                        ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                        : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-[#547365] block">Monthly</span>
                    <span className="font-serif font-bold text-sm text-[#1b2e24] block">Monthly Passage</span>
                    <span className="font-serif font-bold text-xs text-emerald-800">{standardPrice}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTier("Bundle")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      tier === "Bundle"
                        ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                        : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-emerald-700 font-bold block">12 Moons</span>
                    <span className="font-serif font-bold text-sm text-[#1b2e24] block">Annual Bundle</span>
                    <span className="font-serif font-bold text-xs text-amber-900">{bundlePrice}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Destination Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24]">
                2. Your Shipping Region
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDestination("India")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    destination === "India"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#547365] block">Domestic</span>
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">India Delivery</span>
                  <span className="font-serif font-bold text-xs text-emerald-800">Speed Post Included</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDestination("International")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    destination === "International"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#547365] block">Worldwide</span>
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">International</span>
                  <span className="font-serif font-bold text-xs text-amber-900">Standard or Tracked</span>
                </button>
              </div>

              {destination === "International" && (
                <div className="pt-2 space-y-2">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24] block">
                    2b. International Postal Preference
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIntlTracked(false)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        !intlTracked
                          ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                          : "bg-white/40 border-stone-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-[#547365] block">Included</span>
                      <span className="font-serif font-bold text-xs text-[#1b2e24] block">Standard Airmail</span>
                      <span className="text-[10px] text-[#547365] block mt-0.5">Untracked flat letter (~2–4 wks)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntlTracked(true)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        intlTracked
                          ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                          : "bg-white/40 border-stone-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-amber-900 block">{trackedUpgradePrice}</span>
                      <span className="font-serif font-bold text-xs text-[#1b2e24] block">Tracked Airmail (ITPS)</span>
                      <span className="text-[10px] text-[#547365] block mt-0.5">End-to-end online tracking</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Traveler Details */}
            <div className="space-y-3">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24] block">
                3. Where Should We Send Your Batch 01 Invite?
              </label>

              <div>
                <label className="text-[11px] font-semibold text-[#547365] block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chihiro Ogino"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#547365] block mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. chihiro@meadow.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#547365] block mb-1">
                  City & Country (Optional — helps us plan postage)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, India or London, UK"
                  value={cityCountry}
                  onChange={(e) => setCityCountry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                />
              </div>
            </div>

            {/* Checkboxes: Newsletter & Terms */}
            <div className="space-y-2 pt-2 border-t border-[#eedba5]/60 text-xs text-[#547365]">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optInNewsletter}
                  onChange={(e) => setOptInNewsletter(e.target.checked)}
                  className="rounded border-[#9cbfae] text-emerald-800 focus:ring-emerald-700 mt-0.5"
                />
                <span>Send me behind-the-scenes paper & print updates + free region whispers.</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded border-[#9cbfae] text-emerald-800 focus:ring-emerald-700 mt-0.5"
                />
                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="underline text-emerald-800 font-semibold hover:text-emerald-950"
                  >
                    Terms & Conditions
                  </button>
                  .
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#1b2e24] hover:bg-stone-800 disabled:opacity-50 text-white font-serif font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Reserving Your Spot...</span>
                  </>
                ) : (
                  <>
                    <span>Join Founding Waitlist (Free)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-[#547365] font-mono text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>No charge today • Priority Batch 01 invite • Unsubscribe anytime</span>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
