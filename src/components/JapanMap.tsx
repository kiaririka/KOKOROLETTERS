/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, Lock, Unlock, Clock, Truck, Sparkles, Archive, 
  ChevronLeft, ChevronRight, Compass
} from "lucide-react";
import { REGIONS_METADATA, getRegionMonthStatus, getMonthName, getCurrentMonthNumber } from "../data/lore.ts";
import japanMapImg from "../assets/japan_parchment_map.jpg";

interface JapanMapProps {
  isSubscriber?: boolean;
  unlockedRegions: string[];
  activeRegionId: string | null;
  justUnlockedRegionId?: string | null;
  onSelectRegion: (id: string) => void;
  regionsList: Array<{ region_id: string; region_name: string }>;
}

// Accurate geographic pin coordinates (x%, y%) aligned with the hand-painted 16:9 Japanese map
// Coordinates are carefully staggered to prevent pin overlap across mobile, tablet, and desktop viewports
const REGIONS_MAP_PINS = [
  { id: "hokkaido", name: "Hokkaido", month: 1, x: 79, y: 24, shortKanji: "北" },
  { id: "tohoku", name: "Tohoku", month: 2, x: 67, y: 43, shortKanji: "東" },
  { id: "shinshu", name: "Shinshu (Alps)", month: 3, x: 55, y: 52, shortKanji: "信" },
  { id: "kanto", name: "Kanto (Tokyo)", month: 4, x: 62, y: 62, shortKanji: "関" },
  { id: "chubu", name: "Chubu (Fuji)", month: 5, x: 52, y: 66, shortKanji: "富" },
  { id: "iseshima", name: "Ise-Shima", month: 6, x: 47, y: 72, shortKanji: "伊" },
  { id: "kansai", name: "Kansai (Kyoto)", month: 7, x: 41, y: 56, shortKanji: "京" },
  { id: "chugoku", name: "Chugoku", month: 8, x: 32, y: 52, shortKanji: "中" },
  { id: "seto", name: "Seto Inland Sea", month: 9, x: 36, y: 62, shortKanji: "瀬" },
  { id: "shikoku", name: "Shikoku", month: 10, x: 29, y: 70, shortKanji: "四" },
  { id: "kyushu", name: "Kyushu", month: 11, x: 19, y: 58, shortKanji: "九" },
  { id: "okinawa", name: "Okinawa", month: 12, x: 13, y: 82, shortKanji: "沖" }
];

// SVG territorial partition shapes corresponding to each region on the hand-painted Japanese map
const REGION_PARTITION_PATHS: Record<string, string> = {
  hokkaido: "M 70,27 C 72,16 80,12 87,15 C 93,19 91,29 86,34 C 80,38 74,37 70,31 Z",
  tohoku: "M 65,34 C 70,37 71,48 68,52 C 63,50 63,41 65,34 Z",
  shinshu: "M 56,46 C 60,49 59,57 53,56 C 51,51 52,47 56,46 Z",
  kanto: "M 59,55 C 66,55 68,63 65,68 C 59,68 58,61 59,55 Z",
  chubu: "M 51,57 C 56,59 56,69 51,70 C 47,67 47,60 51,57 Z",
  iseshima: "M 45,65 C 49,67 50,75 46,77 C 42,74 43,67 45,65 Z",
  kansai: "M 39,50 C 45,51 45,61 41,63 C 37,60 37,53 39,50 Z",
  chugoku: "M 29,47 C 37,48 38,56 29,57 C 24,56 24,49 29,47 Z",
  seto: "M 32,58 C 40,58 41,64 34,65 C 31,63 31,60 32,58 Z",
  shikoku: "M 26,65 C 33,64 34,73 27,75 C 23,72 23,67 26,65 Z",
  kyushu: "M 15,49 C 22,50 23,64 17,66 C 13,62 13,52 15,49 Z",
  okinawa: "M 7.5,75.5 L 19.5,75.5 L 19.5,89.5 L 7.5,89.5 Z"
};

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
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMouseEnterPin = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredRegion(id);
  };

  const handleMouseLeavePin = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredRegion(null);
    }, 350);
  };

  const handleMouseEnterTooltip = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveTooltip = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredRegion(null);
    }, 350);
  };

  // Active hovered pin object
  const activeHoveredPin = hoveredRegion 
    ? REGIONS_MAP_PINS.find(p => p.id === hoveredRegion)
    : null;

  return (
    <div id="interactive-japan-map" className="w-full space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
        <div>
          <h3 className="text-xl font-bold font-serif text-stone-800 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-800" />
            <span>Interactive Map of Japan</span>
          </h3>
          <p className="text-xs text-stone-500 font-serif">Hover over any region pin to preview travel letters and lore</p>
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

      {/* The Authentic Hand-Painted Japanese Map Container (Full Width, Zero Card Nesting) */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-visible border border-stone-300 shadow-sm bg-[#f6f1e3]">
        <img
          src={japanMapImg}
          alt="Hand-Painted Antique Map of Japan"
          className="w-full h-full object-cover select-none pointer-events-none rounded-2xl"
        />

        {/* SVG Regional Partitions Overlay: Each territorial partition glows with luminous aura when hovered */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl z-10"
        >
          <defs>
            {/* Luminous glowing filter for active / hovered partitions */}
            <filter id="partition-glow-amber" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur1" />
              <feGaussianBlur stdDeviation="4.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="partition-glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur1" />
              <feGaussianBlur stdDeviation="4.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="radial-glow-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="radial-glow-emerald" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 12 Territorial Region Partitions */}
          {REGIONS_MAP_PINS.map((pin) => {
            const isHoveredOrActive = hoveredRegion === pin.id || activeRegionId === pin.id;
            const isUnlocked = (unlockedRegions || []).includes(pin.id);
            const partitionPath = REGION_PARTITION_PATHS[pin.id];
            if (!partitionPath) return null;

            return (
              <g key={`partition-glow-${pin.id}`}>
                {/* Luminous radiant halo core at region centroid */}
                {isHoveredOrActive && (
                  <ellipse
                    cx={pin.x}
                    cy={pin.y}
                    rx="8.5"
                    ry="6.5"
                    fill={isUnlocked ? "url(#radial-glow-emerald)" : "url(#radial-glow-amber)"}
                    className="animate-pulse pointer-events-none"
                  />
                )}

                {/* Partition territorial boundary path */}
                <path
                  d={partitionPath}
                  fill={
                    isHoveredOrActive
                      ? isUnlocked
                        ? "rgba(16, 185, 129, 0.32)"
                        : "rgba(245, 158, 11, 0.35)"
                      : "rgba(0, 0, 0, 0.001)"
                  }
                  stroke={
                    isHoveredOrActive
                      ? isUnlocked
                        ? "#10b981"
                        : "#f59e0b"
                      : "rgba(180, 150, 110, 0.25)"
                  }
                  strokeWidth={isHoveredOrActive ? "1.8" : "0.6"}
                  strokeDasharray={isHoveredOrActive ? "none" : "2,2"}
                  filter={
                    isHoveredOrActive
                      ? isUnlocked
                        ? "url(#partition-glow-emerald)"
                        : "url(#partition-glow-amber)"
                      : "none"
                  }
                  className="transition-all duration-300 pointer-events-auto cursor-pointer"
                  onMouseEnter={() => handleMouseEnterPin(pin.id)}
                  onMouseLeave={handleMouseLeavePin}
                  onClick={() => {
                    onSelectRegion(pin.id);
                    setHoveredRegion(pin.id);
                  }}
                  aria-label={`${pin.name} territory`}
                />
              </g>
            );
          })}
        </svg>

        {/* 12 Interactive Region Pins */}
        {REGIONS_MAP_PINS.map((pin) => {
          const isUnlocked = (unlockedRegions || []).includes(pin.id);
          const isActive = activeRegionId === pin.id;
          const isHovered = hoveredRegion === pin.id;
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
                onClick={() => {
                  onSelectRegion(pin.id);
                  setHoveredRegion(pin.id);
                }}
                onMouseEnter={() => handleMouseEnterPin(pin.id)}
                onMouseLeave={handleMouseLeavePin}
                className={`group relative flex flex-col items-center cursor-pointer transition-transform duration-200 focus:outline-none ${
                  isHovered || isActive ? "scale-125 z-30" : "scale-100 hover:scale-115"
                }`}
                aria-label={`Select ${pin.name}`}
              >
                {/* Active/Current Pulsing Aura */}
                {(isActive || (isCurrent && !hoveredRegion)) && (
                  <span className={`absolute -inset-1 sm:-inset-1.5 rounded-full animate-ping opacity-60 ${
                    isUnlocked ? "bg-emerald-400" : isCurrent ? "bg-amber-400" : "bg-stone-400"
                  }`} />
                )}

                {/* Pin Badge: Responsive scaling from mobile (24px) to desktop (32px) */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-serif font-bold text-[10px] sm:text-xs shadow-md transition-all ${
                    isUnlocked
                      ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                      : isCurrent
                      ? "bg-amber-500 text-stone-900 ring-2 ring-amber-300 shadow-amber-500/50"
                      : isPast
                      ? "bg-[#ecdcc4] text-stone-800 border border-stone-400 ring-1 ring-stone-300"
                      : "bg-[#e5d8c3]/90 text-stone-600 border border-stone-300"
                  }`}
                >
                  <span>{pin.shortKanji}</span>
                </div>
              </button>
            </div>
          );
        })}

        {/* Classic Hover Tooltip Popup Card */}
        <AnimatePresence>
          {activeHoveredPin && (() => {
            const isUnlocked = (unlockedRegions || []).includes(activeHoveredPin.id);
            const meta = REGIONS_METADATA.find(m => m.region_id === activeHoveredPin.id);
            const monthStatus = meta ? getRegionMonthStatus(meta.month) : "past";
            const monthName = meta ? getMonthName(meta.month) : "";
            const isPast = monthStatus === "past";
            const isCurrent = monthStatus === "current";
            const isFuture = monthStatus === "future";

            // Prevent tooltip from clipping boundaries on any viewport
            const isTopArea = activeHoveredPin.y < 35;
            const isNearLeft = activeHoveredPin.x < 24;
            const isNearRight = activeHoveredPin.x > 76;

            const pointerAlignment = isNearLeft
              ? "self-start ml-5"
              : isNearRight
              ? "self-end mr-5"
              : "self-center";

            return (
              <motion.div
                key={`html-tooltip-${activeHoveredPin.id}`}
                initial={{ opacity: 0, y: isTopArea ? -6 : 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isTopArea ? -6 : 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute z-50 flex flex-col pointer-events-none"
                style={{ 
                  left: `${activeHoveredPin.x}%`,
                  top: `${activeHoveredPin.y}%`,
                  transform: isTopArea 
                    ? (isNearLeft ? "translate(-12%, 14px)" : isNearRight ? "translate(-88%, 14px)" : "translate(-50%, 14px)")
                    : (isNearLeft ? "translate(-12%, -100%)" : isNearRight ? "translate(-88%, -100%)" : "translate(-50%, -100%)"),
                  marginTop: isTopArea ? "0px" : "-10px"
                }}
              >
                {/* Pointer Triangle (if above pin, points down) */}
                {!isTopArea && (
                  <div className={`order-2 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-transparent border-t-[#0f1b14] drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] relative -top-[1px] ${pointerAlignment}`}></div>
                )}

                {/* Tooltip Card Body: High-Contrast Obsidian-Forest Lacquer with Radiant Gold Trim */}
                <div 
                  onMouseEnter={handleMouseEnterTooltip}
                  onMouseLeave={handleMouseLeaveTooltip}
                  className="order-1 bg-gradient-to-b from-[#18281f] to-[#0f1b14] border-2 border-amber-400 shadow-[0_20px_50px_rgba(0,0,0,0.75),0_0_24px_rgba(245,158,11,0.35)] ring-1 ring-amber-300/40 rounded-2xl p-4 max-w-[245px] sm:max-w-[265px] w-[235px] sm:w-[255px] text-center flex flex-col items-center relative overflow-hidden pointer-events-auto"
                >
                  {/* Glowing Top Amber Accent Line */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

                  {/* Header with Radiant Glowing Lantern and Title */}
                  <div className="flex items-center justify-center gap-2 w-full mb-1 mt-0.5">
                    <div className="w-6 h-6 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                      <svg viewBox="0 0 20 20" className="w-full h-full">
                        <g>
                          <rect x="6" y="0" width="8" height="2" fill="#78350f" />
                          <rect x="4" y="2" width="12" height="2" fill="#b45309" />
                          <rect x="4" y="4" width="12" height="12" fill={isFuture ? "#64748b" : isPast ? "#92400e" : "#f59e0b"} className={isCurrent ? "animate-pulse" : ""} />
                          <rect x="6" y="6" width="8" height="8" fill={isFuture ? "#94a3b8" : isPast ? "#d97706" : "#fde047"} />
                          <rect x="8" y="8" width="4" height="4" fill={isFuture ? "#cbd5e1" : isPast ? "#fef3c7" : "#ffffff"} />
                          <rect x="4" y="16" width="12" height="2" fill="#b45309" />
                          <rect x="6" y="18" width="8" height="2" fill="#78350f" />
                        </g>
                      </svg>
                    </div>

                    <h4 className="font-serif font-bold text-[#fffbeb] text-base leading-tight tracking-wide drop-shadow-sm">
                      {activeHoveredPin.name}
                    </h4>
                  </div>

                  {/* Subtext */}
                  <p className="text-[11px] text-stone-300 font-sans font-medium leading-tight mb-2.5 w-full text-center">
                    {isUnlocked 
                      ? "Explore travel letters & lore" 
                      : isCurrent
                      ? `${monthName} Dispatch • Available Now`
                      : isPast
                      ? `${monthName} Dispatch • Past Archive`
                      : `Scheduled for ${monthName}`}
                  </p>

                  {/* Shipping logistics status banner */}
                  {isCurrent && (
                    <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-950 text-[10px] font-bold font-mono shadow-md flex items-center justify-center gap-1.5 w-full animate-pulse">
                      <Truck className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                      <span className="truncate">{monthName}: Active Monthly Dispatch</span>
                    </div>
                  )}
                  {isPast && (
                    <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-[#1d2f24] border border-amber-400/30 text-amber-200 text-[10px] font-bold font-mono flex items-center justify-center gap-1.5 w-full">
                      <Archive className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                      <span className="truncate">{monthName}: Past Archive (Kit order)</span>
                    </div>
                  )}
                  {isFuture && (
                    <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-[#17251d] border border-stone-600/50 text-stone-300 text-[10px] font-bold font-mono flex items-center justify-center gap-1.5 w-full">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{monthName}: Coming Soon</span>
                    </div>
                  )}

                  {/* State-Awareness Banner */}
                  <div className={`text-[9px] font-mono font-bold tracking-tight py-1 px-1.5 rounded-lg mb-2.5 w-full text-center leading-normal border ${
                    isUnlocked
                      ? "text-emerald-300 bg-[#0d2217] border-emerald-500/40"
                      : isCurrent
                      ? "text-amber-200 bg-[#251e10] border-amber-500/40"
                      : "text-stone-300 bg-[#16221a] border-stone-700/60"
                  }`}>
                    {isUnlocked 
                      ? `${activeHoveredPin.name} | Unlocked` 
                      : isCurrent 
                      ? `${activeHoveredPin.name} | Subscribe to Unlock` 
                      : isPast
                      ? `${activeHoveredPin.name} | Archived Dispatch (Locked)`
                      : `${activeHoveredPin.name} | Coming Soon (Locked)`}
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => onSelectRegion(activeHoveredPin.id)}
                    className={`text-xs font-serif font-bold py-2 px-4 rounded-xl w-full shadow-lg transition-all whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-95 ${
                      isUnlocked
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-stone-950 shadow-emerald-950/40"
                        : isCurrent
                        ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-stone-950 shadow-amber-950/50"
                        : isPast
                        ? "bg-[#283b30] hover:bg-[#32493c] text-amber-100 border border-amber-500/30 shadow-black/40"
                        : "bg-[#1f2d25] hover:bg-[#28392f] text-stone-300 border border-stone-600/50 shadow-black/40"
                    }`}
                  >
                    {isUnlocked 
                      ? "View Region Letters →" 
                      : isCurrent 
                      ? (isSubscriber ? "Stamp Journal" : "Subscribe to Unlock →") 
                      : isPast
                      ? "Archived Dispatch"
                      : "Coming Soon"}
                  </button>
                </div>

                {/* Pointer Triangle (if below pin, points up) */}
                {isTopArea && (
                  <div className={`order-0 w-0 h-0 border-l-[9px] border-r-[9px] border-b-[9px] border-transparent border-b-[#18281f] drop-shadow-[0_-4px_6px_rgba(0,0,0,0.6)] relative -bottom-[1px] ${pointerAlignment}`}></div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Grid of Regions Covering the Full Map Area (Generous spacing, responsive columns, zero text cutoff) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 pt-2">
        {regionsList.map((r) => {
          const isUnlocked = (unlockedRegions || []).includes(r.region_id);
          const isActive = activeRegionId === r.region_id;
          const meta = REGIONS_METADATA.find(m => m.region_id === r.region_id);
          const monthStatus = meta ? getRegionMonthStatus(meta.month) : "past";
          const monthName = meta ? getMonthName(meta.month) : "";

          const isCurrent = monthStatus === "current";
          const isPast = monthStatus === "past";

          const subLabel = isCurrent 
            ? `${monthName.slice(0, 3)} • Active Dispatch` 
            : isPast 
            ? `${monthName.slice(0, 3)} • Past Archive` 
            : `${monthName.slice(0, 3)} • Upcoming`;

          const isJustUnlocked = justUnlockedRegionId === r.region_id;

          return (
            <button
              key={r.region_id}
              onClick={() => {
                onSelectRegion(r.region_id);
                setHoveredRegion(r.region_id);
              }}
              onMouseEnter={() => handleMouseEnterPin(r.region_id)}
              onMouseLeave={handleMouseLeavePin}
              className={`flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                isJustUnlocked
                  ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300 shadow-xs"
                  : isActive
                  ? isUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-300 shadow-xs"
                    : isCurrent
                    ? "bg-amber-100 border-amber-300 text-amber-950 ring-1 ring-amber-300 shadow-xs"
                    : "bg-stone-200 border-stone-400 text-stone-900 shadow-xs ring-1 ring-stone-300"
                  : isUnlocked
                  ? "bg-white border-emerald-100 hover:border-emerald-200 text-emerald-900 hover:bg-emerald-50/50"
                  : isCurrent
                  ? "bg-amber-50/90 border-amber-200 text-amber-950 hover:border-amber-300 hover:bg-amber-100/60"
                  : "bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isUnlocked ? (
                  <Unlock className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-emerald-600'}`} />
                ) : isCurrent ? (
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                ) : isPast ? (
                  <Archive className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                )}
              </div>
              <div className="min-w-0 flex-1 leading-snug">
                <span className="block font-serif font-bold text-xs text-stone-900 truncate">
                  {r.region_name}
                </span>
                <span className="text-[10px] font-mono text-stone-500 block mt-0.5 leading-tight">
                  {subLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Mail Dispatch Tracker Carousel (Matching Full Width) */}
      {(() => {
        const selectedMeta = REGIONS_METADATA[trackerIndex] || REGIONS_METADATA[0];
        const monthNum = selectedMeta.month;
        const monthStatus = getRegionMonthStatus(monthNum);
        const monthName = getMonthName(monthNum);
        const isCurrent = monthStatus === "current";
        const isPast = monthStatus === "past";
        const isSelectedActive = activeRegionId === selectedMeta.region_id;

        return (
          <div className="mt-8 border-t border-stone-200/80 pt-5 space-y-3">
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
    </div>
  );
}
