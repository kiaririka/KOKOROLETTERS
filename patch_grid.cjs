const fs = require('fs');
let file = fs.readFileSync('src/components/JapanMap.tsx', 'utf8');

const oldGrid = `      {/* Grid list of regions for easy keyboard accessibility */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {regionsList.map((r) => {
          const isUnlocked = unlockedRegions.includes(r.region_id);
          const isActive = activeRegionId === r.region_id;
          const isClickable = isUnlocked;
          return (
            <button
              key={r.region_id}
              onClick={() => {
                if (isClickable) onSelectRegion(r.region_id);
              }}
              disabled={!isClickable}
              className={\`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-medium transition-all text-left \${
                isActive
                  ? isUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs"
                    : "bg-amber-50 border-amber-200 text-amber-900 shadow-xs"
                  : isUnlocked
                  ? "bg-white border-emerald-100 hover:border-emerald-200 text-emerald-800"
                  : !isClickable 
                  ? "bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed opacity-60"
                  : "bg-white border-stone-100 hover:border-amber-200 text-stone-500"
              }\`}
            >
              {isUnlocked ? (
                <Unlock className={\`w-3 h-3 shrink-0 \${isActive ? 'text-emerald-700' : 'text-emerald-600'}\`} />
              ) : (
                <Lock className={\`w-3 h-3 shrink-0 \${isClickable ? 'text-amber-500' : 'text-stone-300'}\`} />
              )}
              <span className="truncate">{r.region_name}</span>
            </button>
          );
        })}
      </div>`;

const newGrid = `      {/* Grid list of regions for easy keyboard accessibility */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {regionsList.map((r) => {
          const isUnlocked = unlockedRegions.includes(r.region_id);
          const isActive = activeRegionId === r.region_id;
          return (
            <button
              key={r.region_id}
              onClick={() => {
                onSelectRegion(r.region_id);
              }}
              className={\`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-medium transition-all text-left \${
                isActive
                  ? isUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs"
                    : "bg-amber-50 border-amber-200 text-amber-900 shadow-xs"
                  : isUnlocked
                  ? "bg-white border-emerald-100 hover:border-emerald-200 text-emerald-800"
                  : "bg-stone-50 border-stone-100 text-stone-400 hover:border-amber-200 hover:text-stone-600"
              }\`}
            >
              {isUnlocked ? (
                <Unlock className={\`w-3 h-3 shrink-0 \${isActive ? 'text-emerald-700' : 'text-emerald-600'}\`} />
              ) : (
                <Lock className={\`w-3 h-3 shrink-0 text-amber-500\`} />
              )}
              <span className="truncate">{r.region_name}</span>
            </button>
          );
        })}
      </div>`;

if(file.includes('const isClickable = isUnlocked;')) {
    file = file.replace(oldGrid, newGrid);
    fs.writeFileSync('src/components/JapanMap.tsx', file);
    console.log("Updated grid buttons successfully.");
} else {
    console.log("Could not find the target grid layout. Manual inspection needed.");
}
