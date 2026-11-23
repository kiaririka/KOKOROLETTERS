/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, Lock, Unlock, Clock, Truck, Sparkles, Archive, 
  ChevronLeft, ChevronRight, X, Maximize2, Compass
} from "lucide-react";
import { REGIONS_METADATA, LORE_DATA, getRegionMonthStatus, getMonthName, getCurrentMonthNumber } from "../data/lore.ts";
import japanMapImg from "../assets/japan_parchment_map.jpg";

interface JapanMapProps {
  isSubscriber?: boolean;
  unlockedRegions: string[];
  activeRegionId: string | null;
  justUnlockedRegionId?: string | null;
  onSelectRegion: (id: string) => void;
  regionsList: Array<{ region_id: string; region_name: string }>;
}

const REGION_KANJI: Record<string, string> = {
  hokkaido: "北海道",
  tohoku: "東北",
  shinshu: "信州",
  kanto: "関東",
  chubu: "中部",
  iseshima: "伊勢志摩",
  kansai: "関西",
  chugoku: "中国",
  seto: "瀬戸内",
  shikoku: "四国",
  kyushu: "九州",
  okinawa: "沖縄",
};

// Accurate geographic pin coordinates (x%, y%) aligned with the hand-painted 16:9 Japanese map
const REGIONS_MAP_PINS = [
  { id: "hokkaido", name: "Hokkaido", month: 1, x: 79, y: 24, shortKanji: "北" },
  { id: "tohoku", name: "Tohoku", month: 2, x: 67, y: 44, shortKanji: "東" },
  { id: "shinshu", name: "Shinshu (Alps)", month: 3, x: 55, y: 54, shortKanji: "信" },
  { id: "kanto", name: "Kanto (Tokyo)", month: 4, x: 61, y: 62, shortKanji: "関" },
  { id: "chubu", name: "Chubu (Fuji)", month: 5, x: 51, y: 64, shortKanji: "富" },
  { id: "iseshima", name: "Ise-Shima", month: 6, x: 47, y: 68, shortKanji: "伊" },
  { id: "kansai", name: "Kansai (Kyoto)", month: 7, x: 43, y: 59, shortKanji: "京" },
  { id: "chugoku", name: "Chugoku", month: 8, x: 34, y: 55, shortKanji: "中" },
  { id: "seto", name: "Seto Inland Sea", month: 9, x: 36, y: 61, shortKanji: "瀬" },
  { id: "shikoku", name: "Shikoku", month: 10, x: 31, y: 66, shortKanji: "四" },
  { id: "kyushu", name: "Kyushu", month: 11, x: 21, y: 58, shortKanji: "九" },
  { id: "okinawa", name: "Okinawa", month: 12, x: 13, y: 82, shortKanji: "沖" }
];

export default function JapanMap({
  unlockedRegions = [],
  activeRegionId,
  justUnlockedRegionId,
  onSelectRegion,
  regionsList = [],
  isSubscriber = false
}: JapanMapProps) {
  const currentCalMonth = getCurrentMonthNumber();
  const [trackerIndex, setTrackerIndex] = useState(() => Math.max(0, currentCalMonth - 1));
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [enlargedImageRegion, setEnlargedImageRegion] = useState<string | null>(null);

  const currentMonthRegionId = REGIONS_METADATA.find(m => m.month === currentCalMonth)?.region_id || "kyushu";
  const displayRegionId = hoveredRegion || activeRegionId || currentMonthRegionId;
  const displayRegionMeta = REGIONS_METADATA.find(m => m.region_id === displayRegionId);
  const displayRegionLore = LORE_DATA[displayRegionId];
  const displayRegionMonthStatus = displayRegionMeta ? getRegionMonthStatus(displayRegionMeta.month) : "past";
  const displayRegionMonthName = displayRegionMeta ? getMonthName(displayRegionMeta.month) : "";
  const isDisplayRegionUnlocked = (unlockedRegions || []).includes(displayRegionId);

  return (
    <div id="interactive-japan-map" className="relative bg-[#fbf9f4] p-5 sm:p-6 rounded-3xl border border-stone-300 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold font-serif text-stone-800 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-800" />
            <span>Interactive Map of Japan</span>
          </h3>
          <p className="text-xs text-stone-500 font-serif">Select a sacred region to inspect travel letters and lore</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
            <span className="w-2 h-2 rounded-full bg-stone-400" /> Locked
          </span>
          <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> Unlocked ({unlockedRegions.length}/12)
          </span>
        </div>
      </div>

      {/* Docked Region Inspector Card (Stable, non-glitchy, rock solid) */}
      <div className="mb-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Thumbnail & Lore Preview */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
          <div 
            onClick={() => setEnlargedImageRegion(displayRegionId)}
            className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-xs cursor-pointer group shrink-0 border border-stone-200 bg-stone-100"
            title="Click to view full-resolution photography & lore"
          >
            {displayRegionLore?.assets_url && (
              <img
                src={displayRegionLore.assets_url}
                alt={displayRegionMeta?.region_name || "Japan"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute bottom-1 right-1 bg-black/60 text-white p-1 rounded-md text-[9px]">
              <Maximize2 className="w-2.5 h-2.5" />
            </div>
            {/* Hanko Stamp Pill */}
            <span className="absolute top-1 left-1 bg-white/95 text-[#991b1b] text-[8px] font-serif font-bold px-1.5 py-0.5 rounded shadow-2xs">
              {REGION_KANJI[displayRegionId] || "日本"}
            </span>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                Month {displayRegionMeta?.month}: {displayRegionMonthName}
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                isDisplayRegionUnlocked
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                  : displayRegionMonthStatus === "current"
                  ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                  : displayRegionMonthStatus === "past"
                  ? "bg-stone-100 text-stone-600 border-stone-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {isDisplayRegionUnlocked 
                  ? "Unlocked" 
                  : displayRegionMonthStatus === "current" 
                  ? "🌟 Active Monthly Dispatch" 
                  : displayRegionMonthStatus === "past" 
                  ? "Past Archive" 
                  : "Upcoming"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="font-serif font-bold text-stone-900 text-lg tracking-tight truncate">
                {displayRegionMeta?.region_name}
              </h4>
              <span className="text-xs font-serif text-stone-500 font-semibold">
                {REGION_KANJI[displayRegionId]}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-1 italic font-serif">
              {displayRegionLore?.lore_content?.split("\n\n")?.[1] || "A slow-living journey celebrating the spirit world of Japan."}
            </p>
          </div>
        </div>

        {/* Right: Direct Action */}
        <div className="shrink-0 w-full sm:w-auto flex justify-end">
          <button
            onClick={() => onSelectRegion(displayRegionId)}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
              isDisplayRegionUnlocked
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : displayRegionMonthStatus === "current"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-stone-800 hover:bg-stone-900 text-white"
            }`}
          >
            {isDisplayRegionUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Open in Journal</span>
              </>
            ) : displayRegionMonthStatus === "current" ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSubscriber ? "Stamp Journal" : "Subscribe to Unlock →"}</span>
              </>
            ) : displayRegionMonthStatus === "past" ? (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>Inspect Archive</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Locked • {displayRegionMonthName}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* The Authentic Hand-Painted Japanese Parchment Map */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-stone-300 shadow-md bg-[#f6f1e3]">
        <img
          src={japanMapImg}
          alt="Hand-Painted Antique Map of Japan"
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* 12 Interactive Region Pins (Smooth, zero-glitch, absolutely stable) */}
        {REGIONS_MAP_PINS.map((pin) => {
          const isUnlocked = (unlockedRegions || []).includes(pin.id);
          const isActive = (activeRegionId === pin.id) || (displayRegionId === pin.id);
          const meta = REGIONS_METADATA.find(m => m.region_id === pin.id);
          const monthStatus = meta ? getRegionMonthStatus(meta.month) : "past";
          const isCurrent = monthStatus === "current";
          const isPast = monthStatus === "past";

          return (
            <div
              key={`pin-${pin.id}`}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                onClick={() => onSelectRegion(pin.id)}
                onMouseEnter={() => setHoveredRegion(pin.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                className={`group relative flex flex-col items-center cursor-pointer transition-all duration-200 focus:outline-none ${
                  isActive ? "scale-115 z-30" : "scale-100 hover:scale-110"
                }`}
                aria-label={`Select ${pin.name}`}
              >
                {/* Active Pulsing Aura */}
                {isActive && (
                  <span className={`absolute -inset-2 rounded-full animate-ping opacity-60 ${
                    isUnlocked ? "bg-emerald-400" : isCurrent ? "bg-amber-400" : "bg-stone-300"
                  }`} />
                )}

                {/* Pin Badge with Kanji */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs shadow-md transition-all ${
                    isUnlocked
                      ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                      : isCurrent
                      ? "bg-amber-500 text-stone-900 ring-2 ring-amber-300 shadow-amber-500/40"
                      : isPast
                      ? "bg-[#ecdcc4] text-stone-800 border border-stone-400 ring-1 ring-stone-300"
                      : "bg-[#e5d8c3]/90 text-stone-600 border border-stone-300"
                  }`}
                >
                  <span>{pin.shortKanji}</span>
                </div>

                {/* Subtitle Label with Region Name */}
                <div className={`mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-serif font-bold whitespace-nowrap shadow-xs transition-all ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "bg-white/90 text-stone-800 border border-stone-300 group-hover:bg-stone-900 group-hover:text-white"
                }`}>
                  {pin.name}
                </div>
              </button>
            </div>
          );
        })}

        {/* Map Legend Overlay in bottom-right corner */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-300 text-[10px] font-mono text-stone-700 shadow-xs flex items-center gap-1.5 z-20">
          <MapPin className="w-3 h-3 text-amber-700" />
          <span>Click any pin to inspect</span>
        </div>
      </div>

      {/* Grid list of regions for easy keyboard accessibility */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
        {regionsList.map((r) => {
          const isUnlocked = (unlockedRegions || []).includes(r.region_id);
          const isActive = (activeRegionId === r.region_id) || (displayRegionId === r.region_id);
          const meta = REGIONS_METADATA.find(m => m.region_id === r.region_id);
          const monthStatus = meta ? getRegionMonthStatus(meta.month) : "past";
          const monthName = meta ? getMonthName(meta.month) : "";

          const isCurrent = monthStatus === "current";
          const isPast = monthStatus === "past";

          const subLabel = isCurrent 
            ? `${monthName.slice(0, 3)} • Current` 
            : isPast 
            ? `${monthName.slice(0, 3)} • Archive` 
            : `${monthName.slice(0, 3)} • Soon`;

          const isJustUnlocked = justUnlockedRegionId === r.region_id;

          return (
            <button
              key={r.region_id}
              onClick={() => onSelectRegion(r.region_id)}
              onMouseEnter={() => setHoveredRegion(r.region_id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-medium transition-all text-left cursor-pointer min-w-0 overflow-hidden ${
                isJustUnlocked
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300/60 shadow-sm"
                  : isActive
                  ? isUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs ring-1 ring-emerald-300"
                    : isCurrent
                    ? "bg-amber-100 border-amber-300 text-amber-950 ring-1 ring-amber-300 shadow-xs"
                    : "bg-stone-200 border-stone-300 text-stone-800 shadow-xs ring-1 ring-stone-300"
                  : isUnlocked
                  ? "bg-white border-emerald-100 hover:border-emerald-200 text-emerald-800"
                  : isCurrent
                  ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:border-amber-300"
                  : "bg-stone-50 border-stone-200/60 text-stone-500 hover:border-stone-300 hover:text-stone-700"
              }`}
            >
              {isUnlocked ? (
                <Unlock className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-700' : 'text-emerald-600'}`} />
              ) : isCurrent ? (
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              ) : isPast ? (
                <Archive className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 shrink-0 text-stone-300" />
              )}
              <div className="min-w-0 flex-1 overflow-hidden leading-tight">
                <span className="truncate block font-semibold text-stone-800">{r.region_name}</span>
                <span className="text-[9px] block opacity-80 text-stone-500 font-mono truncate">{subLabel}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Mail Dispatch Tracker Carousel */}
      {(() => {
        const selectedMeta = REGIONS_METADATA[trackerIndex] || REGIONS_METADATA[0];
        const monthNum = selectedMeta.month;
        const monthStatus = getRegionMonthStatus(monthNum);
        const monthName = getMonthName(monthNum);
        const isCurrent = monthStatus === "current";
        const isPast = monthStatus === "past";
        const isSelectedActive = activeRegionId === selectedMeta.region_id;

        return (
          <div className="mt-6 border-t border-stone-200 pt-5 space-y-3">
            {/* Header with Navigation Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-serif">
                  Mail Dispatch Tracker
                </h4>
                <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                  {trackerIndex + 1} / 12
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {trackerIndex !== currentCalMonth - 1 && (
                  <button
                    onClick={() => setTrackerIndex(currentCalMonth - 1)}
                    className="text-[10px] font-mono font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer mr-1"
                  >
                    Current Month
                  </button>
                )}
                <button
                  onClick={() => setTrackerIndex(prev => (prev > 0 ? prev - 1 : 11))}
                  className="w-7 h-7 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                  title="Previous Dispatch"
                  aria-label="Previous Dispatch"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTrackerIndex(prev => (prev < 11 ? prev + 1 : 0))}
                  className="w-7 h-7 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                  title="Next Dispatch"
                  aria-label="Next Dispatch"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Carousel Active Slide Card */}
            <div
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isCurrent
                  ? "bg-gradient-to-r from-amber-50/90 to-emerald-50/50 border-amber-200/80 shadow-xs"
                  : isPast
                  ? "bg-stone-50/80 border-stone-200"
                  : "bg-stone-50/50 border-stone-200/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? "bg-amber-100 text-amber-800"
                      : isPast
                      ? "bg-stone-100 text-stone-600"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {isCurrent ? (
                    <Truck className="w-5 h-5 text-amber-800" />
                  ) : isPast ? (
                    <Archive className="w-5 h-5 text-stone-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-stone-400" />
                  )}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold font-serif uppercase tracking-wider text-stone-600">
                      Month {monthNum}: {monthName}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                        isCurrent
                          ? "bg-amber-100 text-amber-900 border-amber-200 font-bold"
                          : isPast
                          ? "bg-stone-100 text-stone-600 border-stone-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {isCurrent ? "Active Monthly Dispatch" : isPast ? "Archived Parcel" : "Scheduled Release"}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold font-serif text-stone-900 truncate">
                    {selectedMeta.region_name}
                  </h5>
                  <p className="text-[11px] text-stone-500 font-sans">
                    {isCurrent
                      ? "Now shipping! Hand-crafted Ghibli art postcard, sticker & sealed lore letter."
                      : isPast
                      ? "Archived passage from earlier this year. Available as an individual back-order."
                      : "Upcoming lunar chapter. Preserved and locked until its designated month."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-200/50">
                <button
                  onClick={() => onSelectRegion(selectedMeta.region_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelectedActive
                      ? "bg-stone-800 text-white shadow-xs"
                      : "bg-white border border-stone-200 hover:border-stone-300 text-stone-700 hover:bg-stone-50 shadow-2xs"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isSelectedActive ? "Viewing on Map" : "View on Map"}</span>
                </button>
              </div>
            </div>

            {/* Carousel Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {REGIONS_METADATA.map((m, idx) => {
                const isCur = m.month === currentCalMonth;
                const isSelected = idx === trackerIndex;
                return (
                  <button
                    key={m.region_id}
                    onClick={() => setTrackerIndex(idx)}
                    title={`${getMonthName(m.month)} (${m.region_name})`}
                    className={`transition-all rounded-full cursor-pointer ${
                      isSelected
                        ? "w-5 h-2 bg-stone-800"
                        : isCur
                        ? "w-2 h-2 bg-amber-500 ring-2 ring-amber-300"
                        : "w-2 h-2 bg-stone-200 hover:bg-stone-300"
                    }`}
                    aria-label={`Go to ${getMonthName(m.month)}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Enlarged High-Resolution Inspection Modal */}
      <AnimatePresence>
        {enlargedImageRegion && (() => {
          const meta = REGIONS_METADATA.find(m => m.region_id === enlargedImageRegion);
          const lore = LORE_DATA[enlargedImageRegion];
          const monthStatus = meta ? getRegionMonthStatus(meta.month) : "past";
          const isUnlocked = (unlockedRegions || []).includes(enlargedImageRegion);

          return (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
              onClick={() => setEnlargedImageRegion(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#fcfaf2] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-300 relative text-left"
              >
                <button
                  onClick={() => setEnlargedImageRegion(null)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                  aria-label="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
                  <img
                    src={lore?.assets_url}
                    alt={meta?.region_name || "Regional Landscape"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Floating Postal Stamp Watermark */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-[#991b1b] border border-[#991b1b]/30 px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5 font-serif">
                    <span className="font-bold text-sm">心</span>
                    <span className="text-[10px] font-mono tracking-wider font-semibold">
                      {REGION_KANJI[enlargedImageRegion] || "日本"} • MONTH {meta?.month}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                      Authentic Japanese Landscape
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-white tracking-tight mt-0.5">
                      {meta?.region_name} ({REGION_KANJI[enlargedImageRegion]})
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs text-stone-700 leading-relaxed font-serif whitespace-pre-line max-h-52 overflow-y-auto pr-1">
                    {lore?.lore_content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
                    <div className="text-[11px] font-mono text-stone-500">
                      Status: <strong className="text-stone-800">{isUnlocked ? "Unlocked" : monthStatus === "current" ? "Active Monthly Dispatch" : monthStatus === "past" ? "Archived" : "Upcoming"}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectRegion(enlargedImageRegion);
                          setEnlargedImageRegion(null);
                        }}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        Inspect on Map
                      </button>
                      <button
                        onClick={() => setEnlargedImageRegion(null)}
                        className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
