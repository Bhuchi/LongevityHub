// src/components/NewWorkoutModal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LS_KEY = "lh_workouts";

export default function NewWorkoutModal({ onClose }) {
  const navigate = useNavigate();
  const [start, setStart] = useState(new Date().toISOString().slice(0, 16));
  const [minutes, setMinutes] = useState(45);
  const [type, setType] = useState("Run");
  const [intensity, setIntensity] = useState("moderate");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);

    const existing = JSON.parse(localStorage.getItem(LS_KEY) || "[]");

    // compute effort the same way as in Workouts.jsx
    const intensityFactor =
      intensity === "easy" ? 1 : intensity === "hard" ? 2 : 1.5;
    const effort = Number((minutes * intensityFactor).toFixed(1));

    const newRow = {
      id: Date.now(),
      start,
      minutes: Number(minutes),
      type,
      intensity,
      note,
      effort,
    };

    const next = [newRow, ...existing];
    localStorage.setItem(LS_KEY, JSON.stringify(next));

    await new Promise((r) => setTimeout(r, 200));

    setSaving(false);
    onClose();
    navigate("/workouts"); // ✅ go to workouts page
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Log workout</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Start</div>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="inp"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Minutes</div>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="inp"
              />
            </label>
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Type</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="inp"
              >
                <option>Run</option>
                <option>Walk</option>
                <option>Bike</option>
                <option>Strength</option>
                <option>Swim</option>
                <option>Yoga</option>
              </select>
            </label>
          </div>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Intensity</div>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="inp"
            >
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="inp"
              placeholder="e.g., legs felt heavy"
            />
          </label>

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save workout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
