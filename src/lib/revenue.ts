/**
 * @fileoverview CS2 revenue estimation and tracking.
 *
 * Calculates estimated daily/monthly revenue for CS2 based on:
 * - Current player count (Steam Web API)
 * - Case market volumes (Steam Community Market)
 * - Industry benchmarks (BitSkins, ZestyJesus analyses)
 *
 * All figures are estimates based on publicly available data.
 *
 * @module revenue
 */

// ── Data Sources ─────────────────────────────────────────────
// Revenue estimates based on publicly available data from:
// - Steam Community Market (priceoverview endpoint)
// - BitSkins analysis (bitskins.com/blog)
// - CSGOCaseTracker (csgocasetracker.com) / CSFloat FloatDB
// - Steam Web API (ISteamUserStats)
// - ZestyJesus 2025 yearly market analysis

// ── Constants ───────────────────────────────────────────────

const STEAM_API_KEY = process.env.STEAM_API_KEY || "";
const CS2_APP_ID = 730;
const KEY_PRICE_USD = 2.50; // Cost per case key in USD
const STEAM_MARKET_FEE_RATE = 0.15; // 15% Valve cut on market transactions

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

// ── Types ───────────────────────────────────────────────────

/** Complete revenue snapshot with all calculated metrics */
export interface RevenueSnapshot {
  /** Current online players from Steam API */
  currentPlayers: number;
  /** Total case sales volume in last 24h (from tracked cases sample) */
  caseMarketVolume24h: number;
  /** Individual case data for display */
  trackedCases: { name: string; volume: number; price: number }[];
  /** Estimated daily case openings (market-based + baseline adjustment) */
  dailyCaseOpenings: number;
  /** Daily revenue from case keys (~$2.50 per opening) */
  dailyKeyRevenue: number;
  /** Daily revenue from market fees (15% of transaction volume) */
  dailyMarketFeeRevenue: number;
  /** Combined daily revenue (keys + market) */
  dailyTotalRevenue: number;
  /** Revenue per second for live counter */
  perSecondRevenue: number;
  /** Revenue per minute for display */
  perMinuteRevenue: number;
  /** Revenue per hour for display */
  perHourRevenue: number;
  /** Projected monthly revenue */
  monthlyRevenue: number;
  /** Projected yearly revenue */
  yearlyRevenue: number;
  /** ISO timestamp of data fetch */
  lastUpdated: string;
  /** Data source attributions */
  sources: string[];
}

// ── Baseline Estimates ─────────────────────────────────────

/**
 * Verified baseline estimates from industry analysis.
 * Updated periodically from BitSkins and ZestyJesus reports.
 */
const BASELINE = {
  monthlyCaseOpenings: 32_800_000, // March 2025 (BitSkins confirmed)
  dailyCaseOpenings: 1_058_065, // 32.8M / 31 days
  yearlyMarketTransactionValue: 1_220_000_000, // $1.22B (2025, ZestyJesus)
  dailyMarketTransactionValue: 3_342_466, // $1.22B / 365
};

// ── Data Fetching ────────────────────────────────────────────

/**
 * Fetch current CS2 player count from Steam API.
 * Caches for 5 minutes to avoid rate limits.
 */
async function fetchCurrentPlayers(): Promise<number> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${CS2_APP_ID}`,
      { next: { revalidate: 300 } } // Cache 5 minutes
    );
    const data = await res.json();
    return data?.response?.player_count || 0;
  } catch {
    return 0;
  }
}

/** Individual case market data */
interface CaseData {
  name: string;
  volume: number;
  price: number;
}

/**
 * Fetch market volumes for tracked cases from Steam Community Market.
 * Fetches sequentially to respect rate limits (~20 req/min).
 * Caches for 1 hour as market data changes slowly.
 */
async function fetchCaseMarketVolumes(): Promise<CaseData[]> {
  const results: CaseData[] = [];

  // Fetch in sequence to respect rate limits (~20 req/min)
  for (const caseName of TRACKED_CASES) {
    try {
      const url = `https://steamcommunity.com/market/priceoverview/?appid=${CS2_APP_ID}&currency=1&market_hash_name=${encodeURIComponent(caseName)}`;
      const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour
      const data = await res.json();

      if (data.success) {
        // Parse volume string (e.g., "1,234") to integer
        const volume = parseInt(String(data.volume || "0").replace(/,/g, ""), 10);
        // Parse price string (e.g., "$1.23") to float
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
      // Skip failed requests (rate limited or item not found)
    }
  }

  return results;
}

// ── Main Export ────────────────────────────────────────────

/**
 * Get complete revenue data snapshot.
 * Combines live player count, market data, and baseline estimates.
 *
 * @returns RevenueSnapshot with all calculated metrics
 */
export async function getRevenueData(): Promise<RevenueSnapshot> {
  const [currentPlayers, trackedCases] = await Promise.all([
    fetchCurrentPlayers(),
    fetchCaseMarketVolumes(),
  ]);

  const caseMarketVolume24h = trackedCases.reduce(
    (sum, c) => sum + c.volume,
    0
  );

  // ── Revenue Calculations ───────────────────────────────────

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
  const perSecondRevenue = dailyTotalRevenue / 86400; // 86400 seconds in a day

  return {
    currentPlayers,
    caseMarketVolume24h,
    trackedCases,
    dailyCaseOpenings: Math.round(dailyCaseOpenings),
    dailyKeyRevenue: Math.round(dailyKeyRevenue),
    dailyMarketFeeRevenue: Math.round(dailyMarketFeeRevenue),
    dailyTotalRevenue: Math.round(dailyTotalRevenue),
    perSecondRevenue: Math.round(perSecondRevenue * 100) / 100, // 2 decimal places
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
