/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc,
  Timestamp 
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Region, Subscriber, SubscriptionStatus, PlanTier } from "../src/types.js";

// Load Firebase Config
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (!fs.existsSync(configPath)) {
  throw new Error("firebase-applet-config.json not found! Please run set_up_firebase tool first.");
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID if available
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

// Seed Data for Japan's 12 Regions
export const SEED_REGIONS: Region[] = [
  {
    region_id: "hokkaido",
    region_name: "Hokkaido",
    lore_content: "Dearest Traveler,\n\nI write to you from the quiet northern frontier of Hokkaido, where the earth sleeps beneath a heavy mantle of snow. In the silent birch forests, only the soft crunch of the red-crowned crane’s step breaks the stillness. Here, winter is not a mere season, but a deep spiritual pause. At night, as you submerge into the volcanic warmth of an outdoor onsen, the freezing wind carries the faint scent of sulfur and wild pine, and the starry skies seem close enough to touch.\n\nIn the summer, this frozen canvas transforms. The rolling lavender fields of Furano wash the valleys in violet, and the cool mountain air brings the crisp scent of earth reborn. Hokkaido teaches us the beauty of extremes—how the harshest cold prepares the soil for the sweetest bloom.\n\nMay your heart find its quiet sanctuary,\nKokoro of the North",
    assets_url: "https://images.unsplash.com/photo-1542640244-7e672d6cef21?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "tohoku",
    region_name: "Tohoku",
    lore_content: "Dearest Traveler,\n\nTohoku is a region where the past is not remembered, but felt. Walking along the ancient cedar paths of Dewa Sanzan, beneath trees that have stood for a thousand years, one feels the persistent, moss-covered breath of history. This is the land of spirits, mountain ascetics (Yamabushi), and hidden waterfalls.\n\nIn the spring, the cherry blossoms of Hirosaki Castle drape over the ancient stone walls like heavy silk, their petals falling into the emerald moats below. And in the dark of August, the giant lantern floats of the Nebuta Festival pierce the night, carrying the roaring courage of warriors into the summer breeze. Tohoku reminds us that our roots must run deep to withstand the storms of life.\n\nWith enduring warmth,\nKokoro of Tohoku",
    assets_url: "https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "kanto",
    region_name: "Kanto",
    lore_content: "Dearest Traveler,\n\nHere in Kanto, the future rushes forward with a blinding pulse of neon, yet it always bends its knee to the ancient. Stand at the heart of Shibuya, where thousands of paths cross in a beautiful, silent choreography. Then, walk just ten minutes into the dense cedar forest of Meiji Jingu shrine, and the roar of the metropolis evaporates into the rustle of leaves.\n\nTo the south, the historic temples of Kamakura sit quietly beside the crashing grey waves of the Pacific, and the sacred mist rises over the ornate shrines of Nikko in the northern mountains. Kanto is the delicate dance of stillness within motion. It reminds us that no matter how fast our lives move, we can always find a quiet center.\n\nIn perfect balance,\nKokoro of Kanto",
    assets_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "chubu",
    region_name: "Chubu",
    lore_content: "Dearest Traveler,\n\nChubu is the rooftop of our nation, a mountain fortress dominated by the timeless, snow-capped presence of Mount Fuji. In the cold mornings, the sun rises over the five lakes, painting Fuji’s perfect cone in soft shades of rose and gold. It is a sight that has quieted the minds of poets and travelers for millennia.\n\nDeep within the mountain creases, the steep-roofed wooden houses of Shirakawa-go look like hands folded in prayer, built to survive winters of incredible snow. Along the old Nakasendo path, the post towns of Tsumago and Magome preserve the cobblestones walked by samurai. Chubu teaches us the nobility of endurance, and the peace of looking upward.\n\nWith towering peace,\nKokoro of Chubu",
    assets_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "kansai",
    region_name: "Kansai",
    lore_content: "Dearest Traveler,\n\nWelcome to Kansai, the spiritual beating heart of Japan. Walk through the silent bamboo groves of Arashiyama in Kyoto, where the tall green stalks filter the sunlight into a golden emerald haze. Here, in the ancient capital, the sliding screens of zen temples open to raked rock gardens, inviting you to contemplate the beauty of empty space.\n\nJust a short train ride away, the sacred deer of Nara bow gently to pass buyers, guardians of temples older than the nation itself. And in Osaka, the night erupts in neon light, steaming takoyaki, and the boisterous laughter of a city that lives to eat and celebrate. Kansai shows us that life is both a sacred prayer and a joyful feast.\n\nWith deep devotion,\nKokoro of Kansai",
    assets_url: "https://images.unsplash.com/photo-1490761668535-3149d38a42c5?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "chugoku",
    region_name: "Chugoku",
    lore_content: "Dearest Traveler,\n\nI write to you from Chugoku, a land carved by calm seas and silent winds. Here, on the island of Miyajima, the great red Torii gate stands tall in the ocean water. When the tide rises, the gate appears to float, suspended between the blue sea and the green mountains, a bridge between our world and the divine.\n\nIn Hiroshima, the silent paper cranes piled high at the Peace Memorial whisper of hope, resilience, and the gentle strength of peace. Further north, the giant sand dunes of Tottori meet the roaring Sea of Japan, dynamic and ever-shifting. Chugoku reminds us that even when the tides of life are high, we must remain standing, beautiful and at peace.\n\nIn quiet contemplation,\nKokoro of Chugoku",
    assets_url: "https://images.unsplash.com/photo-1610375229632-c7158c35a537?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "shikoku",
    region_name: "Shikoku",
    lore_content: "Dearest Traveler,\n\nShikoku is the island of the long road, where the dust of the path is a sacred blessing. For over twelve centuries, pilgrims dressed in white have walked the 1,200-kilometer road connecting eighty-eight holy temples. To walk Shikoku is to learn that the destination is merely an excuse for the journey itself.\n\nAway from the pilgrimage paths, the ancient hot waters of Dogo Onsen steam under wooden eaves, healing the tired bones of kings and commoners alike. And the Iya Valley hides rope bridges woven from living vines over rushing turquoise rivers. Shikoku teaches us that our paths may be long and winding, but every step is a home.\n\nWith every step of the journey,\nKokoro of Shikoku",
    assets_url: "https://images.unsplash.com/photo-1504109586057-7a2fe7da5093?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "kyushu",
    region_name: "Kyushu",
    lore_content: "Dearest Traveler,\n\nKyushu is a land born of fire, hot springs, and oceanic trade. Here, the active crater of Mount Aso smokes gently against a green caldera of breathtaking scale. In Beppu, the earth vents its steaming breath in colorful thermal pools—cobalt blues and blood reds that look like portals to another world.\n\nBut Kyushu’s warmth is not just volcanic; it is in its history of connection. In Nagasaki, the historic sea gate remained slightly open to the outer world during centuries of isolation, blending European, Chinese, and Japanese threads into a vibrant tapestry. Kyushu reminds us that our fires must burn bright, welcoming the stranger to our shore.\n\nWith volcanic passion,\nKokoro of Kyushu",
    assets_url: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "okinawa",
    region_name: "Okinawa",
    lore_content: "Dearest Traveler,\n\nOkinawa is a blue paradise far removed from the rush of the mainland. It is the ancient Ryukyu Kingdom, where the ocean is an emerald green mirror and the white coral sands sing with the waves. Life here flows with the tide—unhurried, peaceful, and long.\n\nUnder the shade of banyan trees, the sweet, melancholy notes of the three-stringed sanshin drift through the ocean breeze, accompanied by the laughter of village elders who have seen over a hundred seasons. Okinawa teaches us the wisdom of the slow life, and the simple joy of breathing in the salty sea air.\n\nWith warm ocean breezes,\nKokoro of Okinawa",
    assets_url: "https://images.unsplash.com/photo-1532413995401-7434727d6a5a?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "shinshu",
    region_name: "Shinshu",
    lore_content: "Dearest Traveler,\n\nShinshu is the land of high mountains, cold pristine rivers, and silent valleys in Nagano. Here, the formidable peaks of the Japanese Alps rise like giant sleeping dragons, their snowy summits touching the clouds. In the cold winter, wild snow monkeys gather in the steaming thermal pools of Jigokudani, their red faces relaxed in the rising mist.\n\nIn the ancient halls of Zenko-ji temple, visitors touch the wooden pillars worn smooth by millions of hands over fourteen centuries, seeking a connection to the eternal. Shinshu reminds us to seek height, to look beyond the valleys of our daily worries, and to keep our inner fires burning even in the deepest winter.\n\nWith mountain clarity,\nKokoro of Shinshu",
    assets_url: "https://images.unsplash.com/photo-1555515605-c5357495d2ad?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "iseshima",
    region_name: "Ise-Shima",
    lore_content: "Dearest Traveler,\n\nIse-Shima is the spiritual cradle of our ancient Shinto faith. Hidden within towering forests of sacred Japanese cryptomeria trees lies the Grand Shrine of Ise. For over two thousand years, this wooden sanctuary has been dismantled and rebuilt every twenty years, a perpetual symbol of renewal and impermanence.\n\nAlong the rugged coastline of the Shima Peninsula, the courageous Ama free-divers plunged into the cold depths without breathing equipment, searching for oysters and pearls. Ise-Shima teaches us the beauty of letting go and starting anew—rebuilding our spirits just as the sacred forest whispers to the sea.\n\nWith sacred light,\nKokoro of Ise-Shima",
    assets_url: "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=800&q=80"
  },
  {
    region_id: "seto",
    region_name: "Seto Inland Sea",
    lore_content: "Dearest Traveler,\n\nThe Seto Inland Sea is a tranquil, maze-like sanctuary of quiet blue waters and sleepy green islands. Here, the sea channels are so calm they resemble a giant lake, mirroring the warm, gentle sun. In recent decades, these sleepy fishing villages have transformed into a world-famous open-air canvas of modern art.\n\nOn islands like Naoshima and Teshima, concrete museums designed by master architects emerge from the soil, housing masterpieces that ask us to look closer at the sky, the water, and ourselves. Seto reminds us that even the most forgotten shores can be reborn into magnificent expressions of beauty.\n\nIn quiet harmony,\nKokoro of Seto",
    assets_url: "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=800&q=80"
  }
];

// Helper to seed regions if they don't exist
export async function seedRegionsIfNecessary() {
  try {
    const regionCol = collection(db, "regions");
    const snapshot = await getDocs(regionCol);
    if (snapshot.empty) {
      console.log("Seeding regional data into Firestore...");
      for (const reg of SEED_REGIONS) {
        await setDoc(doc(db, "regions", reg.region_id), reg);
      }
      console.log("Seeding completed successfully.");
    }
  } catch (err) {
    console.error("Error seeding regions:", err);
  }
}

// Get all regions
export async function getRegions(): Promise<Region[]> {
  try {
    const regionCol = collection(db, "regions");
    const snapshot = await getDocs(regionCol);
    const list: Region[] = [];
    snapshot.forEach(d => {
      list.push(d.data() as Region);
    });
    // Ensure order matching our seed list
    const orderMap = SEED_REGIONS.map(r => r.region_id);
    return list.sort((a, b) => orderMap.indexOf(a.region_id) - orderMap.indexOf(b.region_id));
  } catch (err) {
    console.error("Error reading regions from Firestore, returning mock:", err);
    return SEED_REGIONS;
  }
}

// Get subscriber by email
export async function getSubscriber(email: string): Promise<Subscriber | null> {
  if (!email) return null;
  const lowercaseEmail = email.toLowerCase().trim();
  try {
    const subDoc = doc(db, "subscribers", lowercaseEmail);
    const snap = await getDoc(subDoc);
    if (snap.exists()) {
      return snap.data() as Subscriber;
    }
    return null;
  } catch (err) {
    console.error("Error reading subscriber:", err);
    return null;
  }
}

// Create or update subscriber
export async function createOrUpdateSubscriber(
  email: string,
  data: Partial<Omit<Subscriber, "email">>
): Promise<Subscriber> {
  const lowercaseEmail = email.toLowerCase().trim();
  const subDoc = doc(db, "subscribers", lowercaseEmail);
  const existing = await getSubscriber(lowercaseEmail);
  
  const updated: Subscriber = {
    email: lowercaseEmail,
    shipping_address: data.shipping_address ?? existing?.shipping_address ?? "",
    subscription_status: data.subscription_status ?? existing?.subscription_status ?? "Inactive",
    plan_tier: data.plan_tier ?? existing?.plan_tier ?? "India",
    createdAt: data.createdAt ?? existing?.createdAt ?? new Date().toISOString()
  };
  
  await setDoc(subDoc, updated);
  return updated;
}

// Create Access log
export async function unlockRegion(email: string, region_id: string): Promise<void> {
  const lowercaseEmail = email.toLowerCase().trim();
  // We use a composite key to avoid duplicate logs in junction
  const compositeId = `${lowercaseEmail}_${region_id}`;
  const logDoc = doc(db, "access_logs", compositeId);
  await setDoc(logDoc, {
    email: lowercaseEmail,
    region_id,
    granted_at: new Date().toISOString()
  });
}

// Log webhook events
export async function logWebhookEvent(eventData: any): Promise<void> {
  try {
    const eventsCol = collection(db, "subscription_events");
    // Generate a random ID or use setDoc with random ID
    const newDocRef = doc(eventsCol);
    await setDoc(newDocRef, {
      ...eventData,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error logging webhook event to Firestore:", err);
  }
}

// Get webhook events
export async function getWebhookEvents(): Promise<any[]> {
  try {
    const q = query(collection(db, "subscription_events"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error("Error getting webhook events:", err);
    return [];
  }
}

// Get all subscribers (for Admin)
export async function getAllSubscribers(): Promise<Subscriber[]> {
  try {
    const subCol = collection(db, "subscribers");
    const snapshot = await getDocs(subCol);
    const list: Subscriber[] = [];
    snapshot.forEach(d => list.push(d.data() as Subscriber));
    return list;
  } catch (err) {
    console.error("Error getting all subscribers:", err);
    return [];
  }
}

// Sync past subscription history into access_logs based on subscription age
export async function syncSubscriptionHistoryAccessLogs(email: string): Promise<void> {
  const lowercaseEmail = email.toLowerCase().trim();
  const sub = await getSubscriber(lowercaseEmail);
  if (!sub) return;
  if (sub.subscription_status !== "Active") return;

  const createdDate = new Date(sub.createdAt);
  if (isNaN(createdDate.getTime())) return;

  const currentDate = new Date();
  
  // Calculate difference in months (1-based, current month is month 1)
  const yearsDiff = currentDate.getFullYear() - createdDate.getFullYear();
  const monthsDiff = currentDate.getMonth() - createdDate.getMonth();
  const elapsedMonths = Math.max(1, yearsDiff * 12 + monthsDiff + 1);

  // Region IDs in sequential order of monthly dispatches
  const orderedRegionIds = [
    "hokkaido", // Jan
    "tohoku",    // Feb
    "shinshu",   // Mar
    "kanto",     // Apr
    "chubu",     // May
    "iseshima",  // Jun
    "kansai",    // Jul
    "chugoku",   // Aug
    "seto",      // Sep
    "shikoku",   // Oct
    "kyushu",    // Nov
    "okinawa"    // Dec
  ];

  // Limit to 12 regions maximum
  const regionsToUnlockCount = Math.min(elapsedMonths, 12);
  
  for (let i = 0; i < regionsToUnlockCount; i++) {
    const rId = orderedRegionIds[i];
    await unlockRegion(lowercaseEmail, rId);
  }
}

// Get unlocked regions for email
export async function getUnlockedRegions(email: string): Promise<string[]> {
  if (!email) return ["kanto"];
  const lowercaseEmail = email.toLowerCase().trim();
  try {
    // Automatically synchronize past subscription history into real access logs
    await syncSubscriptionHistoryAccessLogs(lowercaseEmail);

    const q = query(collection(db, "access_logs"), where("email", "==", lowercaseEmail));
    const snapshot = await getDocs(q);
    const list: string[] = ["kanto"]; // Always unlock Kanto for debugging
    snapshot.forEach(d => {
      const data = d.data();
      if (data.region_id && data.region_id !== "kanto") {
        list.push(data.region_id);
      }
    });
    return list;
  } catch (err) {
    console.error("Error getting unlocked regions:", err);
    return ["kanto"];
  }
}

// Create Magic Token
export async function createMagicToken(email: string): Promise<string> {
  const lowercaseEmail = email.toLowerCase().trim();
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
  
  await setDoc(doc(db, "magic_tokens", token), {
    token,
    email: lowercaseEmail,
    expires_at: expiresAt,
    used: false
  });
  
  return token;
}

// Verify Magic Token
export async function verifyMagicToken(token: string): Promise<string | null> {
  if (!token) return null;
  try {
    const tokenDoc = doc(db, "magic_tokens", token);
    const snap = await getDoc(tokenDoc);
    if (!snap.exists()) return null;
    
    const data = snap.data();
    if (data.used) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    
    // Mark as used
    await updateDoc(tokenDoc, { used: true });
    return data.email;
  } catch (err) {
    console.error("Error verifying magic token:", err);
    return null;
  }
}

// Check on-demand region access (Single getDoc query)
export async function checkRegionAccess(email: string, region_id: string): Promise<boolean> {
  if (!email) return false;
  if (region_id === "kanto") return true; // Always unlocked for debugging
  const lowercaseEmail = email.toLowerCase().trim();
  const compositeId = `${lowercaseEmail}_${region_id}`;
  try {
    const logDoc = doc(db, "access_logs", compositeId);
    const snap = await getDoc(logDoc);
    return snap.exists();
  } catch (err) {
    console.error("Error checking region access in Firestore:", err);
    return false;
  }
}

