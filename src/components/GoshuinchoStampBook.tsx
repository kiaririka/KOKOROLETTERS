import React from "react";
import { motion } from "motion/react";
import { Lock, Unlock, Clock, Award } from "lucide-react";
import { REGIONS_METADATA } from "../data/lore.ts";

interface GoshuinchoStampBookProps {
  unlockedRegionIds: string[];
  justUnlockedRegionId?: string | null;
  onSelectRegion: (id: string) => void;
  isSubscriber: boolean;
  onOpenStore: () => void;
}

export default function GoshuinchoStampBook({
  unlockedRegionIds,
  justUnlockedRegionId,
  onSelectRegion,
  isSubscriber,
  onOpenStore,
}: GoshuinchoStampBookProps) {
  const total = REGIONS_METADATA.length;
  const count = unlockedRegionIds.length;
  const percentage = Math.round((count / total) * 100);

  return (
    <div className="bg-[#faf6eb] rounded-3xl p-6 md:p-8 border-2 border-[#dcd3b9] vintage-shadow space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eedba5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">御朱印帳</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#547365] bg-white px-2 py-0.5 rounded-md border border-[#eedba5]">
              Japanese Travel Stamp Ledger
            </span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1b2e24] mt-1">
            Goshuincho: 12 Sacred Waypoints
          </h3>
          <p className="text-xs text-[#547365] mt-0.5">
            Collect hand-pressed vermilion stamps as your physical snail-mail dispatches land each month.
          </p>
        </div>

        <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#eedba5] flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-mono text-[#547365] block uppercase">Collected</span>
            <span className="text-lg font-serif font-bold text-[#1b2e24]">
              {count} <span className="text-xs text-stone-400 font-normal">/ {total}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-[#9cbfae] flex items-center justify-center font-mono text-xs font-bold text-emerald-900 bg-[#e3ece8]">
            {percentage}%
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-stone-200/60 rounded-full h-2 overflow-hidden border border-stone-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[#9cbfae] to-emerald-700 rounded-full"
        />
      </div>

      {/* 12-Slot Stamp Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {REGIONS_METADATA.map((meta, idx) => {
          const isUnlocked = unlockedRegionIds.includes(meta.region_id);
          const isJustUnlocked = justUnlockedRegionId === meta.region_id;
          const isFuture = new Date(meta.release_date) > new Date("2026-07-04");

          return (
            <motion.button
              key={meta.region_id}
              onClick={() => onSelectRegion(meta.region_id)}
              whileHover={{ y: -2 }}
              animate={isJustUnlocked ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between h-36 transition-all relative overflow-hidden ${
                isJustUnlocked
                  ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-md"
                  : isUnlocked
                  ? "bg-white border-[#eedba5] shadow-xs hover:border-[#9cbfae]"
                  : "bg-white/40 border-stone-200/80 hover:bg-white/80"
              }`}
            >
              <div className="w-full flex items-center justify-between text-[9px] font-mono text-stone-500">
                <span>M0{meta.month}</span>
                {isFuture ? (
                  <Clock className="w-3 h-3 text-amber-600" />
                ) : isUnlocked ? (
                  <Unlock className="w-3 h-3 text-emerald-700" />
                ) : (
                  <Lock className="w-3 h-3 text-stone-400" />
                )}
              </div>

              {/* Stamp Circle */}
              <div className="my-1 relative flex items-center justify-center">
                {isUnlocked ? (
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-700/80 bg-red-50/70 flex flex-col items-center justify-center text-red-800 shadow-2xs rotate-[-6deg]">
                    <span className="font-serif font-bold text-sm leading-none">心</span>
                    <span className="text-[7px] font-mono uppercase tracking-tighter mt-0.5">Kokoro</span>
                  </div>
                ) : isFuture ? (
                  <div className="w-14 h-14 rounded-full border border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-amber-800">
                    <span className="text-[9px] font-mono">Future</span>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full border border-dashed border-stone-300 bg-stone-100/60 flex flex-col items-center justify-center text-stone-400">
                    <span className="text-[9px] font-mono">Empty</span>
                  </div>
                )}
              </div>

              {/* Title & Tag */}
              <div className="w-full">
                <span className="font-serif font-bold text-xs text-[#1b2e24] block truncate">
                  {meta.region_name}
                </span>
                <span className="text-[9px] text-[#547365] font-mono block truncate">
                  {isUnlocked ? "Stamped & Logged" : isFuture ? "Whisper Ahead" : "Awaiting Passage"}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!isSubscriber && (
        <div className="bg-[#faf6eb] border border-[#eedba5] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-800 shrink-0" />
            <div>
              <h4 className="font-serif font-bold text-xs text-[#1b2e24]">
                Begin filling your Goshuincho Stamp Book
              </h4>
              <p className="text-[11px] text-[#547365]">
                Subscribe to Kokoro Letters to receive your monthly physical dispatch and unlock digital stamps.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenStore}
            className="px-4 py-2 bg-[#9cbfae] hover:bg-[#86ab9a] text-[#1b2e24] rounded-xl text-xs font-serif font-bold transition-all shrink-0 shadow-xs"
          >
            Unlock Ledger
          </button>
        </div>
      )}
    </div>
  );
}
