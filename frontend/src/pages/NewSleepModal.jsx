// src/components/NewSleepModal.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const LS_KEY = "lh_sleep";

function hoursBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(0, (e - s) / 1000 / 3600);
}

export default function NewSleepModal({ onClose }) {
  const navigate = useNavigate();

  // default start = today 23:00
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setHours(23, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // default end = tomorrow 07:00
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(7, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  const [quality, setQuality] = useState("Good");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const hours = useMemo(() => hoursBetween(start, end), [start, end]);

  async function handleSave() {
    setSaving(true);

    // read existing
    const existing = JSON.parse(localStorage.getItem(LS_KEY) || "[]");

    const newRow = {
      id: Date.now(),
      start,
      end,
      hours,
      quality,
      note,
    };

    const next = [newRow, ...existing];
    localStorage.setItem(LS_KEY, JSON.stringify(next));

    // tiny delay like your other modals
    await new Promise((r) => setTimeout(r, 200));

    setSaving(false);
    onClose();
    // 👇 go to the real sleep page
    navigate("/sleep");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Log sleep</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
          >
            Close
          </button>
        </div>

        {/* form */}
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Start</div>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">End</div>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </div>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Quality</div>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
            >
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., woke up twice"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </label>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm">
            <span className="text-slate-400">Duration:</span>{" "}
            <span className="font-semibold text-slate-100">
              {hours.toFixed(1)} hours
            </span>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save sleep"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
