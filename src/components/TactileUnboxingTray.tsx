import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image, Sparkles, Tag, BookOpen, Map, CheckCircle2 } from "lucide-react";

interface KitItem {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  tag: string;
  description: string;
  details: string[];
  sampleImage: string;
}

const KIT_ITEMS: KitItem[] = [
  {
    id: "art-print",
    name: "Hand-Printed Scenic Art",
    subtitle: "Heavy Textured Art Paper",
    icon: <Image className="w-4 h-4" />,
    tag: "Every Month",
    description: "Original, small-batch illustration inspired by the real-world Japanese landscape behind that month's story. Printed on warm, textured fine-art paper.",
    details: ["Heavy textured fine-art stock", "Rich pigment print finish", "Hand-stamped artist edition seal"],
    sampleImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "anime-sticker",
    name: "Spirit Character Sticker",
    subtitle: "Matte Collectible Finish",
    icon: <Sparkles className="w-4 h-4" />,
    tag: "Every Month",
    description: "A gentle illustrated character sticker capturing the spirit world — Kodama, soot sprites, or forest deities, crafted with a soft matte finish.",
    details: ["Soft-touch matte finish", "Custom die-cut silhouette", "Designed for journals & laptops"],
    sampleImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "map-sticker",
    name: "Collectible Region Stamp",
    subtitle: "Physical Map Milestone",
    icon: <Tag className="w-4 h-4" />,
    tag: "Every Month",
    description: "Designed in the style of historic Japanese postal stamps. Paste this sticker directly onto your large physical Japan map to mark that month's milestone.",
    details: ["Postal stamp silhouette", "Prefecture botanical crest", "Collectible 12-piece mosaic set"],
    sampleImage: "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "lore-letter",
    name: "Wax-Sealed Lore Letter",
    subtitle: "Folded Parchment & Wax Seal",
    icon: <BookOpen className="w-4 h-4" />,
    tag: "Every Month",
    description: "A personal letter exploring the prefecture, local folklore, how Miyazaki built that world, and the quiet beauty of rural Japan.",
    details: ["Wax seal with 心 emblem", "Tactile folded letter paper", "Includes Japanese botanical notes"],
    sampleImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "welcome-map",
    name: "Envelope-Sized Map of Japan",
    subtitle: "Inaugural Month 1 Exclusive",
    icon: <Map className="w-4 h-4" />,
    tag: "Month 1 Only",
    description: "Included free only for Founding travelers who join during Month 1. An envelope-sized collectible map of Japan showing all 12 cultural waypoints to stick each month's regional stamp onto. Later joiners can pick it up separately in the store.",
    details: ["Envelope-sized flat keepsake", "12 marked cultural waypoints", "Free only for Month 1 joiners"],
    sampleImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80"
  }
];

export default function TactileUnboxingTray() {
  const [selectedId, setSelectedId] = useState<string>("art-print");
  const selectedItem = KIT_ITEMS.find((item) => item.id === selectedId) || KIT_ITEMS[0];

  return (
    <div className="bg-white/80 backdrop-blur-xs rounded-3xl border border-[#e3ece8] p-6 md:p-8 vintage-shadow space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e3ece8] pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#547365] bg-[#e3ece8]/70 px-2.5 py-1 rounded-full">
            Inside Every Monthly Parcel
          </span>
          <h3 className="text-xl md:text-2xl font-serif font-bold text-[#1b2e24] mt-2">
            The Anatomy of a Dispatch
          </h3>
          <p className="text-xs text-[#547365] mt-1 max-w-lg">
            Every piece is manually hand-printed, hand-folded, and wax-sealed. Select an item to inspect its craft.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-serif text-[#1b2e24] font-medium">Eco-conscious mailers</span>
          <span className="text-[10px] font-mono text-[#547365] block">Concept specs • Finalizing paper</span>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {KIT_ITEMS.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-24 ${
                isSelected
                  ? "bg-[#faf6eb] border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                  : "bg-white/60 border-stone-200/80 hover:bg-[#faf6eb]/50 hover:border-[#9cbfae]/60"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? "bg-[#1b2e24] text-white" : "bg-[#e3ece8] text-[#1b2e24]"
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[9px] font-mono font-bold text-[#547365] uppercase">
                  {item.tag}
                </span>
              </div>
              <div>
                <p className={`font-serif text-xs font-bold truncate ${isSelected ? "text-[#1b2e24]" : "text-stone-700"}`}>
                  {item.name}
                </p>
                <p className="text-[10px] text-[#547365] truncate">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Detail Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedItem.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#faf6eb]/60 rounded-2xl p-6 border border-[#eedba5]/60 items-center"
        >
          {/* Left: Image / Mockup preview */}
          <div className="md:col-span-5 relative h-56 rounded-xl overflow-hidden border border-[#eedba5] shadow-xs">
            <img
              src={selectedItem.sampleImage}
              alt={selectedItem.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <span className="text-[10px] font-mono uppercase tracking-wider bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                Concept Preview
              </span>
              <span className="text-xs font-serif italic text-[#f5dfb8]">Small-batch craft</span>
            </div>
          </div>

          {/* Right: Craft Story & Specifications */}
          <div className="md:col-span-7 space-y-4 text-left">
            <div>
              <span className="text-[10px] font-mono text-[#547365] uppercase tracking-wider block">
                {selectedItem.subtitle}
              </span>
              <h4 className="font-serif font-bold text-xl text-[#1b2e24] mt-0.5">
                {selectedItem.name}
              </h4>
              <p className="text-xs text-[#547365] leading-relaxed mt-2">
                {selectedItem.description}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#eedba5]/60">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1b2e24] block">
                Material & Craft Specs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedItem.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-white/80 border border-[#eedba5] rounded-xl px-2.5 py-1.5 text-[11px] text-[#1b2e24]"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span className="truncate">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
