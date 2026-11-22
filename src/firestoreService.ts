import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

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
