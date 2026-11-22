import React, { useState, useEffect } from "react";
import { Users, FileText, CheckCircle, Database } from "lucide-react";
import { Subscriber } from "../types.ts";

export default function AdminDashboard() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [subsRes, hooksRes] = await Promise.all([
        fetch("/api/admin/subscribers"),
        fetch("/api/debug/webhooks")
      ]);
      const subsData = await subsRes.json();
      const hooksData = await hooksRes.json();

      if (subsData.success) setSubscribers(subsData.subscribers);
      if (hooksData.success) setWebhooks(hooksData.webhooks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdate = async (email: string, months: number) => {
    try {
      const res = await fetch("/api/admin/subscribers/backdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, months })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully simulated ${months} month(s) of history for ${email}! Saved in Firestore, unlocked regions synced.`);
        fetchAdminData();
      } else {
        alert(data.error || "Failed to backdate subscriber.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const activeSubscribers = subscribers.filter(s => s.subscription_status === "Active");
  
  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-ghibli-green-dark">Admin Dashboard</h2>
        <p className="text-ghibli-sage mt-2">Manage subscribers, monitor payments, and audit webhooks.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-ghibli-sage">
          Loading admin data...
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-ghibli-green-light shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-stone-500 font-medium">Active Subscribers</p>
                <p className="text-2xl font-bold text-stone-800">{activeSubscribers.length}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-ghibli-green-light shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-stone-500 font-medium">Total Webhook Events</p>
                <p className="text-2xl font-bold text-stone-800">{webhooks.length}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-ghibli-green-light shadow-sm flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                 onClick={() => {
                   const addresses = activeSubscribers.map(s => `${s.email} - ${s.plan_tier} - ${s.shipping_address}`).join("\n");
                   alert("Addresses (Ready for Export):\n\n" + addresses);
                 }}>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-stone-500 font-medium">Export Fulfillment List</p>
                <p className="text-xs text-amber-600 font-bold mt-1">Click to View</p>
              </div>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-ghibli-green-light shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-ghibli-green-light bg-stone-50 flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-800">Subscribers ({subscribers.length})</h3>
            </div>
            <div className="overflow-x-auto p-0 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/50 text-xs text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium">Address</th>
                    <th className="px-6 py-3 font-medium">History Sim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {subscribers.map((sub, i) => (
                    <tr key={i} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-stone-800">{sub.email}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sub.subscription_status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
                        }`}>
                          {sub.subscription_status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-stone-600">{sub.plan_tier}</td>
                      <td className="px-6 py-3 text-stone-500 max-w-xs truncate" title={sub.shipping_address}>
                        {sub.shipping_address}
                      </td>
                      <td className="px-6 py-3">
                        {sub.subscription_status === "Active" ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleBackdate(sub.email, 1)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] rounded font-medium transition-colors"
                              title="Set subscription age to 1 month (Unlocks Hokkaido)"
                            >
                              1m
                            </button>
                            <button
                              onClick={() => handleBackdate(sub.email, 3)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] rounded font-medium transition-colors font-semibold"
                              title="Set subscription age to 3 months (Unlocks Hokkaido, Tohoku, Shinshu)"
                            >
                              3m
                            </button>
                            <button
                              onClick={() => handleBackdate(sub.email, 6)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] rounded font-medium transition-colors font-semibold"
                              title="Set subscription age to 6 months (Unlocks first 6 regions)"
                            >
                              6m
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-stone-400">
                        No subscribers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Webhook Audit Log */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-ghibli-green-light shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-ghibli-green-light bg-stone-50 flex items-center gap-2">
              <Database className="w-4 h-4 text-stone-500" />
              <h3 className="font-serif font-bold text-stone-800">Webhook Audit Log</h3>
            </div>
            <div className="p-4 overflow-y-auto max-h-[500px] flex-1 space-y-3">
              {webhooks.map((log, i) => (
                <div key={i} className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-stone-600">
                      {log.event || log.body?.event || "UNKNOWN_EVENT"}
                    </span>
                    <span className="text-stone-400 font-mono text-[10px]">
                      {new Date(log.timestamp || log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-stone-500 break-all mb-1">
                    Email: <span className="font-medium">{log.email || log.body?.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-200">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      (log.status || "").includes("SUCCESS") ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {log.status || "UNKNOWN"}
                    </span>
                    <span className="text-stone-400 text-[10px]">
                      {log.payment_gateway || log.body?.payment_gateway || "Gateway"}
                    </span>
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && (
                <div className="text-center p-6 text-stone-400 text-sm">
                  No webhook events recorded.
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
