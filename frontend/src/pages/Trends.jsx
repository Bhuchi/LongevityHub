import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiGet } from "../api";

/* ---- helpers ---- */
const isoDate = (d) => d.toISOString().slice(0,10); // YYYY-MM-DD
const niceDate = (dStr) => new Date(dStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function daysBack(n) {
  const arr = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    arr.push(isoDate(d));
  }
  return arr;
}

/* ---- Trends page ---- */
export default function Trends() {
  const [range, setRange] = useState(14); // 7 | 14 | 30
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiGet(`/controllers/trends.php?days=${range}`);
        if (!active) return;
        setRows(Array.isArray(res?.rows) ? res.rows : []);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load trends data:", err);
        setError(err.message || "Failed to load trends data.");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [range]);

  const data = useMemo(() => {
    const map = Object.create(null);
    for (const row of rows) {
      if (row?.day) map[row.day] = row;
    }
    return daysBack(range).map(day => {
      const r = map[day] || {};
      const steps = Number(r.steps ?? 0);
      const sleepH = Number(r.sleep_hours ?? 0);
      const workout = Number(r.workout_min ?? 0);
      const protein = Number(r.protein_g ?? 0);
      const score = r.score === null || r.score === undefined ? null : Number(r.score);
      return {
        date: day,
        steps: Number.isFinite(steps) ? steps : 0,
        sleep_h: Number.isFinite(sleepH) ? Math.round(sleepH * 100) / 100 : 0,
        workout_min: Number.isFinite(workout) ? workout : 0,
        protein_g: Number.isFinite(protein) ? Math.round(protein * 10) / 10 : 0,
        score: Number.isFinite(score) ? score : null,
      };
    });
  }, [rows, range]);

  const averages = useMemo(() => {
    const n = data.length || 1;
    const sum = data.reduce((a, r) => ({
      steps: a.steps + r.steps,
      sleep_h: a.sleep_h + r.sleep_h,
      workout_min: a.workout_min + r.workout_min,
      protein_g: a.protein_g + r.protein_g
    }), { steps:0, sleep_h:0, workout_min:0, protein_g:0 });
    return {
      steps: Math.round(sum.steps / n),
      sleep_h: +(sum.sleep_h / n).toFixed(1),
      workout_min: Math.round(sum.workout_min / n),
      protein_g: +(sum.protein_g / n).toFixed(1),
    };
  }, [data]);

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trends</h1>
          <div className="text-slate-400 text-sm">
            Aggregated daily data from Wearables, Sleep, Workouts, and Meals
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[7,14,30].map(n => (
            <button key={n}
              onClick={()=>setRange(n)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                range===n ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}>
              {n}d
            </button>
          ))}
        </div>
      </div>

      {(loading || error) && (
        <div className="mb-6 space-y-2">
          {loading && (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-sm text-slate-300">
              Loading latest data…
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Averages */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Avg Steps" value={averages.steps.toLocaleString()} />
        <Stat label="Avg Sleep" value={`${averages.sleep_h} h`} />
        <Stat label="Avg Workout" value={`${averages.workout_min} min`} />
        <Stat label="Avg Protein" value={`${averages.protein_g} g`} />
      </div>

      {/* Charts */}
      <div className="grid gap-6">
        <ChartCard title={`Steps (last ${range}d)`}>
          <TrendChart data={data} yKey="steps" color="#38bdf8" formatter={(v)=>v.toLocaleString()} />
        </ChartCard>

        <ChartCard title={`Sleep hours (last ${range}d)`}>
          <TrendChart data={data} yKey="sleep_h" color="#34d399" />
        </ChartCard>

        <ChartCard title={`Workout minutes (last ${range}d)`}>
          <TrendChart data={data} yKey="workout_min" color="#f59e0b" />
        </ChartCard>

        <ChartCard title={`Protein (g) (last ${range}d)`}>
          <TrendChart data={data} yKey="protein_g" color="#a78bfa" />
        </ChartCard>
      </div>
    </Layout>
  );
}

/* ---------- UI bits ---------- */
function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
      <div className="text-slate-300 text-sm mb-2">{title}</div>
      {children}
    </div>
  );
}

function TrendChart({ data, yKey, color = "#38bdf8", formatter }) {
  const ds = data.map(d => ({ ...d, label: niceDate(d.date) }));
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={ds}>
          <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            formatter={(v)=> formatter ? formatter(v) : v}
            labelFormatter={(l)=>`Date: ${l}`}
            contentStyle={{ background:"#0f172a", border:"1px solid #1e293b", color:"#e2e8f0" }}
          />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
