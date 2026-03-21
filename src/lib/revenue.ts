// Revenue data sources and calculations
// All estimates based on publicly available data from:
// - Steam Community Market (priceoverview endpoint)
// - BitSkins analysis (bitskins.com/blog)
// - CSGOCaseTracker (csgocasetracker.com) / CSFloat FloatDB
// - Steam Web API (ISteamUserStats)

const STEAM_API_KEY = process.env.STEAM_API_KEY || "";
const CS2_APP_ID = 730;
const KEY_PRICE_USD = 2.50;
const STEAM_MARKET_FEE_RATE = 0.15; // 15% Valve cut

// Popular cases to sample market volume from
const TRACKED_CASES = [
  "Dreams %26 Nightmares Case",
  "Kilowatt Case",
  "Revolution Case",
  "Recoil Case",
  "Fracture Case",
  "Prisma 2 Case",
  "Gallery Case",
  "Clutch Case",
  "Danger Zone Case",
  "CS20 Case",
];

export interface RevenueSnapshot {
  // Live data
  currentPlayers: number;
  // Case market data (24h volumes)
  caseMarketVolume24h: number;
  trackedCases: { name: string; volume: number; price: number }[];
  // Estimated revenue rates
  dailyCaseOpenings: number;
  dailyKeyRevenue: number; // case openings × $2.50
  dailyMarketFeeRevenue: number; // market volume × avg price × 15%
  dailyTotalRevenue: number;
  perSecondRevenue: number;
  perMinuteRevenue: number;
  perHourRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  // Metadata
  lastUpdated: string;
  sources: string[];
}

// Baseline estimates from verified public analyses (updated periodically)
// Source: BitSkins March 2025 analysis, ZestyJesus 2025 yearly analysis
const BASELINE = {
  monthlyCaseOpenings: 32_800_000, // March 2025 (BitSkins confirmed)
  dailyCaseOpenings: 1_058_065, // 32.8M / 31 days
  yearlyMarketTransactionValue: 1_220_000_000, // $1.22B (2025, ZestyJesus)
  dailyMarketTransactionValue: 3_342_466, // $1.22B / 365
};

async function fetchCurrentPlayers(): Promise<number> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${CS2_APP_ID}`,
      { next: { revalidate: 300 } } // cache 5 min
    );
    const data = await res.json();
    return data?.response?.player_count || 0;
  } catch {
    return 0;
  }
}

interface CaseData {
  name: string;
  volume: number;
  price: number;
}

async function fetchCaseMarketVolumes(): Promise<CaseData[]> {
  const results: CaseData[] = [];

  // Fetch in sequence to respect rate limits (~20 req/min)
  for (const caseName of TRACKED_CASES) {
    try {
      const url = `https://steamcommunity.com/market/priceoverview/?appid=${CS2_APP_ID}&currency=1&market_hash_name=${encodeURIComponent(caseName)}`;
      const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hour
      const data = await res.json();

      if (data.success) {
        const volume = parseInt(String(data.volume || "0").replace(/,/g, ""), 10);
        const price = parseFloat(
          String(data.lowest_price || "$0").replace(/[^0-9.]/g, "")
        );
        results.push({
          name: caseName.replace(/%26/g, "&"),
          volume,
          price,
        });
      }
    } catch {
      // Skip failed requests
    }
  }

  return results;
}

export async function getRevenueData(): Promise<RevenueSnapshot> {
  const [currentPlayers, trackedCases] = await Promise.all([
    fetchCurrentPlayers(),
    fetchCaseMarketVolumes(),
  ]);

  const caseMarketVolume24h = trackedCases.reduce(
    (sum, c) => sum + c.volume,
    0
  );

  // Revenue calculations
  // Cases opened per day: use baseline (BitSkins verified) adjusted by market activity
  // Market volume tracks ~80% of popular cases, real openings are higher
  const dailyCaseOpenings =
    caseMarketVolume24h > 0
      ? Math.max(caseMarketVolume24h * 1.5, BASELINE.dailyCaseOpenings)
      : BASELINE.dailyCaseOpenings;

  const dailyKeyRevenue = dailyCaseOpenings * KEY_PRICE_USD;

  // Market fee revenue: baseline from yearly analysis
  const dailyMarketFeeRevenue =
    BASELINE.dailyMarketTransactionValue * STEAM_MARKET_FEE_RATE;

  const dailyTotalRevenue = dailyKeyRevenue + dailyMarketFeeRevenue;
  const perSecondRevenue = dailyTotalRevenue / 86400;

  return {
    currentPlayers,
    caseMarketVolume24h,
    trackedCases,
    dailyCaseOpenings: Math.round(dailyCaseOpenings),
    dailyKeyRevenue: Math.round(dailyKeyRevenue),
    dailyMarketFeeRevenue: Math.round(dailyMarketFeeRevenue),
    dailyTotalRevenue: Math.round(dailyTotalRevenue),
    perSecondRevenue: Math.round(perSecondRevenue * 100) / 100,
    perMinuteRevenue: Math.round(perSecondRevenue * 60 * 100) / 100,
    perHourRevenue: Math.round(perSecondRevenue * 3600),
    monthlyRevenue: Math.round(dailyTotalRevenue * 30),
    yearlyRevenue: Math.round(dailyTotalRevenue * 365),
    lastUpdated: new Date().toISOString(),
    sources: [
      "Steam Web API (player count)",
      "Steam Community Market (case volumes)",
      "BitSkins analysis, March 2025 (case opening baseline)",
      "ZestyJesus 2025 analysis (market transaction volume)",
      "csgocasetracker.com / CSFloat FloatDB (case tracking)",
    ],
  };
}
