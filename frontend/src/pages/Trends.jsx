import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ---- LS keys from your other pages ---- */
const LS_WEAR = "lh_wearables"; // [{date, steps, heart_rate, calories}]
const LS_SLEEP = "lh_sleep";    // [{start, end, hours, quality, note, id}]
const LS_WO   = "lh_workouts";  // [{start, minutes, type, intensity, effort, id}]
const LS_MEAL = "lh_meals";     // [{at, items, totals:{protein_g,fiber_g}, id}]

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

function sumBy(arr, pickDate, pickVal) {
  // returns { 'YYYY-MM-DD': total }
  const m = {};
  for (const x of arr) {
    const k = pickDate(x);
    const v = Number(pickVal(x) || 0);
    m[k] = (m[k] ?? 0) + v;
  }
  return m;
}

/* ---- Trends page ---- */
export default function Trends() {
  const [range, setRange] = useState(14); // 7 | 14 | 30

  // load once
  const wear = useMemo(() => JSON.parse(localStorage.getItem(LS_WEAR) || "[]"), []);
  const sleep = useMemo(() => JSON.parse(localStorage.getItem(LS_SLEEP) || "[]"), []);
  const wo = useMemo(() => JSON.parse(localStorage.getItem(LS_WO) || "[]"), []);
  const meals = useMemo(() => JSON.parse(localStorage.getItem(LS_MEAL) || "[]"), []);

  // aggregate per day
  const stepsByDay   = useMemo(() => sumBy(wear,   r => r.date,                    r => r.steps), [wear]);
  const sleepByDay   = useMemo(() => sumBy(sleep,  r => r.end?.slice(0,10),        r => r.hours), [sleep]);
  const workoutByDay = useMemo(() => sumBy(wo,     r => r.start?.slice(0,10),      r => r.minutes), [wo]);
  const proteinByDay = useMemo(() => sumBy(meals,  r => (r.at||"").slice(0,10),    r => r.totals?.protein_g || 0), [meals]);

  // build the chart dataset for selected range
  const data = useMemo(() => {
    const days = daysBack(range);
    return days.map(d => ({
      date: d,
      steps: stepsByDay[d] ?? 0,
      sleep_h: +(sleepByDay[d] ?? 0).toFixed(2),
      workout_min: workoutByDay[d] ?? 0,
      protein_g: +(proteinByDay[d] ?? 0).toFixed(1),
    }));
  }, [range, stepsByDay, sleepByDay, workoutByDay, proteinByDay]);

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
            Aggregated daily data from Wearables, Sleep, Workouts, and Meals (demo)
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
