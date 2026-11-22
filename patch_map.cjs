const fs = require('fs');
let file = fs.readFileSync('src/components/JapanMap.tsx', 'utf8');

const oldSVG = file.substring(
    file.indexOf('{/* 1. Region Paths */}'),
    file.indexOf('</svg>')
);

const newSVG = `{/* 1. Region Paths */}
          {mapRegions.map((region) => {
            const isUnlocked = unlockedRegions.includes(region.id);
            const isActive = activeRegionId === region.id;
            return (
              <motion.path
                key={\`path-\${region.id}\`}
                d={region.path}
                onClick={() => {
                  onSelectRegion(region.id);
                }}
                className="cursor-pointer transition-all focus:outline-none"
                initial={{ fill: "#e5e5e5" }}
                animate={{
                  fill: isUnlocked 
                    ? (isActive ? "#527e69" : "#9cbfae") 
                    : (isActive ? "#eedba5" : "#faf6eb"),
                  stroke: isUnlocked 
                    ? "#2d4438" 
                    : "#d1c6a5",
                  strokeWidth: isActive ? 2 : 1,
                }}
                whileHover={{ 
                  scale: 1.02,
                  filter: "brightness(0.95)",
                  transition: { duration: 0.15 }
                }}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{ transformOrigin: \`\${region.labelX}px \${region.labelY}px\` }}
              />
            );
          })}

          {/* 2. Visual Connectors / Markers */}
          {mapRegions.map((region) => {
            const isUnlocked = unlockedRegions.includes(region.id);
            return (
              <g key={\`label-\${region.id}\`} className="pointer-events-none">
                <circle 
                  cx={region.labelX} 
                  cy={region.labelY} 
                  r="3.5" 
                  fill={isUnlocked ? "#10b981" : "#8c7e5a"}
                />
              </g>
            );
          })}

          {/* 3. Hover Tooltip (Rendered last to stay on top) */}
          {mapRegions.map((region) => {
            const isUnlocked = unlockedRegions.includes(region.id);
            return (
              <AnimatePresence key={\`tooltip-\${region.id}\`}>
                {hoveredRegion === region.id && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="pointer-events-none"
                  >
                    <rect 
                      x={region.labelX - 45} 
                      y={region.labelY - 50} 
                      width="120" 
                      height="40" 
                      rx="4" 
                      fill="#1e293b" 
                      fillOpacity="0.95" 
                    />
                    {/* Pixelated Lantern Popup */}
                    <g transform={\`translate(\${region.labelX - 35}, \${region.labelY - 40}) scale(1.0)\`}>
                      <rect x="6" y="0" width="8" height="2" fill="#451a03" />
                      <rect x="4" y="2" width="12" height="2" fill="#78350f" />
                      
                      <rect x="4" y="4" width="12" height="12" fill="#f59e0b" className="animate-pulse" />
                      <rect x="6" y="6" width="8" height="8" fill="#fcd34d" />
                      <rect x="8" y="8" width="4" height="4" fill="#fffbeb" />
                      
                      <rect x="4" y="16" width="12" height="2" fill="#78350f" />
                      <rect x="6" y="18" width="8" height="2" fill="#451a03" />
                    </g>
                    <text
                      x={region.labelX + 25}
                      y={region.labelY - 32}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="bold"
                      className="font-mono"
                    >
                      {region.name}
                    </text>
                    <text
                      x={region.labelX + 25}
                      y={region.labelY - 18}
                      textAnchor="middle"
                      fill={isUnlocked ? "#34d399" : "#fbbf24"}
                      fontSize="9"
                      className="font-mono"
                    >
                      {isUnlocked 
                         ? "Unlocked - View Details" 
                         : "Click to Subscribe"}
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            );
          })}
        `;

file = file.replace(oldSVG, newSVG);
fs.writeFileSync('src/components/JapanMap.tsx', file);
