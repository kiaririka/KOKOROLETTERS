import React, { useState } from "react";
import { Volume2, VolumeX, Wind, Droplets, Waves, Sparkles, User, LogOut, ShoppingBag } from "lucide-react";

interface AmbientCompassBarProps {
  ambientSound: "none" | "wind" | "river" | "ocean";
  onChangeSound: (sound: "none" | "wind" | "river" | "ocean") => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  sessionEmail?: string | null;
  unlockedCount: number;
  onOpenAuth: () => void;
  onLogout?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export default function AmbientCompassBar({
  ambientSound,
  onChangeSound,
  isAudioPlaying,
  onToggleAudio,
  sessionEmail,
  unlockedCount,
  onOpenAuth,
  onLogout,
  cartCount = 0,
  onOpenCart,
}: AmbientCompassBarProps) {
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const soundOptions = [
    { id: "wind", name: "Alpine Pine Wind", icon: <Wind className="w-3.5 h-3.5" /> },
    { id: "river", name: "Kamogawa River", icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: "ocean", name: "Seto Sea Tide", icon: <Waves className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="flex items-center gap-2">
      {/* Soundscape pill */}
      <div className="relative">
        <button
          onClick={() => setShowSoundMenu((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer ${
            isAudioPlaying
              ? "bg-[#e3ece8] border-[#9cbfae] text-[#1b2e24] shadow-xs"
              : "bg-white/80 border-stone-200 text-stone-500 hover:text-stone-800"
          }`}
          title="Ambient Soundscape"
        >
          {isAudioPlaying ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-800 animate-pulse" />
              <span className="capitalize hidden sm:inline">{ambientSound}</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ambience</span>
            </>
          )}
        </button>

        {showSoundMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-[#faf6eb] border border-[#eedba5] rounded-2xl shadow-xl p-2 z-50 text-left space-y-1">
            <span className="text-[10px] font-mono text-[#547365] px-2 py-1 block uppercase">
              Ambient Biome
            </span>
            {soundOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChangeSound(opt.id);
                  setShowSoundMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  ambientSound === opt.id && isAudioPlaying
                    ? "bg-[#1b2e24] text-white font-medium"
                    : "hover:bg-white text-stone-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.name}</span>
                </div>
                {ambientSound === opt.id && isAudioPlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
            <button
              onClick={() => {
                onToggleAudio();
                setShowSoundMenu(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-rose-700 hover:bg-rose-50 border-t border-[#eedba5]/40 mt-1 cursor-pointer"
            >
              Mute Soundscape
            </button>
          </div>
        )}
      </div>

      {/* Cart / Satchel Button */}
      {onOpenCart && (
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-stone-200 bg-white/80 hover:bg-[#faf6eb] text-[#1b2e24] transition-all cursor-pointer shadow-2xs"
          title="Open Cart Satchel"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#547365]" />
          <span className="hidden sm:inline">Satchel</span>
          {cartCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#1b2e24] text-white text-[9px] font-mono font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      )}

      {/* Traveler Account Badge / Sign In */}
      {sessionEmail ? (
        <div className="flex items-center gap-1.5 bg-[#e3ece8]/80 border border-[#9cbfae] px-3 py-1 rounded-full text-xs text-[#1b2e24]">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold hidden md:inline">
            {unlockedCount}/12 Stamped
          </span>
          <span className="font-serif text-[11px] truncate max-w-[100px]" title={sessionEmail}>
            {sessionEmail.split("@")[0]}
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-stone-400 hover:text-rose-600 ml-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-full text-xs font-serif font-bold transition-all shadow-xs cursor-pointer"
        >
          <User className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
      )}
    </div>
  );
}
