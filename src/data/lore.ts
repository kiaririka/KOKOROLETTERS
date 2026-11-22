import hokkaidoLore from "./lore/hokkaido.json";
import tohokuLore from "./lore/tohoku.json";
import kantoLore from "./lore/kanto.json";
import chubuLore from "./lore/chubu.json";
import kansaiLore from "./lore/kansai.json";
import chugokuLore from "./lore/chugoku.json";
import shikokuLore from "./lore/shikoku.json";
import kyushuLore from "./lore/kyushu.json";
import okinawaLore from "./lore/okinawa.json";
import shinshuLore from "./lore/shinshu.json";
import iseshimaLore from "./lore/iseshima.json";
import setoLore from "./lore/seto.json";

export interface RegionMetadata {
  region_id: string;
  region_name: string;
  release_date: string; // ISO date format: YYYY-MM-DD
  month: number;
}

export interface RegionLore {
  region_id: string;
  region_name: string;
  lore_content: string;
  assets_url: string;
}

// Frontend configuration: release dates spanning across 2026.
// Current local time is 2026-07-04.
// Any date <= 2026-07-04 is released (Past/Present).
// Any date > 2026-07-04 is "Coming Soon" (Future).
export const REGIONS_METADATA: RegionMetadata[] = [
  { region_id: "hokkaido", region_name: "Hokkaido", release_date: "2026-01-01", month: 1 },
  { region_id: "tohoku", region_name: "Tohoku", release_date: "2026-02-01", month: 2 },
  { region_id: "shinshu", region_name: "Shinshu (Alps)", release_date: "2026-10-01", month: 3 }, // Future
  { region_id: "kanto", region_name: "Kanto (Tokyo)", release_date: "2026-03-01", month: 4 },
  { region_id: "chubu", region_name: "Chubu (Fuji)", release_date: "2026-04-01", month: 5 },
  { region_id: "iseshima", region_name: "Ise-Shima", release_date: "2026-11-01", month: 6 }, // Future
  { region_id: "kansai", region_name: "Kansai (Kyoto)", release_date: "2026-05-01", month: 7 },
  { region_id: "chugoku", region_name: "Chugoku", release_date: "2026-06-01", month: 8 },
  { region_id: "seto", region_name: "Seto Inland Sea", release_date: "2026-12-01", month: 9 }, // Future
  { region_id: "shikoku", region_name: "Shikoku", release_date: "2026-07-01", month: 10 }, // Past/Present (July 1st)
  { region_id: "kyushu", region_name: "Kyushu", release_date: "2026-08-01", month: 11 }, // Future (August 1st)
  { region_id: "okinawa", region_name: "Okinawa", release_date: "2026-09-01", month: 12 } // Future (September 1st)
];

export const LORE_DATA: Record<string, RegionLore> = {
  hokkaido: hokkaidoLore,
  tohoku: tohokuLore,
  kanto: kantoLore,
  chubu: chubuLore,
  kansai: kansaiLore,
  chugoku: chugokuLore,
  shikoku: shikokuLore,
  kyushu: kyushuLore,
  okinawa: okinawaLore,
  shinshu: shinshuLore,
  iseshima: iseshimaLore,
  seto: setoLore
};
