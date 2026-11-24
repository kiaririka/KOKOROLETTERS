import React, { useState, useEffect } from "react";
import { 
  Users, 
  Mail, 
  RefreshCw, 
  UserMinus, 
  Download, 
  Search, 
  Check, 
  AlertCircle,
  FileText,
  Sparkles,
  Calendar,
  Package,
  Truck,
  CheckCircle2,
  MapPin
} from "lucide-react";
import { 
  getAllOrders, 
  getAllNewsletter, 
  getAllWaitlist,
  updateOrderStatus, 
  seedSampleData,
  checkAndExpireOverdueSubscriptions,
  OrderRecord, 
  NewsletterRecord,
  WaitlistRecord
} from "../firestoreService.ts";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterRecord[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"waitlist" | "orders" | "newsletter">("waitlist");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        await checkAndExpireOverdueSubscriptions();
      } catch (checkErr) {
        console.warn("Overdue deadline check notice:", checkErr);
      }
      const [fetchedOrders, fetchedNews, fetchedWaitlist] = await Promise.all([
        getAllOrders(),
        getAllNewsletter(),
        getAllWaitlist()
      ]);
      setOrders(fetchedOrders);
      setNewsletters(fetchedNews);
      setWaitlist(fetchedWaitlist);
    } catch (err: any) {
      console.error("AdminDashboard load error:", err);
      setError(err?.message || "Could not fetch data from Firestore. Check your Firestore Security Rules.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedSampleData();
      alert(`🌱 Successfully added ${res.orders} sample subscribers and ${res.newsletter} newsletter members to Cloud Firestore!`);
      await loadData();
    } catch (err: any) {
      alert("Error seeding data: " + err.message + "\n\nMake sure your Firestore rules allow create/read!");
    } finally {
      setSeeding(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStatusChange = async (
    orderId: string, 
    newStatus: "Active" | "Renewed" | "Cancelled" | "Processing" | "Dispatched" | "Delivered"
  ) => {
    setUpdatingId(orderId);
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert("Could not update status. Please check your Firestore rules.");
      }
    } catch (err: any) {
      alert("Error updating order: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper to determine if a record was created in the current calendar month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthName = now.toLocaleString("default", { month: "long" });

  const isCurrentMonth = (dateStr?: string, timestamp?: any): boolean => {
    if (!dateStr && !timestamp) return true;
    try {
      const d = dateStr ? new Date(dateStr) : timestamp?.toDate ? timestamp.toDate() : new Date();
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } catch {
      return false;
    }
  };

  // Metric Calculations
  const subscribersThisMonth = orders.filter(o => o.status !== "Cancelled" && isCurrentMonth(o.createdDate, o.createdAt)).length;
  const totalActiveSubscribers = orders.filter(o => o.status === "Active" || o.status === "Renewed" || o.status === "Submitted" || o.status === "Processing" || o.status === "Dispatched" || o.status === "Delivered").length;
  const dispatchedCount = orders.filter(o => o.status === "Dispatched" || o.status === "Delivered").length;
  const droppedSubscribers = orders.filter(o => o.status === "Cancelled").length;
  const newsletterThisMonth = newsletters.filter(n => isCurrentMonth(n.createdDate, n.createdAt)).length;
  const totalNewsletter = newsletters.length;
  const totalWaitlist = waitlist.length;
  const indiaWaitlist = waitlist.filter(w => w.destination !== "International").length;
  const intlWaitlist = waitlist.filter(w => w.destination === "International").length;

  // Filtered lists for search
  const filteredWaitlist = waitlist.filter(w =>
    w.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.cityCountry || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.preferredPlan || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    (o.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.recipientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.orderNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.trackingNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.shipping_address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.plan_tier || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNewsletters = newsletters.filter(n =>
    n.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export CSV Helpers
  const exportOrdersCsv = () => {
    if (orders.length === 0) {
      alert("No subscriber orders to export yet.");
      return;
    }
    const headers = ["Order #", "Tracking #", "Recipient", "Email", "Status", "Total", "Destination", "Plan / Items", "Shipping Address", "Gateway", "Date"];
    const rows = orders.map(o => [
      `"${o.orderNumber || 'N/A'}"`,
      `"${o.trackingNumber || 'N/A'}"`,
      `"${(o.recipientName || '').replace(/"/g, '""')}"`,
      `"${o.email}"`,
      `"${o.status}"`,
      `"${o.totalFormatted || ''}"`,
      `"${o.destination || 'India'}"`,
      `"${(o.items && o.items.length > 0 ? o.items.map(i => `${i.name} (x${i.quantity})`).join("; ") : o.plan_tier).replace(/"/g, '""')}"`,
      `"${(o.shipping_address || '').replace(/"/g, '""')}"`,
      `"${o.gateway || 'Standard'}"`,
      `"${o.createdDate || 'N/A'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kokoro_orders_${currentMonthName}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportNewsletterCsv = () => {
    if (newsletters.length === 0) {
      alert("No newsletter subscribers to export yet.");
      return;
    }
    const headers = ["Name", "Email", "Date"];
    const rows = newsletters.map(n => [
      `"${n.name.replace(/"/g, '""')}"`,
      `"${n.email}"`,
      `"${n.createdDate || 'N/A'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kokoro_newsletter_${currentMonthName}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWaitlistCsv = () => {
    if (waitlist.length === 0) {
      alert("No Founding Waitlist entries to export yet.");
      return;
    }
    const headers = ["Name", "Email", "Region", "Preferred Plan", "Shipping Method", "City / Country", "Saved Items", "Source", "Date"];
    const rows = waitlist.map(w => [
      `"${(w.name || "Traveler").replace(/"/g, '""')}"`,
      `"${w.email}"`,
      `"${w.destination || "India"}"`,
      `"${(w.preferredPlan || "").replace(/"/g, '""')}"`,
      `"${(w.shippingMethod || "").replace(/"/g, '""')}"`,
      `"${(w.cityCountry || "").replace(/"/g, '""')}"`,
      `"${(w.interestedItems && w.interestedItems.length > 0 ? w.interestedItems.map(i => `${i.name} (x${i.quantity})`).join("; ") : "").replace(/"/g, '""')}"`,
      `"${w.source || "waitlist"}"`,
      `"${w.createdDate || "N/A"}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kokoro_waitlist_${currentMonthName}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-ghibli-green-light shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold tracking-wide border border-emerald-200 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-700" />
            <span>Admin Sanctuary Ledger</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-ghibli-green-dark">
            Kokoro Letters Operations
          </h2>
          <p className="text-xs text-ghibli-sage mt-1">
            Real-time subscriber tracking, monthly renewals, and newsletter audience for {currentMonthName} {currentYear}.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="Add sample mock subscribers to Firestore to test the dashboard"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{seeding ? "Seeding..." : "🌱 Seed Test Data"}</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-[#f0eadd] hover:bg-[#e4dbcc] text-ghibli-green-dark rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={
              activeTab === "waitlist"
                ? exportWaitlistCsv
                : activeTab === "orders"
                ? exportOrdersCsv
                : exportNewsletterCsv
            }
            className="flex items-center gap-2 px-3.5 py-2 bg-ghibli-green hover:bg-[#86ab9a] text-ghibli-green-dark rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error / Firestore Rules Notification Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Firestore Permission Notice: {error}</span>
          </div>
          <p className="leading-relaxed">
            If you see <em>"Missing or insufficient permissions"</em>, please ensure your Firestore Security Rules allow read access.
            Go to <strong>Firebase Console ➔ Firestore Database ➔ Rules</strong> tab, paste the rules, and click <strong>Publish</strong>.
          </p>
        </div>
      )}

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Founding Waitlist Demand */}
        <div className="bg-white p-5 rounded-2xl border border-ghibli-green-light shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ghibli-sage uppercase tracking-wider">Founding Waitlist</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-ghibli-green-dark font-mono">{totalWaitlist}</span>
              <span className="text-[10px] text-ghibli-sage font-mono">({indiaWaitlist} IN / {intlWaitlist} Intl)</span>
            </div>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">🌿 Batch 01 demand intent</p>
          </div>
        </div>

        {/* Card 2: Newsletter Audience */}
        <div className="bg-white p-5 rounded-2xl border border-ghibli-green-light shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ghibli-sage uppercase tracking-wider">Newsletter Audience</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-ghibli-green-dark font-mono">{totalNewsletter}</span>
              <span className="text-[10px] text-emerald-700 font-mono font-semibold">+{newsletterThisMonth} this mo</span>
            </div>
            <p className="text-[10px] text-blue-700 font-medium mt-0.5">📜 Free teaser scrolls</p>
          </div>
        </div>

        {/* Card 3: Dispatches / In Transit */}
        <div className="bg-white p-5 rounded-2xl border border-ghibli-green-light shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ghibli-sage uppercase tracking-wider">Dispatches & Delivered</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-ghibli-green-dark font-mono">{dispatchedCount}</span>
              <span className="text-[10px] text-purple-700 font-mono font-semibold">orders sent</span>
            </div>
            <p className="text-[10px] text-purple-700 font-medium mt-0.5">📦 Physical postal waybills</p>
          </div>
        </div>

        {/* Card 4: Dropped / Churned */}
        <div className="bg-white p-5 rounded-2xl border border-ghibli-green-light shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shrink-0">
            <UserMinus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ghibli-sage uppercase tracking-wider">Dropped / Cancelled</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-800 font-mono">{droppedSubscribers}</span>
              <span className="text-[10px] text-rose-600 font-mono">paused</span>
            </div>
            <p className="text-[10px] text-rose-600 font-medium mt-0.5">🍂 Churned subscribers</p>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-ghibli-green-light shadow-xs overflow-hidden">
        {/* Navigation Tabs & Search */}
        <div className="p-6 border-b border-ghibli-green-light/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("waitlist")}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all ${
                activeTab === "waitlist"
                  ? "bg-ghibli-green text-ghibli-green-dark shadow-xs"
                  : "bg-white text-ghibli-sage hover:text-ghibli-green-dark border border-stone-200"
              }`}
            >
              Founding Waitlist ({waitlist.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-ghibli-green text-ghibli-green-dark shadow-xs"
                  : "bg-white text-ghibli-sage hover:text-ghibli-green-dark border border-stone-200"
              }`}
            >
              Subscribers & Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("newsletter")}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all ${
                activeTab === "newsletter"
                  ? "bg-ghibli-green text-ghibli-green-dark shadow-xs"
                  : "bg-white text-ghibli-sage hover:text-ghibli-green-dark border border-stone-200"
              }`}
            >
              Newsletter Audience ({newsletters.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-ghibli-green"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-ghibli-sage space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
            <p className="text-xs">Loading live Firestore ledger...</p>
          </div>
        ) : activeTab === "waitlist" ? (
          /* Founding Waitlist Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                  <th className="px-6 py-3.5">Traveler</th>
                  <th className="px-6 py-3.5">Preferred Plan & Items</th>
                  <th className="px-6 py-3.5">Region & Location</th>
                  <th className="px-6 py-3.5">Source</th>
                  <th className="px-6 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredWaitlist.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-800">{w.name || "Traveler"}</div>
                      <div className="text-[11px] text-stone-500">{w.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-700">{w.preferredPlan || "Monthly Passage"}</div>
                      {w.interestedItems && w.interestedItems.length > 0 && (
                        <div className="text-[11px] text-stone-500 mt-0.5 space-y-0.5">
                          {w.interestedItems.map((it, i) => (
                            <div key={i}>• {it.name} ×{it.quantity} ({it.priceFormatted})</div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        w.destination === "International"
                          ? "bg-sky-50 text-sky-800 border-sky-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {w.destination === "International" ? "🌏 International" : "🇮🇳 India"}
                      </span>
                      {w.shippingMethod && (
                        <div className="text-[11px] font-medium text-emerald-800 mt-1">{w.shippingMethod}</div>
                      )}
                      {w.cityCountry && (
                        <div className="text-[11px] text-stone-500 mt-0.5">{w.cityCountry}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-stone-500">
                      {w.source}
                    </td>
                    <td className="px-6 py-4 text-right text-stone-400 font-mono text-[11px]">
                      {w.createdDate ? new Date(w.createdDate).toLocaleDateString() : "Recent"}
                    </td>
                  </tr>
                ))}
                {filteredWaitlist.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      No waitlist entries found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === "orders" ? (
          /* Orders Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                  <th className="px-6 py-3.5">Order & Traveler</th>
                  <th className="px-6 py-3.5">Items & Plan</th>
                  <th className="px-6 py-3.5">Destination & Shipping</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => {
                  const hasItems = order.items && order.items.length > 0;
                  const exportWaitlistCsv = () => {
    if (waitlist.length === 0) {
      alert("No Founding Waitlist entries to export yet.");
      return;
    }
    const headers = ["Name", "Email", "Region", "Preferred Plan", "Shipping Method", "City / Country", "Saved Items", "Source", "Date"];
    const rows = waitlist.map(w => [
      `"${(w.name || "Traveler").replace(/"/g, '""')}"`,
      `"${w.email}"`,
      `"${w.destination || "India"}"`,
      `"${(w.preferredPlan || "").replace(/"/g, '""')}"`,
      `"${(w.shippingMethod || "").replace(/"/g, '""')}"`,
      `"${(w.cityCountry || "").replace(/"/g, '""')}"`,
      `"${(w.interestedItems && w.interestedItems.length > 0 ? w.interestedItems.map(i => `${i.name} (x${i.quantity})`).join("; ") : "").replace(/"/g, '""')}"`,
      `"${w.source || "waitlist"}"`,
      `"${w.createdDate || "N/A"}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kokoro_waitlist_${currentMonthName}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
                    <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {order.orderNumber || `KOK-${order.id.slice(0, 4).toUpperCase()}`}
                          </span>
                        </div>
                        <div className="font-semibold text-stone-800">{order.recipientName || "Traveler"}</div>
                        <div className="text-[11px] text-stone-500">{order.email}</div>
                        {order.gateway && (
                          <span className="inline-block text-[10px] text-stone-400 font-mono mt-0.5">via {order.gateway}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {hasItems ? (
                          <div className="space-y-1">
                            <span className="font-bold text-stone-800 font-mono text-[11px]">
                              {order.totalFormatted || (order.items && `${order.items.length} items`)}
                            </span>
                            <div className="text-[11px] text-stone-600 max-w-xs space-y-0.5">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-stone-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  <span className="truncate">{item.name}</span>
                                  <span className="text-stone-400 font-mono text-[10px]">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-stone-700">{order.plan_tier || "India"} Plan</span>
                            {order.totalFormatted && (
                              <span className="block text-[11px] font-mono text-emerald-700 font-bold mt-0.5">{order.totalFormatted}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            order.destination === 'International' 
                              ? "bg-sky-50 text-sky-800 border-sky-200" 
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            {order.destination === 'International' ? '✈️ Tokyo Airmail' : '📮 India Speed-Post'}
                          </span>
                        </div>
                        {order.trackingNumber && (
                          <div className="font-mono text-[10px] text-stone-500 mb-1">
                            Tracking: <span className="font-bold text-stone-700">{order.trackingNumber}</span>
                          </div>
                        )}
                        <p className="text-[11px] text-stone-500 line-clamp-2" title={order.shipping_address}>
                          {order.shipping_address || "No address provided"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          order.status === "Delivered" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          order.status === "Dispatched" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                          order.status === "Processing" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                          order.status === "Renewed" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          order.status === "Active" || order.status === "Submitted" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                          "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}>
                          {order.status === "Delivered" && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {order.status === "Dispatched" && <Truck className="w-2.5 h-2.5" />}
                          {order.status === "Processing" && <Package className="w-2.5 h-2.5" />}
                          {order.status === "Renewed" && <RefreshCw className="w-2.5 h-2.5" />}
                          {order.status === "Active" && <Check className="w-2.5 h-2.5" />}
                          {order.status === "Cancelled" && <AlertCircle className="w-2.5 h-2.5" />}
                          <span>{order.status || "Active"}</span>
                        </span>
                        {order.cancellation_reason && (
                          <span className="block text-[10px] text-rose-700 font-mono mt-1 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-100 max-w-fit">
                            Reason: {order.cancellation_reason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-stone-400 font-mono text-[11px]">
                        {order.createdDate ? new Date(order.createdDate).toLocaleDateString() : "Recent"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          <button
                            onClick={() => handleStatusChange(order.id, "Processing")}
                            disabled={updatingId === order.id}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
                              order.status === "Processing" 
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs" 
                                : "bg-white text-stone-600 hover:text-stone-900 border-stone-200"
                            }`}
                            title="Mark Processing"
                          >
                            Pack
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, "Dispatched")}
                            disabled={updatingId === order.id}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
                              order.status === "Dispatched" 
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs" 
                                : "bg-white text-purple-700 hover:bg-purple-50 border-purple-200"
                            }`}
                            title="Mark Dispatched with Waybill"
                          >
                            Dispatch
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, "Delivered")}
                            disabled={updatingId === order.id}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
                              order.status === "Delivered" 
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                                : "bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            }`}
                            title="Mark Delivered"
                          >
                            Deliver
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, "Cancelled")}
                            disabled={updatingId === order.id}
                            className={`px-1.5 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
                              order.status === "Cancelled" 
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs" 
                                : "bg-white text-rose-600 hover:bg-rose-50 border-rose-200"
                            }`}
                            title="Cancel Order"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      No subscriber orders found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Newsletter Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                  <th className="px-6 py-3.5">Traveler Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Signup Date</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredNewsletters.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-800">{item.name || "Traveler"}</td>
                    <td className="px-6 py-4 text-stone-600">{item.email}</td>
                    <td className="px-6 py-4 text-stone-400 font-mono text-[11px]">
                      {item.createdDate ? new Date(item.createdDate).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                        Subscribed
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredNewsletters.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-stone-400">
                      No newsletter members found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
