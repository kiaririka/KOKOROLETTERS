import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CreditCard, ShieldCheck, RefreshCw, ArrowRight, Package, Sparkles } from "lucide-react";
import { SupportedCurrency, getPlanPriceString, getTrackedUpgradePriceString } from "../currencyService.ts";
import { CartItem } from "./CartDrawer.tsx";
import { formatProductPrice } from "../data/storeProducts.ts";

export type CheckoutSelection = "first-month" | "year-bundle" | "waitlist";

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestination: "India" | "International";
  defaultSelection?: CheckoutSelection;
  selectedCurrency: SupportedCurrency;
  cartItems?: CartItem[];
  onSubmit: (data: {
    mode: "purchase" | "waitlist";
    recipientName: string;
    email: string;
    shipping_address: string;
    plan_tier: "Standard" | "Bundle";
    destination: "India" | "International";
    shippingMethod: string;
    gateway: "razorpay" | "paypal" | "waitlist";
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
  defaultSelection = "first-month",
  selectedCurrency,
  cartItems = [],
  onSubmit,
  isSubmitting,
  existingEmail = "",
  existingAddress = "",
  onOpenTerms,
}: CheckoutDrawerProps) {
  const [destination, setDestination] = useState<"India" | "International">(defaultDestination);
  const [selection, setSelection] = useState<CheckoutSelection>(defaultSelection);
  const [waitlistPlanPref, setWaitlistPlanPref] = useState<"Standard" | "Bundle">("Standard");
  const [intlTracked, setIntlTracked] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [email, setEmail] = useState(existingEmail);
  const [addressOrCity, setAddressOrCity] = useState(existingAddress);
  const [gateway, setGateway] = useState<"razorpay" | "paypal">(defaultDestination === "India" ? "razorpay" : "paypal");
  const [optInNewsletter, setOptInNewsletter] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDestination(defaultDestination);
      setSelection(defaultSelection);
      setGateway(defaultDestination === "India" ? "razorpay" : "paypal");
      setIntlTracked(false);
      if (existingEmail) setEmail(existingEmail);
      if (existingAddress) setAddressOrCity(existingAddress);
      setFormError("");
    }
  }, [isOpen, defaultDestination, defaultSelection, existingEmail, existingAddress]);

  if (!isOpen) return null;

  const hasCart = cartItems.length > 0;
  const isWaitlist = selection === "waitlist";
  const effectiveTier: "Standard" | "Bundle" =
    selection === "year-bundle" ? "Bundle" : selection === "first-month" ? "Standard" : waitlistPlanPref;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!isWaitlist && addressOrCity.trim().length < 5) {
      setFormError("Please enter your complete physical shipping address to place an order.");
      return;
    }
    if (!acceptTerms) {
      setFormError("Please accept the Terms & Conditions to continue.");
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
            productId: effectiveTier === "Bundle" ? "sub-annual" : "sub-monthly",
            name:
              effectiveTier === "Bundle"
                ? "12-Moon Whole Year Bundle"
                : "First Month Passage (incl. Month 1 Map)",
            quantity: 1,
            priceFormatted: getPlanPriceString(destination, effectiveTier, selectedCurrency),
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
      mode: isWaitlist ? "waitlist" : "purchase",
      recipientName: recipientName.trim() || email.split("@")[0],
      email: email.trim(),
      shipping_address: addressOrCity.trim(),
      plan_tier: effectiveTier,
      destination,
      shippingMethod,
      gateway: isWaitlist ? "waitlist" : gateway,
      optInNewsletter,
      acceptTerms,
      items: compiledItems,
      totalFormatted: hasCart
        ? `${cartItems.length} treasures`
        : getPlanPriceString(destination, effectiveTier, selectedCurrency),
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
                {isWaitlist ? "🌿 Free Waitlist" : "🌿 Kokoro Postal Passage"}
              </span>
              <h3 className="font-serif font-bold text-xl text-[#1b2e24] mt-1">
                {isWaitlist
                  ? "Join the Waitlist (No Charge)"
                  : hasCart
                  ? "Seal & Dispatch Your Satchel"
                  : selection === "year-bundle"
                  ? "Purchase Whole Year Bundle"
                  : "Purchase First Month"}
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
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-3.5 py-2.5 text-xs">
                {formError}
              </div>
            )}

            {/* Path Selector: First Month / Whole Year Bundle / Just Waitlist */}
            {hasCart ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24]">
                    Items in Satchel ({cartItems.length})
                  </span>
                  <div className="inline-flex p-0.5 bg-white border border-[#eedba5] rounded-xl text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelection("first-month")}
                      className={`px-2.5 py-1 rounded-lg font-serif cursor-pointer ${
                        !isWaitlist ? "bg-[#1b2e24] text-white font-bold" : "text-[#547365]"
                      }`}
                    >
                      Purchase Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelection("waitlist")}
                      className={`px-2.5 py-1 rounded-lg font-serif cursor-pointer ${
                        isWaitlist ? "bg-[#1b2e24] text-white font-bold" : "text-[#547365]"
                      }`}
                    >
                      Waitlist Only
                    </button>
                  </div>
                </div>
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
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24]">
                  1. Choose Your Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelection("first-month")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selection === "first-month"
                        ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                        : "bg-white/40 border-stone-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-[#547365] block">Month 1</span>
                      <span className="font-serif font-bold text-sm text-[#1b2e24] block">First Month</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-serif font-bold text-xs text-emerald-800 block">{standardPrice}</span>
                      <span className="text-[10px] text-[#547365] block">Incl. free map</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelection("year-bundle")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selection === "year-bundle"
                        ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                        : "bg-white/40 border-stone-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold block">12 Moons</span>
                      <span className="font-serif font-bold text-sm text-[#1b2e24] block">Year Bundle</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-serif font-bold text-xs text-amber-900 block">{bundlePrice}</span>
                      <span className="text-[10px] text-[#547365] block">2 months free</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelection("waitlist")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selection === "waitlist"
                        ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                        : "bg-white/40 border-stone-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-[#547365] block">No Charge</span>
                      <span className="font-serif font-bold text-sm text-[#1b2e24] block">Join Waitlist</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-serif font-bold text-xs text-[#1b2e24] block">Free</span>
                      <span className="text-[10px] text-[#547365] block">Notify me later</span>
                    </div>
                  </button>
                </div>

                {isWaitlist && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-950 flex items-start gap-2 mt-2">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <span className="block">
                        <strong>Waitlist Mode:</strong> No payment today. Optionally tell us which plan interests you most:
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setWaitlistPlanPref("Standard")}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-serif cursor-pointer ${
                            waitlistPlanPref === "Standard"
                              ? "bg-[#1b2e24] text-white border-[#1b2e24]"
                              : "bg-white text-[#1b2e24] border-emerald-200"
                          }`}
                        >
                          First Month ({standardPrice})
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaitlistPlanPref("Bundle")}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-serif cursor-pointer ${
                            waitlistPlanPref === "Bundle"
                              ? "bg-[#1b2e24] text-white border-[#1b2e24]"
                              : "bg-white text-[#1b2e24] border-emerald-200"
                          }`}
                        >
                          Year Bundle ({bundlePrice})
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                  onClick={() => {
                    setDestination("India");
                    setGateway("razorpay");
                  }}
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
                  onClick={() => {
                    setDestination("International");
                    setGateway("paypal");
                  }}
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
                {isWaitlist ? "3. Where Should We Reach You?" : "3. Recipient & Postal Delivery Address"}
              </label>

              <div>
                <label className="text-[11px] font-semibold text-[#547365] block mb-1">
                  {isWaitlist ? "Your Name" : <>Recipient Name <span className="text-rose-600">*</span></>}
                </label>
                <input
                  type="text"
                  required={!isWaitlist}
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
                  {isWaitlist ? (
                    "City & Country (Optional — helps us plan postage)"
                  ) : (
                    <>Physical Shipping Address <span className="text-rose-600">*</span></>
                  )}
                </label>
                {isWaitlist ? (
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India or London, UK"
                    value={addressOrCity}
                    onChange={(e) => setAddressOrCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                  />
                ) : (
                  <textarea
                    required
                    rows={3}
                    placeholder="Street address, building, apartment, city, state, postal code..."
                    value={addressOrCity}
                    onChange={(e) => setAddressOrCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Payment Method (Shown only for Purchase paths) */}
            {!isWaitlist && (
              <div className="space-y-2 pt-2 border-t border-[#eedba5]">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24] block">
                  4. Payment Method
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway("razorpay")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      gateway === "razorpay"
                        ? "bg-[#1b2e24] text-white border-[#1b2e24]"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Razorpay (UPI / Cards)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateway("paypal")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      gateway === "paypal"
                        ? "bg-[#1b2e24] text-white border-[#1b2e24]"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>PayPal (Global)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Checkboxes: Newsletter & Terms */}
            <div className="space-y-2 pt-2 border-t border-[#eedba5]/60 text-xs text-[#547365]">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optInNewsletter}
                  onChange={(e) => setOptInNewsletter(e.target.checked)}
                  className="rounded border-[#9cbfae] text-emerald-800 focus:ring-emerald-700 mt-0.5"
                />
                <span>Send me monthly region whispers and behind-the-scenes updates.</span>
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
                    Terms &amp; Conditions
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
                    <span>{isWaitlist ? "Saving Waitlist Spot..." : "Sealing Dispatch..."}</span>
                  </>
                ) : isWaitlist ? (
                  <>
                    <span>Join Free Waitlist</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>
                      {hasCart
                        ? `Confirm Order (${gateway === "razorpay" ? "Razorpay" : "PayPal"})`
                        : selection === "year-bundle"
                        ? `Confirm Year Bundle (${bundlePrice})`
                        : `Confirm First Month (${standardPrice})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-[#547365] font-mono text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>
                  {isWaitlist
                    ? "No charge today • Priority invite • Unsubscribe anytime"
                    : "Cancel anytime • Hand-packaged with care • Month 1 map free in Batch 01"}
                </span>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
