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
 * Saves an order or subscription interest to the 'orders' collection in Cloud Firestore.
 */
export async function saveOrder(orderData: {
  email: string;
  shipping_address: string;
  plan_tier: string;
  gateway?: string;
}): Promise<boolean> {
  try {
    const cleanEmail = normalizeEmail(orderData.email);
    await addDoc(collection(db, "orders"), {
      email: cleanEmail,
      shipping_address: orderData.shipping_address.trim(),
      plan_tier: orderData.plan_tier,
      gateway: orderData.gateway || "preview",
      status: "Submitted",
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
  gateway?: string;
  status: "Active" | "Renewed" | "Cancelled" | "Submitted";
  createdDate?: string;
  createdAt?: any;
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
      plan_tier: data.plan_tier || "India",
      gateway: data.gateway || "Standard",
      status: (data.status as any) || "Active",
      createdDate: data.createdDate || "",
      createdAt: data.createdAt
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
 * Updates a subscriber's order status in Firestore (Active, Renewed, Cancelled).
 */
export async function updateOrderStatus(
  orderId: string, 
  status: "Active" | "Renewed" | "Cancelled"
): Promise<boolean> {
  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
      updatedDate: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn("Firestore: Error updating order status:", err);
    return false;
  }
}

/**
 * Seeds sample subscribers and newsletter members to Cloud Firestore for initial setup.
 */
export async function seedSampleData(): Promise<{ orders: number; newsletter: number }> {
  const sampleOrders = [
    { email: "isha79799@gmail.com", shipping_address: "Flat 402, Lotus Garden, Bangalore 560001", plan_tier: "India", gateway: "Razorpay", status: "Active" as const },
    { email: "kenji.tanaka@tokyo.jp", shipping_address: "3-14-1 Mejiro, Toshima-ku, Tokyo 171-0031", plan_tier: "International", gateway: "PayPal", status: "Renewed" as const },
    { email: "hana.yamamoto@kyoto.jp", shipping_address: "12-4 Gion-machi, Higashiyama-ku, Kyoto 605-0073", plan_tier: "India", gateway: "Razorpay", status: "Cancelled" as const },
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
