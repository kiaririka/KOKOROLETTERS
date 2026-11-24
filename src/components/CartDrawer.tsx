import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { StoreProduct, formatProductPrice } from "../data/storeProducts.ts";
import { SupportedCurrency } from "../currencyService.ts";

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  destination: "India" | "International";
  onToggleDestination: (dest: "India" | "International") => void;
  selectedCurrency: SupportedCurrency;
  onProceedToCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  destination,
  onToggleDestination,
  selectedCurrency,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Compute total
  const hasSubscription = items.some((item) => item.product.isSubscription);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-[#faf6eb] h-full shadow-2xl border-l-2 border-[#eedba5] flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#eedba5] flex items-center justify-between bg-white/80 backdrop-blur-xs sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1b2e24] text-white flex items-center justify-center font-serif text-xs">
                心
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1b2e24]">
                  Traveler's Satchel
                </h3>
                <span className="text-[10px] font-mono text-[#547365]">
                  {totalItemsCount} {totalItemsCount === 1 ? "treasure" : "treasures"} selected
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Selector Pill inside Cart */}
          <div className="px-6 py-3 bg-[#faf6eb] border-b border-[#eedba5] flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-[#547365]">
              Shipping Hub:
            </span>
            <div className="inline-flex p-0.5 bg-white border border-[#e3ece8] rounded-xl text-[11px]">
              <button
                onClick={() => onToggleDestination("India")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  destination === "India"
                    ? "bg-[#1b2e24] text-white font-bold"
                    : "text-[#547365] hover:text-[#1b2e24]"
                }`}
              >
                🇮🇳 Domestic India
              </button>
              <button
                onClick={() => onToggleDestination("International")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  destination === "International"
                    ? "bg-[#1b2e24] text-white font-bold"
                    : "text-[#547365] hover:text-[#1b2e24]"
                }`}
              >
                🌏 Worldwide
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-full bg-[#e3ece8] flex items-center justify-center text-[#547365]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-base text-[#1b2e24]">
                    Your satchel is empty
                  </h4>
                  <p className="text-xs text-[#547365] max-w-xs leading-relaxed">
                    Explore our handcrafted Japanese mail subscriptions, single collector kits, and artisan stationery.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all shadow-xs cursor-pointer"
                >
                  Browse Store Catalog
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const price = formatProductPrice(product, destination, selectedCurrency);
                return (
                  <div
                    key={product.id}
                    className="bg-white p-4 rounded-2xl border border-[#eedba5] shadow-xs flex gap-3.5 text-left relative"
                  >
                    {/* Thumbnail */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-18 h-18 rounded-xl object-cover border border-stone-200 shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-serif font-bold text-xs text-[#1b2e24] leading-snug">
                            {product.name}
                          </h5>
                          <button
                            onClick={() => onRemoveItem(product.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#547365] line-clamp-1 mt-0.5">
                          {product.tagline}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <span className="font-serif font-bold text-xs text-[#1b2e24]">
                          {price}
                        </span>

                        {/* Quantity Counter */}
                        {!product.isSubscription ? (
                          <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                            <button
                              onClick={() => onUpdateQuantity(product.id, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded bg-white text-stone-600 hover:bg-stone-200 cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[11px] font-mono font-bold px-1.5">
                              {quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(product.id, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded bg-white text-stone-600 hover:bg-stone-200 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Monthly Club
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Bar */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#eedba5] bg-white/90 backdrop-blur-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#547365] font-medium">Launch Batch:</span>
                <span className="text-xs font-serif text-[#1b2e24]">
                  Founding Batch 01 ({destination === "India" ? "India Domestic" : "International"})
                </span>
              </div>

              <div className="bg-[#faf6eb] p-3 rounded-xl border border-[#eedba5] flex items-center gap-2 text-[11px] text-[#1b2e24]">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>No payment today. Reserve your interest to get priority access when Batch 01 opens.</span>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 bg-[#1b2e24] hover:bg-stone-800 text-white font-serif font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Reserve on Waitlist (No Charge)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
