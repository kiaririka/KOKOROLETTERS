const fs = require('fs');
let file = fs.readFileSync('src/components/JapanMap.tsx', 'utf8');

// 1. Add isSubscriber prop
file = file.replace(
  'interface JapanMapProps {',
  'interface JapanMapProps {\n  isSubscriber?: boolean;'
);

file = file.replace(
  /export default function JapanMap\(\{([\s\S]*?)\}: JapanMapProps\) \{/,
  'export default function JapanMap({$1, isSubscriber = false}: JapanMapProps) {'
);

// 2. Remove old SVG tooltip
const oldTooltipStart = '{/* 3. Hover Tooltip (Rendered last to stay on top) */}';
const oldTooltipEnd = '</svg>';
const tooltipIndex = file.indexOf(oldTooltipStart);
if (tooltipIndex > -1) {
  const endSvgIndex = file.indexOf(oldTooltipEnd, tooltipIndex);
  file = file.substring(0, tooltipIndex) + '\n        </svg>\n' + file.substring(endSvgIndex + oldTooltipEnd.length);
}

// 3. Add new HTML tooltip overlay and update region hover effect
const newOverlay = `
        {/* Hover Tooltip Overlay (HTML UI) */}
        {mapRegions.map((region) => {
          const isUnlocked = unlockedRegions.includes(region.id);
          return (
            <AnimatePresence key={\`html-tooltip-\${region.id}\`}>
              {hoveredRegion === region.id && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute z-50 flex flex-col items-center"
                  style={{ 
                    left: \`\${(region.labelX / 500) * 100}%\`,
                    top: \`\${(region.labelY / 500) * 100}%\`,
                    transform: 'translate(-50%, -100%)',
                    marginTop: '-16px' // offset above the dot
                  }}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  {/* Tooltip Card */}
                  <div className="bg-[#fbf9f4] border border-[#769382]/60 shadow-2xl rounded-3xl p-5 w-56 text-center flex flex-col items-center relative overflow-hidden pointer-events-auto">
                    
                    {/* The pixelated Lantern */}
                    <div className="w-9 h-9 mb-3">
                      <svg viewBox="0 0 20 20" className="w-full h-full drop-shadow-sm">
                        <g transform="translate(0, 0)">
                          <rect x="6" y="0" width="8" height="2" fill="#451a03" />
                          <rect x="4" y="2" width="12" height="2" fill="#78350f" />
                          <rect x="4" y="4" width="12" height="12" fill="#f59e0b" className="animate-pulse" />
                          <rect x="6" y="6" width="8" height="8" fill="#fcd34d" />
                          <rect x="8" y="8" width="4" height="4" fill="#fffbeb" />
                          <rect x="4" y="16" width="12" height="2" fill="#78350f" />
                          <rect x="6" y="18" width="8" height="2" fill="#451a03" />
                        </g>
                      </svg>
                    </div>

                    <h4 className="font-serif font-bold text-[#2d4438] text-xl leading-tight mb-1">
                      {region.name}
                    </h4>
                    
                    <p className="text-[10px] font-semibold text-[#527e69] uppercase tracking-widest mb-4 leading-tight opacity-90">
                      {isUnlocked 
                        ? "Journey Active\\nClick to Enter" 
                        : "Click to Unlock\\nJourney"}
                    </p>

                    <button 
                      onClick={() => onSelectRegion(region.id)}
                      className="bg-[#527e69] hover:bg-[#3d604f] active:scale-95 text-white text-[11px] font-bold py-2.5 px-6 rounded-full w-full shadow-sm transition-all whitespace-nowrap"
                    >
                      {isUnlocked ? "View Region" : (isSubscriber ? "Check Status" : "Get your ticket")}
                    </button>
                  </div>
                  
                  {/* Triangle pointer */}
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-transparent border-t-[#769382]/60 mt-0 drop-shadow-md relative">
                    <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-transparent border-t-[#fbf9f4] absolute -top-[11px] -left-[10px]"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
        {/* Legend Overlay / In-map status */}
`;

// Insert new overlay after the SVG
file = file.replace('{/* Legend Overlay / In-map status */}', newOverlay);

// Enhance the hover effect of the regions (shadow lift)
file = file.replace(
  'filter: "brightness(0.95)"',
  'filter: "drop-shadow(0px 8px 12px rgba(0,0,0,0.18)) brightness(1.02)"'
);

fs.writeFileSync('src/components/JapanMap.tsx', file);
console.log("Updated Tooltip and Hover effect successfully.");
