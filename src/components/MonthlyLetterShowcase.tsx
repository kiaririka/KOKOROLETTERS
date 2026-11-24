import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Sparkles, MapPin, Tag, Image, BookOpen, ArrowRight, Heart, Star, Map, Truck, CheckCircle, Package } from "lucide-react";

interface LetterShowcaseItem {
  id: string;
  regionName: string;
  monthLabel: string; // e.g. "Past Month (June)", "Current Month (July)", "Upcoming Month (August)"
  shippingStatus: string; // e.g. "Shipped on June 5, 2026 • Delivered"
  statusIcon: React.ReactNode;
  statusColor: string; // Tailwind class
  title: string;
  animeInspired: string;
  postcardImage: string;
  introText: string;
  animeStickerDesc: string;
  regionStickerDesc: string;
  keepsakes: {
    name: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const MONTHLY_LETTERS: LetterShowcaseItem[] = [
  {
    id: "kanto",
    regionName: "Sayama Hills (Kanto)",
    monthLabel: "Edition 01 Concept",
    shippingStatus: "Batch 01 Candidate • Waitlist Open",
    statusIcon: <CheckCircle className="w-3.5 h-3.5" />,
    statusColor: "text-emerald-800 bg-emerald-50 border-emerald-200",
    title: "Sayama Hills & My Neighbor Totoro",
    animeInspired: "Inspired My Neighbor Totoro (1988)",
    postcardImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    introText: "Dearest Traveler,\n\nWalk down the country dirt roads of Sayama Hills, just outside Tokyo. Feel the cool shadow of the giant Camphor tree where Totoro sleeps. This area—known affectionately as Totoro’s Forest—features rolling green tea hills, seasonal wildflowers, and deep woods. In this letter, we explore the hills and how Miyazaki helped preserve this living ecosystem...",
    animeStickerDesc: "A warm, retro-styled sticker of a friendly forest spirit sleeping comfortably inside a tree trunk hollow.",
    regionStickerDesc: "A regional stamp sticker celebrating Kanto's green tea leaves and historic rural farmlands.",
    keepsakes: [
      {
        name: "Sayama Forest Art Print",
        description: "A vibrant small-batch scenic print of the lush, rolling countryside hills of Sayama under a summer sky.",
        icon: <Image className="w-4 h-4 text-amber-800" />
      },
      {
        name: "Forest Spirit Sticker",
        description: "A delightful illustration sticker inspired by the warm country life of Satsuki and Mei.",
        icon: <Star className="w-4 h-4 text-amber-800" />
      },
      {
        name: "Sayama Region Stamp",
        description: "A custom region sticker showcasing the iconic tea fields of Saitama to stamp onto your map.",
        icon: <Tag className="w-4 h-4 text-amber-800" />
      },
      {
        name: "Personalized Lore Letter",
        description: "A personal letter exploring the conservation of Totoro's Forest, rural Japanese farming, and childhood nostalgia.",
        icon: <BookOpen className="w-4 h-4 text-amber-800" />
      }
    ]
  },
  {
    id: "kyushu",
    regionName: "Yakushima (Kyushu)",
    monthLabel: "Edition 02 Concept",
    shippingStatus: "Concept Preview • Finalizing Paper & Print",
    statusIcon: <Truck className="w-3.5 h-3.5" />,
    statusColor: "text-amber-800 bg-amber-50 border-amber-200",
    title: "Yakushima Forest & Princess Mononoke",
    animeInspired: "Inspired Princess Mononoke (1997)",
    postcardImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80",
    introText: "Dearest Traveler,\n\nStep into the eternal, dripping green of Yakushima's ancient cedar forests. This is the birthplace of the Forest Spirit. In this edition's letter, we explore the ancient Kodama spirits, the deep moss-clad roots that cover the island, and how Hayao Miyazaki's team spent days sketching in the rain to capture this sacred biosphere...",
    animeStickerDesc: "A matte collectible sticker of a gentle, glowing Kodama sitting on a mossy branch.",
    regionStickerDesc: "A circular collectible stamp-style sticker of Yakushima island's ancient Jomon Sugi cedar.",
    keepsakes: [
      {
        name: "Yakushima Scenic Art Print",
        description: "An original textured art print of the moss-laden forest valley that inspired the Forest Spirit's sanctuary.",
        icon: <Image className="w-4 h-4 text-emerald-800" />
      },
      {
        name: "Glowing Kodama Sticker",
        description: "A matte collectible sticker inspired by the mystical forest spirits of the story.",
        icon: <Star className="w-4 h-4 text-emerald-800" />
      },
      {
        name: "Yakushima Region Stamp",
        description: "A specially printed region sticker to affix onto your physical map of Japan to log this destination.",
        icon: <Tag className="w-4 h-4 text-emerald-800" />
      },
      {
        name: "Personalized Lore Letter",
        description: "A detailed, wax-sealed letter describing the region, how Miyazaki built the film's mossy worlds, and local folklore.",
        icon: <BookOpen className="w-4 h-4 text-emerald-800" />
      }
    ]
  },
  {
    id: "chugoku",
    regionName: "Tomonoura (Chugoku)",
    monthLabel: "Edition 03 Concept",
    shippingStatus: "Concept Preview • Planned Future Dispatch",
    statusIcon: <Package className="w-3.5 h-3.5" />,
    statusColor: "text-stone-600 bg-stone-50 border-stone-200",
    title: "Tomonoura Port & Ponyo by the Sea",
    animeInspired: "Inspired Ponyo on the Cliff (2008)",
    postcardImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    introText: "Dearest Traveler,\n\nWelcome to the sleepy, coastal inlet of Tomonoura in Hiroshima. Here, the tide turns quietly in the Seto Inland Sea. Miyazaki lived in a tiny clifftop house here for two months, drawing inspiration from the iron harbor, local fishing boats, and the simple warmth of the sea breeze...",
    animeStickerDesc: "A hand-illustrated sticker of a magical sea spirit riding on a cresting wave.",
    regionStickerDesc: "A custom regional sticker featuring Tomonoura's historic Edo-period stone lighthouse (Joyatō).",
    keepsakes: [
      {
        name: "Scenic Port Art Print",
        description: "A lovely small-batch print of the clifftop view overlooking the glittering blue waters of the Seto Inland Sea.",
        icon: <Image className="w-4 h-4 text-sky-800" />
      },
      {
        name: "Wave-Rider Spirit Sticker",
        description: "A watercolor-style collectible sticker inspired by coastal folklore and playful ocean adventures.",
        icon: <Star className="w-4 h-4 text-sky-800" />
      },
      {
        name: "Tomonoura Region Stamp",
        description: "A classic region sticker depicting the coastal harbor landmarks to mark off Chugoku on your map.",
        icon: <Tag className="w-4 h-4 text-sky-800" />
      },
      {
        name: "Personalized Lore Letter",
        description: "A wax-sealed letter describing the port town of Tomonoura, Miyazaki's retreat, and sea folklore.",
        icon: <BookOpen className="w-4 h-4 text-sky-800" />
      }
    ]
  }
];

export default function MonthlyLetterShowcase({ isSubscriber, onSubscribe }: { isSubscriber: boolean; onSubscribe: () => void }) {
  const [selectedLetterId, setSelectedLetterId] = useState<string>("kyushu"); // default to current month
  
  const currentLetter = MONTHLY_LETTERS.find(l => l.id === selectedLetterId) || MONTHLY_LETTERS[1];

  return (
    <div className="space-y-8 bg-white border border-ghibli-green-light/40 rounded-3xl p-6 md:p-10 shadow-xs">
      
      {/* Header and Mini-Tabs Selector */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-ghibli-green-light/30">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-ghibli-sage uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-ghibli-cream-dark fill-ghibli-cream-dark" />
            <span>Artisanal Mailing Timeline</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold font-serif text-ghibli-green-dark">
            Peek Inside the Envelopes
          </h3>
          <p className="text-xs text-ghibli-sage">
            Follow our active travel rotation. Select a month below to preview what arrives in subscribers' mailboxes.
          </p>
        </div>

        {/* Tab selector for previews with inline statuses */}
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-[#faf8f3] p-1.5 rounded-2xl border border-ghibli-green-light/60 gap-2 w-full xl:w-auto">
          {MONTHLY_LETTERS.map((letter) => {
            const isActive = selectedLetterId === letter.id;
            return (
              <button
                key={letter.id}
                onClick={() => setSelectedLetterId(letter.id)}
                className={`p-2.5 rounded-xl text-left transition-all flex flex-col justify-between gap-1 border ${
                  isActive
                    ? "bg-white text-ghibli-green-dark shadow-xs border-ghibli-green-light/80 font-semibold"
                    : "border-transparent text-ghibli-sage hover:text-ghibli-green-dark hover:bg-white/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-xs font-bold font-serif">{letter.monthLabel}</span>
                  <div className={`p-0.5 rounded-full ${isActive ? 'bg-ghibli-green-light/40' : ''}`}>
                    {letter.statusIcon}
                  </div>
                </div>
                <div className="text-[10px] opacity-95 tracking-tight font-medium truncate">
                  {letter.regionName}
                </div>
                <div className="text-[9px] opacity-75 truncate font-mono mt-0.5">
                  {letter.id === "kanto" ? "Batch 01 Candidate" : letter.id === "kyushu" ? "Concept Preview" : "Planned Edition"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentLetter.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Art Print Representation & Sticker Showcase */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative group rounded-2xl overflow-hidden aspect-4/3 shadow-md border border-ghibli-green-light/40">
              <img
                src={currentLetter.postcardImage}
                alt={currentLetter.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b2e24]/70 via-[#1b2e24]/10 to-transparent pointer-events-none" />
              
              {/* Region Label Badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-ghibli-green-light/40 flex items-center gap-1.5 shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                <span className="text-[11px] font-bold text-ghibli-green-dark font-serif">{currentLetter.regionName}</span>
              </div>

              {/* Subtitle label */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-[10px] font-mono tracking-wider text-ghibli-green-light uppercase font-semibold">{currentLetter.monthLabel}</p>
                <h4 className="text-base font-serif font-bold tracking-wide">{currentLetter.title}</h4>
              </div>
            </div>

            {/* Custom stickers description box */}
            <div className="bg-[#fcfbf7] border border-ghibli-cream-dark/40 rounded-2xl p-5 space-y-4">
              <h5 className="text-[11px] font-semibold tracking-wider text-ghibli-sage uppercase border-b border-ghibli-green-light/20 pb-1.5">
                Artisanal Sticker Set Included
              </h5>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-ghibli-green-light flex items-center justify-center shrink-0 border border-ghibli-green-light/60">
                  <Star className="w-5 h-5 text-emerald-800" />
                </div>
                <div className="space-y-1">
                  <h6 className="text-xs font-bold font-serif text-ghibli-green-dark">Ghibli Anime Sticker</h6>
                  <p className="text-[11px] text-ghibli-sage leading-relaxed">{currentLetter.animeStickerDesc}</p>
                </div>
              </div>

              <div className="flex gap-4 border-t border-dashed border-ghibli-green-light/30 pt-3">
                <div className="w-10 h-10 rounded-full bg-ghibli-green-light flex items-center justify-center shrink-0 border border-ghibli-green-light/60">
                  <Tag className="w-5 h-5 text-emerald-800" />
                </div>
                <div className="space-y-1">
                  <h6 className="text-xs font-bold font-serif text-ghibli-green-dark">Regional Map Sticker</h6>
                  <p className="text-[11px] text-ghibli-sage leading-relaxed">
                    {currentLetter.regionStickerDesc} Paste this onto your physical map of Japan to complete your journey.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Parchment Letter and Keepsakes */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Shipping Status Bar under envelope peek */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3 font-medium text-xs ${currentLetter.statusColor} shadow-xs`}>
              <div className="p-1.5 rounded-full bg-white/80 shrink-0 border border-current">
                {currentLetter.statusIcon}
              </div>
              <div className="space-y-0.5">
                <div className="font-mono text-[10px] uppercase font-bold tracking-wider">Mail Logistics Status</div>
                <div className="text-xs">{currentLetter.shippingStatus}</div>
              </div>
            </div>

            {/* The Parchment Letter Preview */}
            <div className="parchment-bg parchment-border rounded-2xl p-6 md:p-8 space-y-4 vintage-shadow relative">
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#1b2e24]/5 px-2.5 py-1 rounded-full text-[9px] font-mono text-ghibli-sage font-bold">
                <Mail className="w-3 h-3" />
                <span>Letter Excerpt</span>
              </div>
              <div className="font-serif text-xs italic text-ghibli-sage">{currentLetter.animeInspired}</div>
              <div className="font-serif text-sm md:text-base text-ghibli-text leading-relaxed whitespace-pre-wrap font-medium">
                {currentLetter.introText}
              </div>
              <div className="h-4 bg-gradient-to-t from-ghibli-cream to-transparent absolute bottom-0 left-0 right-0 rounded-b-2xl pointer-events-none" />
            </div>

            {/* Keepsakes list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-ghibli-green-light/20 pb-1.5">
                <h5 className="text-[11px] font-bold tracking-wider text-ghibli-sage uppercase">
                  Physical Envelope Contents
                </h5>
                <span className="text-[10px] font-mono text-ghibli-green-dark bg-[#faf6eb] px-2 py-0.5 rounded-full border border-ghibli-cream-dark">
                  Concept Edition Specs
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLetter.keepsakes.map((item, index) => (
                  <div key={index} className="bg-[#faf9f4] hover:bg-[#faf6eb] p-4 rounded-xl border border-ghibli-green-light/20 transition-all flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-ghibli-green-light/40 text-ghibli-green-dark shrink-0">
                      {item.icon}
                    </div>
                    <div className="space-y-0.5">
                      <h6 className="text-xs font-bold font-serif text-ghibli-green-dark">{item.name}</h6>
                      <p className="text-[10px] text-ghibli-sage leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* First Month Bonus highlight */}
            <div className="bg-[#fcfbf8] border-2 border-dashed border-[#d3cbbe] rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#faf6eb] border border-[#d3cbbe] flex items-center justify-center shrink-0 text-ghibli-green-dark">
                <Map className="w-5 h-5 text-ghibli-sage" />
              </div>
              <div className="space-y-1">
                <h6 className="text-xs font-bold font-serif text-ghibli-green-dark">
                  🎁 Month 1 Founding Gift: Envelope-Sized Map of Japan
                </h6>
                <p className="text-[11px] text-ghibli-sage leading-relaxed">
                  Join during our inaugural first month to receive the envelope-sized collectible Map of Japan free inside your parcel. Subscribers who join in later months can purchase the map separately in the store.
                </p>
              </div>
            </div>

            {/* Non-Subscriber Call to Action Banner */}
            {!isSubscriber && (
              <div className="bg-ghibli-green-light/40 border border-ghibli-green/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-emerald-800">
                    <Heart className="w-3.5 h-3.5 text-emerald-800 fill-emerald-800" />
                    <span>Share the love for Japan & beautiful cinema</span>
                  </div>
                  <p className="text-xs text-ghibli-sage">
                    Start with your First Month, book the 12-Moon Year Bundle, or join the free waitlist.
                  </p>
                </div>
                <button
                  onClick={onSubscribe}
                  className="w-full sm:w-auto px-5 py-2.5 bg-ghibli-green-dark text-white hover:bg-[#2b4436] rounded-xl text-xs font-serif font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>Choose Your Passage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
