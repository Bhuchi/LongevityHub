// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost } from "../api";

const TZ_OPTS = [
  "Asia/Bangkok", "UTC", "America/Los_Angeles", "America/New_York",
  "Europe/London", "Europe/Paris", "Asia/Singapore", "Asia/Tokyo",
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // user
  const [fullName, setFullName] = useState("");
  const [tz, setTz] = useState("Asia/Bangkok");

  // measurements (latest shown)
  const [height, setHeight] = useState("");   // cm
  const [weight, setWeight] = useState("");   // kg
  const [bodyFat, setBodyFat] = useState(""); // %
  const [waist, setWaist] = useState("");     // cm
  const [mNote, setMNote] = useState("");

  // goals
  const [steps, setSteps] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [workoutMins, setWorkoutMins] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/controllers/profile.php");

        const u = data.user || {};
        setFullName(u.full_name || "");
        setTz(u.tz || "Asia/Bangkok");

        const g = data.goals || data.goal || {}; // tolerate either shape
        setSteps(g.steps != null ? String(g.steps) : "");
        setSleepHours(g.sleep_hours != null ? String(g.sleep_hours) : "");
        setWorkoutMins(g.workout_min != null ? String(g.workout_min) : "");

        const m = data.latest || data.measurements || {};
        setHeight(m.height_cm ?? "");
        setWeight(m.weight_kg ?? "");
        setBodyFat(m.body_fat_pct ?? "");
        setWaist(m.waist_cm ?? "");
        setMNote(m.note ?? "");
      } catch (e) {
        setMsg("Failed to load: " + (e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setMsg("");
    try {
      const payload = {
        full_name: fullName,
        tz,
        // backend you posted accepts these at top level (POST)
        height_cm:    height !== "" ? Number(height) : null,
        weight_kg:    weight !== "" ? Number(weight) : null,
        body_fat_pct: bodyFat !== "" ? Number(bodyFat) : null,
        waist_cm:     waist !== "" ? Number(waist) : null,
        note:         mNote || "",
        steps:        steps !== "" ? Number(steps) : null,
        sleep_hours:  sleepHours !== "" ? Number(sleepHours) : null,
        workout_min:  workoutMins !== "" ? Number(workoutMins) : null,
      };

      await apiPost("/controllers/profile.php", payload);
      setMsg("✅ Saved");
    } catch (e) {
      setMsg("❌ " + (e.message || "Save failed"));
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Profile</h1>
      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account */}
          <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Account</h2>

            <label className="block mb-3">
              <div className="text-sm text-slate-400 mb-1">Full name</div>
              <input
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            <label className="block mb-3">
              <div className="text-sm text-slate-400 mb-1">Time zone</div>
              <select
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
              >
                {TZ_OPTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <h3 className="text-md font-semibold text-slate-100 mt-6 mb-2">
              Latest body measurements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-sm text-slate-400 mb-1">Height (cm)</div>
                <input className="inp" type="number" value={height} onChange={(e)=>setHeight(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-sm text-slate-400 mb-1">Weight (kg)</div>
                <input className="inp" type="number" value={weight} onChange={(e)=>setWeight(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-sm text-slate-400 mb-1">% Body fat</div>
                <input className="inp" type="number" value={bodyFat} onChange={(e)=>setBodyFat(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-sm text-slate-400 mb-1">Waist (cm)</div>
                <input className="inp" type="number" value={waist} onChange={(e)=>setWaist(e.target.value)} />
              </label>
            </div>

            <label className="block mt-3">
              <div className="text-sm text-slate-400 mb-1">Note</div>
              <input className="inp" value={mNote} onChange={(e)=>setMNote(e.target.value)} />
            </label>

            <button
              onClick={save}
              className="mt-5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold"
            >
              Save
            </button>

            {msg && (
              <div
                className={`mt-3 text-sm ${
                  msg.startsWith("✅") ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {msg}
              </div>
            )}
          </section>

          {/* Goals */}
          <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Goals</h2>

            <label className="block mb-3">
              <div className="text-sm text-slate-400 mb-1">Daily steps</div>
              <input className="inp" type="number" value={steps} onChange={(e)=>setSteps(e.target.value)} />
            </label>

            <label className="block mb-3">
              <div className="text-sm text-slate-400 mb-1">Sleep hours / night</div>
              <input className="inp" type="number" step="0.1" value={sleepHours} onChange={(e)=>setSleepHours(e.target.value)} />
            </label>

            <label className="block mb-3">
              <div className="text-sm text-slate-400 mb-1">Workout minutes / day</div>
              <input className="inp" type="number" value={workoutMins} onChange={(e)=>setWorkoutMins(e.target.value)} />
            </label>

            <p className="text-xs text-slate-500">
              Tip: You can add protein/fiber goals later by posting those keys too.
            </p>
          </section>
        </div>
      )}
    </Layout>
  );
}
