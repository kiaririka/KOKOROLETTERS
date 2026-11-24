import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Volume2, VolumeX, Sparkles, MapPin, Tag, Heart } from "lucide-react";
import { Region } from "../types.ts";

interface ReadingParchmentModalProps {
  region: Region | null;
  isOpen: boolean;
  onClose: () => void;
  ambientSound: "none" | "wind" | "river" | "ocean";
  onToggleSound: () => void;
  isAudioPlaying: boolean;
  onStampUnlock?: () => void;
  isUnlocked: boolean;
  isSubscriber: boolean;
}

export default function ReadingParchmentModal({
  region,
  isOpen,
  onClose,
  ambientSound,
  onToggleSound,
  isAudioPlaying,
  onStampUnlock,
  isUnlocked,
  isSubscriber,
}: ReadingParchmentModalProps) {
  if (!isOpen || !region) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-[#faf6eb] rounded-3xl border-2 border-[#dcd3b9] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col vintage-shadow"
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-20 bg-[#faf6eb]/95 backdrop-blur-md px-6 py-4 border-b border-[#eedba5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#e3ece8] text-emerald-900 font-serif font-bold text-sm flex items-center justify-center border border-[#9cbfae]">
                心
              </span>
              <div>
                <span className="text-[10px] font-mono text-[#547365] uppercase tracking-wider block">
                  Parchment Letter
                </span>
                <h3 className="font-serif font-bold text-base text-[#1b2e24]">
                  {region.region_name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Soundscape pill */}
              <button
                onClick={onToggleSound}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium border flex items-center gap-1.5 transition-colors ${
                  isAudioPlaying
                    ? "bg-[#e3ece8] border-emerald-300 text-emerald-900"
                    : "bg-white/60 border-stone-200 text-stone-500 hover:text-stone-800"
                }`}
                title="Toggle ambient nature soundscape"
              >
                {isAudioPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                    <span className="capitalize">{ambientSound} Ambience</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Ambience Off</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Letter Body */}
          <div className="p-6 md:p-10 overflow-y-auto space-y-6 text-left">
            {/* Scenic Image Banner */}
            <div className="relative h-64 md:h-72 rounded-2xl overflow-hidden border border-[#eedba5] shadow-xs">
              <img
                src={region.assets_url}
                alt={region.region_name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#f5dfb8] bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-md">
                    Scenic Waypoint
                  </span>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">
                    {region.region_name}
                  </h2>
                </div>

                {isUnlocked ? (
                  <span className="bg-emerald-700 text-white text-[10px] font-mono uppercase font-bold px-3 py-1 rounded-full shadow-xs">
                    ✓ Unlocked & Stamped
                  </span>
                ) : (
                  <span className="bg-stone-800/90 text-stone-200 text-[10px] font-mono uppercase font-bold px-3 py-1 rounded-full shadow-xs">
                    Preview Mode
                  </span>
                )}
              </div>
            </div>

            {/* Letter Prose (Washi Parchment Effect) */}
            <div className="bg-white/70 p-6 md:p-8 rounded-2xl border border-[#eedba5] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#eedba5]/60 pb-3">
                <span className="font-serif italic text-sm text-[#547365]">
                  Dearest Traveler,
                </span>
                <span className="text-[10px] font-mono text-[#547365]">
                  Kokoro Monthly Dispatch
                </span>
              </div>

              <div className="serif-letter text-sm md:text-base text-[#1e2d24] leading-relaxed whitespace-pre-line">
                {region.lore_content}
              </div>

              <div className="pt-4 border-t border-[#eedba5]/60 flex items-center justify-between text-xs text-[#547365]">
                <span className="font-serif italic">— Hand-sealed with love from Tokyo</span>
                <span className="text-xl font-serif font-bold text-[#1b2e24]">心</span>
              </div>
            </div>

            {/* Footer action */}
            {!isUnlocked && isSubscriber && onStampUnlock && (
              <div className="bg-[#e3ece8] p-4 rounded-2xl border border-[#9cbfae] flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1b2e24]">
                    You have passage to this region!
                  </h4>
                  <p className="text-[11px] text-[#547365]">
                    Stamp your passport to permanently mark this destination.
                  </p>
                </div>
                <button
                  onClick={onStampUnlock}
                  className="px-4 py-2 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all shadow-xs"
                >
                  Stamp Passport
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
