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
  Archive,
  Image,
  Tag,
  Coffee,
  AlertCircle,
  Edit3,
  X
} from "lucide-react";
import JapanMap from "./components/JapanMap.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import { submitWaitlistEmail } from "./waitlist.ts";
import { 
  saveWaitlist, 
  saveNewsletter, 
  saveOrder, 
  isEmailInNewsletter,
  updateUserPlan,
  cancelSubscription,
  pauseSubscription,
  updateUserAddress,
  checkAndExpireOverdueSubscriptions,
  getAllOrders
} from "./firestoreService.ts";
import { Region, Subscriber, PlanTier, SubscriptionStatus } from "./types.ts";
import { REGIONS_METADATA, LORE_DATA, getRegionMonthStatus, MonthStatus, getCurrentMonthNumber, getMonthName } from "./data/lore.ts";

export const ADMIN_EMAILS = [
  "isha79799@gmail.com",
  "isha79799@gmail"
];

export default function App() {
  // Navigation State (Ghibli multi-page tabs)
  const [activeTab, setActiveTab] = useState<"journey" | "subscription" | "journal" | "admin">("journey");

  // Session & Regions State
  const [session, setSession] = useState<{
    authenticated: boolean;
    email?: string;
    subscriber: Subscriber | null;
    unlocked_regions: string[];
  } | null>(null);

  const isAdmin = Boolean(
    session?.authenticated &&
    session?.email &&
    ADMIN_EMAILS.includes(session.email.trim().toLowerCase())
  );
  
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

  // Guest Direct Checkout Modal state
  const [directCheckoutModalOpen, setDirectCheckoutModalOpen] = useState(false);
  const [directCheckoutEmail, setDirectCheckoutEmail] = useState("");
  const [directCheckoutAddress, setDirectCheckoutAddress] = useState("");
  const [directCheckoutTier, setDirectCheckoutTier] = useState<"Standard" | "Bundle">("Standard");
  const [directCheckoutDestination, setDirectCheckoutDestination] = useState<"India" | "International">("India");
  const [directCheckoutGateway, setDirectCheckoutGateway] = useState<"razorpay" | "paypal">("razorpay");

  // Destination toggle for subscription plans: 'India' vs 'International'
  const [planDestination, setPlanDestination] = useState<"India" | "International">("India");

  // Modals for subscription management
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editAddressModalOpen, setEditAddressModalOpen] = useState(false);
  const [editAddressInput, setEditAddressInput] = useState("");
  const [selectedPlanToChange, setSelectedPlanToChange] = useState<"Standard" | "Bundle">("Bundle");

  // Loading & notification states for actions
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [pausingSub, setPausingSub] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  // Protect admin dashboard: if a non-admin is on the admin tab, redirect to journey
  useEffect(() => {
    if (activeTab === "admin" && !isAdmin) {
      setActiveTab("journey");
    }
  }, [activeTab, isAdmin]);

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

      // Requirement 2 & 3: Check deadline and sync real Firestore order data
      if (data?.email) {
        try {
          await checkAndExpireOverdueSubscriptions(data.email);
        } catch (e) {
          console.warn("Overdue check error:", e);
        }

        try {
          const allOrders = await getAllOrders();
          const cleanEmail = data.email.toLowerCase().trim();
          const userOrder = allOrders.find(o => o.email.toLowerCase().trim() === cleanEmail);
          if (userOrder) {
            if (!data.subscriber) {
              data.subscriber = {
                email: data.email,
                shipping_address: userOrder.shipping_address || "",
                subscription_status: userOrder.status as any,
                plan_tier: userOrder.plan_tier,
                destination: userOrder.destination || (userOrder.plan_tier.toLowerCase().includes("international") ? "International" : "India"),
                cancellation_reason: userOrder.cancellation_reason || "",
                payment_deadline: userOrder.payment_deadline || "",
                createdAt: userOrder.createdDate || new Date().toISOString()
              };
            } else {
              data.subscriber.subscription_status = userOrder.status as any;
              data.subscriber.plan_tier = userOrder.plan_tier;
              data.subscriber.shipping_address = userOrder.shipping_address || data.subscriber.shipping_address;
              data.subscriber.cancellation_reason = userOrder.cancellation_reason || "";
              data.subscriber.payment_deadline = userOrder.payment_deadline || "";
              data.subscriber.destination = userOrder.destination || (userOrder.plan_tier.toLowerCase().includes("international") ? "International" : "India");
            }
          }
        } catch (syncErr) {
          console.warn("Firestore order sync notice:", syncErr);
        }
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
        const fullTierName = `${directCheckoutTier} (${directCheckoutDestination})`;
        saveOrder({
          email: directCheckoutEmail,
          plan_tier: fullTierName,
          destination: directCheckoutDestination,
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


  const handleChangePlan = async (newTier: "Standard" | "Bundle") => {
    if (!session?.email) return;
    setUpdatingPlan(true);
    try {
      const currentTierStr = session.subscriber?.plan_tier || "Standard (India)";
      const isInternational = currentTierStr.toLowerCase().includes("international") || session.subscriber?.destination === "International";
      const fullTierName = `${newTier} (${isInternational ? "International" : "India"})`;

      await updateUserPlan(session.email, fullTierName);

      await fetch("/api/subscriber/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_tier: fullTierName })
      });

      await fetchSession();
      setChangePlanModalOpen(false);
      setActionNotice(`🌿 Plan successfully updated to ${newTier}! Your upcoming dispatches will reflect your new passage.`);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert("Error changing plan: " + err.message);
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session?.email) return;
    setCancellingSub(true);
    try {
      await cancelSubscription(session.email, "Cancelled by subscriber");

      await fetch("/api/subscriber/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by subscriber" })
      });

      await fetchSession();
      setCancelModalOpen(false);
      setActionNotice("Your subscription has been cancelled. If your monthly passage was already paid, it remains active until the end of the billing period.");
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err: any) {
      alert("Error cancelling subscription: " + err.message);
    } finally {
      setCancellingSub(false);
    }
  };

  const handlePauseSubscription = async () => {
    if (!session?.email) return;
    setPausingSub(true);
    try {
      const res = await pauseSubscription(session.email);

      await fetch("/api/subscriber/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      await fetchSession();
      setActionNotice(res.newStatus === "Paused" 
        ? "⏸️ Subscription paused. You won't be charged for upcoming months until you resume." 
        : "▶️ Subscription resumed! Welcome back to your active journey.");
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert("Error pausing subscription: " + err.message);
    } finally {
      setPausingSub(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!session?.email) return;
    if (!editAddressInput || editAddressInput.trim().length < 5) {
      alert("Please enter a valid, complete shipping address.");
      return;
    }
    try {
      await updateUserAddress(session.email, editAddressInput);
      await fetch("/api/subscriber/update-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_address: editAddressInput })
      });
      await fetchSession();
      setEditAddressModalOpen(false);
      setActionNotice("🌿 Shipping address updated in your dispatch records!");
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert("Error updating address: " + err.message);
    }
  };

  const activeRegion = regions.find(r => r.region_id === activeRegionId);
  const activeMetadata = REGIONS_METADATA.find(r => r.region_id === activeRegionId);
  const activeRegionMonthStatus = activeMetadata ? getRegionMonthStatus(activeMetadata.month) : "past";
  const isSubscriberActive = session?.subscriber?.subscription_status === "Active" || session?.subscriber?.subscription_status === "Renewed";
  const isSubscriberCancelled = session?.subscriber?.subscription_status === "Cancelled";
  const isSubscriberPaused = session?.subscriber?.subscription_status === "Paused";
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

  const handleSelectRegion = (id: string) => {
    const metadata = REGIONS_METADATA.find(r => r.region_id === id);
    if (!metadata) return;

    setActiveRegionId(id);
    const monthStatus = getRegionMonthStatus(metadata.month);
    const isAlreadyUnlocked = isSubscriberActive && (session?.unlocked_regions || []).includes(id);

    // If already unlocked for this user, let them view their journal
    if (isAlreadyUnlocked) {
      setActiveTab("journal");
      setTimeout(() => {
        document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    // SCENARIO C: Current month & not yet subscribed -> directly navigate to subscription page!
    if (monthStatus === "current") {
      if (isSubscriberActive) {
        setActiveTab("journal");
        setTimeout(() => {
          document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return;
      }
      setActiveTab("subscription");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
      return;
    }

    // SCENARIO A (Past month) & SCENARIO B (Future month):
    // Stays locked in Travel Journal with specific notice (cannot be unlocked here)
    setActiveTab("journal");
    setTimeout(() => {
      document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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

          {/* Navigation */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            {[
              { id: "journey", label: "Home" },
              { id: "subscription", label: "Subscribe" },
              { id: "journal", label: "My Journal" },
              ...(isAdmin ? [{ id: "admin", label: "Admin" }] : [])
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
          {/* PAGE 1: HOME / LANDING */}
          {activeTab === "journey" && (
            <motion.div
              key="journey-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              {/* Hero */}
              <div className="bg-ghibli-green text-ghibli-green-dark rounded-3xl p-10 md:p-16 text-center space-y-5 relative overflow-hidden shadow-xs">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#faf6eb20,#0000_50%)] pointer-events-none" />
                <div className="w-12 h-12 rounded-full bg-ghibli-sand mx-auto flex items-center justify-center text-ghibli-green-dark border border-ghibli-green-dark/10">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold font-serif tracking-tight max-w-3xl mx-auto leading-tight text-ghibli-green-dark">
                  A monthly letter from Japan
                </h2>
                <p className="text-ghibli-green-dark/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Kokoro Letters is a hand-crafted physical mail subscription — art prints, stickers, wax-sealed letters, and lore from one of Japan's twelve Ghibli-inspired regions, delivered to your door every month.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("subscription")}
                    className="px-6 py-3 bg-ghibli-sand hover:bg-[#eed7b1] text-ghibli-green-dark rounded-xl text-sm font-semibold transition-all shadow-xs"
                  >
                    See Subscription Plans
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("journal");
                      setTimeout(() => {
                        document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="px-6 py-3 border border-ghibli-green-dark/30 hover:bg-ghibli-green-dark/10 text-ghibli-green-dark rounded-xl text-sm font-semibold transition-all"
                  >
                    Explore the Map
                  </button>
                </div>
              </div>

              {/* What is inside each month */}
              <div className="space-y-5">
                <h3 className="text-xl font-bold font-serif text-center text-ghibli-green-dark">
                  What arrives in your mailbox
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {[
                    { title: "Ghibli Art Print", icon: <Image className="w-5 h-5 text-emerald-800" />, desc: "Hand-printed regional scene" },
                    { title: "Character Sticker", icon: <Sparkles className="w-5 h-5 text-emerald-800" />, desc: "Custom illustrated anime art" },
                    { title: "Map Stamp", icon: <Tag className="w-5 h-5 text-emerald-800" />, desc: "Complete your collectible map" },
                    { title: "Lore Letter", icon: <BookOpen className="w-5 h-5 text-emerald-800" />, desc: "Hand-sealed creator's note" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white border border-ghibli-green-light/40 rounded-2xl p-4 text-center space-y-2 vintage-shadow hover:border-ghibli-green transition-colors">
                      <div className="w-9 h-9 rounded-full bg-ghibli-green-light flex items-center justify-center mx-auto">
                        {item.icon}
                      </div>
                      <p className="font-serif font-bold text-xs text-ghibli-green-dark">{item.title}</p>
                      <p className="text-[11px] text-ghibli-sage leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map preview */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold font-serif text-ghibli-green-dark">12 Regions. 12 Months.</h3>
                  <p className="text-xs text-ghibli-sage max-w-md mx-auto">
                    Each month covers one region inspired by a beloved Ghibli film. Click a region on the map to explore.
                  </p>
                </div>
                <div className="max-w-md mx-auto">
                  <JapanMap
                    isSubscriber={isSubscriberActive}
                    unlockedRegions={isSubscriberActive ? (session?.unlocked_regions || []) : []}
                    activeRegionId={activeRegionId}
                    onSelectRegion={handleSelectRegion}
                    regionsList={regions}
                  />
                </div>
              </div>

              {/* Newsletter strip */}
              <div className="bg-ghibli-sand rounded-3xl p-7 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-lg font-bold font-serif text-ghibli-green-dark">Free Monthly Teaser</h3>
                  <p className="text-xs text-ghibli-sage leading-relaxed">Get a whisper of next month's region straight to your inbox. No spam, ever.</p>
                </div>
                <div className="w-full md:w-80 shrink-0">
                  {isNewsletterSubscribed || teaserSent ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium bg-white/80 p-3 rounded-xl border border-emerald-200">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isNewsletterSubscribed ? `Subscribed! Whispers go to ${session?.email} \u{1F343}` : "You're on the list! \u{1F343}"}</span>
                    </div>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (teaserEmail) {
                        const res = await saveNewsletter(teaserName || "Traveler", teaserEmail);
                        if (res === "already-signed-up") { alert("Already signed up! \u{1F343}"); } else { setTeaserSent(true); }
                      }
                    }} className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={teaserEmail}
                        onChange={(e) => setTeaserEmail(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-ghibli-green bg-white text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none"
                      />
                      <button type="submit" className="px-4 py-2 bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark font-serif font-bold rounded-xl text-xs transition-all">Join</button>
                    </form>
                  )}
                </div>
              </div>

              {/* Footer */}
              <footer className="text-center text-xs text-ghibli-sage border-t border-ghibli-green-light/40 pt-6 pb-2 space-y-2">
                <p className="font-serif font-semibold text-ghibli-green-dark text-sm">Kokoro Letters 心</p>
                <p>A slow-living monthly mail club celebrating the spirit world of Japan.</p>
                <div className="flex justify-center gap-6 pt-2 font-medium">
                  <button onClick={() => setActiveTab("journey")} className="hover:text-ghibli-green-dark">Home</button>
                  <button onClick={() => setActiveTab("subscription")} className="hover:text-ghibli-green-dark">Subscribe</button>
                  <button onClick={() => setActiveTab("journal")} className="hover:text-ghibli-green-dark">My Journal</button>
                  {isAdmin && <button onClick={() => setActiveTab("admin")} className="hover:text-ghibli-green-dark">Admin</button>}
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
                <div className="flex justify-between items-center border-b border-ghibli-green-light pb-3">
                  <h3 className="text-lg font-bold font-serif text-ghibli-green-dark">
                    Your Subscription
                  </h3>
                  {session?.subscriber?.subscription_status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                      isSubscriberActive 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : isSubscriberPaused
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isSubscriberActive ? "bg-emerald-600 animate-pulse" : isSubscriberPaused ? "bg-amber-600" : "bg-rose-600"}`} />
                      <span>{session.subscriber.subscription_status}</span>
                    </span>
                  )}
                </div>

                {actionNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                    {actionNotice}
                  </div>
                )}

                {session?.authenticated ? (
                  <div className="space-y-5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] text-ghibli-sage font-mono block uppercase tracking-wider">PLAN TIER</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-ghibli-green-dark font-serif">
                            {session.subscriber?.plan_tier ? `${session.subscriber.plan_tier}` : "Standard Plan"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs font-mono text-ghibli-sage">
                          <span>
                            Status: <strong className={isSubscriberActive ? "text-emerald-700" : isSubscriberPaused ? "text-amber-700" : "text-rose-700"}>
                              {session.subscriber?.subscription_status || "Inactive"}
                            </strong>
                          </span>
                          <span>Billing: Razorpay/PayPal</span>
                          {session.subscriber?.createdAt && (
                            <span>Created: {new Date(session.subscriber.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const curTier = session.subscriber?.plan_tier || "Standard";
                            setSelectedPlanToChange(curTier.toLowerCase().includes("bundle") ? "Standard" : "Bundle");
                            setChangePlanModalOpen(true);
                          }}
                          className="px-4 py-2 border border-ghibli-green text-ghibli-green-dark bg-white rounded-xl text-xs font-semibold hover:bg-ghibli-green-light transition-all cursor-pointer shadow-2xs"
                        >
                          Change Plan
                        </button>
                        <button
                          onClick={handlePauseSubscription}
                          disabled={pausingSub || isSubscriberCancelled}
                          className="px-4 py-2 bg-[#eedba5] hover:bg-[#e4cb8f] text-stone-800 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                        >
                          {pausingSub ? "Updating..." : isSubscriberPaused ? "Resume Subscription" : "Pause Subscription"}
                        </button>
                        <button
                          onClick={() => setCancelModalOpen(true)}
                          disabled={cancellingSub || isSubscriberCancelled}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                        >
                          {isSubscriberCancelled ? "Cancelled" : "Cancel Subscription"}
                        </button>
                      </div>
                    </div>

                    {/* Cancellation Notice Banner (Requirement 3: "not payed yet" reason display) */}
                    {isSubscriberCancelled && (
                      <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                          <span>Subscription Cancelled</span>
                          {session.subscriber?.cancellation_reason && (
                            <span className="font-mono text-[11px] bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                              Reason: {session.subscriber.cancellation_reason}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-rose-800/90 leading-relaxed">
                          {session.subscriber?.cancellation_reason === "not payed yet"
                            ? "Your subscription was automatically cancelled because next month's payment was not received before the deadline cutoff. You can re-subscribe or renew below anytime to resume your monthly parcels."
                            : "Your subscription has been cancelled upon request. If you had active paid dispatches for the current month, they will still be fulfilled."}
                        </p>
                        <button
                          onClick={() => {
                            document.getElementById("passage-tiers-section")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="mt-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Renew / Re-subscribe Now →
                        </button>
                      </div>
                    )}
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
                      onClick={() => {
                        setEditAddressInput(session.subscriber?.shipping_address || "");
                        setEditAddressModalOpen(true);
                      }}
                      className="px-4 py-2 border border-ghibli-green text-ghibli-green-dark rounded-xl text-xs font-semibold hover:bg-ghibli-green-light transition-all cursor-pointer"
                    >
                      Edit Address
                    </button>
                  </div>
                </div>
              )}

              {/* Two Tiers Subscription Grid (Standard & Bundle for both Indian / International) */}
              <div id="passage-tiers-section" className="py-4 space-y-6">
                <div className="text-center space-y-3">
                  <span className="text-[10px] font-mono text-ghibli-sage bg-ghibli-green-light px-3 py-1 rounded-full border border-ghibli-green/30 uppercase tracking-widest font-semibold">
                    Two Sacred Tiers
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold font-serif text-ghibli-green-dark">
                    Choose Your Passage Tier
                  </h3>
                  <p className="text-xs text-ghibli-sage max-w-xl mx-auto leading-relaxed">
                    Every monthly dispatch is authentically hand-printed and hand-packed. Choose between our regular monthly <strong>Standard</strong> passage or the complete 12-month <strong>Bundle</strong>.
                  </p>

                  {/* Destination Toggle */}
                  <div className="inline-flex items-center p-1.5 bg-white border border-ghibli-green-light rounded-2xl shadow-xs mt-2">
                    <button
                      onClick={() => setPlanDestination("India")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        planDestination === "India"
                          ? "bg-ghibli-green-dark text-[#eedba5] shadow-xs"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      <span>🇮🇳 Domestic India</span>
                      <span className="text-[10px] font-mono opacity-80">(₹ INR)</span>
                    </button>
                    <button
                      onClick={() => setPlanDestination("International")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        planDestination === "International"
                          ? "bg-ghibli-green-dark text-[#eedba5] shadow-xs"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      <span>🌏 International</span>
                      <span className="text-[10px] font-mono opacity-80">(₹ INR)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Standard Tier Card */}
                  <div className="bg-ghibli-cream border border-ghibli-cream-dark rounded-3xl p-6 flex flex-col justify-between space-y-6 relative vintage-shadow">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-ghibli-sage font-bold">Regular Passage</span>
                          <h4 className="font-serif font-bold text-xl text-ghibli-green-dark mt-0.5">Standard Plan</h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {planDestination === "India" ? "Domestic Speed-Post" : "Tracked Airmail"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-3xl font-serif font-bold text-ghibli-green-dark block">
                          {planDestination === "India" ? "₹999" : "₹1,200 + ₹1,000"}
                          <span className="text-xs font-normal text-ghibli-sage font-sans">
                            {planDestination === "India" ? " / month" : " shipping / month"}
                          </span>
                        </span>
                        <p className="text-xs text-ghibli-sage leading-relaxed">
                          {planDestination === "India" 
                            ? "Monthly based subscription. Free domestic speed-post across India." 
                            : "Regular monthly subscription. Total ₹2,200/mo (₹1,200 kit + ₹1,000 tracked international airmail)."}
                        </p>
                      </div>

                      <ul className="space-y-2 text-xs text-ghibli-green-dark pt-2 border-t border-ghibli-green-light/40">
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>🖼️ Hand-printed Ghibli-Style Art Postcard</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>✨ Character-Inspired Matte Vinyl Sticker</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>🏷️ Collectible Region Map Passport Stamp</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>📖 Hand-sealed Creator's Lore Letter</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                          <span>🎁 First-Month Welcome Gift: Physical Japan Map</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setDirectCheckoutTier("Standard");
                        setDirectCheckoutDestination(planDestination);
                        setDirectCheckoutGateway(planDestination === "India" ? "razorpay" : "paypal");
                        setDirectCheckoutEmail(session?.email || "");
                        setDirectCheckoutAddress(session?.subscriber?.shipping_address || "");
                        setDirectCheckoutModalOpen(true);
                      }}
                      className="w-full py-3 bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark font-serif font-bold rounded-2xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Subscribe to Standard ({planDestination === "India" ? "Razorpay" : "PayPal"})</span>
                    </button>
                  </div>

                  {/* Bundle Tier Card */}
                  <div className="bg-gradient-to-b from-[#fdfbf6] to-[#f7f2e4] border-2 border-amber-300/80 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative vintage-shadow">
                    <span className="absolute -top-3 right-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[9px] font-mono uppercase font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      12-Month Full Journey
                    </span>

                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold">Bulk Passage</span>
                          <h4 className="font-serif font-bold text-xl text-amber-950 mt-0.5">Bundle Plan</h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                          Yearly Subscription
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-3xl font-serif font-bold text-amber-950 block">
                          {planDestination === "India" ? "₹10,000" : "₹24,200"}
                          <span className="text-xs font-normal text-amber-800 font-sans"> / year</span>
                        </span>
                        <p className="text-xs text-amber-900/80 leading-relaxed">
                          {planDestination === "India" 
                            ? "Buying for all 12 months in bulk! Yearly subscription — save ₹1,988 compared to monthly." 
                            : "Buying all 12 months in bulk: (₹1,200 × 11) + (₹1,000 shipping × 11). Pay for 11 months, get 1 month + shipping FREE!"}
                        </p>
                      </div>

                      <ul className="space-y-2 text-xs text-stone-800 pt-2 border-t border-amber-200/60">
                        <li className="flex items-center gap-2 font-semibold text-emerald-900">
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Complete 12-Month Japan Passage:</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                          <span>📦 All 12 Hand-crafted Monthly Envelopes</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                          <span>🖼️ Complete Set of 12 Ghibli Art Postcards</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                          <span>✨ All 12 Custom Anime Vinyl Stickers</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                          <span>🗺️ Physical Japan Collector Map & Passport Stamps</span>
                        </li>
                        <li className="flex items-center gap-2 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                          <span>🔒 Zero renewal worries — locked in for the entire year</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setDirectCheckoutTier("Bundle");
                        setDirectCheckoutDestination(planDestination);
                        setDirectCheckoutGateway(planDestination === "India" ? "razorpay" : "paypal");
                        setDirectCheckoutEmail(session?.email || "");
                        setDirectCheckoutAddress(session?.subscriber?.shipping_address || "");
                        setDirectCheckoutModalOpen(true);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-serif font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Subscribe to Bundle ({planDestination === "India" ? "Razorpay" : "PayPal"})</span>
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
                                {isUnlocked ? (
                                  <span className="bg-emerald-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                    <Unlock className="w-3 h-3" /> Unlocked
                                  </span>
                                ) : activeRegionMonthStatus === "past" ? (
                                  <span className="bg-stone-700/90 text-stone-200 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                    <Archive className="w-3 h-3 text-stone-300" /> Past Dispatch • Locked Archive
                                  </span>
                                ) : activeRegionMonthStatus === "future" ? (
                                  <span className="bg-amber-700/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                    <Clock className="w-3 h-3" /> Coming Soon • Locked
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/95 text-stone-900 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                    <Sparkles className="w-3 h-3 animate-pulse text-stone-900" /> Current Month's Dispatch
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Region body content */}
                          <div className="p-8 flex-1 flex flex-col gap-6">
                            {!isUnlocked ? (
                              activeRegionMonthStatus === "past" ? (
                                /* SCENARIO A: Past Month */
                                <div className="bg-[#fbf9f4] border border-stone-200 rounded-2xl p-6 text-center space-y-4">
                                  <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mx-auto text-stone-600">
                                    <Archive className="w-6 h-6" />
                                  </div>
                                  <div className="max-w-md mx-auto space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-[11px] font-mono font-semibold">
                                      <span>{activeMetadata ? getMonthName(activeMetadata.month) : ""} Dispatch</span>
                                      <span>•</span>
                                      <span className="text-stone-500">Archived Window</span>
                                    </div>
                                    <h3 className="font-serif font-bold text-stone-800 text-lg">
                                      Past Dispatch Archive • Locked
                                    </h3>
                                    <p className="text-xs text-stone-600 leading-relaxed">
                                      The monthly dispatch window for **{activeRegion.region_name}** has passed. This journey is locked and cannot be unlocked through the active monthly subscription.
                                    </p>
                                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 text-left space-y-1 text-xs text-amber-900 mt-3">
                                      <span className="font-semibold block text-[11px] font-mono uppercase tracking-wider text-amber-800">
                                        📦 Individual Collector Kits
                                      </span>
                                      <p className="text-[11px] text-amber-800/90 leading-relaxed">
                                        Past dispatches are archived and cannot be ordered through standard monthly subscriptions. They will need to be ordered separately as individual collector kits once past editions are made available.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : activeRegionMonthStatus === "future" ? (
                                /* SCENARIO B: Future Month */
                                <div className="bg-ghibli-cream border border-ghibli-cream-dark rounded-2xl p-6 text-center space-y-4">
                                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-800">
                                    <Clock className="w-6 h-6 animate-pulse" />
                                  </div>
                                  <div className="max-w-md mx-auto space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-semibold">
                                      <span>Scheduled for {activeMetadata ? getMonthName(activeMetadata.month) : ""}</span>
                                      <span>•</span>
                                      <span>Month {activeMetadata?.month} of 12</span>
                                    </div>
                                    <h3 className="font-serif font-bold text-ghibli-green-dark text-lg">
                                      Coming Soon • Future Journey
                                    </h3>
                                    <p className="text-xs text-ghibli-sage leading-relaxed">
                                      The journey to **{activeRegion.region_name}** is a future whisper. This monthly letter and postcard collection is scheduled to release in **{activeMetadata ? getMonthName(activeMetadata.month) : ""}** and remains sealed until that month arrives.
                                    </p>
                                    <div className="p-3 bg-white/70 border border-ghibli-cream-dark/50 rounded-xl text-[11px] text-ghibli-sage font-mono space-y-1 text-left mt-3">
                                      <span className="block text-ghibli-green-dark font-semibold">Travel Calendar Notice:</span>
                                      <span className="block text-stone-600">● Scheduled Dispatch: {activeMetadata ? getMonthName(activeMetadata.month) : ""}</span>
                                      <span className="block text-amber-800">🔒 Will stay locked until the month arrives. Early unlocking is not available.</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* SCENARIO C: Current Month */
                                <div className="bg-ghibli-cream border border-amber-200/80 rounded-2xl p-6 text-center space-y-4 shadow-xs">
                                  <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                                    <Sparkles className="w-6 h-6" />
                                  </div>
                                  <div className="max-w-md mx-auto space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-[11px] font-mono font-bold uppercase tracking-wider">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Active Dispatch • {activeMetadata ? getMonthName(activeMetadata.month) : ""}</span>
                                    </div>
                                    <h3 className="font-serif font-bold text-ghibli-green-dark text-xl">
                                      Current Month's Journey: {activeRegion.region_name}
                                    </h3>
                                    <p className="text-xs text-ghibli-sage leading-relaxed">
                                      This is our active dispatch for {activeMetadata ? getMonthName(activeMetadata.month) : ""}! Subscribe today to receive this month's physical hand-addressed letter kit and unlock the complete interactive digital journey.
                                    </p>

                                    {isSubscriberActive ? (
                                      <div className="pt-3 space-y-3">
                                        <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                          You are an active **{session?.subscriber?.plan_tier}** tier traveler! Stamp your journal to unlock this month's letters now.
                                        </p>
                                        <button
                                          onClick={() => handleManualStamp(activeRegion.region_id)}
                                          className="w-full bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          <Unlock className="w-4 h-4" />
                                          <span>Stamp & Unlock {activeRegion.region_name}</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="pt-3">
                                        <button
                                          onClick={() => {
                                            setActiveTab("subscription");
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                          }}
                                          className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 py-3 px-6 rounded-xl font-bold font-serif text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow cursor-pointer"
                                        >
                                          <span>Go to Subscription Page to Subscribe</span>
                                          <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <span className="block text-[10px] text-ghibli-sage font-mono mt-2">
                                          Includes physical letter kit delivery + digital journal access
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
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


          {activeTab === "admin" && isAdmin && (
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
                        {directCheckoutTier} Passage ({directCheckoutDestination === "India" ? "Domestic India" : "International"})
                      </span>
                      <span className="font-serif font-bold text-emerald-800">
                        {directCheckoutDestination === "India" 
                          ? (directCheckoutTier === "Bundle" ? "₹10,000 / year (Bulk)" : "₹999 / month")
                          : (directCheckoutTier === "Bundle" ? "₹24,200 / year (Bulk)" : "₹1,200 + ₹1,000 shp / mo")}
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

        {/* Change Plan Modal (Two tiers only: Standard and Bundle) */}
        <AnimatePresence>
          {changePlanModalOpen && (
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
                className="bg-[#fbf9f4] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden relative border border-[#e7d8b5]"
              >
                <div className="absolute inset-2 border-[1.5px] border-[#dcd3b9] rounded-xl pointer-events-none" />
                
                <div className="p-8 relative z-10 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                        🌿 Subscription Ledger
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-[#3d4c41] mt-2 tracking-tight">
                        Change Passage Tier
                      </h2>
                      <p className="text-xs text-ghibli-sage leading-relaxed mt-1">
                        Select your preferred tier for all upcoming monthly dispatches. Changes take effect on your next parcel cycle.
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setChangePlanModalOpen(false)}
                      className="text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Destination info badge */}
                  <div className="bg-[#f2f6ee] px-4 py-2 rounded-lg border border-[#d2dfcb] flex justify-between items-center text-xs">
                    <span className="text-ghibli-sage font-medium">Your Destination:</span>
                    <span className="font-serif font-bold text-[#3d4c41]">
                      {session?.subscriber?.destination === "International" ? "🌏 International" : "🇮🇳 Domestic India"}
                    </span>
                  </div>

                  {/* Tier Choice Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Standard Tier */}
                    <div 
                      onClick={() => setSelectedPlanToChange("Standard")}
                      className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col justify-between ${
                        selectedPlanToChange === "Standard"
                          ? "bg-[#eaf1e7] border-emerald-600 shadow-sm"
                          : "bg-white/70 border-stone-200 hover:border-emerald-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-serif font-bold text-sm text-[#2d3b2f]">Standard (Monthly)</h3>
                          {selectedPlanToChange === "Standard" && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                          )}
                        </div>
                        <p className="text-lg font-serif font-bold text-emerald-800">
                          {session?.subscriber?.destination === "International" ? "₹1,200 + ₹1,000" : "₹999"}
                          <span className="text-xs font-normal text-stone-500"> {session?.subscriber?.destination === "International" ? " shp/mo" : " / month"}</span>
                        </p>
                        <ul className="text-[11px] text-[#4a554a] mt-2 space-y-1 font-sans">
                          <li>• Regular monthly subscription</li>
                          <li>• 1 Hand-crafted letter & postcard</li>
                          <li>• Full digital portal lore</li>
                        </ul>
                      </div>
                    </div>

                    {/* Bundle Tier */}
                    <div 
                      onClick={() => setSelectedPlanToChange("Bundle")}
                      className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col justify-between ${
                        selectedPlanToChange === "Bundle"
                          ? "bg-[#eaf1e7] border-emerald-600 shadow-sm"
                          : "bg-white/70 border-stone-200 hover:border-emerald-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-serif font-bold text-sm text-[#2d3b2f]">Bundle (Yearly)</h3>
                          {selectedPlanToChange === "Bundle" && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                          )}
                        </div>
                        <p className="text-lg font-serif font-bold text-emerald-800">
                          {session?.subscriber?.destination === "International" ? "₹24,200" : "₹10,000"}
                          <span className="text-xs font-normal text-stone-500"> / year</span>
                        </p>
                        <ul className="text-[11px] text-[#4a554a] mt-2 space-y-1 font-sans">
                          <li>• All 12 months in bulk</li>
                          <li>• {session?.subscriber?.destination === "International" ? "Pay 11 mos, get 1 mo free!" : "Save ₹1,988 vs monthly"}</li>
                          <li>• Complete 12-month passage guaranteed</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setChangePlanModalOpen(false)}
                      className="w-1/3 py-3 px-4 border border-stone-300 rounded-xl text-stone-600 font-serif font-medium text-xs hover:bg-stone-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={updatingPlan}
                      onClick={() => handleChangePlan(selectedPlanToChange)}
                      className="w-2/3 py-3 px-4 bg-[#a8c1a6] hover:bg-[#97b395] disabled:bg-[#d1ddd0] disabled:cursor-not-allowed text-[#2b3a2f] font-serif font-bold text-xs rounded-xl shadow-xs transition-all border border-[#96af94] flex items-center justify-center gap-2"
                    >
                      {updatingPlan ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Updating Ledger...</span>
                        </>
                      ) : (
                        <span>Confirm Switch to {selectedPlanToChange}</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Subscription Modal */}
        <AnimatePresence>
          {cancelModalOpen && (
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
                className="bg-[#fbf9f4] w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative border border-rose-200"
              >
                <div className="absolute inset-2 border-[1.5px] border-rose-100 rounded-xl pointer-events-none" />
                
                <div className="p-8 relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-widest">
                        ⚠️ Subscription Cancellation
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-[#3d4c41] mt-2 tracking-tight">
                        Cancel Your Passage?
                      </h2>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setCancelModalOpen(false)}
                      className="text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    We will miss you on the meadow path. Before you depart, here is what will happen:
                  </p>

                  <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/60 space-y-2 text-xs text-stone-700">
                    <p>
                      <strong>• Active Paid Month:</strong> If you have already paid for the current monthly cycle, your passage <strong>remains active</strong> until your billing deadline ({session?.subscriber?.payment_deadline || "the end of the cycle"}), and your parcels will still be dispatched.
                    </p>
                    <p>
                      <strong>• No Renewal:</strong> You will not be charged when the next monthly cycle begins.
                    </p>
                    <p>
                      <strong>• Re-join Anytime:</strong> Your account ledger is safely kept. You can re-subscribe anytime from this dashboard.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCancelModalOpen(false)}
                      className="w-1/2 py-3 px-4 border border-stone-300 rounded-xl text-stone-700 font-serif font-medium text-xs hover:bg-stone-100 transition-colors"
                    >
                      Keep Subscription
                    </button>
                    <button
                      type="button"
                      disabled={cancellingSub}
                      onClick={handleCancelSubscription}
                      className="w-1/2 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white font-serif font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      {cancellingSub ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <span>Confirm Cancellation</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Address Modal */}
        <AnimatePresence>
          {editAddressModalOpen && (
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
                <div className="absolute inset-2 border-[1.5px] border-[#dcd3b9] rounded-xl pointer-events-none" />
                
                <div className="p-8 relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                        📮 Delivery Destination
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-[#3d4c41] mt-2 tracking-tight">
                        Update Shipping Address
                      </h2>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEditAddressModalOpen(false)}
                      className="text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-ghibli-sage leading-relaxed">
                    Provide the complete mailing address where your wax-sealed envelopes, postcards, and regional artifacts should be dispatched.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#4a554a] uppercase tracking-wide block">
                      Physical Shipping Address <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Full name, street address, apartment/suite, city, state/province, postal code, country..."
                      value={editAddressInput}
                      onChange={(e) => setEditAddressInput(e.target.value)}
                      className="w-full p-3 rounded-xl border border-ghibli-green bg-white text-xs focus:ring-1 focus:ring-ghibli-green focus:outline-none placeholder-stone-400 font-sans"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditAddressModalOpen(false)}
                      className="w-1/3 py-3 px-4 border border-stone-300 rounded-xl text-stone-600 font-serif font-medium text-xs hover:bg-stone-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateAddress}
                      className="w-2/3 py-3 px-4 bg-[#a8c1a6] hover:bg-[#97b395] text-[#2b3a2f] font-serif font-bold text-xs rounded-xl shadow-xs transition-all border border-[#96af94] flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Save Address</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}