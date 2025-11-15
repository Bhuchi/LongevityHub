import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Heart,
  Moon,
  Dumbbell,
  BarChart3,
  Upload,
  Plus,
  Clock,
  Database,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Link } from "react-router-dom";
import LogModal from "../components/LogModal.jsx";
import Navbar from "../components/Navbar";
import { apiGet } from "../api";

export default function Dashboard() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/controllers/dashboard.php");
        if (!active) return;
        setPayload(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load dashboard data.");
        setPayload(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const scoreTrend = useMemo(() => {
    return (payload?.score?.trend || []).map((row) => ({
      day: row.day,
      label: new Date(row.day).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: Number(row.score ?? 0),
    }));
  }, [payload]);

  const scoreToday =
    payload?.score?.today !== null && payload?.score?.today !== undefined
      ? Number(payload.score.today).toFixed(0)
      : "--";

  const readiness = payload?.readiness || {};
  const goals = payload?.goals || {};
  const proteinTrend = useMemo(() => {
    return (payload?.protein?.trend || []).map((row) => ({
      day: row.day,
      label: new Date(row.day).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      protein: Number(row.amount ?? row.value ?? 0),
    }));
  }, [payload]);
  const recentActivity = payload?.recent_activity || [];

  const goalSteps = goals.steps || {};
  const goalSleep = goals.sleep_hours || {};
  const goalWorkout = goals.workout_min || {};
  const goalProtein = goals.protein_g || {};
  const goalCarb = goals.carb_g || {};

  const readinessDefaults = {
    avg_hrv:
      readiness.avg_hrv === null || readiness.avg_hrv === undefined
        ? null
        : Number(readiness.avg_hrv),
    avg_rhr:
      readiness.avg_rhr === null || readiness.avg_rhr === undefined
        ? null
        : Number(readiness.avg_rhr),
    steps: Number(readiness.steps ?? 0),
    sleep_hours: Number(readiness.sleep_hours ?? 0),
    workout_min: Number(readiness.workout_min ?? 0),
  };

  const formatTime = (ts) => {
    if (!ts) return "--";
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 space-y-6">
      <Navbar />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="date-input rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm px-3 py-1"
            value={new Date().toISOString().slice(0, 10)}
            readOnly
          />
          <button
            onClick={() => {
              setLogType(null);
              setShowLogModal(true);
            }}
            className="bg-sky-600 hover:bg-sky-500 text-sm font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Log
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
          Loading the latest metrics…
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-700 bg-rose-950/40 px-4 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {/* Profile + Daily Score */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <img
            src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
            alt="Profile"
            className="h-16 w-16 rounded-full mb-3 border-2 border-sky-500"
          />
          <h2 className="text-lg font-semibold text-slate-100">My Profile</h2>
          <p className="text-slate-400 text-sm mb-4">
            View or edit your health details
          </p>
          <a
            href="/profile"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-sm font-semibold rounded-xl text-white transition"
          >
            Go to Profile
          </a>
        </Card>

        <div className="lg:col-span-2 grid lg:grid-cols-3 gap-6">
          <Card className="col-span-2">
            <h2 className="text-lg font-semibold mb-1">Daily Score</h2>
            <div className="text-5xl font-bold mb-1">{scoreToday}</div>
            <p className="text-slate-400 text-xs mb-3">
              Computed from v_daily_score (last 7 days)
            </p>
            {scoreTrend.length === 0 ? (
              <div className="text-slate-500 text-sm">
                No score data yet. Log wearables/sleep to see this metric.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={scoreTrend}>
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="grid grid-cols-3 gap-4 text-center">
            <CircleStat
              label="Steps"
              value={Math.round(goalSteps.current ?? 0)}
              goal={goalSteps.goal}
              color="#38bdf8"
            />
            <CircleStat
              label="Sleep (h)"
              value={Number(goalSleep.current ?? 0).toFixed(1)}
              goal={goalSleep.goal}
              color="#34d399"
            />
            <CircleStat
              label="Workout (min)"
              value={Math.round(goalWorkout.current ?? 0)}
              goal={goalWorkout.goal}
              color="#f59e0b"
            />
          </Card>
        </div>
      </div>

      {/* Activity & Lifestyle */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-1">Activity & Recovery</h2>
          <p className="text-xs text-slate-500 mb-3">7-day averages</p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/wearables"
              className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-sky-500 transition"
            >
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <BarChart3 className="h-4 w-4 text-sky-400" /> HRV
              </div>
              <div className="text-2xl font-semibold text-slate-100">
                {readinessDefaults.avg_hrv ?? "--"}{" "}
                <span className="text-slate-500 text-sm">ms</span>
              </div>
            </Link>
            <Link
              to="/wearables"
              className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-sky-500 transition"
            >
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Heart className="h-4 w-4 text-rose-400" /> RESTING HR
              </div>
              <div className="text-2xl font-semibold text-slate-100">
                {readinessDefaults.avg_rhr ?? "--"}{" "}
                <span className="text-slate-500 text-sm">bpm</span>
              </div>
            </Link>
            <Link
              to="/wearables"
              className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-sky-500 transition"
            >
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Activity className="h-4 w-4 text-emerald-400" /> STEPS
              </div>
              <div className="text-2xl font-semibold text-slate-100">
                {Math.round(readinessDefaults.steps)}{" "}
                <span className="text-slate-500 text-sm">steps</span>
              </div>
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-1">Lifestyle Metrics</h2>
          <p className="text-xs text-slate-500 mb-3">7-day averages</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              to="/sleep"
              className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-violet-500 transition"
            >
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Moon className="h-4 w-4 text-violet-400" /> SLEEP
              </div>
              <div className="text-2xl font-semibold text-slate-100">
                {(readinessDefaults.sleep_hours ?? 0).toFixed(1)}{" "}
                <span className="text-slate-500 text-sm">h</span>
              </div>
            </Link>
            <Link
              to="/workouts"
              className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-amber-500 transition"
            >
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Dumbbell className="h-4 w-4 text-amber-400" /> WORKOUT
              </div>
              <div className="text-2xl font-semibold text-slate-100">
                {Math.round(readinessDefaults.workout_min)}{" "}
                <span className="text-slate-500 text-sm">min</span>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Macro progress */}
      <div className="grid md:grid-cols-2 gap-4">
        <ProgressBar
          label="Protein (g)"
          current={Math.round(goalProtein.current ?? 0)}
          goal={goalProtein.goal}
          color="bg-sky-500"
        />
        <ProgressBar
          label="Carbs (g)"
          current={Math.round(goalCarb.current ?? 0)}
          goal={goalCarb.goal}
          color="bg-violet-500"
        />
      </div>

      {/* Recent activity + Protein chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link to="/meals" className="text-sky-400 text-sm hover:underline">
              View logs
            </Link>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {recentActivity.length === 0 ? (
              <li className="text-slate-500">No recent activity yet.</li>
            ) : (
              recentActivity.map((item, idx) => (
                <li key={`${item.type}-${item.ts}-${idx}`}>
                  {formatTime(item.ts)} — {item.label} · {item.detail || ""}
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-3">7-Day Protein</h2>
          {proteinTrend.length === 0 ? (
            <div className="text-slate-500 text-sm">
              Log meals to see protein trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={proteinTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    color: "#f8fafc",
                  }}
                  formatter={(value) => [`${value} g`, "Protein"]}
                />
                <Bar dataKey="protein" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Upload + shortcuts */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-semibold">Wearables CSV</h2>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            Import steps / HRV / resting HR from supported devices.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const csvContent = "date,steps,hrv,resting_hr\n2025-10-15,8900,72,58";
                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "wearables_template.csv";
                link.click();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm border border-slate-700"
            >
              Download template
            </button>
            <label
              htmlFor="file-upload"
              className="px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-1"
            >
              <Upload className="h-4 w-4" /> Upload file
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  alert(
                    `✅ Uploaded ${file.name}\n\nPreview:\n${event.target.result
                      .toString()
                      .slice(0, 100)}...`
                  );
                };
                reader.readAsText(file);
              }}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Shortcuts</h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setLogType("meal");
                setShowLogModal(true);
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              Log meal
            </button>
            <button
              onClick={() => {
                setLogType("workout");
                setShowLogModal(true);
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              Log workout
            </button>
            <button
              onClick={() => {
                setLogType("sleep");
                setShowLogModal(true);
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              Log sleep
            </button>
          </div>
        </Card>
      </div>

      {showLogModal && (
        <LogModal
          isOpen={showLogModal}
          type={logType}
          onClose={() => {
            setShowLogModal(false);
            setLogType(null);
          }}
        />
      )}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-lg " +
        className
      }
    >
      {children}
    </div>
  );
}

function ProgressBar({ label, current, goal, color }) {
  const numericCurrent = Number(current ?? 0);
  const safeGoal =
    goal && goal > 0 ? Number(goal) : Math.max(numericCurrent, 1);
  const percent =
    safeGoal > 0 ? Math.min(100, Math.round((numericCurrent / safeGoal) * 100)) : 0;

  return (
    <Link
      to="/meals"
      className="block rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-lg hover:border-sky-500 transition"
    >
      <div className="flex justify-between mb-1">
        <span className="text-slate-300 text-sm">{label}</span>
        <span className="text-slate-400 text-sm">
          {numericCurrent} / {goal ?? "—"}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-2 ${color}`} style={{ width: `${percent}%` }}></div>
      </div>
    </Link>
  );
}

function CircleStat({ label, value, goal, color }) {
  const numericValue = Number(value ?? 0);
  const numericGoal =
    goal && goal > 0 ? Number(goal) : Math.max(numericValue, 1) || 1;
  const percent =
    numericGoal > 0
      ? Math.min(100, Math.round((numericValue / numericGoal) * 100))
      : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="mb-2">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#1e293b"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="text-lg font-semibold fill-slate-100"
        >
          {percent}%
        </text>
      </svg>
      <div className="text-sm text-slate-300 font-medium">{label}</div>
      <div className="text-xs text-slate-500">
        {numericValue} / {goal ?? "—"}
      </div>
    </div>
  );
}
