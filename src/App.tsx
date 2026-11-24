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
  Coffee,
  X,
  ExternalLink,
  ShieldCheck,
  Award,
  Globe,
  Settings,
  ShoppingBag,
  Package
} from "lucide-react";

import JapanMap from "./components/JapanMap.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import MonthlyLetterShowcase from "./components/MonthlyLetterShowcase.tsx";
import FaqSection from "./components/FaqSection.tsx";
import TactileUnboxingTray from "./components/TactileUnboxingTray.tsx";
import GoshuinchoStampBook from "./components/GoshuinchoStampBook.tsx";
import ReadingParchmentModal from "./components/ReadingParchmentModal.tsx";
import CheckoutDrawer, { CheckoutSelection } from "./components/CheckoutDrawer.tsx";
import PostcardWhispers from "./components/PostcardWhispers.tsx";
import AmbientCompassBar from "./components/AmbientCompassBar.tsx";
import StoreFront from "./components/StoreFront.tsx";
import CartDrawer, { CartItem } from "./components/CartDrawer.tsx";
import PostalReceiptModal from "./components/PostalReceiptModal.tsx";
import OrderHistoryView from "./components/OrderHistoryView.tsx";

import { submitWaitlistEmail } from "./waitlist.ts";
import { 
  saveWaitlist, 
  saveNewsletter, 
  saveOrder, 
  saveCompleteOrder,
  getCustomerOrders,
  isEmailInNewsletter,
  updateUserPlan,
  cancelSubscription,
  pauseSubscription,
  updateUserAddress,
  checkAndExpireOverdueSubscriptions,
  getAllOrders
} from "./firestoreService.ts";
import { 
  INTERNATIONAL_CURRENCIES, 
  SupportedCurrency, 
  detectLocalCurrency, 
  getPlanPriceString 
} from "./currencyService.ts";
import { Region, Subscriber, PlanTier, SubscriptionStatus, CustomerOrder } from "./types.ts";
import { REGIONS_METADATA, LORE_DATA, getRegionMonthStatus, MonthStatus, getCurrentMonthNumber, getMonthName } from "./data/lore.ts";
import { StoreProduct, STORE_PRODUCTS } from "./data/storeProducts.ts";

export const ADMIN_EMAILS = [
  "isha79799@gmail.com",
  "isha79799@gmail"
];

const CART_STORAGE_KEY = "kokoro_cart_v1";

export default function App() {
  // Navigation: Voyage | Travel Journal | Store | Whispers | Admin
  const [activeTab, setActiveTab] = useState<"journey" | "journal" | "store" | "newsletter" | "admin">("journey");
  
  // Journal Sub-view: Map vs Goshuincho Stamp Book
  const [journalSubView, setJournalSubView] = useState<"map" | "stampbook">("map");

  // Store Sub-view: Catalog vs Order History
  const [storeSubView, setStoreSubView] = useState<"boutique" | "orders">("boutique");

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

  // E-Commerce & Persistent Cart State
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("USD");
  const [planDestination, setPlanDestination] = useState<"India" | "International">("India");
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Customer Orders history & Receipt modal
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [placedReceiptOrder, setPlacedReceiptOrder] = useState<CustomerOrder | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Modals & Drawers
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [checkoutDrawerOpen, setCheckoutDrawerOpen] = useState(false);
  const [defaultCheckoutSelection, setDefaultCheckoutSelection] = useState<CheckoutSelection>("first-month");
  const [lastSubmissionMode, setLastSubmissionMode] = useState<"purchase" | "waitlist">("purchase");
  const [alreadyOnWaitlist, setAlreadyOnWaitlist] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  // Subscription management modals
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [selectedPlanToChange, setSelectedPlanToChange] = useState<"Standard" | "Bundle">("Bundle");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editAddressModalOpen, setEditAddressModalOpen] = useState(false);
  const [editAddressInput, setEditAddressInput] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Auth form state (Magic link)
  const [emailInput, setEmailInput] = useState("");
  const [requestingLink, setRequestingLink] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [authAcceptTerms, setAuthAcceptTerms] = useState(true);
  const [authOptInNewsletter, setAuthOptInNewsletter] = useState(true);

  // Ambient sound simulator
  const [ambientSound, setAmbientSound] = useState<"none" | "wind" | "river" | "ocean">("wind");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Quick footer waitlist
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistNotice, setWaitlistNotice] = useState<string | null>(null);

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

  // Sync Cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Failed to save cart to localStorage", e);
    }
  }, [cartItems]);

  // Auto-detect visitor's local currency
  useEffect(() => {
    const detected = detectLocalCurrency();
    setSelectedCurrency(detected);
    if (detected === "INR") {
      setPlanDestination("India");
    } else {
      setPlanDestination("International");
    }
  }, []);

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

  // Fetch customer order history whenever user logs in
  const fetchCustomerOrders = async (email: string) => {
    try {
      const orders = await getCustomerOrders(email);
      if (orders && orders.length > 0) {
        setCustomerOrders(orders);
        return;
      }
    } catch (err) {
      console.warn("Firestore customer orders notice:", err);
    }

    try {
      const res = await fetch("/api/orders/user");
      const data = await res.json();
      if (data.success && data.orders) {
        setCustomerOrders(data.orders);
      }
    } catch (e) {
      console.warn("Preview customer orders notice:", e);
    }
  };

  useEffect(() => {
    if (session?.email) {
      fetchCustomerOrders(session.email);
    } else {
      setCustomerOrders([]);
    }
  }, [session?.email]);

  // Redirect to Travel Journal on login success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login_success") === "true") {
      setActiveTab("journal");
    }
  }, []);

  // Protect admin dashboard
  useEffect(() => {
    if (activeTab === "admin" && !isAdmin) {
      setActiveTab("journey");
    }
  }, [activeTab, isAdmin]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/session");
      if (!res.ok) {
        setSession({ authenticated: false, subscriber: null, unlocked_regions: [] });
        return;
      }
      const data = await res.json();
      
      if (data && !data.unlocked_regions) {
        data.unlocked_regions = [];
      }

      // Check overdue and sync Firestore orders
      if (data?.email) {
        try {
          await checkAndExpireOverdueSubscriptions(data.email);
        } catch (e) {
          console.warn("Overdue check notice:", e);
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

  // Cart operations
  const handleAddToCart = (product: StoreProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleDirectSubscribe = (product: StoreProduct) => {
    setDefaultCheckoutSelection(product.billingInterval === "yearly" ? "year-bundle" : "first-month");
    setCheckoutDrawerOpen(true);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setAuthError("Please provide a valid email address.");
      return;
    }
    if (!authAcceptTerms) {
      setAuthError("Please accept the Terms & Conditions to proceed.");
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
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        setAuthError(
          `Email backend unreachable (HTTP ${res.status}). Make sure you are on your Cloudflare Pages URL and /functions deployed.`
        );
        return;
      }

      if (data?.success) {
        if (authOptInNewsletter) {
          saveNewsletter("Traveler", emailInput.trim()).catch((err) =>
            console.warn("Newsletter opt-in notice:", err)
          );
        }
        setAuthMessage(data.message);
        if (data.link) {
          setGeneratedLink(data.link);
        }
      } else {
        setAuthError(data?.error || `Failed to send magic link (HTTP ${res.status}).`);
      }
    } catch {
      setAuthError("Network error reaching /api/auth/request-link. Please check your connection.");
    } finally {
      setRequestingLink(false);
    }
  };

  const handleDrawerCheckout = async (data: {
    mode: "purchase" | "waitlist";
    recipientName: string;
    email: string;
    shipping_address: string;
    plan_tier: "Standard" | "Bundle";
    destination: "India" | "International";
    shippingMethod: string;
    gateway: "razorpay" | "paypal" | "waitlist";
    optInNewsletter: boolean;
    acceptTerms: boolean;
    items?: Array<{
      productId: string;
      name: string;
      quantity: number;
      priceFormatted: string;
      isSubscription?: boolean;
    }>;
    totalFormatted?: string;
  }) => {
    setIsSubmittingCheckout(true);

    try {
      const orderItems = data.items || [];
      const preferredPlan =
        data.plan_tier === "Bundle"
          ? `12-Moon Annual (${data.destination})`
          : `Monthly Passage (${data.destination})`;

      if (data.mode === "waitlist") {
        const waitlistResult = await saveWaitlist(data.email, {
          name: data.recipientName,
          destination: data.destination,
          preferredPlan,
          shippingMethod: data.shippingMethod,
          cityCountry: data.shipping_address,
          interestedItems: orderItems,
          estimatedTotal: data.totalFormatted || "",
          source: cartItems.length > 0 ? "store-satchel-waitlist" : "founding-waitlist",
        });

        if (data.optInNewsletter) {
          saveNewsletter(data.recipientName || "Traveler", data.email.trim()).catch(e => console.warn(e));
        }

        submitWaitlistEmail(data.email.trim()).catch(e => console.warn(e));

        const passRef = `KOK-WL-${Math.floor(1000 + Math.random() * 9000)}`;
        const newWaitlistPass: CustomerOrder = {
          id: `wl_${Date.now()}`,
          orderNumber: passRef,
          trackingNumber: data.shippingMethod || "Batch 01 Priority",
          email: data.email,
          recipientName: data.recipientName,
          shipping_address: data.shipping_address,
          destination: data.destination,
          items: orderItems,
          totalFormatted: data.totalFormatted || "",
          currency: selectedCurrency,
          gateway: "waitlist",
          status: "Processing",
          createdDate: new Date().toISOString()
        };

        setLastSubmissionMode("waitlist");
        setAlreadyOnWaitlist(waitlistResult === "already-signed-up");
        setPlacedReceiptOrder(newWaitlistPass);
        setReceiptModalOpen(true);
        setCheckoutDrawerOpen(false);
        setCartDrawerOpen(false);
        setCartItems([]);
        return;
      }

      // Purchase Flow (First Month, Whole Year Bundle, or Cart)
      if (data.optInNewsletter) {
        saveNewsletter(data.recipientName || "Traveler", data.email.trim()).catch(e => console.warn(e));
      }

      const hasSubscription = orderItems.some(i => i.isSubscription);
      const completeRes = await saveCompleteOrder({
        email: data.email,
        recipientName: data.recipientName,
        shipping_address: data.shipping_address,
        destination: data.destination,
        gateway: data.gateway,
        items: orderItems,
        totalFormatted: data.totalFormatted || "",
        currency: selectedCurrency,
      });

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          recipientName: data.recipientName,
          shipping_address: data.shipping_address,
          destination: data.destination,
          gateway: data.gateway,
          items: orderItems,
          totalFormatted: data.totalFormatted || "",
          currency: selectedCurrency,
          orderNumber: completeRes.orderNumber,
          trackingNumber: completeRes.trackingNumber,
          skipFirestoreWrite: Boolean(completeRes.persistedToFirestore),
        })
      });
      const result = await res.json();

      const orderNumber = result.orderNumber || completeRes.orderNumber;
      const trackingNumber = result.trackingNumber || completeRes.trackingNumber;

      const newPlacedOrder: CustomerOrder = {
        id: `ord_${Date.now()}`,
        orderNumber,
        trackingNumber,
        email: data.email,
        recipientName: data.recipientName,
        shipping_address: data.shipping_address,
        destination: data.destination,
        items: orderItems,
        totalFormatted: data.totalFormatted || "",
        currency: selectedCurrency,
        gateway: data.gateway,
        status: hasSubscription ? "Active" : "Processing",
        createdDate: new Date().toISOString()
      };

      setLastSubmissionMode("purchase");
      setAlreadyOnWaitlist(false);
      setPlacedReceiptOrder(newPlacedOrder);
      setReceiptModalOpen(true);
      setCheckoutDrawerOpen(false);
      setCartDrawerOpen(false);
      setCartItems([]);

      await fetchSession();
      if (data.email) {
        await fetchCustomerOrders(data.email);
      }
      if (hasSubscription) {
        triggerUnlockAnimation("hokkaido");
      }
    } catch (err: any) {
      setActionNotice("Checkout notice: " + (err?.message || "Could not complete request. Please try again."));
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ authenticated: false, subscriber: null, unlocked_regions: [] });
      setCustomerOrders([]);
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
    }
  };

  const handleCancelSubscription = async () => {
    if (!session?.email) return;
    try {
      await cancelSubscription(session.email, "Cancelled by subscriber");
      await fetch("/api/subscriber/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by subscriber" })
      });
      await fetchSession();
      setCancelModalOpen(false);
      setActionNotice("Your subscription has been cancelled. Dispatches already processed remain active.");
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err: any) {
      alert("Error cancelling subscription: " + err.message);
    }
  };

  const handlePauseSubscription = async () => {
    if (!session?.email) return;
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
  const isSubscriberPaused = session?.subscriber?.subscription_status === "Paused";
  const isUnlocked = isSubscriberActive && (session?.unlocked_regions?.includes(activeRegionId || "") || false);

  const handleToggleSound = () => {
    setIsAudioPlaying(prev => !prev);
  };

  const handleSelectRegion = async (id: string) => {
    const metadata = REGIONS_METADATA.find(r => r.region_id === id);
    if (!metadata) return;

    setActiveRegionId(id);
    const monthStatus = getRegionMonthStatus(metadata.month);

    if (monthStatus === "future") {
      setActiveTab("journal");
      return;
    }

    const unlocked = session?.unlocked_regions?.includes(id) || await checkRegionAuthorization(id);
    if (!unlocked && !isSubscriberActive) {
      setCheckoutDrawerOpen(true);
    } else {
      setActiveTab("journal");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1b2e24] font-sans selection:bg-[#eedba5] selection:text-[#1b2e24]">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="bg-[#e3ece8] border-b border-[#9cbfae] px-4 py-2 text-xs text-center text-[#1b2e24] font-medium sticky top-0 z-50">
          {actionNotice}
        </div>
      )}

      {/* LAYER 1: The Traveler's Header & Command Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e3ece8] px-4 md:px-8 py-3.5 vintage-shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Mark */}
          <button 
            onClick={() => setActiveTab("journey")}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1b2e24] text-[#faf6eb] flex items-center justify-center font-serif font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              心
            </div>
            <div>
              <span className="font-serif font-bold text-base md:text-lg text-[#1b2e24] block leading-tight">
                Kokoro Letters
              </span>
              <span className="text-[10px] text-[#547365] font-mono block">
                Japan Snail Mail Club & Paperie
              </span>
            </div>
          </button>

          {/* Primary Navigation Portals */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { id: "journey", label: "Voyage", icon: <Compass className="w-3.5 h-3.5" /> },
              { id: "journal", label: "Travel Journal", icon: <BookOpen className="w-3.5 h-3.5" /> },
              { id: "store", label: "Boutique Store", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
              { id: "newsletter", label: "Whispers", icon: <Mail className="w-3.5 h-3.5" /> },
              ...(isAdmin ? [{ id: "admin", label: "Admin", icon: <Settings className="w-3.5 h-3.5" /> }] : []),
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                      : "text-[#547365] hover:text-[#1b2e24] hover:bg-stone-100/70"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Currency Switcher + Cart Satchel + Ambient Compass */}
          <div className="flex items-center gap-2">
            {/* Currency Selector Pill */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-[#547365] bg-white border border-[#e3ece8] px-2 py-1 rounded-full">
              <Globe className="w-3 h-3 text-[#547365]" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
                className="bg-transparent border-none text-[11px] font-mono font-medium text-[#1b2e24] focus:outline-none cursor-pointer"
              >
                {Object.keys(INTERNATIONAL_CURRENCIES).map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            {/* Ambient Sound Dock & Account Badge */}
            <AmbientCompassBar
              ambientSound={ambientSound}
              onChangeSound={(snd) => {
                setAmbientSound(snd);
                setIsAudioPlaying(true);
              }}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={handleToggleSound}
              sessionEmail={session?.email}
              unlockedCount={session?.unlocked_regions?.length || 0}
              onOpenAuth={() => setAuthModalOpen(true)}
              onLogout={session?.authenticated ? handleLogout : undefined}
              cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              onOpenCart={() => setCartDrawerOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          
          {/* ======================================================== */}
          {/* SCREEN 1: VOYAGE (Discovery, Unboxing & Story)            */}
          {/* ======================================================== */}
          {activeTab === "journey" && (
            <motion.div
              key="journey-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-16"
            >
              {/* Spacious, Calming Hero Banner */}
              <div className="relative rounded-3xl bg-[#faf6eb] border-2 border-[#dcd3b9] p-8 md:p-16 text-center space-y-6 overflow-hidden vintage-shadow">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#eedba530,#0000_60%)] pointer-events-none" />
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#eedba5] text-[11px] font-mono text-[#547365]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Founding Batch 01 • Month 1, Year Bundle &amp; Waitlist Open</span>
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1b2e24] max-w-3xl mx-auto leading-tight">
                  Step through the meadow into the spirit world
                </h1>

                <p className="text-sm md:text-base text-[#547365] max-w-2xl mx-auto leading-relaxed">
                  Monthly wax-sealed art &amp; lore letters from Japan’s Ghibli-inspired landscapes &mdash; receive a scenic art print, collectible region stamp, and creator letter, plus a free envelope-sized Japan map if you join in Month 1.
                </p>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setPlanDestination("India");
                      setDefaultCheckoutSelection("first-month");
                      setCheckoutDrawerOpen(true);
                    }}
                    className="px-6 py-3.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-2xl text-xs md:text-sm font-serif font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>Start First Month or Year Bundle</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setPlanDestination("India");
                      setDefaultCheckoutSelection("waitlist");
                      setCheckoutDrawerOpen(true);
                    }}
                    className="px-6 py-3.5 bg-white border border-[#9cbfae] hover:bg-[#e3ece8]/40 text-[#1b2e24] rounded-2xl text-xs md:text-sm font-serif font-bold transition-all cursor-pointer"
                  >
                    Join Free Waitlist
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById("tactile-unboxing-tray")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-5 py-3.5 text-[#547365] hover:text-[#1b2e24] text-xs md:text-sm font-serif font-bold transition-all cursor-pointer"
                  >
                    Peek Inside a Dispatch
                  </button>
                </div>
              </div>

              {/* LAYER: Tactile Unboxing Tray */}
              <div id="tactile-unboxing-tray">
                <TactileUnboxingTray />
              </div>

              {/* Monthly Letter Showcase Strip */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#547365] bg-[#e3ece8] px-2.5 py-0.5 rounded-full">
                    Monthly Curations
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-[#1b2e24]">
                    Dispatches from the Meadow
                  </h3>
                  <p className="text-xs text-[#547365] max-w-lg mx-auto">
                    A glimpse into recent and upcoming monthly kits.
                  </p>
                </div>
                <MonthlyLetterShowcase
                  isSubscriber={isSubscriberActive}
                  onSubscribe={() => {
                    setPlanDestination("India");
                    setCheckoutDrawerOpen(true);
                  }}
                />
              </div>

              {/* Interactive Japan Path Preview */}
              <div className="bg-[#faf6eb] border-2 border-[#dcd3b9] rounded-3xl p-8 md:p-12 text-center space-y-6 vintage-shadow">
                <div className="max-w-2xl mx-auto space-y-2">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#1b2e24]">
                    Your 12-Moon Path Across Japan
                  </h3>
                  <p className="text-xs md:text-sm text-[#547365]">
                    Trace the route across Hokkaido, Kansai, Yakushima, and beyond. Tap any checkpoint to inspect its folklore or open the full interactive journal.
                  </p>
                </div>

                <div className="max-w-xl mx-auto py-2">
                  <JapanMap
                    isSubscriber={false}
                    unlockedRegions={regions.map(r => r.region_id)}
                    activeRegionId={activeRegionId}
                    onSelectRegion={handleSelectRegion}
                    regionsList={regions}
                  />
                </div>

                <button
                  onClick={() => {
                    setActiveTab("journal");
                    setTimeout(() => {
                      document.getElementById("interactive-japan-map")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="px-6 py-3 bg-[#9cbfae] hover:bg-[#86ab9a] text-[#1b2e24] rounded-2xl text-xs font-serif font-bold transition-all shadow-xs cursor-pointer"
                >
                  Enter Travel Journal & Stamp Map
                </button>
              </div>

              {/* FAQ Section */}
              <FaqSection />
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2: TRAVEL JOURNAL (The Core Interactive Map & Book)*/}
          {/* ======================================================== */}
          {activeTab === "journal" && (
            <motion.div
              key="journal-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Journal Sub-Navigation Segmented Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-2 md:p-3 rounded-2xl border border-[#e3ece8] shadow-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setJournalSubView("map")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-serif transition-all cursor-pointer ${
                      journalSubView === "map"
                        ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                        : "text-[#547365] hover:text-[#1b2e24] hover:bg-stone-100"
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Expedition Map</span>
                  </button>

                  <button
                    onClick={() => setJournalSubView("stampbook")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-serif transition-all cursor-pointer ${
                      journalSubView === "stampbook"
                        ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                        : "text-[#547365] hover:text-[#1b2e24] hover:bg-stone-100"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Goshuincho Stamp Book</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 px-3">
                  <span className="text-[11px] font-mono text-[#547365]">
                    {session?.unlocked_regions?.length || 1} of 12 Waypoints Stamped
                  </span>
                  {!isSubscriberActive && (
                    <button
                      onClick={() => {
                        setPlanDestination("India");
                        setDefaultCheckoutSelection("first-month");
                        setCheckoutDrawerOpen(true);
                      }}
                      className="px-3 py-1 bg-[#9cbfae] text-[#1b2e24] rounded-lg text-xs font-serif font-bold hover:bg-[#86ab9a] transition-colors cursor-pointer"
                    >
                      Unlock or Join Waitlist
                    </button>
                  )}
                </div>
              </div>

              {/* Just Unlocked Banner */}
              <AnimatePresence>
                {justUnlockedRegionId && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="bg-[#faf6eb] border-2 border-emerald-300 rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between gap-4 max-w-2xl mx-auto"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-full border-2 border-red-700 bg-red-50 flex items-center justify-center text-red-900 font-serif font-bold text-base rotate-[-6deg]">
                        心
                      </div>
                      <div>
                        <p className="text-xs font-serif font-bold text-[#1b2e24]">
                          Passport Stamped: {regions.find(r => r.region_id === justUnlockedRegionId)?.region_name || justUnlockedRegionId}
                        </p>
                        <p className="text-[11px] text-[#547365]">
                          New regional lore and letter unlocked in your Travel Journal.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                      Stamped
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SUB-VIEW 1: Expedition Map Mode (Spacious & Clean) */}
              {journalSubView === "map" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: The Big Japan Map with Breathing Room */}
                  <div className="lg:col-span-7 bg-[#faf6eb] border-2 border-[#dcd3b9] rounded-3xl p-6 md:p-8 vintage-shadow space-y-4">
                    <div className="flex items-center justify-between border-b border-[#eedba5] pb-3">
                      <div>
                        <h3 className="font-serif font-bold text-base text-[#1b2e24]">
                          Interactive Map of Japan
                        </h3>
                        <p className="text-xs text-[#547365]">
                          Tap a territory to inspect its folklore or read this month's dispatch.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-[#547365] bg-white px-2 py-0.5 rounded-md border border-[#eedba5]">
                        {isSubscriberActive ? "Subscriber Mode" : "Preview Mode"}
                      </span>
                    </div>

                    <div className="py-2">
                      <JapanMap
                        isSubscriber={isSubscriberActive}
                        unlockedRegions={isSubscriberActive ? (session?.unlocked_regions || []) : []}
                        activeRegionId={activeRegionId}
                        justUnlockedRegionId={justUnlockedRegionId}
                        onSelectRegion={handleSelectRegion}
                        regionsList={regions}
                      />
                    </div>
                  </div>

                  {/* Right: Selected Region Inspector Card */}
                  <div className="lg:col-span-5 space-y-6">
                    {activeRegion ? (
                      <div className="bg-white rounded-3xl border border-[#e3ece8] overflow-hidden vintage-shadow flex flex-col text-left">
                        {/* Region Picture Header */}
                        <div className="h-44 relative overflow-hidden">
                          <img
                            src={activeRegion.assets_url}
                            alt={activeRegion.region_name}
                            className="w-full h-full object-cover brightness-85"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                          
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                            <div>
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#f5dfb8]">
                                Selected Destination
                              </span>
                              <h3 className="text-xl font-serif font-bold">
                                {activeRegion.region_name}
                              </h3>
                            </div>

                            {activeRegionMonthStatus === "future" ? (
                              <span className="bg-amber-600 text-white text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Coming Soon
                              </span>
                            ) : isUnlocked ? (
                              <span className="bg-emerald-600 text-white text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Unlock className="w-3 h-3" /> Unlocked
                              </span>
                            ) : (
                              <span className="bg-stone-800 text-stone-200 text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Region Card Body */}
                        <div className="p-6 space-y-4">
                          <p className="text-xs text-[#547365] leading-relaxed line-clamp-4">
                            {activeRegion.lore_content}
                          </p>

                          <div className="pt-2 border-t border-[#e3ece8] flex flex-col gap-2">
                            {/* Read Full Letter Button */}
                            <button
                              onClick={() => setReadingModalOpen(true)}
                              className="w-full py-2.5 bg-[#faf6eb] hover:bg-[#eedba5]/40 text-[#1b2e24] border border-[#eedba5] rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-stone-600" />
                              <span>Read Letter in Parchment Reader</span>
                            </button>

                            {/* Unlock or Stamp Action */}
                            {!isUnlocked && isSubscriberActive ? (
                              <button
                                onClick={() => handleManualStamp(activeRegion.region_id)}
                                className="w-full py-2.5 bg-[#9cbfae] hover:bg-[#86ab9a] text-[#1b2e24] rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Stamp & Unlock Destination</span>
                              </button>
                            ) : !isUnlocked ? (
                              <button
                                onClick={() => {
                                  setPlanDestination("India");
                                  setDefaultCheckoutSelection("first-month");
                                  setCheckoutDrawerOpen(true);
                                }}
                                className="w-full py-2.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Unlock Passage or Waitlist</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Quick Passage Stats Card */}
                    <div className="bg-[#faf6eb] p-5 rounded-3xl border border-[#eedba5] text-left space-y-3">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#547365] block">
                        Traveler's Log
                      </span>
                      <div className="space-y-1.5 text-xs text-[#1b2e24]">
                        <div className="flex justify-between">
                          <span className="text-[#547365]">Account Status:</span>
                          <span className="font-semibold">{isSubscriberActive ? "Active Subscriber" : isSubscriberPaused ? "Paused" : "Guest Explorer"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#547365]">Plan Tier:</span>
                          <span className="font-semibold">{session?.subscriber?.plan_tier || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#547365]">Shipping Hub:</span>
                          <span className="font-semibold">{session?.subscriber?.destination === "International" ? "Tokyo Airmail" : "India Domestic Hub"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: Goshuincho Stamp Book Mode */}
              {journalSubView === "stampbook" && (
                <GoshuinchoStampBook
                  unlockedRegionIds={session?.unlocked_regions || []}
                  justUnlockedRegionId={justUnlockedRegionId}
                  onSelectRegion={(id) => {
                    setActiveRegionId(id);
                    setJournalSubView("map");
                  }}
                  isSubscriber={isSubscriberActive}
                  onOpenStore={() => {
                    setActiveTab("store");
                  }}
                />
              )}
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3: BOUTIQUE STORE (Full E-Commerce & Subscriptions) */}
          {/* ======================================================== */}
          {activeTab === "store" && (
            <motion.div
              key="store-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-12"
            >
              {/* Store Sub-Navigation (Boutique Catalog vs My Orders) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-2 md:p-3 rounded-2xl border border-[#e3ece8] shadow-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setStoreSubView("boutique")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-serif transition-all cursor-pointer ${
                      storeSubView === "boutique"
                        ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                        : "text-[#547365] hover:text-[#1b2e24] hover:bg-stone-100"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Curated Treasures & Passages</span>
                  </button>

                  <button
                    onClick={() => setStoreSubView("orders")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-serif transition-all cursor-pointer ${
                      storeSubView === "orders"
                        ? "bg-[#1b2e24] text-white font-bold shadow-xs"
                        : "text-[#547365] hover:text-[#1b2e24] hover:bg-stone-100"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>My Dispatches & Orders ({customerOrders.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3">
                  <span className="text-[11px] font-mono text-[#547365]">
                    Satchel: {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
                  </span>
                  <button
                    onClick={() => setCartDrawerOpen(true)}
                    className="px-3 py-1 bg-[#9cbfae] text-[#1b2e24] rounded-lg text-xs font-serif font-bold hover:bg-[#86ab9a] transition-colors cursor-pointer"
                  >
                    View Satchel
                  </button>
                </div>
              </div>

              {/* If Active Member: The Traveler's Passport Card */}
              {session?.authenticated && isSubscriberActive ? (
                <div className="bg-[#faf6eb] border-2 border-[#eedba5] rounded-3xl p-8 max-w-3xl mx-auto vintage-shadow space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eedba5] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1b2e24] text-white flex items-center justify-center font-serif font-bold">
                        心
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#547365] block">
                          Active Traveler Passport
                        </span>
                        <h4 className="font-serif font-bold text-lg text-[#1b2e24]">
                          {session.subscriber?.plan_tier} Subscriber
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        ✓ {session.subscriber?.subscription_status || "Active"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-4 rounded-2xl border border-[#eedba5]">
                      <span className="text-[10px] font-mono text-[#547365] block mb-1">SHIPPING ADDRESS</span>
                      <p className="text-[#1b2e24] font-medium">{session.subscriber?.shipping_address || "None recorded"}</p>
                      <button
                        onClick={() => {
                          setEditAddressInput(session.subscriber?.shipping_address || "");
                          setEditAddressModalOpen(true);
                        }}
                        className="text-[11px] font-serif font-bold text-emerald-800 hover:underline mt-2 inline-block cursor-pointer"
                      >
                        Edit Shipping Destination →
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#eedba5] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#547365] block mb-1">CURRENT CYCLE DISPATCH</span>
                        <p className="text-[#1b2e24] font-medium">Month {getCurrentMonthNumber()}: {getMonthName(getCurrentMonthNumber())} Dispatch</p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-stone-100 mt-2">
                        <button
                          onClick={() => setChangePlanModalOpen(true)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-semibold text-[#1b2e24] cursor-pointer"
                        >
                          Change Plan
                        </button>
                        <button
                          onClick={handlePauseSubscription}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-semibold text-[#1b2e24] cursor-pointer"
                        >
                          {isSubscriberPaused ? "Resume" : "Pause"}
                        </button>
                        <button
                          onClick={() => setCancelModalOpen(true)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Sub-View 1: Catalog */}
              {storeSubView === "boutique" && (
                <StoreFront
                  destination={planDestination}
                  onToggleDestination={setPlanDestination}
                  selectedCurrency={selectedCurrency}
                  onAddToCart={handleAddToCart}
                  onDirectSubscribe={handleDirectSubscribe}
                  onJoinWaitlist={() => {
                    setDefaultCheckoutSelection("waitlist");
                    setCheckoutDrawerOpen(true);
                  }}
                  onOpenCart={() => setCartDrawerOpen(true)}
                  cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                />
              )}

              {/* Sub-View 2: Customer Order & Dispatch History */}
              {storeSubView === "orders" && (
                <OrderHistoryView
                  orders={customerOrders}
                  onOpenStore={() => setStoreSubView("boutique")}
                />
              )}

              {/* Already a Member: Clean Magic Link Card */}
              {!session?.authenticated && (
                <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-[#e3ece8] text-center space-y-3">
                  <h4 className="font-serif font-bold text-sm text-[#1b2e24]">
                    Already a subscriber or have an account?
                  </h4>
                  <p className="text-xs text-[#547365]">
                    Enter your email to receive a passwordless magic link and access your Travel Journal:
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="px-5 py-2 border border-[#9cbfae] text-[#1b2e24] hover:bg-[#e3ece8]/40 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer"
                  >
                    Request Magic Sign-in Link
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4: WHISPERS & NEWSLETTER (The Postcard Archive)    */}
          {/* ======================================================== */}
          {activeTab === "newsletter" && (
            <motion.div
              key="newsletter-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <PostcardWhispers
                onSubscribeEmail={async (em) => {
                  try {
                    const res = await saveNewsletter("Traveler", em);
                    submitWaitlistEmail(em).catch(() => {});
                    return res;
                  } catch {
                    return "error";
                  }
                }}
              />
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5: ADMIN DASHBOARD (Fulfillment Ledger)           */}
          {/* ======================================================== */}
          {activeTab === "admin" && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AdminDashboard />
            </motion.div>
          )}

        </AnimatePresence>

        {/* Global Footer */}
        <footer className="mt-20 pt-8 border-t border-[#e3ece8] text-left text-xs text-[#547365] grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1b2e24] text-white flex items-center justify-center font-serif font-bold text-xs">
                心
              </span>
              <span className="font-serif font-bold text-sm text-[#1b2e24]">Kokoro Letters</span>
            </div>
            <p className="text-[11px] leading-relaxed max-w-sm">
              A moonlit journey through Japan, one wax-sealed letter at a time. Thoughtfully curated, printed, and hand-assembled in small batches.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-mono font-bold text-[10px] uppercase text-[#1b2e24] block">Wander</span>
            <div className="flex flex-col gap-1.5 text-[11px]">
              <button onClick={() => setActiveTab("journey")} className="text-left hover:text-[#1b2e24] cursor-pointer">Our Voyage</button>
              <button onClick={() => setActiveTab("journal")} className="text-left hover:text-[#1b2e24] cursor-pointer">Travel Journal & Map</button>
              <button onClick={() => setActiveTab("store")} className="text-left hover:text-[#1b2e24] cursor-pointer">Boutique Store & Passages</button>
              <button onClick={() => setActiveTab("newsletter")} className="text-left hover:text-[#1b2e24] cursor-pointer">Postcard Whispers</button>
              {isAdmin && (
                <button onClick={() => setActiveTab("admin")} className="text-left font-mono text-[10px] text-stone-400 hover:text-stone-800 pt-1 cursor-pointer">
                  Admin Fulfillment Ledger
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono font-bold text-[10px] uppercase text-[#1b2e24] block">Founding Batch 01 Waitlist</span>
            <p className="text-[11px]">Get notified when Batch 01 opens and receive subtle region whispers.</p>
            <div className="flex gap-1.5">
              <input
                type="email"
                placeholder="you@meadow.jp"
                value={waitlistEmail}
                onChange={(e) => {
                  setWaitlistEmail(e.target.value);
                  if (waitlistNotice) setWaitlistNotice(null);
                }}
                className="bg-white border border-[#e3ece8] rounded-xl px-2.5 py-1.5 text-xs flex-1 focus:outline-none"
              />
              <button
                onClick={async () => {
                  if (!waitlistEmail.includes("@")) {
                    setWaitlistNotice("Please enter a valid email address.");
                    return;
                  }
                  try {
                    const status = await saveWaitlist(waitlistEmail.trim(), {
                      destination: planDestination,
                      source: "footer-waitlist",
                    });
                    submitWaitlistEmail(waitlistEmail.trim()).catch(() => {});
                    if (status === "already-signed-up") {
                      setWaitlistNotice("You’re already on the Founding Waitlist! 🍃");
                    } else if (status === "error") {
                      setWaitlistNotice("Could not save right now — please try again.");
                    } else {
                      setWaitlistNotice("Spot saved! Watch your inbox for Batch 01. 🍃");
                      setWaitlistEmail("");
                    }
                  } catch {
                    setWaitlistNotice("Spot saved! Watch your inbox for Batch 01. 🍃");
                  }
                }}
                className="px-3 py-1.5 bg-[#1b2e24] text-white rounded-xl text-xs font-serif font-bold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Join
              </button>
            </div>
            {waitlistNotice && (
              <p className="text-[11px] text-emerald-800 font-medium">{waitlistNotice}</p>
            )}
          </div>
        </footer>
      </main>

      {/* ======================================================== */}
      {/* LAYER 3: DRAWERS & MODALS                                */}
      {/* ======================================================== */}

      {/* 1. Shopping Satchel / Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        destination={planDestination}
        onToggleDestination={setPlanDestination}
        selectedCurrency={selectedCurrency}
        onProceedToCheckout={() => {
          setCartDrawerOpen(false);
          setCheckoutDrawerOpen(true);
        }}
      />

      {/* 2. Slide-Over Checkout & Waitlist Drawer */}
      <CheckoutDrawer
        isOpen={checkoutDrawerOpen}
        onClose={() => setCheckoutDrawerOpen(false)}
        defaultDestination={planDestination}
        defaultSelection={defaultCheckoutSelection}
        selectedCurrency={selectedCurrency}
        cartItems={cartItems}
        onSubmit={handleDrawerCheckout}
        isSubmitting={isSubmittingCheckout}
        existingEmail={session?.email || ""}
        existingAddress={session?.subscriber?.shipping_address || ""}
        onOpenTerms={() => setTermsModalOpen(true)}
      />

      {/* 3. Confirmation / Postal Manifest Modal */}
      <PostalReceiptModal
        order={placedReceiptOrder}
        isOpen={receiptModalOpen}
        isWaitlistReservation={lastSubmissionMode === "waitlist"}
        alreadyOnWaitlist={alreadyOnWaitlist}
        onClose={() => setReceiptModalOpen(false)}
        onViewJournal={() => {
          setActiveTab("journal");
          setReceiptModalOpen(false);
        }}
      />

      {/* 4. Reading Parchment Modal */}
      <ReadingParchmentModal
        region={activeRegion || null}
        isOpen={readingModalOpen}
        onClose={() => setReadingModalOpen(false)}
        ambientSound={ambientSound}
        onToggleSound={handleToggleSound}
        isAudioPlaying={isAudioPlaying}
        onStampUnlock={() => activeRegion && handleManualStamp(activeRegion.region_id)}
        isUnlocked={isUnlocked}
        isSubscriber={isSubscriberActive}
      />

      {/* 5. Magic Link Sign-in Modal */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf6eb] w-full max-w-md rounded-3xl p-6 md:p-8 border-2 border-[#eedba5] shadow-xl space-y-4 text-left relative"
            >
              <button
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#547365] bg-white px-2.5 py-0.5 rounded-full border border-[#eedba5]">
                  Digital Key
                </span>
                <h3 className="font-serif font-bold text-xl text-[#1b2e24]">
                  Sign into Travel Ledger
                </h3>
                <p className="text-xs text-[#547365]">
                  No password required. Enter your email to receive a secure Magic Link to enter the meadow gates.
                </p>
              </div>

              <form onSubmit={handleSendMagicLink} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="e.g. chihiro@spirited.jp"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
                />

                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-[#547365]">
                    <input
                      type="checkbox"
                      checked={authOptInNewsletter}
                      onChange={(e) => setAuthOptInNewsletter(e.target.checked)}
                      className="rounded border-[#9cbfae] text-emerald-800 focus:ring-emerald-700 mt-0.5"
                    />
                    <span>
                      Also add me to free monthly Cultural Newsletter whispers &amp; region previews.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer text-xs text-[#547365]">
                    <input
                      type="checkbox"
                      checked={authAcceptTerms}
                      onChange={(e) => setAuthAcceptTerms(e.target.checked)}
                      className="rounded border-[#9cbfae] text-emerald-800 focus:ring-emerald-700 mt-0.5"
                    />
                    <span>
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setTermsModalOpen(true)}
                        className="underline text-emerald-800 font-semibold hover:text-emerald-950"
                      >
                        Terms & Conditions
                      </button>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={requestingLink}
                  className="w-full py-3 bg-[#1b2e24] hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {requestingLink ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Magic Link</span>
                </button>
              </form>

              {authMessage && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-2">
                  <p>{authMessage}</p>
                  {generatedLink && (
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-300 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono truncate text-emerald-800">{generatedLink}</span>
                      <a
                        href={generatedLink}
                        className="px-2.5 py-1 bg-emerald-700 text-white text-[10px] font-serif font-bold rounded-md shrink-0 flex items-center gap-1"
                      >
                        <span>Enter</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {authError && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs">
                  {authError}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Terms & Conditions Modal */}
      <AnimatePresence>
        {termsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf6eb] w-full max-w-lg rounded-3xl p-6 md:p-8 border-2 border-[#eedba5] shadow-xl space-y-4 text-left relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#eedba5] pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#547365] bg-white px-2 py-0.5 rounded-md border border-[#eedba5]">
                    📜 Traveler Covenant
                  </span>
                  <h3 className="font-serif font-bold text-xl text-[#1b2e24] mt-1">
                    Terms & Conditions
                  </h3>
                </div>
                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 text-xs text-[#547365] leading-relaxed pr-1">
                <div className="bg-white p-3.5 rounded-xl border border-[#eedba5] space-y-1">
                  <h4 className="font-serif font-bold text-sm text-[#1b2e24]">1. Handcrafted Dispatches</h4>
                  <p>
                    Kokoro Letters dispatches are prepared with tactile craftsmanship. Each envelope contains real paper prints, stickers, and hand-sealed letters inspired by Japan.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#eedba5] space-y-1">
                  <h4 className="font-serif font-bold text-sm text-[#1b2e24]">2. Shipping & Delivery Cycles</h4>
                  <p>
                    Parcels are prepared and dispatched on monthly cycles. Domestic orders within India are delivered via Speed-Post (3-5 days). International parcels are dispatched via tracked airmail directly to your registered destination.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#eedba5] space-y-1">
                  <h4 className="font-serif font-bold text-sm text-[#1b2e24]">3. Plans & Cancellations</h4>
                  <p>
                    Standard plans renew monthly; Bundle plans cover all 12 regions in bulk. Subscribers may cancel or pause at any time from their ledger. Already-paid dispatches for the current month remain active and will be shipped.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#eedba5] space-y-1">
                  <h4 className="font-serif font-bold text-sm text-[#1b2e24]">4. Privacy & Postal Address</h4>
                  <p>
                    Your email and shipping address are held in confidence. They are used exclusively to process your subscription, deliver physical parcels, and send periodic travel whispers if subscribed.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(false)}
                  className="w-full py-3 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all cursor-pointer"
                >
                  I Understand & Accept
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Change Plan Modal */}
      <AnimatePresence>
        {changePlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf6eb] w-full max-w-md rounded-3xl p-6 md:p-8 border-2 border-[#eedba5] shadow-xl space-y-4 text-left relative"
            >
              <button
                onClick={() => setChangePlanModalOpen(false)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif font-bold text-lg text-[#1b2e24]">
                Change Subscription Plan
              </h3>
              <p className="text-xs text-[#547365]">
                Switch between monthly standard dispatches and the 12-moon bundle:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => setSelectedPlanToChange("Standard")}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlanToChange === "Standard"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200"
                  }`}
                >
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">Standard Plan (Monthly)</span>
                  <span className="text-xs text-[#547365]">Billed monthly. Cancel or pause anytime.</span>
                </button>

                <button
                  onClick={() => setSelectedPlanToChange("Bundle")}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlanToChange === "Bundle"
                      ? "bg-white border-[#9cbfae] ring-2 ring-[#9cbfae]/40 shadow-xs"
                      : "bg-white/40 border-stone-200"
                  }`}
                >
                  <span className="font-serif font-bold text-sm text-[#1b2e24] block">Annual Bundle (12 Moons)</span>
                  <span className="text-xs text-[#547365]">Guaranteed 12-month expedition with priority fulfillment.</span>
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handleChangePlan(selectedPlanToChange)}
                  className="flex-1 py-2.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all cursor-pointer"
                >
                  Confirm Change
                </button>
                <button
                  onClick={() => setChangePlanModalOpen(false)}
                  className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Edit Address Modal */}
      <AnimatePresence>
        {editAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf6eb] w-full max-w-md rounded-3xl p-6 md:p-8 border-2 border-[#eedba5] shadow-xl space-y-4 text-left relative"
            >
              <button
                onClick={() => setEditAddressModalOpen(false)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif font-bold text-lg text-[#1b2e24]">
                Update Shipping Address
              </h3>
              <p className="text-xs text-[#547365]">
                Enter the full address where your monthly parcels should be delivered:
              </p>

              <textarea
                rows={3}
                value={editAddressInput}
                onChange={(e) => setEditAddressInput(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#9cbfae] bg-white text-xs focus:ring-1 focus:ring-[#9cbfae] focus:outline-none"
              />

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleUpdateAddress}
                  className="flex-1 py-2.5 bg-[#1b2e24] hover:bg-stone-800 text-white rounded-xl text-xs font-serif font-bold transition-all cursor-pointer"
                >
                  Save Address
                </button>
                <button
                  onClick={() => setEditAddressModalOpen(false)}
                  className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Cancel Subscription Modal */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf6eb] w-full max-w-md rounded-3xl p-6 md:p-8 border-2 border-[#eedba5] shadow-xl space-y-4 text-left relative"
            >
              <button
                onClick={() => setCancelModalOpen(false)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif font-bold text-lg text-rose-800">
                Cancel Monthly Passage?
              </h3>
              <p className="text-xs text-[#547365] leading-relaxed">
                Are you sure you wish to cancel your Kokoro Letters subscription? You will still receive any dispatches already processed for this billing cycle, but no future kits will be shipped.
              </p>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleCancelSubscription}
                  className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-serif font-bold transition-all cursor-pointer"
                >
                  Yes, Cancel Passage
                </button>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Keep Subscription
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
