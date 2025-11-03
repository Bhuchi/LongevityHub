import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  Users,
  FileSpreadsheet,
  Droplets,
  ActivitySquare,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdminAnalytics() {
  const [demoMode, setDemoMode] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    foods: 0,
    nutrients: 0,
    logs: [],
  });

  useEffect(() => {
    if (demoMode) {
      setStats({
        users: 128,
        foods: 56,
        nutrients: 12,
        logs: [
          { day: "Mon", users: 3, foods: 1 },
          { day: "Tue", users: 5, foods: 3 },
          { day: "Wed", users: 2, foods: 4 },
          { day: "Thu", users: 4, foods: 2 },
          { day: "Fri", users: 7, foods: 5 },
          { day: "Sat", users: 1, foods: 3 },
          { day: "Sun", users: 2, foods: 1 },
        ],
      });
    } else {
      // when backend ready:
      // fetch("/api/analytics.php").then(r=>r.json()).then(setStats)
    }
  }, [demoMode]);

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Analytics</h1>
          <div className="text-slate-400 text-sm">
            Monitor platform-wide usage and data statistics
          </div>
        </div>
        <button
          onClick={() => setDemoMode((d) => !d)}
          className={`text-xs px-2 py-1 rounded-lg border ${
            demoMode
              ? "border-emerald-600 text-emerald-300 bg-emerald-600/10"
              : "border-slate-700 text-slate-300"
          }`}
        >
          {demoMode ? "Demo" : "Live"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatCard
          icon={<Users className="h-6 w-6 text-sky-400" />}
          title="Total Users"
          value={stats.users}
        />
        <StatCard
          icon={<FileSpreadsheet className="h-6 w-6 text-emerald-400" />}
          title="Total Foods"
          value={stats.foods}
        />
        <StatCard
          icon={<Droplets className="h-6 w-6 text-teal-400" />}
          title="Nutrients Defined"
          value={stats.nutrients}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User vs Food Activity */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ActivitySquare className="h-5 w-5 text-amber-400" />
              Weekly Activity
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.logs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#f8fafc",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#38bdf8"
                strokeWidth={2}
                name="New Users"
              />
              <Line
                type="monotone"
                dataKey="foods"
                stroke="#34d399"
                strokeWidth={2}
                name="Foods Added"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Nutrient usage distribution */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-teal-400" />
              Nutrient Distribution
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sampleNutrientData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#f8fafc",
                }}
              />
              <Bar dataKey="foods" fill="#38bdf8" name="Foods Containing" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-10 text-slate-400 text-sm">
        <p>
          This dashboard visualizes activity and nutrient stats for the LongevityHub system.  
          When backend APIs are connected, it will automatically show live data.
        </p>
      </div>
    </Layout>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-sky-500/10 grid place-items-center">
          {icon}
        </div>
        <div>
          <div className="text-slate-400 text-sm">{title}</div>
          <div className="text-xl font-semibold text-slate-100">{value}</div>
        </div>
      </div>
    </div>
  );
}

/* ---- Demo nutrient data ---- */
function sampleNutrientData() {
  return [
    { name: "Protein", foods: 32 },
    { name: "Fiber", foods: 25 },
    { name: "Carbs", foods: 45 },
    { name: "Fat", foods: 28 },
    { name: "Calories", foods: 56 },
  ];
}
