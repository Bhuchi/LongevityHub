import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";

/* ---- demo helpers ---- */
const LS_KEY = "lh_workouts";
const TYPES = ["Run", "Walk", "Bike", "Strength", "Swim", "Yoga"];
const INTENSITY = [
  { id: "easy",     label: "Easy",     factor: 1.0 },
  { id: "moderate", label: "Moderate", factor: 1.5 },
  { id: "hard",     label: "Hard",     factor: 2.0 },
];

/* time helpers */
const startOfWeek = (d) => {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun ... 6 Sat
  const diff = x.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(x.setDate(diff)); // local
};
const isSameWeek = (a, b) => {
  const sa = startOfWeek(a);
  const sb = startOfWeek(b);
  return sa.toDateString() === sb.toDateString();
};
const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Workouts() {
  const [rows, setRows] = useState([]); // [{id, start, minutes, type, intensity, note, effort}]
  const [q, setQ] = useState("");
  const [show, setShow] = useState(false);

  // load/save
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    setRows(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  }, [rows]);

  function addRow(r) { setRows((v) => [{ ...r, id: Date.now() }, ...v]); }
  function delRow(id) { setRows((v) => v.filter((x) => x.id !== id)); }

  // search + weekly stats
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.type.toLowerCase().includes(s) ||
        (r.note || "").toLowerCase().includes(s) ||
        r.intensity.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const weekStats = useMemo(() => {
    const now = new Date();
    const wk = rows.filter((r) => isSameWeek(new Date(r.start), now));
    const sessions = wk.length;
    const minutes = wk.reduce((t, r) => t + Number(r.minutes || 0), 0);
    const effort = wk.reduce((t, r) => t + Number(r.effort || 0), 0);
    return { sessions, minutes, effort };
  }, [rows]);

  return (
    <Layout>
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workouts</h1>
          <div className="text-slate-400 text-sm">
            Log sessions and see weekly totals (demo, saved in your browser)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search type, note, intensity…"
            className="inp w-64"
          />
          <button className="btn" onClick={() => setShow(true)}>
            Log workout
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <StatCard label="Sessions (this week)" value={weekStats.sessions} />
        <StatCard label="Minutes (this week)" value={weekStats.minutes} />
        <StatCard label="Effort score (this week)" value={weekStats.effort} />
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No workouts yet. Click <span className="text-sky-400">Log workout</span> to add your first one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => (
            <RowCard key={r.id} row={r} onDelete={() => delRow(r.id)} />
          ))}
        </div>
      )}

      {show && <QuickLog onClose={() => setShow(false)} onSave={addRow} />}
    </Layout>
  );
}

/* --- UI bits --- */
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
          <div className="font-semibold">{row.type} · {row.minutes} min</div>
          <div className="text-slate-400 text-sm">
            {fmt(row.start)} · {row.intensity} · Effort {row.effort}
          </div>
          {row.note && <div className="text-slate-300 text-sm mt-1">{row.note}</div>}
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

function QuickLog({ onClose, onSave }) {
  const [start, setStart] = useState(new Date().toISOString().slice(0, 16));
  const [minutes, setMinutes] = useState(45);
  const [type, setType] = useState("Run");
  const [intensity, setIntensity] = useState("moderate");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const factor = INTENSITY.find((i) => i.id === intensity)?.factor || 1;
  const effort = Math.round(Number(minutes || 0) * factor);

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 250));
    onSave({
      start: new Date(start).toISOString(),
      minutes: Number(minutes),
      type,
      intensity,
      note,
      effort,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Log workout</div>
          <button
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Start</div>
            <input
              type="datetime-local"
              className="inp"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Minutes</div>
              <input
                type="number"
                className="inp"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>

            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Type</div>
              <select
                className="inp"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Intensity</div>
            <div className="grid grid-cols-3 gap-2">
              {INTENSITY.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setIntensity(i.id)}
                  className={`px-3 py-2 rounded-xl text-sm ${
                    intensity === i.id
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
            <input
              className="inp"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., intervals, pushed last 10m"
            />
          </label>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm">
            <span className="text-slate-400">Effort score:</span>{" "}
            <span className="font-semibold">{effort}</span>{" "}
            <span className="text-slate-500">(minutes × intensity factor)</span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="btn" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save workout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
