import React from "react";
import { Package, Truck, CheckCircle2, Clock, ExternalLink, ArrowRight, ShoppingBag } from "lucide-react";
import { CustomerOrder } from "../types.ts";

interface OrderHistoryViewProps {
  orders: CustomerOrder[];
  onOpenStore: () => void;
}

export default function OrderHistoryView({ orders, onOpenStore }: OrderHistoryViewProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-[#faf6eb] border-2 border-[#eedba5] rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto vintage-shadow">
        <div className="w-14 h-14 rounded-full bg-[#e3ece8] flex items-center justify-center mx-auto text-[#547365]">
          <Package className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-serif font-bold text-lg text-[#1b2e24]">
            No Dispatches Recorded Yet
          </h4>
          <p className="text-xs text-[#547365] leading-relaxed max-w-sm mx-auto">
            When you subscribe to a monthly passage or order handcrafted stationery treasures, your parcel tracking records will be logged here.
          </p>
        </div>
        <button
          onClick={onOpenStore}
          className="px-5 py-2.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all shadow-xs cursor-pointer"
        >
          Browse Boutique Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-[#eedba5] pb-3">
        <div>
          <h4 className="font-serif font-bold text-lg text-[#1b2e24]">
            My Postal Dispatches & Orders
          </h4>
          <p className="text-xs text-[#547365]">
            Real-time fulfillment logs for your monthly mail club and physical goods.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#1b2e24] bg-white px-3 py-1 rounded-full border border-[#eedba5]">
          {orders.length} {orders.length === 1 ? "Dispatch" : "Dispatches"}
        </span>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isSpeedPost = order.destination === "India";
          const formattedDate = new Date(order.createdDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={order.id || order.orderNumber}
              className="bg-white rounded-2xl border border-[#eedba5] p-5 space-y-4 vintage-shadow"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1b2e24] text-white flex items-center justify-center font-serif text-xs font-bold">
                    心
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#1b2e24]">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        • {formattedDate}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#547365] block">
                      Waybill: {order.trackingNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      order.status === "Delivered"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : order.status === "Dispatched"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {order.status === "Delivered" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : order.status === "Dispatched" ? (
                      <Truck className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>{order.status}</span>
                  </span>

                  <span className="text-[10px] font-mono font-bold bg-[#faf6eb] text-[#1b2e24] px-2.5 py-1 rounded-full border border-[#eedba5]">
                    {isSpeedPost ? "Speed-Post (India)" : "Tracked Airmail (Global)"}
                  </span>
                </div>
              </div>

              {/* Line items list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(order.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#faf6eb]/60 rounded-xl border border-[#eedba5]/70 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Package className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span className="font-serif font-bold text-[#1b2e24] truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">x{item.quantity}</span>
                    </div>
                    <span className="text-xs font-serif text-[#1b2e24] shrink-0 font-medium">
                      {item.priceFormatted}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping address & total footer */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-2 border-t border-stone-100 text-xs text-[#547365]">
                <div className="truncate max-w-md">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#1b2e24] mr-1">
                    Delivered To:
                  </span>
                  <span className="truncate">{order.shipping_address}</span>
                </div>

                {order.totalFormatted && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono mr-1">Total:</span>
                    <span className="font-serif font-bold text-sm text-[#1b2e24]">
                      {order.totalFormatted}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
