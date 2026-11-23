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

// SVG territorial partition shapes precisely traced to each region's landmass on the hand-painted Japanese map
const REGION_PARTITION_PATHS: Record<string, string> = {
  hokkaido: "M 68,30.5 C 69.5,26 72,21 73.5,15.5 C 75,15 76,18 77,22 C 80,21 83,23 85,27 C 83.5,29 82,32 79.5,35.5 C 76.5,34.5 74,31 71,31 C 69,32 68,30.5 68,30.5 Z",
  tohoku: "M 66,34.5 C 69,37 70.5,47 67.5,52 C 63.5,50 63.5,41 66,34.5 Z",
  shinshu: "M 55.5,46 C 59,49 58,56.5 53,56 C 51,51 52.5,47 55.5,46 Z",
  kanto: "M 59,55 C 65,55 67,62.5 64.5,67.5 C 59.5,67.5 58.5,61 59,55 Z",
  chubu: "M 51,57 C 55.5,59 55.5,68 51,69.5 C 47.5,67 47.5,60 51,57 Z",
  iseshima: "M 45,65 C 48.5,67 49,74.5 46,76.5 C 42.5,74 43,67 45,65 Z",
  kansai: "M 39,50.5 C 44.5,51.5 44.5,61 41,62.5 C 37.5,60 37.5,53 39,50.5 Z",
  chugoku: "M 28.5,47.5 C 36.5,48.5 37.5,55.5 28.5,56.5 C 24.5,55.5 24.5,49.5 28.5,47.5 Z",
  seto: "M 32,58 C 39.5,58 40.5,63.5 34,64.5 C 31,63 31,60 32,58 Z",
  shikoku: "M 26,65 C 32.5,64 33.5,72.5 27,74.5 C 23.5,72 23.5,67 26,65 Z",
  kyushu: "M 15.5,49.5 C 21.5,50.5 22.5,63.5 17,65.5 C 13.5,62 13.5,52.5 15.5,49.5 Z",
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
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-visible border border-[#9cbfae]/40 shadow-sm bg-[#fbf9f4]">
        <img
          src={japanMapImg}
          alt="Hand-Painted Antique Map of Japan"
          className="w-full h-full object-cover select-none pointer-events-none rounded-2xl filter saturate-[0.85] hue-rotate-[16deg] brightness-[1.02]"
        />

        {/* Ghibli Sage Theme Color Tint: Harmonizes map oceans and land with the Kokoro Letters website theme */}
        <div className="absolute inset-0 bg-[#86ab9a]/25 mix-blend-color pointer-events-none rounded-2xl" />
        <div className="absolute inset-0 bg-[#faf6eb]/15 mix-blend-soft-light pointer-events-none rounded-2xl" />

        {/* SVG Regional Partitions Overlay: Each territorial partition glows with luminous aura when hovered */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl z-10"
        >
          <defs>
            {/* Soft, authentic antique gold & emerald watercolor glow filters for hovered partitions */}
            <filter id="partition-glow-amber" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="partition-glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="radial-glow-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#d97706" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="radial-glow-emerald" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#547365" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#547365" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#547365" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 12 Territorial Region Partitions: ONLY glows when that specific region is actively hovered */}
          {REGIONS_MAP_PINS.map((pin) => {
            const isHovered = hoveredRegion === pin.id;
            const isUnlocked = (unlockedRegions || []).includes(pin.id);
            const partitionPath = REGION_PARTITION_PATHS[pin.id];
            if (!partitionPath) return null;

            return (
              <g key={`partition-glow-${pin.id}`}>
                {/* Partition territorial boundary path: Precisely traces regional landmass without vague circular blobs */}
                <path
                  d={partitionPath}
                  fill={
                    isHovered
                      ? isUnlocked
                        ? "rgba(84, 115, 101, 0.22)"
                        : "rgba(217, 119, 6, 0.20)"
                      : "rgba(0, 0, 0, 0.001)"
                  }
                  stroke={
                    isHovered
                      ? isUnlocked
                        ? "#3d5a49"
                        : "#b45309"
                      : "rgba(180, 150, 110, 0.2)"
                  }
                  strokeWidth={isHovered ? "1.6" : "0.5"}
                  strokeDasharray={isHovered ? "none" : "2,2"}
                  filter={
                    isHovered
                      ? isUnlocked
                        ? "url(#partition-glow-emerald)"
                        : "url(#partition-glow-amber)"
                      : "none"
                  }
                  className="transition-all duration-200 pointer-events-auto cursor-pointer"
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

                {/* Uniform, consistent luminous beacon aura when hovered (identical size on all 12 regions) */}
                {isHovered && (
                  <span className={`absolute -inset-1.5 sm:-inset-2 rounded-full border-2 ${
                    isUnlocked ? "border-emerald-500 bg-emerald-500/20" : "border-amber-400 bg-amber-400/25"
                  } animate-pulse pointer-events-none`} />
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

            // Pins in the northern/upper half (Hokkaido, Tohoku) show popup BELOW the pin (isTopArea = true)
            // Pins in the southern/central half show popup ABOVE the pin (isTopArea = false)
            const isTopArea = activeHoveredPin.y < 48;
            const isNearLeft = activeHoveredPin.x < 24;
            const isNearRight = activeHoveredPin.x > 76;

            const pointerAlignment = isNearLeft
              ? "self-start ml-8"
              : isNearRight
              ? "self-end mr-8"
              : "self-center";

            return (
              <div
                key={`tooltip-anchor-${activeHoveredPin.id}`}
                className="absolute z-50 pointer-events-none"
                style={{ 
                  left: `${activeHoveredPin.x}%`,
                  top: `${activeHoveredPin.y}%`,
                  transform: isTopArea 
                    ? (isNearLeft ? "translate(-15%, 16px)" : isNearRight ? "translate(-85%, 16px)" : "translate(-50%, 16px)")
                    : (isNearLeft ? "translate(-15%, -100%)" : isNearRight ? "translate(-85%, -100%)" : "translate(-50%, -100%)"),
                  marginTop: isTopArea ? "0px" : "-12px"
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: isTopArea ? -6 : 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: isTopArea ? -6 : 6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  {/* If card is BELOW pin (isTopArea = true), triangle is at TOP of card pointing UP to pin */}
                  {isTopArea && (
                    <div 
                      className={`w-0 h-0 border-l-[9px] border-r-[9px] border-b-[9px] border-transparent border-b-[#fcfaf3] drop-shadow-[0_-3px_5px_rgba(27,46,36,0.15)] relative -bottom-[1px] z-10 ${pointerAlignment}`}
                    />
                  )}

                  {/* Tooltip Card Body: Ghibli Warm Japanese Parchment Theme (Matching the website palette) */}
                  <div 
                    onMouseEnter={handleMouseEnterTooltip}
                    onMouseLeave={handleMouseLeaveTooltip}
                    className="bg-[#fcfaf3] border-2 border-[#547365]/80 ring-2 ring-[#eedba5] shadow-[0_18px_40px_rgba(27,46,36,0.22),0_4px_12px_rgba(0,0,0,0.08)] rounded-2xl p-4 sm:p-5 max-w-[285px] sm:max-w-[310px] w-[275px] sm:w-[295px] text-center flex flex-col items-center relative overflow-hidden pointer-events-auto"
                  >
                    {/* Gentle Ghibli Sage & Bamboo Top Trim */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#9cbfae] via-[#eedba5] to-[#9cbfae]" />

                    {/* Header with Warm Japanese Lantern and Title */}
                    <div className="flex items-center justify-center gap-2 w-full mb-1.5 mt-0.5">
                      <div className="w-5 h-5 shrink-0 drop-shadow-xs">
                        <svg viewBox="0 0 20 20" className="w-full h-full">
                          <g>
                            <rect x="6" y="0" width="8" height="2" fill="#451a03" />
                            <rect x="4" y="2" width="12" height="2" fill="#78350f" />
                            <rect x="4" y="4" width="12" height="12" fill={isFuture ? "#9ca3af" : isPast ? "#b45309" : "#d97706"} className={isCurrent ? "animate-pulse" : ""} />
                            <rect x="6" y="6" width="8" height="8" fill={isFuture ? "#d1d5db" : isPast ? "#d97706" : "#fcd34d"} />
                            <rect x="8" y="8" width="4" height="4" fill={isFuture ? "#f3f4f6" : isPast ? "#fef3c7" : "#fffbeb"} />
                            <rect x="4" y="16" width="12" height="2" fill="#78350f" />
                            <rect x="6" y="18" width="8" height="2" fill="#451a03" />
                          </g>
                        </svg>
                      </div>

                      <h4 className="font-serif font-bold text-[#1b2e24] text-base leading-tight tracking-wide">
                        {activeHoveredPin.name}
                      </h4>
                    </div>

                    {/* Subtext */}
                    <p className="text-xs text-[#547365] font-sans font-medium leading-relaxed mb-2.5 w-full text-center">
                      {isUnlocked 
                        ? "Explore travel letters & lore" 
                        : isCurrent
                        ? `${monthName} Dispatch • Available Now`
                        : isPast
                        ? `${monthName} Dispatch • Past Archive`
                        : `Scheduled for ${monthName}`}
                    </p>

                    {/* Shipping logistics status banner: Generous layout without any text cut-off */}
                    {isCurrent && (
                      <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-bold font-sans shadow-2xs flex items-center justify-center gap-2 w-full text-center animate-pulse">
                        <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                        <span>{monthName}: Active Monthly Dispatch</span>
                      </div>
                    )}
                    {isPast && (
                      <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-[#f4efe4] border border-[#dcd3b9] text-[#547365] text-xs font-medium font-sans flex items-center justify-center gap-2 w-full text-center">
                        <Archive className="w-4 h-4 text-[#8c6b45] shrink-0" />
                        <span>{monthName}: Past Archive (Kit order)</span>
                      </div>
                    )}
                    {isFuture && (
                      <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium font-sans flex items-center justify-center gap-2 w-full text-center">
                        <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                        <span>{monthName}: Coming Soon</span>
                      </div>
                    )}

                    {/* State-Awareness Banner */}
                    <div className={`text-[10px] font-mono font-semibold py-1 px-2 rounded-lg mb-3 w-full text-center leading-normal border ${
                      isUnlocked
                        ? "text-emerald-900 bg-emerald-50 border-emerald-200"
                        : isCurrent
                        ? "text-amber-900 bg-amber-50/80 border-amber-200"
                        : "text-stone-700 bg-stone-100 border-stone-200"
                    }`}>
                      {isUnlocked 
                        ? `${activeHoveredPin.name} | Unlocked in Journal` 
                        : isCurrent 
                        ? `${activeHoveredPin.name} | Subscribe to Unlock` 
                        : isPast
                        ? `${activeHoveredPin.name} | Archived Dispatch (Locked)`
                        : `${activeHoveredPin.name} | Coming Soon (Locked)`}
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={() => onSelectRegion(activeHoveredPin.id)}
                      className={`text-xs font-serif font-bold py-2 px-4 rounded-xl w-full shadow-2xs transition-all cursor-pointer hover:scale-[1.01] active:scale-95 ${
                        isUnlocked
                          ? "bg-[#527e69] hover:bg-[#3d604f] text-white"
                          : isCurrent
                          ? "bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shadow-amber-500/20"
                          : isPast
                          ? "bg-[#e8decb] hover:bg-[#ded1bc] text-[#3d5a49] border border-[#dcd3b9]"
                          : "bg-stone-200 hover:bg-stone-300 text-stone-600"
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

                  {/* If card is ABOVE pin (isTopArea = false), triangle is at BOTTOM of card pointing DOWN to pin */}
                  {!isTopArea && (
                    <div 
                      className={`w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-transparent border-t-[#fcfaf3] drop-shadow-[0_3px_5px_rgba(27,46,36,0.15)] relative -top-[1px] z-10 ${pointerAlignment}`}
                    />
                  )}
                </motion.div>
              </div>
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
