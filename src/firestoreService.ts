import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
 * Saves an email to the 'waitlist' collection in Cloud Firestore.
 */
export async function saveWaitlist(email: string, source: string = "waitlist"): Promise<boolean> {
  try {
    await addDoc(collection(db, "waitlist"), {
      email: email.trim().toLowerCase(),
      source,
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn("Firestore: Error saving waitlist:", err);
    return false;
  }
}

/**
 * Saves a subscriber to the 'newsletter' collection in Cloud Firestore.
 */
export async function saveNewsletter(name: string, email: string): Promise<boolean> {
  try {
    await addDoc(collection(db, "newsletter"), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn("Firestore: Error saving newsletter:", err);
    return false;
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
    await addDoc(collection(db, "orders"), {
      email: orderData.email.trim().toLowerCase(),
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
