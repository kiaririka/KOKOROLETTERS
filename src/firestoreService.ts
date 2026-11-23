import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  collection, 
  serverTimestamp 
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBTlvRy95FWFAMGTGRznoFDsXphZ0sfEUI",
  authDomain: "kokoro-letters.firebaseapp.com",
  projectId: "kokoro-letters",
  storageBucket: "kokoro-letters.firebasestorage.app",
  messagingSenderId: "786255013135",
  appId: "1:786255013135:web:a1e535b558319a9e1fca7a",
  measurementId: "G-QJDXYCW5CK"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

/**
 * Normalizes an email address to lowercase and trimmed.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks if a given email is already subscribed in the 'newsletter' collection.
 */
export async function isEmailInNewsletter(email: string): Promise<boolean> {
  try {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes("@")) return false;
    const docRef = doc(db, "newsletter", cleanEmail);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (err) {
    console.warn("Firestore: Error checking newsletter status:", err);
    return false;
  }
}

/**
 * Saves a subscriber to the 'newsletter' collection in Cloud Firestore.
 * Uses the email as document ID to guarantee uniqueness.
 * Returns: 'success' | 'already-signed-up' | 'error'
 */
export async function saveNewsletter(
  name: string,
  email: string
): Promise<"success" | "already-signed-up" | "error"> {
  try {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return "error";
    }

    const docRef = doc(db, "newsletter", cleanEmail);

    // 1. Check if the user is already signed up
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return "already-signed-up";
      }
    } catch (checkErr: any) {
      console.warn("Firestore getDoc check:", checkErr);
    }

    // 2. Create the document with email as key
    await setDoc(docRef, {
      name: name.trim() || "Traveler",
      email: cleanEmail,
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString()
    });

    return "success";
  } catch (err: any) {
    // If the document already exists and rules block update, treat as duplicate
    if (err?.code === "permission-denied" || err?.code === "already-exists") {
      return "already-signed-up";
    }
    console.warn("Firestore: Error saving newsletter:", err);
    return "error";
  }
}

/**
 * Saves an email to the 'waitlist' collection.
 */
export async function saveWaitlist(
  email: string,
  source: string = "waitlist"
): Promise<"success" | "already-signed-up" | "error"> {
  try {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return "error";
    }

    const docRef = doc(db, "waitlist", cleanEmail);

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return "already-signed-up";
      }
    } catch (e) {
      // ignore
    }

    await setDoc(docRef, {
      email: cleanEmail,
      source,
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString()
    });

    return "success";
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.code === "already-exists") {
      return "already-signed-up";
    }
    console.warn("Firestore: Error saving waitlist:", err);
    return "error";
  }
}

/**
 * Calculates deadline for next month's payment:
 * In Kokoro Letters, cutoff is 30 days from creation/renewal.
 */
export function getNextPaymentDeadline(startDate?: Date): string {
  const d = startDate ? new Date(startDate) : new Date();
  const deadline = new Date(d);
  deadline.setDate(deadline.getDate() + 30);
  return deadline.toISOString();
}

/**
 * Saves an order or subscription interest to the 'orders' collection in Cloud Firestore.
 */
export async function saveOrder(orderData: {
  email: string;
  shipping_address: string;
  plan_tier: string;
  destination?: 'India' | 'International';
  gateway?: string;
  payment_deadline?: string;
}): Promise<boolean> {
  try {
    const cleanEmail = normalizeEmail(orderData.email);
    const deadline = orderData.payment_deadline || getNextPaymentDeadline();
    await addDoc(collection(db, "orders"), {
      email: cleanEmail,
      shipping_address: orderData.shipping_address.trim(),
      plan_tier: orderData.plan_tier,
      destination: orderData.destination || (orderData.plan_tier.toLowerCase().includes("international") ? "International" : "India"),
      gateway: orderData.gateway || "preview",
      status: "Active",
      payment_deadline: deadline,
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn("Firestore: Error saving order:", err);
    return false;
  }
}

export interface OrderRecord {
  id: string;
  email: string;
  shipping_address: string;
  plan_tier: string;
  destination?: 'India' | 'International';
  gateway?: string;
  status: "Active" | "Renewed" | "Cancelled" | "Paused" | "Submitted";
  cancellation_reason?: string;
  payment_deadline?: string;
  next_billing_date?: string;
  createdDate?: string;
  createdAt?: any;
  updatedDate?: string;
  updatedAt?: any;
}

export interface NewsletterRecord {
  id: string;
  email: string;
  name: string;
  createdDate?: string;
  createdAt?: any;
}

/**
 * Fetches all orders from Firestore.
 */
export async function getAllOrders(): Promise<OrderRecord[]> {
  const snap = await getDocs(collection(db, "orders"));
  const records: OrderRecord[] = [];
  snap.forEach((d) => {
    const data = d.data();
    records.push({
      id: d.id,
      email: data.email || "",
      shipping_address: data.shipping_address || "",
      plan_tier: data.plan_tier || "Standard (India)",
      destination: data.destination || (String(data.plan_tier || "").toLowerCase().includes("international") ? "International" : "India"),
      gateway: data.gateway || "Standard",
      status: (data.status as any) || "Active",
      cancellation_reason: data.cancellation_reason || "",
      payment_deadline: data.payment_deadline || "",
      next_billing_date: data.next_billing_date || "",
      createdDate: data.createdDate || "",
      createdAt: data.createdAt,
      updatedDate: data.updatedDate || ""
    });
  });
  return records;
}

/**
 * Fetches all newsletter members from Firestore.
 */
export async function getAllNewsletter(): Promise<NewsletterRecord[]> {
  const snap = await getDocs(collection(db, "newsletter"));
  const records: NewsletterRecord[] = [];
  snap.forEach((d) => {
    const data = d.data();
    records.push({
      id: d.id,
      email: data.email || d.id,
      name: data.name || "Traveler",
      createdDate: data.createdDate || "",
      createdAt: data.createdAt
    });
  });
  return records;
}

/**
 * Updates a subscriber's order status in Firestore (Active, Renewed, Cancelled, Paused).
 */
export async function updateOrderStatus(
  orderId: string, 
  status: "Active" | "Renewed" | "Cancelled" | "Paused",
  cancellation_reason?: string
): Promise<boolean> {
  try {
    const docRef = doc(db, "orders", orderId);
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
      updatedDate: new Date().toISOString()
    };
    if (cancellation_reason !== undefined) {
      updatePayload.cancellation_reason = cancellation_reason;
    }
    await updateDoc(docRef, updatePayload);
    return true;
  } catch (err) {
    console.warn("Firestore: Error updating order status:", err);
    return false;
  }
}

/**
 * Updates a user's plan tier (between Standard and Deluxe) in Cloud Firestore.
 */
export async function updateUserPlan(email: string, newPlanTier: string): Promise<boolean> {
  try {
    const cleanEmail = normalizeEmail(email);
    const orders = await getAllOrders();
    const userOrders = orders.filter(o => normalizeEmail(o.email) === cleanEmail && o.status !== "Cancelled");
    if (userOrders.length > 0) {
      const target = userOrders[0];
      const docRef = doc(db, "orders", target.id);
      await updateDoc(docRef, {
        plan_tier: newPlanTier,
        updatedDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Firestore: Error updating user plan:", err);
    return false;
  }
}

/**
 * Cancels a subscription in Cloud Firestore.
 */
export async function cancelSubscription(email: string, reason: string = "Cancelled by subscriber"): Promise<boolean> {
  try {
    const cleanEmail = normalizeEmail(email);
    const orders = await getAllOrders();
    const userOrders = orders.filter(o => normalizeEmail(o.email) === cleanEmail && o.status !== "Cancelled");
    for (const order of userOrders) {
      const docRef = doc(db, "orders", order.id);
      await updateDoc(docRef, {
        status: "Cancelled",
        cancellation_reason: reason,
        cancelled_at: serverTimestamp(),
        cancelled_date: new Date().toISOString()
      });
    }
    return true;
  } catch (err) {
    console.warn("Firestore: Error cancelling subscription:", err);
    return false;
  }
}

/**
 * Pauses or resumes a subscription in Cloud Firestore.
 */
export async function pauseSubscription(email: string): Promise<{ success: boolean; newStatus: "Paused" | "Active" }> {
  try {
    const cleanEmail = normalizeEmail(email);
    const orders = await getAllOrders();
    const userOrders = orders.filter(o => normalizeEmail(o.email) === cleanEmail && o.status !== "Cancelled");
    if (userOrders.length === 0) return { success: false, newStatus: "Active" };

    const order = userOrders[0];
    const newStatus: "Paused" | "Active" = order.status === "Paused" ? "Active" : "Paused";
    const docRef = doc(db, "orders", order.id);
    await updateDoc(docRef, {
      status: newStatus,
      updatedDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });
    return { success: true, newStatus };
  } catch (err) {
    console.warn("Firestore: Error pausing subscription:", err);
    return { success: false, newStatus: "Active" };
  }
}

/**
 * Updates a subscriber's shipping address in Cloud Firestore.
 */
export async function updateUserAddress(email: string, newAddress: string): Promise<boolean> {
  try {
    const cleanEmail = normalizeEmail(email);
    const orders = await getAllOrders();
    const userOrders = orders.filter(o => normalizeEmail(o.email) === cleanEmail);
    for (const order of userOrders) {
      const docRef = doc(db, "orders", order.id);
      await updateDoc(docRef, {
        shipping_address: newAddress.trim(),
        updatedDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (err) {
    console.warn("Firestore: Error updating user address:", err);
    return false;
  }
}

/**
 * Automatically checks active subscriptions against their payment deadlines.
 * If the deadline has passed without payment for the next month, updates
 * status to 'Cancelled' with reason 'not payed yet'.
 */
export async function checkAndExpireOverdueSubscriptions(userEmail?: string): Promise<{ expiredCount: number; updatedOrders: OrderRecord[] }> {
  try {
    const allOrders = await getAllOrders();
    const now = new Date();
    let expiredCount = 0;
    const updatedOrders: OrderRecord[] = [];

    for (const o of allOrders) {
      if (userEmail && normalizeEmail(o.email) !== normalizeEmail(userEmail)) {
        continue;
      }
      
      // Only check non-cancelled orders
      if (o.status !== "Cancelled" && o.status !== "Paused") {
        let isOverdue = false;
        if (o.payment_deadline) {
          isOverdue = new Date(o.payment_deadline).getTime() < now.getTime();
        } else if (o.createdDate) {
          const created = new Date(o.createdDate);
          const deadline = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
          isOverdue = deadline.getTime() < now.getTime();
        }

        if (isOverdue) {
          try {
            const docRef = doc(db, "orders", o.id);
            await updateDoc(docRef, {
              status: "Cancelled",
              cancellation_reason: "not payed yet",
              updatedDate: new Date().toISOString(),
              updatedAt: serverTimestamp()
            });
            o.status = "Cancelled";
            o.cancellation_reason = "not payed yet";
            expiredCount++;
            updatedOrders.push(o);
          } catch (updateErr) {
            console.warn("Failed to expire overdue subscription:", o.id, updateErr);
          }
        }
      }
    }

    return { expiredCount, updatedOrders };
  } catch (err) {
    console.warn("Firestore: Error checking overdue subscriptions:", err);
    return { expiredCount: 0, updatedOrders: [] };
  }
}

/**
 * Seeds sample subscribers and newsletter members to Cloud Firestore for initial setup.
 */
export async function seedSampleData(): Promise<{ orders: number; newsletter: number }> {
  const sampleOrders = [
    { 
      email: "isha79799@gmail.com", 
      shipping_address: "Flat 402, Lotus Garden, Bangalore 560001", 
      plan_tier: "Deluxe (India)", 
      destination: "India" as const,
      gateway: "Razorpay", 
      status: "Active" as const,
      payment_deadline: getNextPaymentDeadline()
    },
    { 
      email: "kenji.tanaka@tokyo.jp", 
      shipping_address: "3-14-1 Mejiro, Toshima-ku, Tokyo 171-0031", 
      plan_tier: "Deluxe (International)", 
      destination: "International" as const,
      gateway: "PayPal", 
      status: "Renewed" as const,
      payment_deadline: getNextPaymentDeadline()
    },
    { 
      email: "hana.yamamoto@kyoto.jp", 
      shipping_address: "12-4 Gion-machi, Higashiyama-ku, Kyoto 605-0073", 
      plan_tier: "Standard (India)", 
      destination: "India" as const,
      gateway: "Razorpay", 
      status: "Cancelled" as const,
      cancellation_reason: "not payed yet"
    },
    { 
      email: "sophie.hatter@ingary.com", 
      shipping_address: "Market Chipping Hat Shop, Kingsbury", 
      plan_tier: "Standard (International)", 
      destination: "International" as const,
      gateway: "PayPal", 
      status: "Cancelled" as const,
      cancellation_reason: "Cancelled by subscriber"
    }
  ];

  const sampleNews = [
    { name: "Isha", email: "isha79799@gmail.com" },
    { name: "Chihiro Ogino", email: "chihiro@spiritrealm.jp" },
    { name: "Satsuki Kusakabe", email: "satsuki@totoroforest.jp" },
  ];

  for (const o of sampleOrders) {
    await addDoc(collection(db, "orders"), {
      ...o,
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString()
    });
  }

  for (const n of sampleNews) {
    const docRef = doc(db, "newsletter", n.email);
    await setDoc(docRef, {
      ...n,
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString()
    });
  }

  return { orders: sampleOrders.length, newsletter: sampleNews.length };
}
