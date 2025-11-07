import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { Search } from "lucide-react";
import { Link, useLocation  } from "react-router-dom";

const LS_KEY = "lh_sleep";

/* time helper */
const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function hoursBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(0, (e - s) / 1000 / 3600);
}

export default function Sleep() {
  const [logs, setLogs] = useState([]); // [{id, start, end, hours, quality, note}]
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");
  const location = useLocation();

  // load from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    setLogs(saved);
  }, []);

  // save to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(logs));
  }, [logs]);
   useEffect(() => {
      if (location.state?.openLog === "meal") {
        setShowNew(true);
      }
    }, [location.state]);

  function addLog(log) {
    setLogs((v) => [{ ...log, id: Date.now() }, ...v]);
  }
  function delLog(id) {
    setLogs((v) => v.filter((x) => x.id !== id));
  }

  // filter by search
  const filtered = useMemo(() => {
    if (!q.trim()) return logs;
    const s = q.toLowerCase();
    return logs.filter(
      (r) =>
        (r.note || "").toLowerCase().includes(s) ||
        r.quality.toLowerCase().includes(s)
    );
  }, [logs, q]);

  const avg = useMemo(() => {
    if (logs.length === 0) return 0;
    const total = logs.reduce((t, r) => t + r.hours, 0);
    return (total / logs.length).toFixed(1);
  }, [logs]);

  return (
    <Layout>
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sleep</h1>
          <div className="text-slate-400 text-sm">
            Track your sleep duration and quality (demo stored locally)
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-64 shadow-sm hover:border-slate-600 transition">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes or quality..."
              className="bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 w-full"
            />
          </div>

          {/* Log Sleep Button */}
          <button
            onClick={() => setShow(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-sm transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Log sleep
          </button>
        </div>

      </div>

      {/* stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Stat label="Entries" value={logs.length} />
        <Stat label="Average Hours" value={avg} />
        <Stat label="Last Recorded" value={logs[0] ? fmt(logs[0].end) : "—"} />
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No sleep logs yet. Click{" "}
          <button
            className="text-sky-400 hover:underline"
            onClick={() => setShow(true)}
          >
            Log sleep
          </button>{" "}
          to add one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => (
            <Card key={r.id} row={r} onDelete={() => delLog(r.id)} />
          ))}
        </div>
      )}

      {show && <NewSleepModal onClose={() => setShow(false)} onSave={addLog} />}
    </Layout>
  );
}

/* --- components --- */
function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-xl font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function Card({ row, onDelete }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-slate-100">
            {row.hours.toFixed(1)} hours
          </div>
          <div className="text-slate-400 text-sm">
            {fmt(row.start)} → {fmt(row.end)} · {row.quality}
          </div>
          {row.note && (
            <div className="text-slate-200 text-sm mt-1">{row.note}</div>
          )}
        </div>
        <button
          onClick={onDelete}
          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function NewSleepModal({ onClose, onSave }) {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setHours(23, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [quality, setQuality] = useState("Good");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const hours = useMemo(() => hoursBetween(start, end), [start, end]);

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 250));
    onSave({ start, end, hours, quality, note });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold text-slate-100">Log sleep</div>
          <button
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Start</div>
              <input
                type="datetime-local"
                className="inp"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-sm text-slate-400 mb-1">End</div>
              <input
                type="datetime-local"
                className="inp"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Quality</div>
            <select
              className="inp"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">
              Note (optional)
            </div>
            <input
              className="inp"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., woke up early, restless night"
            />
          </label>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm">
            <span className="text-slate-400">Duration:</span>{" "}
            <span className="font-semibold text-slate-100">
              {hours.toFixed(1)} hours
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="btn" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save sleep"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
