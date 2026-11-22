/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Mail, 
  MapPin, 
  Unlock, 
  Lock, 
  Send, 
  Compass, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RefreshCw, 
  Check, 
  CreditCard,
  LogOut,
  HelpCircle,
  Clock,
  UserCheck,
  BookOpen,
  ArrowRight,
  Image,
  Tag,
  Coffee,
  X
} from "lucide-react";
import JapanMap from "./components/JapanMap.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import { submitWaitlistEmail } from "./waitlist.ts";
import { saveWaitlist, saveNewsletter, saveOrder, isEmailInNewsletter } from "./firestoreService.ts";
import MonthlyLetterShowcase from "./components/MonthlyLetterShowcase.tsx";
import FaqSection from "./components/FaqSection.tsx";
import { Region, Subscriber, PlanTier, SubscriptionStatus } from "./types.ts";
import { REGIONS_METADATA, LORE_DATA } from "./data/lore.ts";

export default function App() {
  // Navigation State (Ghibli multi-page tabs)
  const [activeTab, setActiveTab] = useState<"journey" | "subscription" | "journal" | "newsletter" | "admin">("journey");

  // Session & Regions State
  const [session, setSession] = useState<{
    authenticated: boolean;
    email?: string;
    subscriber: Subscriber | null;
    unlocked_regions: string[];
  } | null>(null);
  
  const [regions, setRegions] = useState<Region[]>([]);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [justUnlockedRegionId, setJustUnlockedRegionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState(true);

  // Auth form state
  const [emailInput, setEmailInput] = useState("");
  const [requestingLink, setRequestingLink] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  // Checkout form state
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutTier, setCheckoutTier] = useState<PlanTier>("India");

  // Ambient sound simulator
  const [ambientSound, setAmbientSound] = useState<"none" | "wind" | "river" | "ocean">("none");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);

  // Ghibli theme newsletter form state
  const [teaserName, setTeaserName] = useState("");
  const [teaserEmail, setTeaserEmail] = useState("");
  const [teaserSent, setTeaserSent] = useState(false);

  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);

  // Magic link generated for preview login (completely replaces the developer panel verification)
  const [generatedLink, setGeneratedLink] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  // Traveler's Ticket Modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketRegion, setTicketRegion] = useState("");
  const [ticketCountry, setTicketCountry] = useState<"India" | "International">("India");
  const [ticketPlan, setTicketPlan] = useState("");

  // Guest Direct Checkout Modal state
  const [directCheckoutModalOpen, setDirectCheckoutModalOpen] = useState(false);
  const [directCheckoutEmail, setDirectCheckoutEmail] = useState("");
  const [directCheckoutAddress, setDirectCheckoutAddress] = useState("");
  const [directCheckoutTier, setDirectCheckoutTier] = useState<PlanTier>("India");
  const [directCheckoutGateway, setDirectCheckoutGateway] = useState<"razorpay" | "paypal">("razorpay");

  const stampTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerUnlockAnimation = (regionId: string) => {
    if (stampTimeoutRef.current) {
      clearTimeout(stampTimeoutRef.current);
    }
    setJustUnlockedRegionId(regionId);
    stampTimeoutRef.current = setTimeout(() => {
      setJustUnlockedRegionId(null);
    }, 3200);
  };

  // Fetch session & regions on mount
  useEffect(() => {
    fetchSession();
    fetchRegions();
    return () => {
      if (stampTimeoutRef.current) {
        clearTimeout(stampTimeoutRef.current);
      }
    };
  }, []);

  // Audio timer increments
  useEffect(() => {
    let interval: any;
    if (isAudioPlaying) {
      interval = setInterval(() => {
        setAudioTimer(prev => prev + 1);
      }, 1000);
    } else {
      setAudioTimer(0);
    }
    return () => clearInterval(interval);
  }, [isAudioPlaying]);

  // Redirect to Travel Journal on login success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login_success") === "true") {
      setActiveTab("journal");
    }
  }, []);

  // Check if logged-in user is already subscribed to the newsletter
  useEffect(() => {
    if (session?.email) {
      isEmailInNewsletter(session.email).then((subbed) => {
        setIsNewsletterSubscribed(subbed);
      }).catch(() => {});
    } else {
      setIsNewsletterSubscribed(false);
    }
  }, [session?.email]);

  const fetchSession = async () => {
    try {
      console.log("Fetching session...");
      const res = await fetch("/api/session");
      if (!res.ok) {
        console.error("Session fetch failed:", res.status, res.statusText);
        setSession({ authenticated: false, subscriber: null, unlocked_regions: [] });
        return;
      }
      const data = await res.json();
      console.log("Session data:", data);
      
      // Ensure unlocked_regions array exists
      if (data && !data.unlocked_regions) {
        data.unlocked_regions = [];
      }
      
      setSession(data);
    } catch (err) {
      console.error("Error fetching session:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchRegions = async () => {
    try {
      // Load static region lore content from frontend bundled files with zero database reads
      const localRegions: Region[] = REGIONS_METADATA.map(meta => {
        const lore = LORE_DATA[meta.region_id] || { lore_content: "", assets_url: "" };
        return {
          region_id: meta.region_id,
          region_name: meta.region_name,
          lore_content: lore.lore_content,
          assets_url: lore.assets_url
        };
      });
      setRegions(localRegions);
      if (localRegions.length > 0) {
        setActiveRegionId(localRegions[0].region_id);
      }
    } catch (err) {
      console.error("Error setting regions:", err);
    } finally {
      setLoadingRegions(false);
    }
  };

  const checkRegionAuthorization = async (regionId: string): Promise<boolean> => {
    if (!session?.authenticated) return false;

    try {
      const res = await fetch(`/api/regions/check-access?region_id=${regionId}`);
      const data = await res.json();
      if (data.success && data.unlocked) {
        // Safe state update: add authorized region to session if not present
        setSession(prev => {
          if (!prev) return null;
          const current = prev.unlocked_regions || [];
          if (!current.includes(regionId)) {
            return { ...prev, unlocked_regions: [...current, regionId] };
          }
          return prev;
        });
        return true;
      }
    } catch (err) {
      console.error("Error checking region access:", err);
    }
    return false;
  };

  // Perform single getDoc authorization check on past/present region selection
  useEffect(() => {
    if (activeRegionId && session?.authenticated) {
      const metadata = REGIONS_METADATA.find(r => r.region_id === activeRegionId);
      if (metadata) {
        const isFuture = new Date(metadata.release_date).getTime() > Date.now();
        if (!isFuture) {
          checkRegionAuthorization(activeRegionId);
        }
      }
    }
  }, [activeRegionId, session?.authenticated]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setAuthError("Please provide a valid email address.");
      return;
    }

    setRequestingLink(true);
    setAuthMessage("");
    setAuthError("");
    setGeneratedLink("");

    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (data.success) {
        setAuthMessage(data.message);
        if (data.link) {
          setGeneratedLink(data.link);
        }
      } else {
        setAuthError(data.error || "Failed to generate link.");
      }
    } catch (err) {
      setAuthError("Network error. Please try again.");
    } finally {
      setRequestingLink(false);
    }
  };

  const handleDirectCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCheckoutEmail || !directCheckoutEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!directCheckoutAddress || directCheckoutAddress.trim().length < 5) {
      alert("Please provide a complete shipping address.");
      return;
    }

    setSimulatingWebhook(true);
    try {
      const res = await fetch("/api/checkout/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: directCheckoutEmail,
          plan_tier: directCheckoutTier,
          shipping_address: directCheckoutAddress,
          gateway: directCheckoutGateway
        })
      });
      const data = await res.json();
      if (data.success) {
        // Save order and subscription data to Cloud Firestore
        saveOrder({
          email: directCheckoutEmail,
          plan_tier: directCheckoutTier,
          shipping_address: directCheckoutAddress,
          gateway: directCheckoutGateway
        }).catch(e => console.warn("Firestore saveOrder error:", e));

        setDirectCheckoutModalOpen(false);
        alert(import.meta.env.VITE_PREVIEW === "true"
          ? "🌿 Preview mode: no real payment was taken. You are signed in to a demo account so you can explore the travel journal."
          : `🌿 Welcome to Kokoro Letters!\n\nYour payment via ${directCheckoutGateway === "razorpay" ? "Razorpay" : "PayPal"} succeeded. You have been registered and automatically logged in! Enjoy exploring your travel journal!`);
        await fetchSession();
        setActiveRegionId("hokkaido");
        setActiveTab("journal");
        triggerUnlockAnimation("hokkaido");
        setTimeout(() => {
          document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        alert(data.error || "Failed to complete direct checkout.");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ authenticated: false, subscriber: null, unlocked_regions: [] });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleManualStamp = async (regionId: string) => {
    try {
      const res = await fetch("/api/regions/stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_id: regionId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSession();
        triggerUnlockAnimation(regionId);
      } else {
        alert(data.error || "Failed to stamp region");
      }
    } catch (err) {
      console.error("Stamp error:", err);
    }
  };


  const activeRegion = regions.find(r => r.region_id === activeRegionId);
  const activeMetadata = REGIONS_METADATA.find(r => r.region_id === activeRegionId);
  const isActiveRegionFuture = activeMetadata ? new Date(activeMetadata.release_date).getTime() > Date.now() : false;
  const isSubscriberActive = session?.subscriber?.subscription_status === "Active";
  const isUnlocked = isSubscriberActive && (session?.unlocked_regions?.includes(activeRegionId || "") || false);

  const handleToggleSound = (sound: "wind" | "river" | "ocean") => {
    if (ambientSound === sound && isAudioPlaying) {
      setIsAudioPlaying(false);
      setAmbientSound("none");
    } else {
      setAmbientSound(sound);
      setIsAudioPlaying(true);
    }
  };

  const handleSelectRegion = async (id: string) => {
    const metadata = REGIONS_METADATA.find(r => r.region_id === id);
    if (!metadata) return;

    const isFuture = new Date(metadata.release_date).getTime() > Date.now();
    setActiveRegionId(id);

    if (isFuture) {
      // Future: display Coming Soon. Zero database interaction.
      setActiveTab("journal");
      setTimeout(() => {
        document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    // Past/Present: check authorization
    const unlocked = session?.unlocked_regions?.includes(id) || await checkRegionAuthorization(id);
    if (!unlocked && !isSubscriberActive) {
      setTicketRegion(id);
      setTicketModalOpen(true);
    } else {
      setActiveTab("journal");
      setTimeout(() => {
        document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-ghibli-green-dark font-sans selection:bg-ghibli-sand selection:text-ghibli-green-dark pb-12">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-ghibli-green-light px-6 py-4 vintage-shadow">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ghibli-green flex items-center justify-center text-white font-serif font-bold text-xl shadow-inner border border-ghibli-green-dark/10">
              心
            </div>
            <div>
              <h1 className="text-xl font-bold text-ghibli-green-dark font-serif tracking-tight flex items-center gap-2">
                Kokoro Letters
              </h1>
              <p className="text-xs text-ghibli-sage font-medium">Unlock Poetic Journeys in Japan</p>
            </div>
          </div>

          {/* Navigation Links matching Screenshot 1 */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            {[
              { id: "journey", label: "Our Journey" },
              { id: "subscription", label: "Subscription" },
              { id: "journal", label: "Travel Journal" },
              { id: "newsletter", label: "Newsletter" },
              { id: "admin", label: "Admin Dashboard" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`transition-colors py-1 px-1 border-b-2 font-serif text-sm ${
                  activeTab === tab.id
                    ? "border-ghibli-green text-ghibli-green-dark font-bold"
                    : "border-transparent text-ghibli-sage hover:text-ghibli-green-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {session?.authenticated ? (
              <div className="flex items-center gap-3 bg-ghibli-green-light/60 p-1.5 pl-3 rounded-full border border-ghibli-green-light shadow-xs">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-ghibli-green-dark">{session.email}</span>
                  <span className="text-[10px] font-mono text-ghibli-sage flex items-center gap-1 justify-end">
                    {isSubscriberActive ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> {session.subscriber?.plan_tier} Tier
                      </span>
                    ) : (
                      "Inactive Subscriber"
                    )}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full bg-white hover:bg-ghibli-green-light flex items-center justify-center text-ghibli-sage hover:text-ghibli-green-dark transition-colors border border-ghibli-green-light"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("subscription")}
                  className="px-4 py-1.5 rounded-full border border-ghibli-green hover:bg-ghibli-green text-ghibli-green-dark hover:text-white text-xs font-serif font-semibold transition-all"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* PAGE 1: OUR JOURNEY TAB */}
          {activeTab === "journey" && (
            <motion.div
              key="journey-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              {/* Hero Banner (Sage green Ghibli theme) */}
              <div className="bg-ghibli-green text-ghibli-green-dark rounded-3xl p-10 md:p-16 text-center space-y-6 relative overflow-hidden shadow-xs">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#faf6eb20,#0000_50%)] pointer-events-none" />
                
                <div className="w-12 h-12 rounded-full bg-ghibli-sand mx-auto flex items-center justify-center text-ghibli-green-dark border border-ghibli-green-dark/10">
                  <Compass className="w-6 h-6" />
                </div>

                <h2 className="text-3xl md:text-5xl font-bold font-serif tracking-tight max-w-3xl mx-auto leading-tight text-ghibli-green-dark">
                  Step through the meadow into the spirit world
                </h2>
                <p className="text-ghibli-green-dark/80 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                  Each month, a handcrafted kit arrives at your door &mdash; lore, art, and quiet magic from one of Japan's twelve regions. Trace the path across our map to begin.
                </p>

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <button
                    onClick={() => {
                      setActiveTab("journal");
                      setTimeout(() => {
                        document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="px-6 py-3 bg-ghibli-sand hover:bg-[#eed7b1] text-ghibli-green-dark rounded-xl text-sm font-semibold transition-all shadow-xs"
                  >
                    Begin the Journey
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById("journey-unfolds-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-3 border border-ghibli-green-dark/30 hover:bg-ghibli-green-dark/10 text-ghibli-green-dark rounded-xl text-sm font-semibold transition-all"
                  >
                    Explore Our Lore
                  </button>
                </div>
              </div>

              {/* How the Journey Unfolds Section */}
              <div id="journey-unfolds-section" className="py-8 space-y-12">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf6eb] text-ghibli-green-dark text-[11px] font-bold tracking-wide border border-[#d3cbbe]">
                    <Sparkles className="w-3.5 h-3.5 text-ghibli-sage" />
                    <span>A Postcard Love Letter to Japan</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-green-dark">
                    How the Journey Unfolds
                  </h3>
                  <p className="text-xs md:text-sm text-ghibli-sage leading-relaxed max-w-2xl mx-auto">
                    Kokoro Letters is a monthly physical mail club made to share a profound love for Japan. Over the course of a year, we travel together through <strong>12 scenic regions</strong> across Japan that inspired beloved Ghibli movies. Every dispatch is strictly handmade, hand-printed, and sent with pure devotion.
                  </p>
                </div>

                {/* Core Philosophy Split Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  <div className="bg-ghibli-cream border border-ghibli-cream-dark rounded-3xl p-8 space-y-4 vintage-shadow relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 opacity-5 text-ghibli-green-dark text-9xl font-serif select-none pointer-events-none">画</div>
                    <div className="w-12 h-12 rounded-full bg-ghibli-green-light flex items-center justify-center text-ghibli-green-dark">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-xl text-ghibli-green-dark">100% Handmade & Hand-printed</h4>
                    <p className="text-xs md:text-sm text-ghibli-sage leading-relaxed">
                      We cherish tactile authenticity. Every single art print, letter, and sticker in your monthly envelope is hand-printed and prepared manually. No mass production, no artificial shortcuts—just raw, gorgeous materials that celebrate slow craftsmanship and physical connection.
                    </p>
                  </div>

                  <div className="bg-[#f0eadd]/40 border border-[#d3cbbe]/60 rounded-3xl p-8 space-y-4 vintage-shadow relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 opacity-5 text-ghibli-green-dark text-9xl font-serif select-none pointer-events-none">図</div>
                    <div className="w-12 h-12 rounded-full bg-ghibli-green-light flex items-center justify-center text-ghibli-green-dark">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-xl text-ghibli-green-dark">Interactive 12-Region Collectible Map</h4>
                    <p className="text-xs md:text-sm text-ghibli-sage leading-relaxed">
                      When you subscribe in your first month, you receive a large, beautifully printed physical map of Japan with all 12 regions marked. As each month passes and you receive your new regional stickers, paste them directly onto the physical map to complete your ultimate travel collection!
                    </p>
                  </div>
                </div>

                {/* What You Get in Every Monthly Physical Mail */}
                <div className="space-y-6 pt-4">
                  <h4 className="text-lg md:text-xl font-bold font-serif text-center text-ghibli-green-dark">
                    What lands in your mailbox every month?
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    {[
                      {
                        title: "Ghibli Art Print",
                        desc: "A hand-printed art print of a breathtaking scene from the Ghibli movie inspired by that month's region.",
                        icon: <Image className="w-5 h-5 text-emerald-800" />
                      },
                      {
                        title: "Anime Sticker",
                        desc: "A gorgeous, custom-illustrated sticker inspired by the characters or spirits of that specific anime.",
                        icon: <Sparkles className="w-5 h-5 text-emerald-800" />
                      },
                      {
                        title: "Region Sticker",
                        desc: "A beautiful regional sticker designed for that territory. Stick it onto your physical map of Japan to complete it!",
                        icon: <Tag className="w-5 h-5 text-emerald-800" />
                      },
                      {
                        title: "Creator's Lore Letter",
                        desc: "A personal letter from me describing the region's scenery, the anime it inspired, and the story of how it was built.",
                        icon: <BookOpen className="w-5 h-5 text-emerald-800" />
                      }
                    ].map((item, i) => (
                      <div key={i} className="bg-white border border-ghibli-green-light/40 rounded-2xl p-5 space-y-3 vintage-shadow text-center hover:border-ghibli-green transition-colors">
                        <div className="w-10 h-10 rounded-full bg-ghibli-green-light flex items-center justify-center mx-auto text-ghibli-green-dark">
                          {item.icon}
                        </div>
                        <h5 className="font-serif font-bold text-xs text-ghibli-green-dark">{item.title}</h5>
                        <p className="text-[11px] text-ghibli-sage leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Letter Showcase Section */}
              <div className="py-4">
                <MonthlyLetterShowcase
                  isSubscriber={session?.subscriber?.subscription_status === "Active"}
                  onSubscribe={() => setActiveTab("subscription")}
                />
              </div>

              {/* Interactive Map Section */}
              <div className="py-4 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold font-serif text-ghibli-green-dark">
                    Your Path Across Japan
                  </h3>
                  <p className="text-xs text-ghibli-sage max-w-lg mx-auto">
                    Hover a checkpoint to glimpse its name and status. Tap a region below to jump into your travel journal and stamp your ticket.
                  </p>
                </div>
                
                <div className="max-w-xl mx-auto">
                  <div className="text-center bg-[#fdfcf7] py-2 px-4 rounded-full border border-ghibli-cream-dark/65 max-w-xs mx-auto mb-3 text-[11px] font-medium text-ghibli-sage">
                    🌏 Global Journey Map (Visible to Everyone)
                  </div>
                  <JapanMap
                    isSubscriber={false}
                    unlockedRegions={regions.map(r => r.region_id)}
                    activeRegionId={activeRegionId}
                    onSelectRegion={handleSelectRegion}
                    regionsList={regions}
                  />
                </div>
              </div>

              {/* FAQ Section */}
              <div className="py-4">
                <FaqSection />
              </div>

              {/* Whispers from the Next Region (Newsletter Signup Banner) */}
              <div className="bg-ghibli-sand rounded-3xl p-8 md:p-12 text-center space-y-6 vintage-shadow">
                <h3 className="text-2xl font-bold font-serif text-ghibli-green-dark">
                  Whispers from the Next Region
                </h3>
                <p className="text-xs text-ghibli-sage max-w-lg mx-auto leading-relaxed">
                  Sign up for our free Cultural Newsletter and receive monthly teasers about the upcoming region's Ghibli theme and lore.
                </p>

                <div className="max-w-md mx-auto bg-white rounded-2xl p-6 border border-ghibli-cream-dark shadow-sm text-left">
                  {isNewsletterSubscribed ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-800">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="font-serif font-bold text-base text-ghibli-green-dark">You are already subscribed! 🍃</h4>
                      <p className="text-xs text-ghibli-sage">We will whisper the secrets of the upcoming region to {session?.email}.</p>
                    </div>
                  ) : teaserSent ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-800">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="font-serif font-bold text-base text-ghibli-green-dark">Your Teaser Scroll is Sealed!</h4>
                      <p className="text-xs text-ghibli-sage">We will whisper the secrets of the next region to you soon. 🍃</p>
                    </div>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (teaserEmail) {
                        const res = await saveNewsletter(teaserName || "Traveler", teaserEmail);
                        if (res === "already-signed-up") {
                          alert("You are already signed up! 🍃");
                        } else {
                          setTeaserSent(true);
                        }
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="text-[11px] font-semibold text-ghibli-sage block mb-1">Your Name</label>
                        <input
                          type="text"
                          placeholder="Chihiro"
                          value={teaserName}
                          onChange={(e) => setTeaserName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-ghibli-green bg-[#faf8f5] text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-ghibli-sage block mb-1">Email</label>
                        <input
                          type="email"
                          required
                          placeholder="you@meadow.jp"
                          value={teaserEmail}
                          onChange={(e) => setTeaserEmail(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-ghibli-green bg-[#faf8f5] text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark font-serif font-bold rounded-xl text-xs tracking-wide transition-all shadow-xs"
                      >
                        Send Me Teasers
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Footer exactly like Screenshot 2 */}
              <footer className="bg-ghibli-green-light/40 border-t border-ghibli-green-light rounded-3xl p-8 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-lg text-ghibli-green-dark">Kokoro Letters</h4>
                  <p className="text-xs text-ghibli-sage leading-relaxed">
                    A moonlit journey through Japan, one paper lantern at a time. Slow living, delivered to your door.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-sm text-ghibli-green-dark">Wander</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-ghibli-sage">
                    <button onClick={() => setActiveTab("journey")} className="hover:text-ghibli-green-dark text-left">Our Journey</button>
                    <button onClick={() => setActiveTab("subscription")} className="hover:text-ghibli-green-dark text-left">Subscription</button>
                    <button onClick={() => setActiveTab("journal")} className="hover:text-ghibli-green-dark text-left">Travel Journal</button>
                    <button onClick={() => setActiveTab("newsletter")} className="hover:text-ghibli-green-dark text-left">Newsletter</button>
                    {import.meta.env.VITE_PREVIEW !== "true" && (
                      <button onClick={() => setActiveTab("admin")} className="hover:text-ghibli-green-dark text-left font-mono text-[10px] text-ghibli-sage/60 mt-1 col-span-2">Admin Ledger</button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-sm text-ghibli-green-dark">Monthly Teasers</h4>
                  <p className="text-xs text-ghibli-sage mb-2">Whispers of the region to come, delivered to your inbox.</p>
                  {isNewsletterSubscribed ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>You are already subscribed ({session?.email}) 🍃</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                    <input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@meadow.jp"
                      className="bg-white border border-ghibli-green-light rounded-lg px-2.5 py-1 text-xs focus:outline-none flex-1"
                    />
                    <button
                      onClick={async () => {
                        if (!waitlistEmail.includes("@")) {
                          alert("Please enter a valid email address.");
                          return;
                        }
                        try {
                          const res = await saveNewsletter("Traveler", waitlistEmail.trim());
                          if (res === "already-signed-up") {
                            alert("You are already signed up! 🍃");
                          } else if (res === "success") {
                            alert("You're on the list! 🍃 Whispers of the next region will be sent to your inbox.");
                            setWaitlistEmail("");
                          } else {
                            alert("Could not complete signup. Please try again.");
                          }
                        } catch {
                          alert("Something went wrong. Please try again.");
                        }
                      }}
                      className="bg-ghibli-sand hover:bg-[#eed7b1] px-3 py-1 rounded-lg text-xs font-semibold text-ghibli-green-dark"
                    >Join</button>
                  </div>
                )}
              </div>
              </footer>
            </motion.div>
          )}

          {/* PAGE 2: SUBSCRIPTION TAB */}
          {activeTab === "subscription" && (
            <motion.div
              key="subscription-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="bg-ghibli-green text-ghibli-green-dark rounded-3xl p-8 text-center space-y-2 relative overflow-hidden shadow-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-950 bg-ghibli-green-light px-2.5 py-1 rounded-full border border-ghibli-green-dark/10">
                  Your Journey
                </span>
                <h2 className="text-2xl md:text-3xl font-bold font-serif tracking-tight pt-1">
                  Manage Your Passage
                </h2>
                <p className="text-ghibli-sage text-xs max-w-lg mx-auto">
                  Twelve regions, twelve moons of quiet wonder. Tend to your subscription, shipping, and plan below.
                </p>
              </div>

              {/* Your Subscription Status Card */}
              <div className="bg-white rounded-3xl p-6 border border-ghibli-green-light shadow-sm space-y-6">
                <h3 className="text-lg font-bold font-serif text-ghibli-green-dark border-b border-ghibli-green-light pb-3">
                  Your Subscription
                </h3>

                {session?.authenticated ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] text-ghibli-sage font-mono block">PLAN TIER</span>
                      <span className="text-xl font-bold text-ghibli-green-dark font-serif block">
                        {isSubscriberActive ? `${session.subscriber?.plan_tier} Plan` : "No Active Plan"}
                      </span>
                      <div className="flex gap-4 text-xs font-mono text-ghibli-sage">
                        <span>Status: <strong className={isSubscriberActive ? "text-emerald-700" : "text-stone-500"}>{isSubscriberActive ? "Active" : "Pending Activation"}</strong></span>
                        {isSubscriberActive && (
                          <>
                            <span>Billing: Razorpay/PayPal</span>
                            <span>Created: {new Date(session.subscriber?.createdAt || "").toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          document.getElementById("passage-tiers-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-4 py-2 border border-ghibli-green text-ghibli-green-dark rounded-xl text-xs font-semibold hover:bg-ghibli-green-light transition-all"
                      >
                        Change Plan
                      </button>
                      <button
                        disabled={!isSubscriberActive}
                        onClick={() => alert("Subscription paused in sandbox environment!")}
                        className="px-4 py-2 bg-ghibli-sand hover:bg-[#eed7b1] text-ghibli-green-dark rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
                      >
                        Pause Subscription
                      </button>
                      <button
                        disabled={!isSubscriberActive}
                        onClick={() => alert("Subscription cancelled in sandbox environment!")}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Magic Link Form inside Subscription if guest */
                  <div className="p-4 bg-ghibli-green-light/40 border border-ghibli-green-light rounded-2xl max-w-xl mx-auto space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-base text-ghibli-green-dark flex items-center gap-2">
                        <Mail className="w-5 h-5 text-ghibli-sage" />
                        Access your Personal Travel Ledger
                      </h4>
                      <p className="text-xs text-ghibli-sage leading-relaxed">
                        We use secure, passwordless **Magic Links** to manage your Kokoro Letters ledger. Simply request a login link, and click it below to authenticate instantly.
                      </p>
                    </div>

                    <form onSubmit={handleSendMagicLink} className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="Enter your email (e.g. isha79799@gmail.com)"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-ghibli-green bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={requestingLink}
                        className="px-4 py-2 bg-ghibli-green-dark text-white hover:bg-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {requestingLink ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Send Link</span>
                      </button>
                    </form>

                    {authMessage && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 font-medium space-y-2">
                        <div>{authMessage}</div>
                        {generatedLink && (
                          <div className="mt-2 bg-white p-2.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                            <span className="text-[10px] text-emerald-700 font-mono select-all truncate max-w-xs">{generatedLink}</span>
                            <a
                              href={generatedLink}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1 shrink-0"
                            >
                              <span>Enter Meadow Gates</span>
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {authError && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-800 font-medium">
                        {authError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping Address Section */}
              {session?.authenticated && (
                <div className="bg-white rounded-3xl p-6 border border-ghibli-green-light shadow-sm space-y-4">
                  <h3 className="text-lg font-bold font-serif text-ghibli-green-dark border-b border-ghibli-green-light pb-3">
                    Shipping Address
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] text-ghibli-sage font-mono block mb-1">WHERE YOUR KITS ARRIVE</span>
                      {session.subscriber?.shipping_address ? (
                        <p className="text-sm text-ghibli-green-dark font-medium">{session.subscriber.shipping_address}</p>
                      ) : (
                        <p className="text-xs text-ghibli-sage italic">No shipping address recorded yet. Subscribe below to set it.</p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        const newAddr = prompt("Enter new shipping address:", session.subscriber?.shipping_address || "");
                        if (newAddr) {
                          try {
                            const res = await fetch("/api/subscriber/update-address", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ shipping_address: newAddr })
                            });
                            const data = await res.json();
                            if (data.success) {
                              setCheckoutAddress(newAddr);
                              await fetchSession();
                            } else {
                              alert(data.error || "Failed to update address.");
                            }
                          } catch (err: any) {
                            alert("Network error: " + err.message);
                          }
                        }
                      }}
                      className="px-4 py-2 border border-ghibli-green text-ghibli-green-dark rounded-xl text-xs font-semibold hover:bg-ghibli-green-light transition-all"
                    >
                      Edit Address
                    </button>
                  </div>
                </div>
              )}

              {/* Personalized subscriber progress section */}
              {session?.authenticated && isSubscriberActive && (
                <div className="bg-[#fcfcf9] rounded-3xl p-6 border border-ghibli-green-light shadow-sm space-y-6 vintage-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-ghibli-green-light/60 pb-4 gap-4">
                    <div>
                      <h3 className="text-xl font-bold font-serif text-ghibli-green-dark">
                        Your Personal Traveler's Map & Progress
                      </h3>
                      <p className="text-xs text-ghibli-sage mt-1">
                        This map is unique to your subscription history. As the months go by, you'll stamp and unlock your path across the 12 regions of Japan.
                      </p>
                    </div>
                    <div className="bg-[#e2edd3] text-emerald-800 text-xs px-3 py-1.5 rounded-xl font-mono font-bold border border-emerald-200 shrink-0">
                      🌿 {session.unlocked_regions?.length || 0} of 12 Regions Covered
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-ghibli-green-dark">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        Wandering Progress
                      </span>
                      <span>{Math.round(((session.unlocked_regions?.length || 0) / 12) * 100)}% Completed</span>
                    </div>
                    <div className="h-3.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200 p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((session.unlocked_regions?.length || 1) / 12) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#86ab9a] to-[#527e69] rounded-full shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Render their personalized Subscriber Map of Japan */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
                    <div className="lg:col-span-5 max-w-sm mx-auto w-full">
                      <div className="text-center font-mono text-[9px] text-[#426151] font-bold mb-3 uppercase tracking-wider bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                        🔒 Subscriber-Specific Map
                      </div>
                      <JapanMap
                        isSubscriber={true}
                        unlockedRegions={session.unlocked_regions || []}
                        activeRegionId={activeRegionId}
                        onSelectRegion={(id) => {
                          handleSelectRegion(id);
                        }}
                        regionsList={regions}
                      />
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="text-sm font-bold font-serif text-ghibli-green-dark flex items-center gap-1">
                        <span>📖</span>
                        <span>Your Travel Stamp Book</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {regions.map((region, idx) => {
                          const isCovered = (session.unlocked_regions || []).includes(region.region_id);
                          return (
                            <div
                              key={region.region_id}
                              className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all ${
                                isCovered
                                  ? "bg-[#eaf4eb] border-emerald-200 text-emerald-900"
                                  : "bg-stone-50 border-stone-200 text-stone-400"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-bold text-ghibli-sage">Month {idx + 1}</span>
                                {isCovered ? (
                                  <span className="text-emerald-700 font-bold">🌱</span>
                                ) : (
                                  <span className="text-stone-300">🔒</span>
                                )}
                              </div>
                              <div className="font-serif font-bold text-xs truncate">{region.region_name}</div>
                              <div className="text-[9px] font-mono">
                                {isCovered ? "Stamped & Shipped" : "Locked"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Single Subscription Tier Grid */}
              <div id="passage-tiers-section" className="py-4 space-y-6">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono text-ghibli-sage bg-ghibli-green-light px-2.5 py-1 rounded-full">One Single Premium Tier</span>
                  <h3 className="text-2xl font-bold font-serif text-ghibli-green-dark pt-2">
                    Kokoro Letters Monthly Mail Club
                  </h3>
                  <p className="text-xs text-ghibli-sage max-w-xl mx-auto">
                    We offer one single, uncompromising premium experience. Every monthly dispatch is entirely hand-printed and hand-packed. The only difference is your shipping destination.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Domestic India Card */}
                  <div className="bg-ghibli-cream border border-ghibli-cream-dark rounded-2xl p-6 flex flex-col justify-between space-y-6 relative vintage-shadow">
                    <span className="absolute -top-3 right-4 bg-emerald-700 text-white text-[9px] font-mono uppercase font-bold px-3 py-1 rounded-full shadow-xs">
                      Domestic Delivery
                    </span>
                    <div className="space-y-4">
                      <h4 className="font-serif font-bold text-lg text-ghibli-green-dark">Domestic India Plan</h4>
                      <span className="text-2xl font-serif font-bold text-ghibli-green-dark block">₹1,499 / mo</span>
                      <p className="text-xs text-ghibli-sage leading-relaxed">
                        Free domestic speed-post from our Indian distribution hub. Delivered in 3-5 business days.
                      </p>
                      <ul className="space-y-2 text-xs text-ghibli-green-dark">
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>🖼️ Hand-printed Ghibli Art Print</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>✨ Character-Inspired Vinyl Sticker</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>🏷️ Collectible Region Map Sticker</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>📖 Hand-sealed Creator's Lore Letter</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>🎁 First-Month Welcome Gift: Physical Japan Map</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setCheckoutTier("India");
                        if (!session?.authenticated) {
                          setDirectCheckoutTier("India");
                          setDirectCheckoutGateway("razorpay");
                          setDirectCheckoutEmail("");
                          setDirectCheckoutAddress("");
                          setDirectCheckoutModalOpen(true);
                          return;
                        }
                        setActiveTab("journal");
                        setTimeout(() => {
                          document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="w-full py-2.5 bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark font-serif font-bold rounded-xl text-xs transition-all shadow-xs"
                    >
                      Subscribe via Razorpay
                    </button>
                  </div>

                  {/* International Card */}
                  <div className="bg-ghibli-cream border border-[#d3cbbe] rounded-2xl p-6 flex flex-col justify-between space-y-6 relative vintage-shadow">
                    <span className="absolute -top-3 right-4 bg-[#78350f] text-white text-[9px] font-mono uppercase font-bold px-3 py-1 rounded-full shadow-xs">
                      Worldwide tracked airmail
                    </span>
                    <div className="space-y-4">
                      <h4 className="font-serif font-bold text-lg text-ghibli-green-dark">International Plan</h4>
                      <span className="text-2xl font-serif font-bold text-[#78350f] block">$29.99 / mo</span>
                      <p className="text-xs text-ghibli-sage leading-relaxed">
                        Tracked global shipping directly from Tokyo. Customs pre-cleared, delivered in 7-12 business days.
                      </p>
                      <ul className="space-y-2 text-xs text-ghibli-green-dark">
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78350f] shrink-0" />
                          <span>🖼️ Hand-printed Ghibli Art Print</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78350f] shrink-0" />
                          <span>✨ Character-Inspired Vinyl Sticker</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78350f] shrink-0" />
                          <span>🏷️ Collectible Region Map Sticker</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78350f] shrink-0" />
                          <span>📖 Hand-sealed Creator's Lore Letter</span>
                        </li>
                        <li className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78350f] shrink-0" />
                          <span>🎁 First-Month Welcome Gift: Physical Japan Map</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setCheckoutTier("International");
                        if (!session?.authenticated) {
                          setDirectCheckoutTier("International");
                          setDirectCheckoutGateway("paypal");
                          setDirectCheckoutEmail("");
                          setDirectCheckoutAddress("");
                          setDirectCheckoutModalOpen(true);
                          return;
                        }
                        setActiveTab("journal");
                        setTimeout(() => {
                          document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="w-full py-2.5 bg-stone-700 hover:bg-stone-800 text-white font-serif font-bold rounded-xl text-xs transition-all shadow-xs"
                    >
                      Subscribe via PayPal
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PAGE 3: TRAVEL JOURNAL (Workspace & Ledger) */}
          {activeTab === "journal" && (
            <motion.div
              key="journal-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* If NOT signed in, display Guest Sign-In / Subscribe Gate */}
              {!session?.authenticated ? (
                <div className="max-w-4xl mx-auto space-y-8 py-4">
                  <div className="bg-white rounded-3xl p-8 md:p-12 border border-ghibli-green-light text-center space-y-6 vintage-shadow">
                    <div className="w-16 h-16 rounded-full bg-ghibli-green-light flex items-center justify-center mx-auto text-ghibli-green-dark border border-ghibli-green">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div className="max-w-xl mx-auto space-y-2">
                      <h3 className="font-serif font-bold text-ghibli-green-dark text-xl md:text-2xl">
                        Enter the Travel Ledger Gates
                      </h3>
                      <p className="text-xs text-ghibli-sage leading-relaxed">
                        Your Travel Journal is a private, hand-bound digital parchment where you can collect interactive stamps, keep real-time physical dispatch tracking logs, and read your Japanese botanical letters from Kokoro. Please sign in or subscribe below to check your travel journal.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-6 border-t border-ghibli-green-light/40">
                      {/* Left card: Magic Link login */}
                      <div className="space-y-4 p-6 bg-ghibli-green-light/20 border border-ghibli-green-light/40 rounded-2xl flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="font-serif font-bold text-sm text-ghibli-green-dark flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-ghibli-sage" />
                            Already a subscriber or have an account?
                          </h4>
                          <p className="text-[11px] text-ghibli-sage">
                            Request a single-use passwordless Magic Link to authenticate instantly and safely enter the meadow gates:
                          </p>
                        </div>

                        <form onSubmit={handleSendMagicLink} className="space-y-2.5 mt-2">
                          <input
                            type="email"
                            required
                            placeholder="Enter your email (e.g. isha79799@gmail.com)"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-ghibli-green bg-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={requestingLink}
                            className="w-full px-4 py-2 bg-ghibli-green text-ghibli-green-dark hover:bg-stone-800 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {requestingLink ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Send Magic Link</span>
                          </button>
                        </form>

                        {authMessage && (
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 font-medium space-y-2 mt-2">
                            <div>{authMessage}</div>
                            {generatedLink && (
                              <div className="mt-2 bg-white p-2 border border-emerald-200 flex flex-col items-center gap-2 shadow-xs">
                                <span className="text-[9px] text-emerald-700 font-mono select-all truncate max-w-full">{generatedLink}</span>
                                <a
                                  href={generatedLink}
                                  className="w-full px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-serif font-bold transition-all flex items-center justify-center gap-1"
                                >
                                  <span>Verify & Enter</span>
                                  <ArrowRight className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        {authError && (
                          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-800 font-medium mt-2">
                            {authError}
                          </div>
                        )}
                      </div>

                      {/* Right card: Subscribe */}
                      <div className="space-y-4 p-6 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="font-serif font-bold text-sm text-ghibli-green-dark flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                            Begin Your Journey
                          </h4>
                          <p className="text-[11px] text-ghibli-sage leading-relaxed">
                            Subscribe today to receive real monthly snail-mail dispatches filled with scenic Japanese regional art, postcards, physical botanical stamps, and beautiful letters.
                          </p>
                          <ul className="text-[10px] text-ghibli-green-dark space-y-1 font-medium font-mono">
                            <li className="flex items-center gap-1.5">✓ 12-Month Japan Travel Pass</li>
                            <li className="flex items-center gap-1.5">✓ Physical Art, Postcards & Lore Delivered</li>
                            <li className="flex items-center gap-1.5">✓ Interactive Stamp Map Ledger</li>
                          </ul>
                        </div>

                        <button
                          onClick={() => setActiveTab("subscription")}
                          className="w-full px-4 py-2.5 bg-ghibli-green-dark text-white hover:bg-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-4"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Check Subscription Plans & Join</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Authenticated User Content */
                <div className="space-y-8">
                  {/* Warning banner for unsubscribed authenticated users */}
                  {!isSubscriberActive && (
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
                      <div className="space-y-1 max-w-2xl">
                        <h4 className="font-serif font-bold text-[#8c5e1a] text-base flex items-center gap-2">
                          <Lock className="w-5 h-5 shrink-0" />
                          Your Travel Journal is Fully Locked
                        </h4>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          You have successfully signed into your account, but you do not have an active monthly mail subscription yet. To unlock your interactive map, stamp and read Ghibli-themed letters, and activate your physical mail dispatches, please subscribe below.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const scrollEl = document.getElementById("subscription-direct-checkout-form");
                          if (scrollEl) {
                            scrollEl.scrollIntoView({ behavior: "smooth" });
                          } else {
                            // Focus address area in right column
                            const addressEl = document.getElementById("address-ledger-focus");
                            addressEl?.focus();
                          }
                        }}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold tracking-wide shadow-sm transition-colors shrink-0"
                      >
                        Subscribe to Unlock Map
                      </button>
                    </div>
                  )}

                  {/* Header Banner */}
                  <div className="bg-ghibli-green text-ghibli-green-dark rounded-3xl p-8 text-center space-y-1 relative overflow-hidden shadow-xs">
                    <h2 className="text-2xl md:text-3xl font-bold font-serif tracking-tight">
                      Your Personal Travel Journal
                    </h2>
                    <p className="text-ghibli-sage text-xs max-w-lg mx-auto">
                      {isSubscriberActive 
                        ? "Click a region on your map below to read your letters and access premium environmental soundscapes."
                        : "Select a region below to see plan details and subscribe to unlock your journey!"}
                    </p>
                  </div>

                  {/* Subtle Stamp Achievement Banner */}
                  <AnimatePresence>
                    {justUnlockedRegionId && (
                      <motion.div
                        key={`unlock-banner-${justUnlockedRegionId}`}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-[#fbf9f4] border border-emerald-300/80 rounded-2xl px-5 py-3.5 shadow-sm flex items-center justify-between gap-4 max-w-2xl mx-auto"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <motion.div
                            initial={{ scale: 1.8, rotate: -20, opacity: 0 }}
                            animate={{ scale: [1.8, 0.92, 1], rotate: -8, opacity: 1 }}
                            transition={{ duration: 0.42, ease: "easeOut" }}
                            className="w-9 h-9 rounded-full border-2 border-red-800/80 bg-red-50/70 flex items-center justify-center shrink-0 text-red-900 font-serif font-bold text-sm shadow-2xs"
                          >
                            心
                          </motion.div>
                          <div>
                            <p className="text-xs font-serif font-bold text-ghibli-green-dark">
                              Passport Stamped: {regions.find(r => r.region_id === justUnlockedRegionId)?.region_name || justUnlockedRegionId}
                            </p>
                            <p className="text-[11px] text-ghibli-sage">
                              New regional lore and letter unlocked in your Travel Journal.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                          Stamped
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Map */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      <JapanMap
                        isSubscriber={isSubscriberActive}
                        unlockedRegions={isSubscriberActive ? (session?.unlocked_regions || []) : []}
                        activeRegionId={activeRegionId}
                        justUnlockedRegionId={justUnlockedRegionId}
                        onSelectRegion={handleSelectRegion}
                        regionsList={regions}
                      />

                      {/* Existing Subscriber History Block */}
                      {isSubscriberActive && (
                        <div className="bg-white rounded-3xl p-6 border border-ghibli-green-light shadow-xs space-y-4 text-left">
                          <h4 className="text-sm font-bold font-serif text-ghibli-green-dark border-b border-ghibli-green-light pb-2 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-ghibli-sage" />
                            Traveler's Passage History
                          </h4>
                          <div className="text-xs space-y-2.5">
                            <div className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                              <span className="text-emerald-800 font-mono text-[10px] font-bold">ACCOUNT STATUS</span>
                              <span className="font-bold text-emerald-800">Active Subscriber</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-ghibli-sage font-mono text-[10px] font-bold">PLAN TIER</span>
                              <span className="font-semibold text-ghibli-green-dark">{session.subscriber?.plan_tier} Plan</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-ghibli-sage font-mono text-[10px] font-bold">SHIPPING DESTINATION</span>
                              <span className="font-medium text-ghibli-green-dark truncate max-w-[180px]" title={session.subscriber?.shipping_address}>
                                {session.subscriber?.shipping_address || "None"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-ghibli-sage font-mono text-[10px] font-bold">JOURNEY COMMENCED</span>
                              <span className="text-ghibli-green-dark font-medium">
                                {new Date(session.subscriber?.createdAt || "").toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-ghibli-sage font-mono text-[10px] font-bold">UNLOCKED REGIONS</span>
                              <span className="text-emerald-800 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                {session.unlocked_regions?.length || 0} of 12
                              </span>
                            </div>
                          </div>

                          {/* Stamp Book Display */}
                          <div className="space-y-2 pt-3 border-t border-stone-100">
                            <span className="text-[10px] text-ghibli-sage font-mono font-bold uppercase tracking-wider block">
                              Your Personal Stamp Book
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {regions.map((reg) => {
                                const stamped = session.unlocked_regions?.includes(reg.region_id);
                                const isJustStamped = justUnlockedRegionId === reg.region_id;
                                return (
                                  <motion.div
                                    key={`stamp-book-${reg.region_id}`}
                                    animate={isJustStamped ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.45, ease: "easeOut" }}
                                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] transition-colors ${
                                      isJustStamped
                                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-1 ring-emerald-300/70"
                                        : stamped
                                        ? "bg-emerald-50/50 border-emerald-100 text-emerald-800 font-semibold"
                                        : "bg-stone-50/50 border-stone-100 text-stone-400"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${stamped ? "bg-emerald-600 shadow-xs animate-pulse" : "bg-stone-300"}`} />
                                    <span className="truncate">{reg.region_name}</span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Region details / Parchment dispatch letter */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      {loadingRegions ? (
                        <div className="bg-white rounded-3xl p-12 border border-ghibli-green-light flex flex-col items-center justify-center text-stone-400">
                          <RefreshCw className="w-8 h-8 animate-spin text-stone-400 mb-2" />
                          <p className="text-sm font-medium">Reading travel diaries...</p>
                        </div>
                      ) : activeRegion ? (
                        <div className="bg-white rounded-3xl overflow-hidden border border-ghibli-green-light shadow-xs flex flex-col vintage-shadow">
                          {/* Region image header */}
                          <div className="h-48 relative overflow-hidden">
                            <img
                              src={activeRegion.assets_url}
                              alt={activeRegion.region_name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover brightness-85"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                            
                            <div className="absolute bottom-6 left-6 flex items-end justify-between right-6">
                              <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#eedba5]">
                                  Region Profile
                                </span>
                                <h2 className="text-2xl font-serif font-bold text-white tracking-tight mt-1">
                                  {activeRegion.region_name}
                                </h2>
                              </div>

                              <div className="flex items-center gap-2">
                                {isActiveRegionFuture ? (
                                  <span className="bg-amber-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                    <Clock className="w-3 h-3" /> Coming Soon
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="bg-emerald-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                    <Unlock className="w-3 h-3" /> Unlocked
                                  </span>
                                ) : (
                                  <span className="bg-stone-800/90 text-stone-300 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                    <Lock className="w-3 h-3" /> Locked
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Region body content */}
                          <div className="p-8 flex-1 flex flex-col gap-6">
                            {isActiveRegionFuture ? (
                              <div className="bg-ghibli-cream border border-ghibli-cream-dark rounded-2xl p-6 text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-800">
                                  <Clock className="w-6 h-6 animate-pulse" />
                                </div>
                                <div className="max-w-md mx-auto">
                                  <h3 className="font-serif font-bold text-ghibli-green-dark text-base">Coming Soon</h3>
                                  <p className="text-xs text-ghibli-sage leading-relaxed mt-2">
                                    The journey to **{activeRegion?.region_name}** is a future whisper. This beautiful monthly letter and postcard collection is scheduled to release on **{new Date(activeMetadata?.release_date || "").toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}**.
                                  </p>
                                  <div className="p-3 bg-white/60 border border-ghibli-cream-dark/50 rounded-xl mt-4 text-[11px] text-ghibli-sage font-mono space-y-1 text-left">
                                    <span className="block text-ghibli-green-dark font-semibold">Guard-and-Fetch Gateway:</span>
                                    <span className="block">● Release Date: {activeMetadata?.release_date}</span>
                                    <span className="block text-emerald-800">✓ Evaluated locally: zero network requests to Firestore made.</span>
                                  </div>
                                </div>
                              </div>
                            ) : !isUnlocked ? (
                              /* Locked region details */
                              <div className="bg-ghibli-cream border border-ghibli-cream-dark rounded-2xl p-6 text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-ghibli-green-light flex items-center justify-center mx-auto text-ghibli-green-dark">
                                  <Lock className="w-6 h-6" />
                                </div>
                                <div className="max-w-md mx-auto">
                                  <h3 className="font-serif font-bold text-ghibli-green-dark text-base">This journey is currently locked</h3>
                                  <p className="text-xs text-ghibli-sage leading-relaxed mt-2">
                                    To unlock the monthly letters, postcards, and lore of **{activeRegion.region_name}**, choose a subscription passage below. Active subscribers can stamp and unlock any released region instantly.
                                  </p>
                                </div>

                                <div className="max-w-md mx-auto pt-4 border-t border-ghibli-green-light space-y-4">
                                  {isSubscriberActive ? (
                                    <div className="space-y-3">
                                      <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                        You are an active **{session.subscriber?.plan_tier}** tier traveler! You can stamp and unlock this region directly.
                                      </p>
                                      <button
                                        onClick={() => handleManualStamp(activeRegion.region_id)}
                                        className="w-full bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                                      >
                                        <Unlock className="w-4 h-4" />
                                        <span>Stamp & Unlock Region</span>
                                      </button>
                                    </div>
                                  ) : (
                                    /* Direct subscription activation triggers */
                                    <div id="subscription-direct-checkout-form" className="space-y-3 text-left">
                                      <h4 className="text-xs font-bold text-ghibli-green-dark font-serif uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                        Subscribe to Unlock are you ready?
                                      </h4>
                                      
                                      <div className="space-y-2 text-xs">
                                        <div>
                                          <label className="text-[10px] text-ghibli-sage block mb-1 font-semibold">Shipping Address (Required for Physical Postcards)</label>
                                          <textarea
                                            id="address-ledger-focus"
                                            rows={2}
                                            value={checkoutAddress}
                                            onChange={(e) => setCheckoutAddress(e.target.value)}
                                            placeholder="Enter your physical shipping address where letters should be delivered..."
                                            className="w-full p-2 rounded-lg border border-ghibli-green bg-white text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-ghibli-sage block mb-1 font-semibold">Plan Passage Tier</label>
                                          <select
                                            value={checkoutTier}
                                            onChange={(e) => setCheckoutTier(e.target.value as PlanTier)}
                                            className="w-full p-2 rounded-lg border border-ghibli-green bg-white text-xs"
                                          >
                                            <option value="India">Domestic India Plan (₹1,499/mo - Free Shipping)</option>
                                            <option value="International">Collector's International Plan ($29.99/mo - Global Delivery)</option>
                                          </select>
                                        </div>
                                      </div>

                                      <button
                                        onClick={async () => {
                                          if (!checkoutAddress || checkoutAddress.trim().length < 5) {
                                            alert("Please enter a complete shipping address first!");
                                            return;
                                          }
                                          try {
                                            setSimulatingWebhook(true);
                                            const res = await fetch("/api/checkout", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                plan_tier: checkoutTier,
                                                region_id: activeRegion.region_id,
                                                shipping_address: checkoutAddress
                                              })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                              if (session?.email) { saveOrder({ email: session.email, plan_tier: checkoutTier, shipping_address: checkoutAddress, gateway: 'region-checkout' }).catch(function(e) { console.warn(e); }); }
                                              await fetchSession();
                                              triggerUnlockAnimation(activeRegion.region_id);
                                            } else {
                                              alert(data.error || "Failed to complete checkout.");
                                            }
                                          } catch (err: any) {
                                            alert("Network error: " + err.message);
                                          } finally {
                                            setSimulatingWebhook(false);
                                          }
                                        }}
                                        disabled={simulatingWebhook}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-3"
                                      >
                                        {simulatingWebhook ? (
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <CreditCard className="w-4 h-4" />
                                        )}
                                        <span>Proceed to Secure Subscription ({checkoutTier === "India" ? "Razorpay" : "PayPal"})</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Unlocked Letter view */
                              <div className="space-y-6">
                                {/* Audio component */}
                                <div className="bg-ghibli-green-light/40 p-4 rounded-2xl border border-ghibli-green-light flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-ghibli-green/10 flex items-center justify-center text-ghibli-green-dark">
                                      <Volume2 className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="text-left">
                                      <span className="text-xs font-semibold text-ghibli-green-dark block">Ambient Sound Companion</span>
                                      <span className="text-[10px] text-ghibli-sage font-mono">
                                        {isAudioPlaying 
                                          ? `Playing - ${ambientSound} overlay (${audioTimer}s)` 
                                          : "Enhance reading atmosphere"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    {["wind", "river", "ocean"].map((sound) => (
                                      <button
                                        key={sound}
                                        onClick={() => handleToggleSound(sound as any)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all uppercase tracking-wide capitalize ${
                                          ambientSound === sound && isAudioPlaying
                                            ? "bg-ghibli-green text-ghibli-green-dark font-bold"
                                            : "bg-white text-ghibli-sage border border-ghibli-green-light hover:border-ghibli-green"
                                        }`}
                                      >
                                        {sound}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Parchment letter text container */}
                                <div className="parchment-bg parchment-border p-8 rounded-3xl shadow-xs relative overflow-hidden">
                                  <div className="absolute top-4 right-4 flex items-center gap-1 text-ghibli-green-dark/20 select-none">
                                    <Heart className="w-4 h-4 fill-current" />
                                    <span className="text-[10px] font-serif uppercase tracking-widest font-bold">KOKORO</span>
                                  </div>

                                  {/* Subtle Hanko Stamp Seal animation when region is newly unlocked */}
                                  <AnimatePresence>
                                    {justUnlockedRegionId === activeRegion.region_id && (
                                      <motion.div
                                        key={`parchment-stamp-${activeRegion.region_id}`}
                                        initial={{ scale: 2.1, opacity: 0, rotate: -24 }}
                                        animate={{ scale: [2.1, 0.94, 1], opacity: [0, 0.9, 0.85], rotate: -10 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.45, times: [0, 0.72, 1], ease: "easeOut" }}
                                        className="pointer-events-none select-none float-right ml-4 mb-2 mt-4 w-16 h-16 rounded-full border-2 border-red-800/75 flex flex-col items-center justify-center bg-[#fbf9f4]/60 shadow-2xs"
                                      >
                                        <div className="w-13 h-13 rounded-full border border-dashed border-red-800/60 flex flex-col items-center justify-center">
                                          <span className="font-serif font-bold text-red-900/85 text-lg leading-none">心</span>
                                          <span className="font-mono font-bold text-[7px] tracking-widest text-red-900/80 uppercase mt-0.5">
                                            STAMPED
                                          </span>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  <div className="prose prose-stone max-w-none text-ghibli-green-dark serif-letter text-sm leading-relaxed whitespace-pre-wrap text-left">
                                    {activeRegion.lore_content}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* PAGE 4: NEWSLETTER TAB */}
          {activeTab === "newsletter" && (
            <motion.div
              key="newsletter-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              <div className="bg-ghibli-green text-ghibli-green-dark rounded-3xl p-8 text-center space-y-2 relative overflow-hidden shadow-xs">
                <h2 className="text-2xl md:text-3xl font-bold font-serif tracking-tight">
                  The Cultural Newsletter
                </h2>
                <p className="text-ghibli-sage text-xs max-w-lg mx-auto">
                  Each month, a whisper of the region to come &mdash; lore snippets, Ghibli inspiration, and glimpses of the kit drifting toward your door. Wander with us before you journey.
                </p>
              </div>

              {/* Newsletter Join Box exactly like Screenshot 6 */}
              <div className="max-w-md mx-auto bg-ghibli-cream border border-ghibli-cream-dark rounded-2xl p-6 vintage-shadow">
                <div className="text-center space-y-1 mb-6">
                  <h3 className="text-lg font-bold font-serif text-ghibli-green-dark">Join the Journey</h3>
                  <p className="text-xs text-ghibli-sage">Free monthly teasers, straight from the meadow.</p>
                </div>

                {isNewsletterSubscribed ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-800">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif font-bold text-base text-ghibli-green-dark">You are already subscribed! 🍃</h4>
                    <p className="text-xs text-ghibli-sage">Your scroll is sealed with {session?.email}. You will receive every monthly whisper and teaser directly in your inbox.</p>
                  </div>
                ) : newsletterSent ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-800">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif font-bold text-base text-ghibli-green-dark">Your Scroll has been Sealed!</h4>
                    <p className="text-xs text-ghibli-sage">Thank you for wandering with us. Check your mailbox for whispers. 🍃</p>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (newsletterEmail) {
                      const res = await saveNewsletter(newsletterName, newsletterEmail);
                      if (res === "already-signed-up") {
                        alert("You are already signed up! 🍃");
                      } else {
                        setNewsletterSent(true);
                      }
                    }
                  }} className="space-y-4 text-left">
                    <div>
                      <label className="text-[11px] font-semibold text-ghibli-sage block mb-1">Traveler Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        value={newsletterName}
                        onChange={(e) => setNewsletterName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-ghibli-green bg-white text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ghibli-sage block mb-1">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@meadow.jp"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-ghibli-green bg-white text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark font-serif font-bold rounded-xl text-xs tracking-wide transition-all shadow-xs"
                    >
                      Seal & Send
                    </button>
                  </form>
                )}
              </div>

              {/* Past Whispers List */}
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold font-serif text-ghibli-green-dark">Past Whispers</h3>
                  <p className="text-xs text-ghibli-sage">Browse the teasers of months gone by &mdash; each a doorway into a region's quiet magic.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      date: "Jul 1, 2026 3:30 pm",
                      title: "Kansai (Spirited Away Theme)",
                      body: "In the heart of Kansai, where lantern light pools in ancient stone streets, a girl once traded her name for the chance to work in a bathhouse for the gods. Every temple here holds a doorway, and every doorway holds a choice."
                    },
                    {
                      date: "Jun 1, 2026 1:15 pm",
                      title: "Tohoku (Princess Mononoke Theme)",
                      body: "Along the Sea of Japan's brooding coast, deep within the ancient moss-covered cedar forests, a wolf god and a forest princess stand guard against the advance of iron towers. Listen closely to the wind to hear the Kodama rattle."
                    },
                    {
                      date: "May 1, 2026 10:45 am",
                      title: "Chubu (The Wind Rises Theme)",
                      body: "High in the alpine passes of Chubu, where the wind carries the scent of pine and machine oil, a young engineer looked up at his beloved plane and understood that the beauty of flight was worth a lifetime of dreaming."
                    }
                  ].map((teaser, i) => (
                    <div key={i} className="bg-white border border-ghibli-green-light rounded-2xl p-6 space-y-3 shadow-xs flex flex-col justify-between text-left vintage-shadow">
                      <div className="space-y-2">
                        <span className="text-[10px] text-ghibli-sage font-mono block">{teaser.date}</span>
                        <h4 className="font-serif font-bold text-sm text-[#1e2d24]">{teaser.title}</h4>
                        <p className="text-xs text-ghibli-sage leading-relaxed">{teaser.body}</p>
                      </div>
                      <button
                        onClick={() => alert(`Opening whisper details for ${teaser.title} in simulation!`)}
                        className="text-left text-xs font-semibold text-emerald-700 hover:text-emerald-950 flex items-center gap-1 mt-2"
                      >
                        <span>Read the whole whisper</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Traveler's Ticket Modal */}
        <AnimatePresence>
          {ticketModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#fbf9f4] w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative border border-[#e7d8b5]"
              >
                {/* Vintage Border overlay (pseudo-element equivalent via absolute div) */}
                <div className="absolute inset-2 border-[1.5px] border-[#dcd3b9] rounded-xl pointer-events-none" />
                
                <div className="p-8 relative z-10">
                  <button 
                    onClick={() => setTicketModalOpen(false)}
                    className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <h2 className="text-3xl font-serif font-bold text-[#3d4c41] mb-6 tracking-tight">
                    Traveler's Ticket
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Departing for */}
                    <div className="bg-[#e4ebd8] p-4 rounded-xl border border-[#cbd5c1]">
                      <p className="text-[11px] font-medium text-[#7a8a7a] mb-1 uppercase tracking-wider">Departing for</p>
                      <p className="text-2xl font-serif font-bold text-[#3d4c41]">
                        {regions.find(r => r.region_id === ticketRegion)?.region_name || "Unknown Region"}
                      </p>
                    </div>

                    {/* Country */}
                    <div>
                      <p className="text-sm font-medium text-[#4a554a] mb-3">Stamp your country of residence</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setTicketCountry("India")}
                          className={`py-3 px-4 rounded-xl border-2 font-serif font-bold text-lg transition-all ${
                            ticketCountry === "India"
                              ? "border-[#a3b89e] text-[#86a07f]"
                              : "border-[#e2e8e0] text-[#a0aab0] bg-[#f7f9f6] hover:border-[#cbd5c1]"
                          }`}
                        >
                          India
                        </button>
                        <button
                          onClick={() => setTicketCountry("International")}
                          className={`py-3 px-4 rounded-xl border-2 font-serif font-bold text-lg transition-all ${
                            ticketCountry === "International"
                              ? "border-[#a3b89e] text-[#86a07f]"
                              : "border-[#e2e8e0] text-[#a0aab0] bg-[#f7f9f6] hover:border-[#cbd5c1]"
                          }`}
                        >
                          International
                        </button>
                      </div>
                    </div>

                    {/* Plan Tier */}
                    <div>
                      <p className="text-sm font-medium text-[#4a554a] mb-2">Choose your plan tier</p>
                      <div className="relative">
                        <select
                          value={ticketPlan}
                          onChange={(e) => setTicketPlan(e.target.value)}
                          className="w-full appearance-none bg-[#eef1e6] border border-[#d6e0ce] text-[#6b7b6b] py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a3b89e] focus:border-transparent font-medium"
                        >
                          <option value="" disabled>Select a plan…</option>
                          <option value="Standard">Standard</option>
                          <option value="Deluxe">Deluxe</option>
                          <option value="Collector's">Collector's</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8fa189]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={async () => {
                      const email = session?.email || "traveler@kokoro.com";
                      setTicketModalOpen(false);
                      setSimulatingWebhook(true);
                      
                      const simulatedTier = ticketPlan === "Collector's" ? "International" : "India";
                      
                      try {
                        const res = await fetch("/api/checkout", {
                          method: "POST",
                          headers: { 
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            email,
                            shipping_address: "108 Lotus Path, Block C, New Delhi 110001",
                            plan_tier: simulatedTier,
                            region_id: ticketRegion
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          saveOrder({ email: email, shipping_address: '108 Lotus Path, Block C, New Delhi 110001', plan_tier: simulatedTier, gateway: 'ticket-modal' }).catch(function(e) { console.warn(e); });
                          await fetchSession();
                          if (ticketRegion) {
                            setActiveRegionId(ticketRegion);
                            setActiveTab("journal");
                            triggerUnlockAnimation(ticketRegion);
                          }
                        } else {
                          alert(data.error || "Failed to complete checkout.");
                        }
                      } catch (err: any) {
                        console.error("Checkout error from modal:", err);
                      } finally {
                        setSimulatingWebhook(false);
                      }
                    }}
                    disabled={!ticketPlan || simulatingWebhook}
                    className="w-full mt-8 bg-[#a8c1a6] hover:bg-[#97b395] disabled:bg-[#d1ddd0] disabled:cursor-not-allowed text-[#2b3a2f] font-serif font-bold text-lg py-4 rounded-full shadow-sm transition-all border border-[#96af94] flex items-center justify-center gap-2"
                  >
                    {simulatingWebhook ? (
                      <span>Unlocking Journey...</span>
                    ) : (
                      <span>Seal & Proceed to Checkout</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Direct Guest Checkout Modal */}
        <AnimatePresence>
          {directCheckoutModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#fbf9f4] w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative border border-[#e7d8b5]"
              >
                {/* Vintage Border overlay */}
                <div className="absolute inset-2 border-[1.5px] border-[#dcd3b9] rounded-xl pointer-events-none" />
                
                <form onSubmit={handleDirectCheckoutSubmit} className="p-8 relative z-10 space-y-5">
                  <button 
                    type="button"
                    onClick={() => setDirectCheckoutModalOpen(false)}
                    className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div>
                    <span className="text-[10px] font-mono font-bold text-ghibli-sage bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                      🌿 Meadow Gate Checkout
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-[#3d4c41] mt-2 tracking-tight">
                      Begin Your Passage
                    </h2>
                    <p className="text-xs text-ghibli-sage leading-relaxed mt-1">
                      No password required. Your email will act as your automatic key to enter the meadow gates and track your parcel.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-[#f2f6ee] p-4 rounded-xl border border-[#d2dfcb] space-y-1">
                    <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">Selected Passage</span>
                    <div className="flex justify-between items-center">
                      <span className="font-serif font-bold text-sm text-[#3d4c41]">
                        {directCheckoutTier === "India" ? "Domestic India Plan" : "International Plan"}
                      </span>
                      <span className="font-serif font-bold text-emerald-800">
                        {directCheckoutTier === "India" ? "₹1,499/mo" : "$29.99/mo"}
                      </span>
                    </div>
                    <span className="text-[10px] text-ghibli-sage block italic font-medium">
                      Simulated via {directCheckoutGateway === "razorpay" ? "Razorpay Gateway" : "PayPal Gateway"}
                    </span>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#4a554a] uppercase tracking-wide block">
                      Traveler Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@domain.com"
                      value={directCheckoutEmail}
                      onChange={(e) => setDirectCheckoutEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-ghibli-green bg-white text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none placeholder-stone-400"
                    />
                    <p className="text-[10px] text-ghibli-sage">
                      Your subscription ledger and magic login will be instantly linked to this address.
                    </p>
                  </div>

                  {/* Shipping Address Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#4a554a] uppercase tracking-wide block">
                      Physical Shipping Address <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Street address, apartment, city, state, postal code..."
                      value={directCheckoutAddress}
                      onChange={(e) => setDirectCheckoutAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-ghibli-green bg-white text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none placeholder-stone-400"
                    />
                    <p className="text-[10px] text-ghibli-sage">
                      To safely deliver your beautiful monthly physical prints, stickers, and hand-sealed letters.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={simulatingWebhook}
                    className="w-full mt-2 bg-[#a8c1a6] hover:bg-[#97b395] disabled:bg-[#d1ddd0] disabled:cursor-not-allowed text-[#2b3a2f] font-serif font-bold text-sm py-3 rounded-xl shadow-xs transition-all border border-[#96af94] flex items-center justify-center gap-2"
                  >
                    {simulatingWebhook ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Securing Payment...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay & Subscribe ({directCheckoutGateway === "razorpay" ? "Razorpay" : "PayPal"})</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
