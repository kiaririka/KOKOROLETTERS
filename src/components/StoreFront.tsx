import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  Tag, 
  Package, 
  Globe, 
  X,
  Truck
} from "lucide-react";
import { 
  STORE_PRODUCTS, 
  StoreProduct, 
  ProductCategory, 
  formatProductPrice 
} from "../data/storeProducts.ts";
import { SupportedCurrency } from "../currencyService.ts";

interface StoreFrontProps {
  destination: "India" | "International";
  onToggleDestination: (dest: "India" | "International") => void;
  selectedCurrency: SupportedCurrency;
  onAddToCart: (product: StoreProduct) => void;
  onDirectSubscribe: (product: StoreProduct) => void;
  onOpenCart: () => void;
  cartCount: number;
}

export default function StoreFront({
  destination,
  onToggleDestination,
  selectedCurrency,
  onAddToCart,
  onDirectSubscribe,
  onOpenCart,
  cartCount,
}: StoreFrontProps) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("all");
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);

  const categories = [
    { id: "all", label: "All Treasures" },
    { id: "subscription", label: "Monthly Passages" },
    { id: "kits", label: "Collector's Kits" },
    { id: "stationery", label: "Artisan Stationery" },
  ] as const;

  const filteredProducts = STORE_PRODUCTS.filter((prod) => {
    if (activeCategory === "all") return true;
    return prod.category === activeCategory;
  });

  return (
    <div className="space-y-12 text-left">
      {/* Boutique Hero Banner */}
      <div className="bg-[#faf6eb] border-2 border-[#dcd3b9] rounded-3xl p-8 md:p-14 text-center space-y-5 vintage-shadow relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#eedba540,#0000_60%)] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#eedba5] text-[11px] font-mono text-[#547365]">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Founding Batch 01 • Waitlist Open (No Payment Yet)</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#1b2e24] max-w-2xl mx-auto leading-tight">
          The Kokoro Post & Paperie
        </h2>

        <p className="text-xs md:text-sm text-[#547365] max-w-xl mx-auto leading-relaxed">
          Explore our planned monthly snail-mail memberships, archived regional editions, and keepsake stationery. Reserve your favorite picks on the Founding Waitlist with zero upfront charge.
        </p>

        {/* Global Destination & Currency Toggle */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex p-1 bg-white border border-[#eedba5] rounded-2xl shadow-xs">
            <button
              onClick={() => onToggleDestination("India")}
              className={`px-4 py-2 rounded-xl text-xs font-serif transition-all cursor-pointer ${
                destination === "India"
                  ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                  : "text-[#547365] hover:text-[#1b2e24]"
              }`}
            >
              🇮🇳 India (Tracked Speed Post)
            </button>
            <button
              onClick={() => onToggleDestination("International")}
              className={`px-4 py-2 rounded-xl text-xs font-serif transition-all cursor-pointer ${
                destination === "International"
                  ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                  : "text-[#547365] hover:text-[#1b2e24]"
              }`}
            >
              🌏 Worldwide (Optional Tracked)
            </button>
          </div>

          {cartCount > 0 && (
            <button
              onClick={onOpenCart}
              className="px-4 py-2 bg-[#9cbfae] hover:bg-[#86ab9a] text-[#1b2e24] rounded-2xl text-xs font-serif font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Satchel ({cartCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e3ece8] pb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-serif transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                    : "bg-white/80 border border-stone-200 text-[#547365] hover:text-[#1b2e24]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-[#547365]">
          Showing {filteredProducts.length} curated {filteredProducts.length === 1 ? "creation" : "creations"}
        </span>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => {
          const price = formatProductPrice(product, destination, selectedCurrency);
          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-[#eedba5] overflow-hidden vintage-shadow flex flex-col justify-between hover:border-[#9cbfae] transition-all group"
            >
              {/* Product Image & Badges */}
              <div className="relative h-60 overflow-hidden bg-stone-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {product.badge && (
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-[#1b2e24] text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                    {product.badge}
                  </span>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#f5dfb8] block">
                      {product.category === "subscription" ? "Monthly Mail Club" : "Physical Goods"}
                    </span>
                    <h3 className="font-serif font-bold text-lg leading-tight mt-0.5">
                      {product.name}
                    </h3>
                  </div>

                  <span className="font-serif font-bold text-base text-white bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-xl">
                    {price}
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-serif italic text-[#547365]">
                    {product.tagline}
                  </p>
                  <p className="text-xs text-[#1b2e24] leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                </div>

                {/* Micro Perks */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100 text-[11px] text-[#547365]">
                  {product.perks.slice(0, 3).map((perk, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setQuickViewProduct(product)}
                    className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-[#1b2e24] hover:bg-stone-50 text-xs font-serif transition-colors cursor-pointer"
                  >
                    Details
                  </button>

                  {product.isSubscription ? (
                    <button
                      onClick={() => onDirectSubscribe(product)}
                      className="flex-1 py-2.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Reserve Spot (Waitlist)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddToCart(product)}
                      className="flex-1 py-2.5 bg-[#9cbfae] hover:bg-[#86ab9a] text-[#1b2e24] rounded-xl text-xs font-serif font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Save to Satchel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf6eb] w-full max-w-2xl rounded-3xl p-6 md:p-8 border-2 border-[#eedba5] shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6"
            >
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="w-full h-64 rounded-2xl object-cover border border-[#eedba5]"
                />

                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#547365] bg-white px-2.5 py-0.5 rounded-full border border-[#eedba5]">
                    {quickViewProduct.badge || "Craft Creation"}
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-[#1b2e24]">
                    {quickViewProduct.name}
                  </h3>
                  <div className="font-serif font-bold text-lg text-emerald-900">
                    {formatProductPrice(quickViewProduct, destination, selectedCurrency)}
                  </div>
                  <p className="text-xs text-[#547365] leading-relaxed">
                    {quickViewProduct.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#eedba5]">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#1b2e24]">
                  What is included in this parcel:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickViewProduct.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-white p-2.5 rounded-xl border border-[#eedba5] text-[#1b2e24]">
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                {quickViewProduct.isSubscription ? (
                  <button
                    onClick={() => {
                      onDirectSubscribe(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="w-full py-3 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Reserve Founding Waitlist Spot</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onAddToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="w-full py-3 bg-[#9cbfae] hover:bg-[#86ab9a] text-[#1b2e24] rounded-xl text-xs font-serif font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Save to Interest Satchel</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
