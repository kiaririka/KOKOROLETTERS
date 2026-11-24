import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Package, Truck, Compass, ArrowRight, ShieldCheck, Printer } from "lucide-react";
import { CustomerOrder } from "../types.ts";

interface PostalReceiptModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  isWaitlistReservation?: boolean;
  alreadyOnWaitlist?: boolean;
  onClose: () => void;
  onViewJournal: () => void;
}

export default function PostalReceiptModal({
  order,
  isOpen,
  isWaitlistReservation = true,
  alreadyOnWaitlist = false,
  onClose,
  onViewJournal,
}: PostalReceiptModalProps) {
  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#faf6eb] rounded-3xl border-2 border-[#dcd3b9] shadow-2xl p-6 md:p-8 space-y-6 my-auto text-left vintage-shadow"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Traditional Japanese Postal Header */}
          <div className="flex items-start justify-between border-b border-[#eedba5] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-emerald-950">招待状</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#547365] bg-white px-2 py-0.5 rounded-md border border-[#eedba5]">
                  {isWaitlistReservation ? "Founding Waitlist Pass" : "Official Postal Manifest"}
                </span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#1b2e24] mt-1">
                {isWaitlistReservation
                  ? alreadyOnWaitlist
                    ? "You’re Already on the List"
                    : "Founding Spot Reserved"
                  : "Dispatch Sealed"}
              </h3>
              <p className="text-xs text-[#547365]">
                {isWaitlistReservation
                  ? "No payment was charged. You’ll be first to know when Batch 01 paper & prints are ready to ship."
                  : "Your handcrafted parcel is being prepared in our slow workshop."}
              </p>
            </div>

            {/* Vermilion Red Seal Stamp */}
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-700/80 bg-red-50 flex flex-col items-center justify-center text-red-800 shadow-2xs rotate-[-8deg] shrink-0">
              <span className="font-serif font-bold text-base leading-none">心</span>
              <span className="text-[7px] font-mono uppercase tracking-tighter mt-0.5">
                {isWaitlistReservation ? "Reserved" : "Sealed"}
              </span>
            </div>
          </div>

          {/* Order & Tracking Summary Pill */}
          <div className="bg-white p-4 rounded-2xl border border-[#eedba5] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono text-[#547365] block uppercase">
                {isWaitlistReservation ? "Pass Reference" : "Manifest ID"}
              </span>
              <span className="font-mono font-bold text-sm text-[#1b2e24]">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#547365] block uppercase">
                {isWaitlistReservation ? "Postal Preference" : "Tracking Waybill"}
              </span>
              <span className="font-mono font-bold text-xs text-emerald-800">
                {order.trackingNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#547365] block uppercase">Traveler</span>
              <span className="font-medium text-[#1b2e24] truncate block">{order.recipientName}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#547365] block uppercase">Shipping Region</span>
              <span className="font-medium text-[#1b2e24]">
                {order.destination === "India" ? "India Domestic" : "International"}
              </span>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-[#547365] block">
              {isWaitlistReservation ? "Saved Preferences (No Charge Today)" : "Parcels Included in this Dispatch"}
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 p-3 rounded-xl border border-[#eedba5] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#e3ece8] flex items-center justify-center text-[#1b2e24] shrink-0">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-serif font-bold text-[#1b2e24] block">{item.name}</span>
                      <span className="text-[10px] text-[#547365]">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-xs text-[#1b2e24]">{item.priceFormatted}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Destination */}
          {order.shipping_address ? (
            <div className="bg-[#faf6eb] p-3.5 rounded-xl border border-[#eedba5] text-xs text-[#1b2e24] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#547365] block">
                {isWaitlistReservation ? "Location / City" : "Delivery Destination"}
              </span>
              <p className="font-medium text-[#1b2e24] leading-relaxed">{order.shipping_address}</p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                onClose();
                onViewJournal();
              }}
              className="flex-1 py-3 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open Travel Ledger & Map</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 border border-[#9cbfae] hover:bg-[#e3ece8]/40 text-[#1b2e24] rounded-xl text-xs font-serif font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
