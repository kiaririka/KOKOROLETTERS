/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, Lock, Unlock, Clock, Truck, CheckCircle, Package, Sparkles, Archive, 
  ChevronLeft, ChevronRight, Compass, Image as ImageIcon, X, Maximize2 
} from "lucide-react";
import { REGIONS_METADATA, LORE_DATA, getRegionMonthStatus, getMonthName, getCurrentMonthNumber } from "../data/lore.ts";
import MapThreeCanvas, { AnimationMode } from "./MapThreeCanvas.tsx";

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

export default function JapanMap({
  unlockedRegions,
  activeRegionId,
  justUnlockedRegionId,
  onSelectRegion,
  regionsList,
isSubscriber = false
}: JapanMapProps) {
  const currentCalMonth = getCurrentMonthNumber();
  const [trackerIndex, setTrackerIndex] = useState(() => Math.max(0, currentCalMonth - 1));
  const [animationMode, setAnimationMode] = useState<AnimationMode>("sakura");
  const [mapVisualMode, setMapVisualMode] = useState<"parchment" | "living">("parchment");
  const [enlargedImageRegion, setEnlargedImageRegion] = useState<string | null>(null);
  // Define coordinates and stylized path/shape descriptors for the 12 regions on a 500x500 map canvas
  const mapRegions = [
    {
      id: "hokkaido",
      name: "Hokkaido",
      month: 1, // January
      path: "M 320,60 L 420,40 L 460,90 L 380,120 L 340,110 Z",
      labelX: 380,
      labelY: 80,
    },
    {
      id: "tohoku",
      name: "Tohoku",
      month: 2, // February
      path: "M 320,130 L 350,130 L 350,190 L 310,210 L 290,170 Z",
      labelX: 325,
      labelY: 170,
    },
    {
      id: "shinshu",
      name: "Shinshu (Alps)",
      month: 3, // March
      path: "M 290,170 L 310,210 L 290,235 L 260,220 Z",
      labelX: 285,
      labelY: 200,
    },
    {
      id: "kanto",
      name: "Kanto (Tokyo)",
      month: 4, // April
      path: "M 310,210 L 330,230 L 315,270 L 280,260 L 290,235 Z",
      labelX: 305,
      labelY: 245,
    },
    {
      id: "chubu",
      name: "Chubu (Fuji)",
      month: 5, // May
      path: "M 260,220 L 290,235 L 280,260 L 250,270 L 225,245 Z",
      labelX: 255,
      labelY: 245,
    },
    {
      id: "iseshima",
      name: "Ise-Shima",
      month: 6, // June
      path: "M 230,270 L 250,270 L 245,295 L 225,290 Z",
      labelX: 238,
      labelY: 285,
    },
    {
      id: "kansai",
      name: "Kansai (Kyoto)",
      month: 7, // July
      path: "M 225,245 L 250,270 L 225,290 L 195,290 L 185,255 Z",
      labelX: 208,
      labelY: 270,
    },
    {
      id: "chugoku",
      name: "Chugoku",
      month: 8, // August
      path: "M 185,255 L 195,290 L 115,305 L 110,275 Z",
      labelX: 150,
      labelY: 280,
    },
    {
      id: "seto",
      name: "Seto Inland Sea",
      month: 9, // September
      path: "M 115,305 L 180,295 L 175,310 L 110,315 Z",
      labelX: 145,
      labelY: 305,
    },
    {
      id: "shikoku",
      name: "Shikoku",
      month: 10, // October
      path: "M 110,315 L 170,310 L 160,345 L 105,335 Z",
      labelX: 135,
      labelY: 330,
    },
    {
      id: "kyushu",
      name: "Kyushu",
      month: 11, // November
      path: "M 65,310 L 105,310 L 95,380 L 55,370 L 50,335 Z",
      labelX: 75,
      labelY: 345,
    },
    {
      id: "okinawa",
      name: "Okinawa",
      month: 12, // December
      path: "M 40,430 L 120,430 L 110,460 L 30,450 Z",
      labelX: 75,
      labelY: 445,
    }
  ];

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // JavaScript logic to handle dynamic coordinate positioning based on the SVG region path's screen coordinates
  const updateTooltipPosition = (e: React.MouseEvent<SVGPathElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      // Get the clicked path's screen coordinates relative to the container
      const pathCenterX = rect.left - containerRect.left + rect.width / 2;
      const pathTopY = rect.top - containerRect.top;
      
      // Compact Tooltip dimensions
      const tooltipWidth = 210;
      const tooltipHeight = 140;
      
      // Subtract the tooltip's width and height to ensure it is centered and slightly above the clicked region path
      const calculatedLeft = pathCenterX - tooltipWidth / 2;
      const calculatedTop = pathTopY - tooltipHeight - 12; // offsetting slightly so it doesn't cover the path
      
      setTooltipPos({
        x: calculatedLeft,
        y: calculatedTop
      });
    }
  };

  const handleMouseEnterRegion = (e: React.MouseEvent<SVGPathElement>, regionId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredRegion(regionId);
    updateTooltipPosition(e);
  };

  const handleMouseLeaveRegion = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredRegion(null);
    }, 400); // 400ms delay to smoothly transition to the tooltip card
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
    }, 400);
  };

  const currentMonthRegionId = REGIONS_METADATA.find(m => m.month === currentCalMonth)?.region_id || "kyushu";
  const displayRegionId = hoveredRegion || activeRegionId || currentMonthRegionId;
  const displayRegionMeta = REGIONS_METADATA.find(m => m.region_id === displayRegionId);
  const displayRegionLore = LORE_DATA[displayRegionId];
  const displayRegionMonthStatus = displayRegionMeta ? getRegionMonthStatus(displayRegionMeta.month) : "past";
  const displayRegionMonthName = displayRegionMeta ? getMonthName(displayRegionMeta.month) : "";
  const isDisplayRegionUnlocked = (unlockedRegions || []).includes(displayRegionId);

  // Active coordinates for the Three.js 3D beacon
  const targetedRegionObj = mapRegions.find(r => r.id === (activeRegionId || displayRegionId));
  const activeBeaconCoords = targetedRegionObj ? { x: targetedRegionObj.labelX, y: targetedRegionObj.labelY } : null;

  return (
    <div id="interactive-japan-map" className="relative bg-stone-50/50 p-6 rounded-3xl border border-stone-200/80 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-800 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-stone-600" />
            Interactive Map
          </h3>
          <p className="text-xs text-stone-500">Select a region to explore or stamp</p>
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <span className="flex items-center gap-1 text-stone-400">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Locked
          </span>
          <span className="flex items-center gap-1 text-amber-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm animate-pulse" /> Unlocked
          </span>
        </div>
      </div>

      {/* Interactive Visual Showcase Card with Image & 3D Controls */}
      <div className="mb-4 bg-gradient-to-r from-white to-[#fbf9f4] border border-stone-200/90 rounded-2xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden">
        {/* Left: Thumbnail with Ken-Burns zoom & Click to Enlarge */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div 
            onClick={() => setEnlargedImageRegion(displayRegionId)}
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shadow-xs cursor-pointer group shrink-0 border border-stone-200"
            title="Click to view full-resolution regional photography"
          >
            {displayRegionLore?.assets_url ? (
              <img
                src={displayRegionLore.assets_url}
                alt={displayRegionMeta?.region_name || "Japan"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />
            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white p-1 rounded-md text-[9px]">
              <Maximize2 className="w-2.5 h-2.5" />
            </div>
            {/* Hanko Stamp Pill on image */}
            <span className="absolute top-1 left-1 bg-white/95 backdrop-blur-xs text-[#991b1b] text-[8px] font-serif font-bold px-1.5 py-0.5 rounded shadow-2xs">
              {REGION_KANJI[displayRegionId] || "日本"}
            </span>
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                Month {displayRegionMeta?.month}: {displayRegionMonthName}
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.2 rounded-full border ${
                isDisplayRegionUnlocked
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                  : displayRegionMonthStatus === "current"
                  ? "bg-amber-50 text-amber-900 border-amber-200 font-bold animate-pulse"
                  : displayRegionMonthStatus === "past"
                  ? "bg-stone-100 text-stone-600 border-stone-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {isDisplayRegionUnlocked 
                  ? "Unlocked" 
                  : displayRegionMonthStatus === "current" 
                  ? "Active Dispatch" 
                  : displayRegionMonthStatus === "past" 
                  ? "Past Archive" 
                  : "Upcoming"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="font-serif font-bold text-stone-900 text-base tracking-tight truncate">
                {displayRegionMeta?.region_name}
              </h4>
              <span className="text-xs font-serif text-stone-500 font-medium">
                {REGION_KANJI[displayRegionId]}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-1 italic font-serif">
              {displayRegionLore?.lore_content?.split("\n\n")?.[1] || "A slow-living journey celebrating the spirit world of Japan."}
            </p>
          </div>
        </div>

        {/* Right: Layer Mode & Three.js 3D Animation Switch */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-stone-200/60">
          {/* Visual Layer Mode Toggle */}
          <div className="inline-flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-[10px] font-medium">
            <button
              onClick={() => setMapVisualMode("parchment")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                mapVisualMode === "parchment"
                  ? "bg-white text-stone-800 shadow-2xs font-semibold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              title="Antique Cartography Map with calligraphy"
            >
              <Compass className="w-3 h-3" />
              <span>Cartography</span>
            </button>
            <button
              onClick={() => setMapVisualMode("living")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                mapVisualMode === "living"
                  ? "bg-white text-stone-800 shadow-2xs font-semibold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              title="Living Photographic Realm backdrop"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Living Realm</span>
            </button>
          </div>

          {/* Three.js 3D Animation Toggle */}
          <button
            onClick={() => {
              setAnimationMode(prev => prev === "sakura" ? "spirits" : prev === "spirits" ? "off" : "sakura");
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              animationMode === "sakura"
                ? "bg-pink-50 border-pink-200 text-pink-900 hover:bg-pink-100"
                : animationMode === "spirits"
                ? "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                : "bg-white border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50"
            }`}
            title="Toggle Three.js 3D particle animations"
          >
            {animationMode === "sakura" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <span>🌸 3D Sakura Wind</span>
              </>
            ) : animationMode === "spirits" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>✨ 3D Spirit Lights</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-stone-300" />
                <span>3D Animation: Off</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative aspect-square w-full bg-[#fdfbf6] rounded-2xl border border-stone-200/50 overflow-hidden shadow-inner">
        {/* Living Photographic Realm Background Layer */}
        {mapVisualMode === "living" && displayRegionLore?.assets_url && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
            <motion.img
              key={displayRegionId}
              src={displayRegionLore.assets_url}
              alt="Living Landscape"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.38, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              className="w-full h-full object-cover filter blur-[0.5px] brightness-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf2]/90 via-[#fcfaf2]/60 to-[#fcfaf2]/80 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Three.js 3D Interactive Animation Layer */}
        <MapThreeCanvas
          activeRegionCoords={activeBeaconCoords}
          animationMode={animationMode}
          hoveredRegionId={hoveredRegion}
        />

        <svg
          viewBox="0 0 500 500"
          className="w-full h-full select-none relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cartography Background Layer: Waves, Compass & Mt. Fuji */}
          {mapVisualMode === "parchment" && (
            <g className="pointer-events-none select-none">
              {/* Antique Japanese Nautical Compass Rose */}
              <g transform="translate(48, 65) scale(0.85)" className="opacity-45">
                <circle cx="0" cy="0" r="28" fill="none" stroke="#78716c" strokeWidth="0.8" strokeDasharray="2 2" />
                <circle cx="0" cy="0" r="22" fill="none" stroke="#78716c" strokeWidth="1.2" />
                <line x1="0" y1="-26" x2="0" y2="26" stroke="#78716c" strokeWidth="0.8" />
                <line x1="-26" y1="0" x2="26" y2="0" stroke="#78716c" strokeWidth="0.8" />
                {/* Needle */}
                <polygon points="0,-22 4,-4 0,0 -4,-4" fill="#991b1b" opacity="0.85" />
                <polygon points="0,22 4,4 0,0 -4,4" fill="#57534e" opacity="0.6" />
                {/* Kanji Cardinals */}
                <text x="0" y="-12" textAnchor="middle" fontSize="6.5" fontFamily="serif" fontWeight="bold" fill="#991b1b">北</text>
                <text x="14" y="2.5" textAnchor="middle" fontSize="6" fontFamily="serif" fill="#78716c">東</text>
                <text x="0" y="16" textAnchor="middle" fontSize="6" fontFamily="serif" fill="#78716c">南</text>
                <text x="-14" y="2.5" textAnchor="middle" fontSize="6" fontFamily="serif" fill="#78716c">西</text>
              </g>

              {/* Decorative Sea Waves in Sea of Japan and Pacific Ocean */}
              <g className="opacity-35 stroke-stone-400" fill="none" strokeWidth="0.8">
                <path d="M 160,110 Q 165,106 170,110 T 180,110 M 185,110 Q 190,106 195,110" />
                <path d="M 140,140 Q 145,136 150,140 T 160,140 M 165,140 Q 170,136 175,140" />
                <path d="M 360,280 Q 365,276 370,280 T 380,280 M 385,280 Q 390,276 395,280" />
                <path d="M 340,320 Q 345,316 350,320 T 360,320" />
              </g>

              {/* Calligraphic Sea Watermarks */}
              <text x="175" y="150" className="text-[10px] font-serif fill-stone-400/60 tracking-widest">日本海 (Sea of Japan)</text>
              <text x="350" y="315" className="text-[10px] font-serif fill-stone-400/60 tracking-widest">太平洋 (Pacific Ocean)</text>

              {/* Mt. Fuji Stylized Peak */}
              <g transform="translate(255, 230) scale(0.65)" className="opacity-45">
                <path d="M -12,12 L 0,-6 L 12,12 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="0.8" />
                <path d="M -4,0 L 0,-6 L 4,0 Q 2,2 0,0 Q -2,2 -4,0 Z" fill="#ffffff" />
                <text x="0" y="20" textAnchor="middle" fontSize="7" fontFamily="serif" fill="#78716c">富士山</text>
              </g>
            </g>
          )}

          {/* Map Inset lines for Okinawa */}
          <line x1="10" y1="410" x2="150" y2="410" stroke="#e5e5e7" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="150" y1="410" x2="150" y2="490" stroke="#e5e5e7" strokeWidth="1" strokeDasharray="3 3" />
          <text x="15" y="425" className="text-[10px] font-mono fill-stone-400">Okinawa Inset</text>

          {/* 1. Region Paths */}
          {mapRegions.map((region) => {
            const isUnlocked = unlockedRegions.includes(region.id);
            const isActive = activeRegionId === region.id;
            const meta = REGIONS_METADATA.find(m => m.region_id === region.id);
            const monthStatus = meta ? getRegionMonthStatus(meta.month) : "past";
            const isPast = monthStatus === "past";
            const isCurrent = monthStatus === "current";

            return (
              <motion.path
                key={`path-${region.id}`}
                d={region.path}
                onClick={(e) => {
                  updateTooltipPosition(e);
                  onSelectRegion(region.id);
                }}
                className="cursor-pointer transition-all focus:outline-none"
                initial={{ fill: "#e5e5e5" }}
                animate={{
                  fill: isUnlocked 
                    ? (isActive ? "#527e69" : "#9cbfae") 
                    : isCurrent 
                    ? (isActive ? "#f59e0b" : "#fef3c7")
                    : isPast 
                    ? (isActive ? "#d6d3d1" : "#f5f5f4") 
                    : (isActive ? "#e7e5e4" : "#fafaf9"),
                  stroke: isUnlocked 
                    ? "#2d4438" 
                    : isCurrent 
                    ? "#d97706"
                    : isPast 
                    ? "#a8a29e" 
                    : "#d6d3d1",
                  strokeWidth: isActive ? 2 : 1,
                }}
                whileHover={{ 
                  scale: 1.02,
                  filter: "drop-shadow(0px 8px 12px rgba(0,0,0,0.18)) brightness(1.02)",
                  transition: { duration: 0.15 }
                }}
                onMouseEnter={(e) => handleMouseEnterRegion(e, region.id)}
                onMouseLeave={handleMouseLeaveRegion}
                style={{ transformOrigin: `${region.labelX}px ${region.labelY}px` }}
              />
            );
          })}

          {/* 2. Visual Connectors / Markers */}
          {mapRegions.map((region) => {
            const isUnlocked = unlockedRegions.includes(region.id);
            const isActive = activeRegionId === region.id;
            const meta = REGIONS_METADATA.find(m => m.region_id === region.id);
            const monthStatus = meta ? getRegionMonthStatus(meta.month) : "past";
            const isCurrent = monthStatus === "current";
            const isPast = monthStatus === "past";

            return (
              <g key={`label-${region.id}`} className="pointer-events-none">
                {isCurrent && (
                  <motion.circle
                    cx={region.labelX}
                    cy={region.labelY}
                    r="8"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="1.5"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.7, 0.1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  />
                )}
                <circle 
                  cx={region.labelX} 
                  cy={region.labelY} 
                  r={isCurrent ? "5" : "3.5"} 
                  fill={
                    isUnlocked 
                      ? "#10b981" 
                      : isCurrent 
                      ? "#f59e0b" 
                      : isPast 
                      ? "#a8a29e" 
                      : "#d6d3d1"
                  }
                />
                <text 
                  x={region.labelX + 8} 
                  y={region.labelY + 3.5} 
                  className={`text-[8.5px] font-serif select-none pointer-events-none transition-all ${
                    isActive || hoveredRegion === region.id 
                      ? 'fill-stone-900 font-bold opacity-100' 
                      : 'fill-stone-500 opacity-60'
                  }`}
                >
                  {REGION_KANJI[region.id]}
                </text>
              </g>
            );
          })}

          {/* Stamp Animation Overlay */}
          <AnimatePresence>
            {justUnlockedRegionId && (() => {
              const reg = mapRegions.find(r => r.id === justUnlockedRegionId);
              if (!reg) return null;
              return (
                <motion.g
                  key={`stamp-effect-${reg.id}`}
                  className="pointer-events-none"
                >
                  {/* Soft ink ripple */}
                  <motion.circle
                    cx={reg.labelX}
                    cy={reg.labelY}
                    r="10"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="1.75"
                    initial={{ scale: 0.7, opacity: 0.75 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    style={{ transformOrigin: `${reg.labelX}px ${reg.labelY}px` }}
                  />
                  <motion.circle
                    cx={reg.labelX}
                    cy={reg.labelY}
                    r="10"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="1.25"
                    initial={{ scale: 0.8, opacity: 0.55 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.9, delay: 0.12, ease: "easeOut" }}
                    style={{ transformOrigin: `${reg.labelX}px ${reg.labelY}px` }}
                  />

                  {/* Hanko-style postal seal stamp */}
                  <motion.g
                    initial={{ scale: 2.1, opacity: 0, rotate: -22 }}
                    animate={{ scale: [2.1, 0.93, 1], opacity: [0, 1, 1], rotate: -10 }}
                    exit={{ scale: 1.06, opacity: 0 }}
                    transition={{ duration: 0.45, times: [0, 0.72, 1], ease: "easeOut" }}
                    style={{ transformOrigin: `${reg.labelX}px ${reg.labelY}px` }}
                  >
                    <circle
                      cx={reg.labelX}
                      cy={reg.labelY}
                      r="17"
                      fill="#fbf9f4"
                      fillOpacity="0.92"
                      stroke="#991b1b"
                      strokeWidth="1.75"
                    />
                    <circle
                      cx={reg.labelX}
                      cy={reg.labelY}
                      r="13.5"
                      fill="none"
                      stroke="#991b1b"
                      strokeWidth="0.85"
                      strokeDasharray="2 1.5"
                    />
                    <text
                      x={reg.labelX}
                      y={reg.labelY - 1.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#991b1b"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="serif"
                    >
                      心
                    </text>
                    <text
                      x={reg.labelX}
                      y={reg.labelY + 8.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#991b1b"
                      fontSize="4.5"
                      fontWeight="bold"
                      letterSpacing="0.8"
                    >
                      STAMPED
                    </text>
                  </motion.g>
                </motion.g>
              );
            })()}
          </AnimatePresence>

          
        </svg>


        
        {/* Hover Tooltip Overlay (HTML UI) */}
        <AnimatePresence>
          {hoveredRegion && (() => {
            const activeHoveredRegion = mapRegions.find(r => r.id === hoveredRegion);
            if (!activeHoveredRegion) return null;
            const isUnlocked = unlockedRegions.includes(activeHoveredRegion.id);
            const hoveredMeta = REGIONS_METADATA.find(m => m.region_id === activeHoveredRegion.id);
            const monthStatus = hoveredMeta ? getRegionMonthStatus(hoveredMeta.month) : "past";
            const monthName = hoveredMeta ? getMonthName(hoveredMeta.month) : "";
            const isPast = monthStatus === "past";
            const isCurrent = monthStatus === "current";
            const isFuture = monthStatus === "future";

            return (
              <motion.div
                key={`html-tooltip-${activeHoveredRegion.id}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute z-50 flex flex-col items-center pointer-events-none"
                style={{ 
                  position: "absolute",
                  left: tooltipPos ? `${tooltipPos.x}px` : `${(activeHoveredRegion.labelX / 500) * 100}%`,
                  top: tooltipPos ? `${tooltipPos.y}px` : `${(activeHoveredRegion.labelY / 500) * 100}%`,
                  transform: tooltipPos ? "none" : "translate(-50%, -100%)",
                }}
              >
                {/* Tooltip Card */}
                <div 
                  onMouseEnter={handleMouseEnterTooltip}
                  onMouseLeave={handleMouseLeaveTooltip}
                  className="bg-[#fcfaf2] border border-[#527e69]/40 shadow-xl rounded-2xl p-3.5 max-w-[220px] w-[210px] text-center flex flex-col items-center relative overflow-hidden pointer-events-auto"
                >
                  
                  {/* Header with Inline Lantern and Title */}
                  <div className="flex items-center justify-center gap-1.5 w-full mb-1">
                    <div className="w-5 h-5 shrink-0">
                      <svg viewBox="0 0 20 20" className="w-full h-full drop-shadow-xs">
                        <g>
                          <rect x="6" y="0" width="8" height="2" fill="#451a03" />
                          <rect x="4" y="2" width="12" height="2" fill="#78350f" />
                          <rect x="4" y="4" width="12" height="12" fill={isFuture ? "#9ca3af" : isPast ? "#78716c" : "#f59e0b"} className={isCurrent ? "animate-pulse" : ""} />
                          <rect x="6" y="6" width="8" height="8" fill={isFuture ? "#d1d5db" : isPast ? "#a8a29e" : "#fcd34d"} />
                          <rect x="8" y="8" width="4" height="4" fill={isFuture ? "#f3f4f6" : isPast ? "#e7e5e4" : "#fffbeb"} />
                          <rect x="4" y="16" width="12" height="2" fill="#78350f" />
                          <rect x="6" y="18" width="8" height="2" fill="#451a03" />
                        </g>
                      </svg>
                    </div>

                    <h4 className="font-serif font-bold text-[#2d4438] text-sm leading-tight">
                      {activeHoveredRegion.name}
                    </h4>
                  </div>

                  {/* Subtext */}
                  <p className="text-[10px] text-stone-500 font-medium leading-tight mb-2.5 w-full text-center">
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
                    <div className="mt-1 mb-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold font-mono animate-pulse flex items-center justify-center gap-1 w-full">
                      <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">{monthName}: Active Monthly Dispatch</span>
                    </div>
                  )}
                  {isPast && (
                    <div className="mt-1 mb-2 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 text-[9px] font-bold font-mono flex items-center justify-center gap-1 w-full">
                      <Archive className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="truncate">{monthName}: Past Archive (Kit order)</span>
                    </div>
                  )}
                  {isFuture && (
                    <div className="mt-1 mb-2 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-500 text-[9px] font-bold font-mono flex items-center justify-center gap-1 w-full">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{monthName}: Coming Soon</span>
                    </div>
                  )}

                  {/* State-Awareness Banner */}
                  <div className={`text-[9px] font-mono font-bold tracking-tight py-1 px-1.5 rounded-md mb-3 w-full text-center leading-normal ${
                    isUnlocked
                      ? "text-emerald-800 bg-emerald-50"
                      : isCurrent
                      ? "text-amber-800 bg-amber-50"
                      : "text-stone-600 bg-stone-100"
                  }`}>
                    {isUnlocked 
                      ? `${activeHoveredRegion.name} | Unlocked` 
                      : isCurrent 
                      ? `${activeHoveredRegion.name} | Subscribe to Unlock` 
                      : isPast
                      ? `${activeHoveredRegion.name} | Archived Dispatch (Locked)`
                      : `${activeHoveredRegion.name} | Coming Soon (Locked)`}
                  </div>

                  {/* Compact Button */}
                  <button 
                    onClick={() => onSelectRegion(activeHoveredRegion.id)}
                    className={`text-[10px] font-bold py-1.5 px-4 rounded-full w-full shadow-xs transition-all whitespace-nowrap cursor-pointer ${
                      isUnlocked
                        ? "bg-[#527e69] hover:bg-[#3d604f] active:scale-95 text-white"
                        : isCurrent
                        ? "bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-900 font-bold"
                        : isPast
                        ? "bg-stone-300 hover:bg-stone-400 text-stone-800"
                        : "bg-stone-200 hover:bg-stone-300 text-stone-600"
                    }`}
                  >
                    {isUnlocked 
                      ? "View Region" 
                      : isCurrent 
                      ? (isSubscriber ? "Stamp Journal" : "Subscribe to Unlock →") 
                      : isPast
                      ? "Archived Dispatch"
                      : "Coming Soon"}
                  </button>
                </div>
                
                {/* Triangle pointer */}
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent border-t-[#527e69]/30 mt-0 drop-shadow-xs relative">
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent border-t-[#fcfaf2] absolute -top-[9px] -left-[8px]"></div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
        {/* Legend Overlay / In-map status */}

        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-stone-200/80 text-[10px] font-mono text-stone-600 shadow-sm flex items-center gap-1">
          <Unlock className="w-3 h-3 text-emerald-600" />
          <span>{unlockedRegions.length} of 12 Unlocked</span>
        </div>
      </div>

      {/* Grid list of regions for easy keyboard accessibility (responsive & overflow-safe) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
        {regionsList.map((r) => {
          const isUnlocked = unlockedRegions.includes(r.region_id);
          const isActive = activeRegionId === r.region_id;
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
            <motion.button
              key={r.region_id}
              onClick={() => {
                onSelectRegion(r.region_id);
              }}
              animate={
                isJustUnlocked
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-medium transition-all text-left cursor-pointer min-w-0 overflow-hidden ${
                isJustUnlocked
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300/60 shadow-sm"
                  : isActive
                  ? isUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs"
                    : isCurrent
                    ? "bg-amber-100 border-amber-300 text-amber-950 ring-1 ring-amber-300 shadow-xs"
                    : "bg-stone-100 border-stone-300 text-stone-700 shadow-xs"
                  : isUnlocked
                  ? "bg-white border-emerald-100 hover:border-emerald-200 text-emerald-800"
                  : isCurrent
                  ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:border-amber-300"
                  : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200 hover:text-stone-600"
              }`}
            >
              {isUnlocked ? (
                <Unlock className={`w-3.5 h-3.5 shrink-0 ${isActive || isJustUnlocked ? 'text-emerald-700' : 'text-emerald-600'}`} />
              ) : isCurrent ? (
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-600 animate-pulse" />
              ) : isPast ? (
                <Archive className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 shrink-0 text-stone-300" />
              )}
              <div className="min-w-0 flex-1 overflow-hidden leading-tight">
                <span className="truncate block font-semibold text-stone-800">{r.region_name}</span>
                <span className="text-[9px] block opacity-80 text-stone-500 font-mono truncate">{subLabel}</span>
              </div>
            </motion.button>
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
          <div className="mt-6 border-t border-stone-200/60 pt-5 space-y-3">
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
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMeta.region_id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? "bg-gradient-to-r from-amber-50/90 to-emerald-50/50 border-amber-200/80 shadow-xs"
                    : isPast
                    ? "bg-stone-50/80 border-stone-200/80"
                    : "bg-stone-50/50 border-stone-200/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-amber-100 text-amber-800 animate-pulse"
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
              </motion.div>
            </AnimatePresence>

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

      {/* Interactive High-Resolution Regional Image Inspection Modal */}
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
