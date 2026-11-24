import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CreditCard, ShieldCheck, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { SupportedCurrency, getPlanPriceString } from "../currencyService.ts";

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestination: "India" | "International";
  defaultTier: "Standard" | "Bundle";
  selectedCurrency: SupportedCurrency;
  onSubmit: (data: {
    email: string;
    shipping_address: string;
    plan_tier: "Standard" | "Bundle";
    destination: "India" | "International";
    gateway: "razorpay" | "paypal";
    optInNewsletter: boolean;
    acceptTerms: boolean;
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
  onSubmit,
  isSubmitting,
  existingEmail = "",
  existingAddress = "",
  onOpenTerms,
}: CheckoutDrawerProps) {
  const [destination, setDestination] = useState<"India" | "International">(defaultDestination);
  const [tier, setTier] = useState<"Standard" | "Bundle">(defaultTier);
  const [email, setEmail] = useState(existingEmail);
  const [address, setAddress] = useState(existingAddress);
  const [gateway, setGateway] = useState<"razorpay" | "paypal">(defaultDestination === "India" ? "razorpay" : "paypal");
  const [optInNewsletter, setOptInNewsletter] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !address) {
      alert("Please enter your email and complete physical delivery address.");
      return;
    }
    if (!acceptTerms) {
      alert("Please accept the Terms & Conditions to complete your passage.");
      return;
    }
    onSubmit({
      email,
      shipping_address: address,
      plan_tier: tier,
      destination,
      gateway,
      optInNewsletter,
      acceptTerms,
    });
  };

  const standardPrice = getPlanPriceString("Standard", destination, selectedCurrency);
  const bundlePrice = getPlanPriceString("Bundle", destination, selectedCurrency);

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
                🌿 Kokoro Letters Passage
              </span>
              <h3 className="font-serif font-bold text-xl text-[#1b2e24] mt-1">
                Begin Your Snail Mail Passage
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 text-left">
            {/* Step 1: Destination Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24]">
                1. Shipping Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDestination("India");
                    setGateway("razorpay");
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    destination === "India"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#547365] block">Domestic</span>
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">India Delivery</span>
                  <span className="font-serif font-bold text-xs text-emerald-800">Speed-Post Free</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDestination("International");
                    setGateway("paypal");
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    destination === "International"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#547365] block">Worldwide</span>
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">International Airmail</span>
                  <span className="font-serif font-bold text-xs text-amber-900">Tracked from Tokyo</span>
                </button>
              </div>
            </div>

            {/* Step 2: Tier Selector (Monthly vs 12-Month Bundle) */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24]">
                2. Membership Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTier("Standard")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    tier === "Standard"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#547365] block">Monthly</span>
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">Standard</span>
                  <span className="font-serif font-bold text-xs text-emerald-800">{standardPrice}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTier("Bundle")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    tier === "Bundle"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-mono text-emerald-700 font-bold block">12 Moons (Best Value)</span>
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">Annual Bundle</span>
                  <span className="font-serif font-bold text-xs text-amber-900">{bundlePrice}</span>
                </button>
              </div>
            </div>

            {/* Perks mini summary */}
            <div className="bg-white/80 p-3.5 rounded-2xl border border-[#eedba5] text-xs text-[#1b2e24] space-y-1.5 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Hand-printed Ghibli scene art + collectible vinyl sticker</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Handmade creator lore letter sealed with authentic wax</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Month 1 Gift: Large foldout cartography map of Japan</span>
              </div>
            </div>

            {/* Step 3: Traveler Credentials */}
            <div className="space-y-4">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24] block">
                3. Traveler Details & Physical Delivery
              </label>

              <div>
                <label className="text-[11px] font-semibold text-[#547365] block mb-1">
                  Email Address (Your Digital Key) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. chihiro@spirited.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#547365] block mb-1">
                  Physical Shipping Address <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Street address, building, apartment, city, state, postal code..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                />
                <span className="text-[10px] text-[#547365] mt-1 block">
                  Your monthly physical mailers are dispatched directly to this address.
                </span>
              </div>
            </div>

            {/* Step 4: Gateway Selection */}
            <div className="space-y-2 pt-2 border-t border-[#eedba5]">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b2e24] block">
                4. Payment Method
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGateway("razorpay")}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
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
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    gateway === "paypal"
                      ? "bg-[#1b2e24] text-white border-[#1b2e24]"
                      : "bg-white text-stone-700 border-stone-200"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>PayPal (International)</span>
                </button>
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
                <span>Also subscribe me to free monthly Cultural Newsletter whispers.</span>
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
                className="w-full py-3.5 bg-[#9cbfae] hover:bg-[#86ab9a] disabled:opacity-50 text-[#1b2e24] font-serif font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sealing Passage...</span>
                  </>
                ) : (
                  <>
                    <span>Seal & Begin Journey</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-[#547365] font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                <span>256-bit Encrypted • Cancel Anytime • No lock-in</span>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
