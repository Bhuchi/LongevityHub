// src/pages/Workouts.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { Search, Plus } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "../api";

/** Keep in sync with your DB ENUMs */
const INTENSITIES = ["easy", "moderate", "hard"];
const ACTIVITIES  = ["run", "walk", "cycle", "swim", "strength", "yoga", "row"]; // add only if enum has "row"

const fmtDate = (sql) => new Date(String(sql).replace(" ", "T")).toLocaleString();

const toLocalInputValue = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
};
const toMySQLDateTime = (localInput) => {
  const d = new Date(localInput);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [showNew, setShowNew]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/controllers/workouts.php");
        const normalized = (data.workouts || []).map(w => ({
          id: w.workout_id,                    // <<< IMPORTANT for delete
          started_at: w.started_at,
          duration_min: w.duration_min,
          intensity: w.intensity,
          note: w.note || "",
          activities: w.activities || [],      // [{activity_type, minutes, intensity, note}]
        }));
        setWorkouts(normalized);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return workouts;
    return workouts.filter(w =>
      (w.note || "").toLowerCase().includes(s) ||
      (w.activities || []).some(a => a.activity_type.toLowerCase().includes(s))
    );
  }, [q, workouts]);

  async function handleDelete(w) {
    try {
      await apiDelete(`/controllers/workouts.php?workout_id=${w.id}`);
      setWorkouts(list => list.filter(x => x.id !== w.id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  function addWorkout(w) {
    setWorkouts((l) => [w, ...l]);
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Workouts</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search workouts…"
              className="bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 w-full"
            />
          </div>

          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Log workout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No workouts yet. Click <button onClick={() => setShowNew(true)} className="text-sky-400 hover:underline font-medium">Log workout</button>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(w => (
            <div key={w.id} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{fmtDate(w.started_at)}</div>
                  <div className="text-slate-400 text-sm">{w.intensity} · {w.duration_min} min</div>
                </div>
                <button onClick={() => handleDelete(w)} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs">
                  Delete
                </button>
              </div>

              {!!w.note && <div className="mt-2 text-sm text-slate-300">{w.note}</div>}

              <ul className="mt-3 space-y-1 text-sm">
                {w.activities.map((a, i) => (
                  <li key={i} className="text-slate-300">• {a.activity_type} ({a.minutes} min{a.intensity ? `, ${a.intensity}` : ""}{a.note ? ` — ${a.note}` : ""})</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewWorkoutModal onClose={() => setShowNew(false)} onSaved={addWorkout} />}
    </Layout>
  );
}

/* ---------------- New workout modal ---------------- */
function NewWorkoutModal({ onClose, onSaved }) {
  const [start, setStart] = useState(toLocalInputValue(new Date()));
  const [duration, setDuration] = useState(50);
  const [intensity, setIntensity] = useState("moderate");
  const [note, setNote] = useState("");

  const [acts, setActs] = useState([{ activity_type: "row", minutes: 10, intensity: "easy", note: "" }]); // default matches enum
  const [saving, setSaving] = useState(false);

  const setAct = (i, f, v) => setActs(list => list.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const addAct = () => setActs(list => [...list, { activity_type: ACTIVITIES[0], minutes: 10, intensity: "easy", note: "" }]);
  const remAct = (i) => setActs(list => list.filter((_, idx) => idx !== i));

  const durationNumber = Number(duration) || 0;
  const totalActivityMinutes = useMemo(
    () => acts.reduce((sum, act) => sum + (Number(act.minutes) || 0), 0),
    [acts]
  );
  const minutesMatch = durationNumber > 0 && totalActivityMinutes === durationNumber;
  const canSave = !saving && acts.length > 0 && durationNumber > 0 && minutesMatch;

  async function save() {
    if (!acts.length) {
      alert("Add at least one activity.");
      return;
    }
    setSaving(true);
    try {
      // validate activity types are in the supported list to avoid enum truncation
      const cleanedActs = acts
        .filter(a => a.activity_type && ACTIVITIES.includes(a.activity_type))
        .map(a => ({ ...a, minutes: Number(a.minutes) || 0 }));

      if (!cleanedActs.length) {
        alert("Each activity needs a valid type and minutes.");
        setSaving(false);
        return;
      }

      const payload = {
        started_at: toMySQLDateTime(start),
        duration_min: Number(duration) || 0,
        intensity,
        note,
        activities: cleanedActs,
      };

      const minutesSum = cleanedActs.reduce((sum, a) => sum + (a.minutes || 0), 0);
      if (minutesSum !== payload.duration_min) {
        alert(`Activity minutes (${minutesSum}) must equal the workout duration (${payload.duration_min}).`);
        setSaving(false);
        return;
      }

      const data = await apiPost("/controllers/workouts.php", payload);
      // reflect in UI
      onSaved({
        id: data.workout_id,
        started_at: payload.started_at,
        duration_min: payload.duration_min,
        intensity: payload.intensity,
        note: payload.note,
        activities: payload.activities,
      });
      onClose();
    } catch (e) {
      alert("❌ Failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Log workout</div>
          <button className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm" onClick={onClose}>Close</button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Start time</div>
            <input type="datetime-local" className="inp" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Duration (min)</div>
              <input type="number" className="inp" value={duration} onChange={e => setDuration(e.target.value)} />
            </label>
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Intensity</div>
              <select className="inp" value={intensity} onChange={e => setIntensity(e.target.value)}>
                {INTENSITIES.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
            <input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., intervals + core" />
          </label>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">
                Activities{" "}
                <span className={minutesMatch ? "text-emerald-400" : "text-rose-400"}>
                  ({totalActivityMinutes} / {durationNumber} min)
                </span>
              </div>
              <button onClick={addAct} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Add activity</button>
            </div>
            <div className="space-y-2">
              {acts.map((a, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select className="inp col-span-4" value={a.activity_type} onChange={e => setAct(i, "activity_type", e.target.value)}>
                    {ACTIVITIES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input className="inp col-span-2" type="number" value={a.minutes} onChange={e => setAct(i, "minutes", Number(e.target.value))} />
                  <select className="inp col-span-3" value={a.intensity} onChange={e => setAct(i, "intensity", e.target.value)}>
                    {INTENSITIES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input className="inp col-span-2" placeholder="note" value={a.note} onChange={e => setAct(i, "note", e.target.value)} />
                  <button className="text-xs text-rose-400 hover:underline col-span-1" onClick={() => remAct(i)}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm" onClick={onClose}>Cancel</button>
            <button className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white disabled:opacity-60"
              onClick={save} disabled={!canSave}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
