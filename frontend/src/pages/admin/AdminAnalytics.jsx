import React, { useEffect, useState } from "react";
import {
  Users,
  Database,
  Droplets,
  ActivitySquare,
  ArrowLeft,
  Utensils,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../api";

const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg ${className}`}>
    {children}
  </div>
);

const Button = ({ variant = "solid", size = "md", className = "", children, ...props }) => {
  const base = "rounded-xl font-semibold transition inline-flex items-center justify-center gap-2";
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-3.5 py-2",
  };
  const variants = {
    solid: "bg-sky-600 hover:bg-sky-500 text-white",
    ghost: "bg-slate-800/60 hover:bg-slate-800 text-slate-100 border border-slate-700",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, foods: 0, nutrients: 0, meals: 0 });
  const [weekly, setWeekly] = useState([]);
  const [nutrients, setNutrients] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setStatus("");
    try {
      const data = await apiGet("/controllers/admin_analytics.php");
      setStats(data.stats || { users: 0, foods: 0, nutrients: 0, meals: 0 });
      setWeekly(data.weekly || []);
      setNutrients(data.nutrients || []);
    } catch (err) {
      setStatus(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      icon: <Users className="h-5 w-5 text-sky-400" />,
      label: "Total Users",
      value: stats.users ?? 0,
    },
    {
      icon: <Database className="h-5 w-5 text-emerald-400" />,
      label: "Foods",
      value: stats.foods ?? 0,
    },
    {
      icon: <Droplets className="h-5 w-5 text-cyan-400" />,
      label: "Nutrients",
      value: stats.nutrients ?? 0,
    },
    {
      icon: <Utensils className="h-5 w-5 text-amber-400" />,
      label: "Meals Logged",
      value: stats.meals ?? 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">System Analytics</h1>
              <p className="text-slate-400 text-sm">
                Live metrics sourced from users, foods, meals, and nutrient tables.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4" /> Back to Admin Page
              </Button>
              <Button variant="ghost" onClick={load}>
                Refresh
              </Button>
            </div>
          </div>

          {status && (
            <div className="rounded-xl border border-rose-600/30 bg-rose-900/20 px-4 py-2 text-sm text-rose-200">
              {status}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            {statCards.map((s, i) => (
              <Card key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800/70 border border-slate-700 grid place-items-center">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                    <div className="text-xl font-semibold">{loading ? "…" : s.value.toLocaleString()}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <ActivitySquare className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold">Weekly Activity</h2>
              </div>
              {weekly.length === 0 ? (
                <div className="text-sm text-slate-400">No data for the selected window.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                        color: "#f8fafc",
                      }}
                    />
                    <Line type="monotone" dataKey="meals" stroke="#50C878" strokeWidth={2} dot={false} name="Meals logged" />
                    <Line type="monotone" dataKey="new_users" stroke="#38bdf8" strokeWidth={2} dot={false} name="New users" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="text-xs text-slate-400 mt-2 flex gap-6">
                <span className="text-emerald-400">⎯ Meals logged</span>
                <span className="text-sky-400">⎯ New users</span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold">Top Nutrients (sum per 100g)</h2>
              </div>
              {nutrients.length === 0 ? (
                <div className="text-sm text-slate-400">No nutrient data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={nutrients}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                        color: "#f8fafc",
                      }}
                      formatter={(value, _, payload) => [
                        `${value.toFixed(2)} ${payload?.payload?.unit ?? ""}`.trim(),
                        payload?.payload?.name ?? "",
                      ]}
                    />
                    <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {loading && (
            <div className="text-center text-slate-500 text-sm pt-2">
              Fetching live analytics…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
