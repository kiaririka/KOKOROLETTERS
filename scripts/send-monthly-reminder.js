/**
 * Kokoro Letters - Automated Monthly Dispatch & Reminder Script
 * 
 * Runs automatically on the 25th of every month via GitHub Actions.
 * 1. Connects to Cloud Firestore (kokoro-letters).
 * 2. Authenticates as admin (if ADMIN_EMAIL & ADMIN_PASSWORD provided).
 * 3. Fetches all subscriber & newsletter emails securely.
 * 4. Identifies the upcoming month's region & lore.
 * 5. Dispatches a Ghibli-themed reminder invitation via Resend API.
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Firebase web client config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBTlvRy95FWFAMGTGRznoFDsXphZ0sfEUI",
  authDomain: "kokoro-letters.firebaseapp.com",
  projectId: "kokoro-letters",
  storageBucket: "kokoro-letters.firebasestorage.app",
  messagingSenderId: "786255013135",
  appId: "1:786255013135:web:a1e535b558319a9e1fca7a"
};

// 12 Regional Calendar
const REGIONS_CALENDAR = [
  { month: 1, id: "hokkaido", name: "Hokkaido", season: "Winter Frost & White Birch", anime: "Golden Kamuy & Classic Snow Realms" },
  { month: 2, id: "tohoku", name: "Tohoku", season: "Ancient Forests & Mountain Ascetics", anime: "Princess Mononoke inspiration" },
  { month: 3, id: "shinshu", name: "Shinshu (Alps)", season: "Snow Monkeys & Clear Alps", anime: "The Wind Rises inspiration" },
  { month: 4, id: "kanto", name: "Sayama Hills (Kanto)", season: "Spring Tea Fields & Rural Farmlands", anime: "My Neighbor Totoro" },
  { month: 5, id: "chubu", name: "Chubu (Fuji)", season: "Mount Fuji & Shirakawa-go", anime: "Hyouka & Classic Countryside" },
  { month: 6, id: "iseshima", name: "Ise-Shima", season: "Sacred Shrines & Pearl Waters", anime: "Spirited Away waters" },
  { month: 7, id: "kansai", name: "Kansai (Kyoto & Tomo)", season: "Bamboo Groves & Port of Tomonoura", anime: "Ponyo on the Cliff by the Sea" },
  { month: 8, id: "chugoku", name: "Chugoku (Miyajima)", season: "Floating Torii & Dynamic Tottori Dunes", anime: "Whisper of the Heart inspiration" },
  { month: 9, id: "seto", name: "Seto Inland Sea", season: "Island Ferries & Lemon Groves", anime: "Kiki's Delivery Service coastline" },
  { month: 10, id: "shikoku", name: "Shikoku", season: "Vine Bridges & 88 Temple Pilgrimage", anime: "Pom Poko forest trails" },
  { month: 11, id: "kyushu", name: "Kyushu (Yakushima)", season: "Ancient Moss Forests & Cedar Roots", anime: "Princess Mononoke ancient woods" },
  { month: 12, id: "okinawa", name: "Okinawa", season: "Coral Sands & Melodic Sanshin", anime: "Ocean Waves & Emerald Shores" }
];

async function run() {
  console.log("🍃 Kokoro Letters: Starting monthly reminder task...");

  // Determine next month (1-12)
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextRegion = REGIONS_CALENDAR.find(r => r.month === nextMonth) || REGIONS_CALENDAR[0];

  console.log(`📅 Current Month: ${currentMonth} -> Upcoming Month: ${nextMonth} (${nextRegion.name})`);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Authenticate as Admin if credentials provided
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log(`🔐 Successfully authenticated as Admin (${adminEmail})`);
    } catch (authErr) {
      console.warn("⚠️ Admin login failed, attempting unauthenticated read:", authErr.message);
    }
  }

  // Fetch unique emails from orders and newsletter collections
  const emails = new Set();

  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    ordersSnap.forEach(doc => {
      const email = doc.data()?.email;
      if (email && email.includes("@")) emails.add(email.trim().toLowerCase());
    });
    console.log(`📦 Fetched unique emails from orders.`);
  } catch (err) {
    console.warn("Could not read orders collection (check rules):", err.message);
  }

  try {
    const newsSnap = await getDocs(collection(db, "newsletter"));
    newsSnap.forEach(doc => {
      const email = doc.data()?.email;
      if (email && email.includes("@")) emails.add(email.trim().toLowerCase());
    });
    console.log(`📜 Total unique recipients (including newsletter): ${emails.size}`);
  } catch (err) {
    console.warn("Could not read newsletter collection (check rules):", err.message);
  }

  const recipientList = Array.from(emails);

  if (recipientList.length === 0) {
    console.log("No recipients found in database yet. Exiting cleanly.");
    return;
  }

  console.log(`📨 Found ${recipientList.length} recipient(s).`);

  const websiteUrl = "https://kiaririka.github.io/KOKOROLETTERS/";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log("ℹ️ RESEND_API_KEY is not set in repository secrets.");
    console.log("Recipients queued for this reminder:");
    recipientList.forEach(e => console.log(`  - ${e}`));
    console.log("Add RESEND_API_KEY to your GitHub Repo Secrets to enable live automated delivery.");
    return;
  }

  // HTML Email Template
  const emailHtml = `
    <div style="background-color: #faf8f5; padding: 40px 20px; font-family: 'Georgia', serif; color: #2d3831;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e8e3d8; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="background-color: #86ab9a; padding: 32px 24px; text-align: center; color: #ffffff;">
          <span style="font-size: 28px;">心</span>
          <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: normal; letter-spacing: 1px;">Kokoro Letters</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Whispers from the Meadow &bull; Monthly Dispatch</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="font-size: 20px; color: #1e3a28; margin-top: 0;">
            Next Month's Region is Approaching: ${nextRegion.name} 🍃
          </h2>
          <p style="font-size: 14px; line-height: 1.7; color: #4a5c50;">
            Dearest Traveler,<br><br>
            As the current season turns, our paper artisans are preparing the next monthly dispatch. 
            Next month, our journey travels into <strong>${nextRegion.name}</strong> (${nextRegion.season}).
          </p>
          <div style="background-color: #f5f2ea; border-left: 4px solid #86ab9a; padding: 14px 18px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #2d3831;">
              <strong>Art & Lore Preview:</strong> Inspired by <em>${nextRegion.anime}</em>.<br>
              Each handcrafted envelope includes an exclusive regional art print, collectible stickers for your physical Japan map, and the creator's handwritten lore letter.
            </p>
          </div>
          <p style="font-size: 14px; line-height: 1.7; color: #4a5c50;">
            Sign-ups and batch printing for <strong>${nextRegion.name}</strong> are opening soon. Reserve your kit before the batch closes so your mailbox doesn't miss this month's spirit dispatch!
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${websiteUrl}" style="background-color: #2b4436; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: bold; display: inline-block;">
              Reserve Next Month's Kit &rarr;
            </a>
          </div>
          <p style="font-size: 12px; line-height: 1.6; color: #88998d; text-align: center; margin-bottom: 0;">
            With warmth from the studio,<br>
            <strong>The Kokoro Letters Team</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  // Dispatch emails via Resend
  for (const recipient of recipientList) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Kokoro Letters <onboarding@resend.dev>",
          to: recipient,
          subject: `🍃 Next Month's Journey: ${nextRegion.name} awaits!`,
          html: emailHtml
        })
      });

      if (response.ok) {
        console.log(`✅ Dispatched reminder to ${recipient}`);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Failed to send to ${recipient}:`, errorText);
      }
    } catch (sendErr) {
      console.error(`❌ Network error sending to ${recipient}:`, sendErr.message);
    }
  }

  console.log("✨ Monthly reminder job completed!");
}

run().catch(console.error);
