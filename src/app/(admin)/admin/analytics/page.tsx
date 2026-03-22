"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDay: Array<{ date: string; views: number; unique_visitors: number }>;
  topPages: Array<{ path: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  devices: Record<string, number>;
  browsers: Array<{ browser: string; count: number }>;
  os: Array<{ os: string; count: number }>;
  recentViews: Array<{
    path: string;
    country: string;
    device: string;
    browser: string;
    referrer: string;
    createdAt: string;
  }>;
}

const COLORS = ["#de9b35", "#5b99c9", "#e8c252", "#4caf50", "#ff4444"];

const PERIODS = ["7d", "30d", "90d", "all"] as const;
type Period = (typeof PERIODS)[number];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (!res.ok) throw new Error("Failed to fetch analytics data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const deviceData = data
    ? Object.entries(data.devices).map(([name, value]) => ({ name, value }))
    : [];

  const topCountry =
    data?.topCountries && data.topCountries.length > 0
      ? data.topCountries[0].country
      : "--";

  const topPage =
    data?.topPages && data.topPages.length > 0
      ? data.topPages[0].path
      : "--";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Traffic and visitor insights
          </p>
        </div>

        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-cs-orange text-white"
                  : "bg-cs-dark text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "All Time" : p}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground text-sm">
            Loading analytics...
          </div>
        </div>
      )}

      {error && (
        <div className="cs-card rounded-lg p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => fetchData(period)}
            className="mt-3 text-cs-orange text-sm hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="cs-card rounded-lg p-5">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-heading">
                Total Views
              </span>
              <div className="cs-stat-number text-2xl font-heading text-foreground mt-2">
                {data.totalViews.toLocaleString()}
              </div>
            </div>
            <div className="cs-card rounded-lg p-5">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-heading">
                Unique Visitors
              </span>
              <div className="cs-stat-number text-2xl font-heading text-foreground mt-2">
                {data.uniqueVisitors.toLocaleString()}
              </div>
            </div>
            <div className="cs-card rounded-lg p-5">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-heading">
                Top Country
              </span>
              <div className="cs-stat-number text-2xl font-heading text-foreground mt-2">
                {topCountry}
              </div>
            </div>
            <div className="cs-card rounded-lg p-5">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-heading">
                Top Page
              </span>
              <div className="cs-stat-number text-lg font-heading text-foreground mt-2 truncate">
                {topPage}
              </div>
            </div>
          </div>

          {/* Views Over Time */}
          <div className="cs-card rounded-lg p-6">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              Views Over Time
            </h2>
            {data.viewsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.viewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="var(--cs-orange)"
                    strokeWidth={2}
                    dot={false}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="unique_visitors"
                    stroke="var(--cs-blue)"
                    strokeWidth={2}
                    dot={false}
                    name="Unique Visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">
                No data for this period.
              </p>
            )}
          </div>

          {/* Top Pages + Geographic Distribution */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="cs-card rounded-lg p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                Top Pages
              </h2>
              {data.topPages.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-muted-foreground py-2 font-medium">
                        Path
                      </th>
                      <th className="text-right text-muted-foreground py-2 font-medium">
                        Views
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((page) => (
                      <tr
                        key={page.path}
                        className="border-b border-border/30"
                      >
                        <td className="py-2 text-foreground truncate max-w-[200px]">
                          {page.path}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {page.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">
                  No page data.
                </p>
              )}
            </div>

            <div className="cs-card rounded-lg p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                Geographic Distribution
              </h2>
              {data.topCountries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topCountries} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      type="number"
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="country"
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--cs-blue)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">
                  No country data.
                </p>
              )}
            </div>
          </div>

          {/* Devices, Browsers, OS */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="cs-card rounded-lg p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                Devices
              </h2>
              {deviceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label
                    >
                      {deviceData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">
                  No device data.
                </p>
              )}
            </div>

            <div className="cs-card rounded-lg p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                Browsers
              </h2>
              {data.browsers.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.browsers}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="browser"
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--cs-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">
                  No browser data.
                </p>
              )}
            </div>

            <div className="cs-card rounded-lg p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                Operating Systems
              </h2>
              {data.os.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.os}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="os"
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--cs-orange)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">
                  No OS data.
                </p>
              )}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="cs-card rounded-lg p-6">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              Top Referrers
            </h2>
            {data.topReferrers.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left text-muted-foreground py-2 font-medium">
                      Referrer
                    </th>
                    <th className="text-right text-muted-foreground py-2 font-medium">
                      Visits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topReferrers.map((ref) => (
                    <tr
                      key={ref.referrer}
                      className="border-b border-border/30"
                    >
                      <td className="py-2 text-foreground truncate max-w-[300px]">
                        {ref.referrer || "(direct)"}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {ref.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">
                No referrer data.
              </p>
            )}
          </div>

          {/* Live Feed */}
          <div className="cs-card rounded-lg p-6">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              Live Feed -- Recent 20 Visits
            </h2>
            {data.recentViews.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-muted-foreground py-2 font-medium">
                        Time
                      </th>
                      <th className="text-left text-muted-foreground py-2 font-medium">
                        Path
                      </th>
                      <th className="text-left text-muted-foreground py-2 font-medium">
                        Country
                      </th>
                      <th className="text-left text-muted-foreground py-2 font-medium">
                        Device
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentViews.map((view, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-2 text-muted-foreground whitespace-nowrap">
                          {new Date(view.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 text-foreground truncate max-w-[200px]">
                          {view.path}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {view.country}
                        </td>
                        <td className="py-2 text-muted-foreground capitalize">
                          {view.device}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">
                No recent visits.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
