import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Check, RotateCw, Send, ArrowRight } from "lucide-react";

interface TeaserItem {
  id: string;
  region: string;
  theme: string;
  date: string;
  frontImage: string;
  excerpt: string;
  fullWhisper: string;
}

const PAST_TEASERS: TeaserItem[] = [
  {
    id: "kansai",
    region: "Kansai (Kyoto & Nara)",
    theme: "Spirited Away Inspiration",
    date: "July 2026",
    frontImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    excerpt: "In the heart of Kansai, where lantern light pools in ancient stone streets, a girl once traded her name for the chance to work in a bathhouse for the gods...",
    fullWhisper: "Every wooden doorway in Gion holds a quiet secret. In this month's physical dispatch, we explore the hot spring towns and cedar bathhouses that gave life to Yubaba's legendary sanctuary."
  },
  {
    id: "tohoku",
    region: "Tohoku (Shirakami-Sanchi)",
    theme: "Princess Mononoke Inspiration",
    date: "June 2026",
    frontImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80",
    excerpt: "Along the brooding coast, deep within the ancient moss-covered beech forests, a wolf god and a forest princess stand guard against iron towers...",
    fullWhisper: "Shirakami-Sanchi houses the last virgin beech forest in East Asia. Walking under its canopy, you can almost hear the soft rattle of Kodama spirits echoing across the mist."
  },
  {
    id: "chubu",
    region: "Chubu (Japanese Alps)",
    theme: "The Wind Rises Inspiration",
    date: "May 2026",
    frontImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    excerpt: "High in the alpine passes of Chubu, where the wind carries the scent of pine and machine oil, a young engineer understood that flight was worth a lifetime of dreaming...",
    fullWhisper: "From the traditional thatched houses of Shirakawa-go to the high windy plateaus, Chubu is where dreamers look upward toward the clouds."
  }
];

interface PostcardWhispersProps {
  onSubscribeEmail: (email: string) => Promise<boolean>;
}

export default function PostcardWhispers({ onSubscribeEmail }: PostcardWhispersProps) {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.includes("@")) return;
    setIsSubmitting(true);
    const ok = await onSubscribeEmail(newsletterEmail);
    setIsSubmitting(false);
    if (ok) setNewsletterSent(true);
  };

  return (
    <div className="space-y-10">
      {/* Newsletter Subscribe Banner (Aesthetic Japanese Mailbox) */}
      <div className="bg-[#faf6eb] rounded-3xl p-8 md:p-12 border-2 border-[#eedba5] vintage-shadow text-center space-y-6 max-w-3xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#e3ece8] flex items-center justify-center mx-auto text-[#1b2e24] border border-[#9cbfae]">
          <Mail className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#547365] bg-white px-2.5 py-1 rounded-full border border-[#eedba5]">
            Free Monthly Dispatch Teasers
          </span>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#1b2e24]">
            Whispers from the Next Region
          </h3>
          <p className="text-xs text-[#547365] max-w-md mx-auto leading-relaxed">
            Not ready for the full physical club yet? Sign up to receive free monthly digital teasers about upcoming Ghibli locations and Japanese botanical folklore.
          </p>
        </div>

        {newsletterSent ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 font-serif font-bold text-sm">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Your Scroll has been Sealed!</span>
            </div>
            <p className="text-[11px] text-[#547365]">
              Check your inbox when the new moon rises for the next region whisper. 🍃
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="Enter your email (e.g. chihiro@meadow.jp)"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl border border-[#9cbfae] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#9cbfae]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#1b2e24] hover:bg-stone-800 disabled:opacity-50 text-white rounded-2xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
            >
              <span>Subscribe Free</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* Interactive 3D Postcard Rack */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#e3ece8] pb-3">
          <div>
            <h4 className="font-serif font-bold text-lg text-[#1b2e24]">
              The Postcard Archive
            </h4>
            <p className="text-xs text-[#547365]">
              Tap any postcard to flip between the scenic artwork and the handwritten field note.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#547365] hidden sm:block">
            3 Past Dispatches
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAST_TEASERS.map((teaser) => {
            const isFlipped = !!flippedCards[teaser.id];
            return (
              <div
                key={teaser.id}
                onClick={() => toggleFlip(teaser.id)}
                className="cursor-pointer group perspective-1000 h-80"
              >
                <div
                  className={`relative w-full h-full transition-transform duration-500 rounded-3xl shadow-sm border border-[#eedba5] overflow-hidden ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front: Scenic Art Postcard */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden flex flex-col justify-between p-5 text-white"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <img
                      src={teaser.frontImage}
                      alt={teaser.region}
                      className="absolute inset-0 w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="relative z-10 flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full">
                        {teaser.date}
                      </span>
                      <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                        <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                      </span>
                    </div>

                    <div className="relative z-10 space-y-1 text-left">
                      <span className="text-[10px] font-mono text-[#f5dfb8] uppercase tracking-wider block">
                        {teaser.theme}
                      </span>
                      <h5 className="font-serif font-bold text-lg leading-tight">
                        {teaser.region}
                      </h5>
                      <p className="text-[11px] text-stone-200 line-clamp-2">
                        {teaser.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Back: Handwritten Letter Note */}
                  <div
                    className="absolute inset-0 w-full h-full bg-[#faf6eb] p-6 flex flex-col justify-between text-left rotate-y-180"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#eedba5] pb-2">
                        <span className="font-serif font-bold text-xs text-[#1b2e24]">
                          Postcard from {teaser.region}
                        </span>
                        <div className="w-7 h-7 rounded-sm border border-dashed border-red-700/60 bg-red-50 flex items-center justify-center text-[10px] font-serif text-red-900 font-bold">
                          心
                        </div>
                      </div>

                      <p className="serif-letter text-xs text-[#1e2d24] leading-relaxed">
                        {teaser.fullWhisper}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#eedba5] text-[10px] font-mono text-[#547365]">
                      <span>Tap to flip back</span>
                      <span className="text-emerald-800 font-serif font-bold text-xs">Kokoro Archive</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
