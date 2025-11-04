import React from "react";
import {
  Users,
  Database,
  Droplets,
  ActivitySquare,
  ArrowLeft,
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
import Navbar from "../../components/Navbar"; // ✅ use your existing Navbar
import { useNavigate } from "react-router-dom";

const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  variant = "solid",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const base =
    "rounded-xl font-semibold transition inline-flex items-center justify-center gap-2";
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-3.5 py-2",
  };
  const variants = {
    solid: "bg-sky-600 hover:bg-sky-500 text-white",
    ghost:
      "bg-slate-800/60 hover:bg-slate-800 text-slate-100 border border-slate-700",
    subtle:
      "bg-slate-900/60 hover:bg-slate-800/70 text-slate-200 border border-slate-700",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function AdminAnalytics() {
  const navigate = useNavigate();

  const stats = [
    {
      icon: <Users className="h-5 w-5 text-sky-400" />,
      label: "Total Users",
      value: 128,
    },
    {
      icon: <Database className="h-5 w-5 text-emerald-400" />,
      label: "Total Foods",
      value: 56,
    },
    {
      icon: <Droplets className="h-5 w-5 text-teal-400" />,
      label: "Nutrients Defined",
      value: 12,
    },
  ];

  const weeklyData = [
    { day: "Mon", foods: 1, users: 3 },
    { day: "Tue", foods: 4, users: 5 },
    { day: "Wed", foods: 3, users: 2 },
    { day: "Thu", foods: 2, users: 4 },
    { day: "Fri", foods: 4, users: 3 },
    { day: "Sat", foods: 1, users: 1 },
    { day: "Sun", foods: 2, users: 2 },
  ];

  const nutrients = [
    { name: "Protein", value: 32 },
    { name: "Fiber", value: 25 },
    { name: "Carbs", value: 45 },
    { name: "Fat", value: 28 },
    { name: "Calories", value: 55 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">System Analytics</h1>
              <p className="text-slate-400 text-sm">
                Monitor platform-wide usage and data statistics
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4" /> Back to Admin Page
              </Button>
              <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg">
                Demo
              </span>
            </div>
          </div>

          {/* Overview cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((s, i) => (
              <Card key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800/70 border border-slate-700 grid place-items-center">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                    <div className="text-xl font-semibold">{s.value}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <ActivitySquare className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold">Weekly Activity</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    opacity={0.4}
                  />
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
                    formatter={(v, n) => [
                      v,
                      n === "foods" ? "Foods Added" : "New Users",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="foods"
                    stroke="#50C878"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-xs text-slate-400 mt-2 flex gap-6">
                <span className="text-emerald-400">⎯ Foods Added</span>
                <span className="text-sky-400">⎯ New Users</span>
              </div>
            </Card>

            {/* Nutrient Distribution */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold">Nutrient Distribution</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={nutrients}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    opacity={0.4}
                  />
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
                  />
                  <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Footer note */}
          <div className="text-center text-slate-500 text-sm pt-4">
            This dashboard visualizes activity and nutrient stats for the
            LongevityHub system. When backend APIs are connected, it will
            automatically show live data.
          </div>
        </div>
      </div>
    </div>
  );
}
