import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const LS_KEY = "lh_wearables";

/* helper */
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/* random generator for demo mode */
function genDemo(days = 10) {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    data.push({
      id: d.toISOString(),
      date: d.toISOString().split("T")[0],
      steps: Math.floor(4000 + Math.random() * 6000),
      heart_rate: Math.floor(60 + Math.random() * 40),
      calories: Math.floor(1800 + Math.random() * 600),
    });
  }
  return data;
}

export default function Wearables() {
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [demo] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (saved.length === 0 && demo) {
      const demoRows = genDemo();
      setRows(demoRows);
      localStorage.setItem(LS_KEY, JSON.stringify(demoRows));
    } else setRows(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  }, [rows]);

  const avg = useMemo(() => {
    if (rows.length === 0) return { steps: 0, heart_rate: 0, calories: 0 };
    const sum = rows.reduce(
      (a, r) => ({
        steps: a.steps + r.steps,
        heart_rate: a.heart_rate + r.heart_rate,
        calories: a.calories + r.calories,
      }),
      { steps: 0, heart_rate: 0, calories: 0 }
    );
    const n = rows.length;
    return {
      steps: Math.round(sum.steps / n),
      heart_rate: Math.round(sum.heart_rate / n),
      calories: Math.round(sum.calories / n),
    };
  }, [rows]);

  function addRow(r) {
    setRows((v) => [{ ...r, id: Date.now() }, ...v]);
  }

  function delRow(id) {
    setRows((v) => v.filter((x) => x.id !== id));
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wearables</h1>
          <div className="text-slate-400 text-sm">
            Daily stats from your wearable device (demo mode)
          </div>
        </div>
        <button className="btn" onClick={() => setShow(true)}>
          Add manual entry
        </button>
      </div>

      {/* averages */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Avg Steps" value={avg.steps.toLocaleString()} />
        <StatCard label="Avg Heart Rate" value={`${avg.heart_rate} bpm`} />
        <StatCard label="Avg Calories" value={`${avg.calories} kcal`} />
      </div>

      {/* chart */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 mb-6">
        <div className="text-slate-400 text-sm mb-2">Steps trend (past {rows.length} days)</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={[...rows].reverse()}>
            <Line type="monotone" dataKey="steps" stroke="#38bdf8" strokeWidth={2} dot={false} />
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                color: "#f8fafc",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* list */}
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No wearable data yet. Click <span className="text-sky-400">Add manual entry</span> to simulate syncing.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <RowCard key={r.id} row={r} onDelete={() => delRow(r.id)} />
          ))}
        </div>
      )}

      {show && <NewEntryModal onClose={() => setShow(false)} onSave={addRow} />}
    </Layout>
  );
}

/* --- UI Components --- */
function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function RowCard({ row, onDelete }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{fmtDate(row.date)}</div>
          <div className="text-slate-400 text-sm">
            {row.steps.toLocaleString()} steps · {row.heart_rate} bpm · {row.calories} kcal
          </div>
        </div>
        <button
          onClick={onDelete}
          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function NewEntryModal({ onClose, onSave }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [steps, setSteps] = useState(7000);
  const [heart_rate, setHR] = useState(72);
  const [calories, setCalories] = useState(2200);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 200));
    onSave({ date, steps: Number(steps), heart_rate: Number(heart_rate), calories: Number(calories) });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">New Wearable Entry</div>
          <button
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Date</div>
            <input
              type="date"
              className="inp"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Steps</div>
            <input
              type="number"
              className="inp"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Heart Rate (bpm)</div>
            <input
              type="number"
              className="inp"
              value={heart_rate}
              onChange={(e) => setHR(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Calories (kcal)</div>
            <input
              type="number"
              className="inp"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="btn" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
