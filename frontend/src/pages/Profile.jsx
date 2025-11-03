import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function Profile() {
  // demo: load current user (set by Login)
  const me = JSON.parse(localStorage.getItem("lh_user") || "null");

  const [form, setForm] = useState({
    full_name: "",
    tz: "Asia/Bangkok",
    height_cm: "",
    goal_steps: 10000,
    goal_sleep_hours: 8,
    goal_workout_min: 45,
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // load saved profile (demo)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("lh_profile") || "null");
    if (saved) setForm(saved);
    if (me?.full_name && !saved?.full_name) {
      setForm((v) => ({ ...v, full_name: me.full_name }));
    }
  }, []);

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setBusy(true);
    // demo delay
    await new Promise((r) => setTimeout(r, 400));
    localStorage.setItem("lh_profile", JSON.stringify(form));
    setBusy(false);
    setMsg("✅ Saved (demo)");
    setTimeout(() => setMsg(""), 1200);
  }

  function logout() {
    localStorage.removeItem("lh_user");
    window.location.href = "/login";
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button onClick={logout} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">
            Logout
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account card */}
          <Card>
            <Header title="Account" subtitle="Your basic information" />
            <div className="space-y-4">
              <Field label="Full name">
                <input
                  className="inp"
                  value={form.full_name}
                  onChange={(e) => setField("full_name", e.target.value)}
                  placeholder="Bob Member"
                />
              </Field>

              <Field label="Time zone">
                <select
                  className="inp"
                  value={form.tz}
                  onChange={(e) => setField("tz", e.target.value)}
                >
                  <option>Asia/Bangkok</option>
                  <option>Asia/Tokyo</option>
                  <option>Europe/London</option>
                  <option>America/New_York</option>
                  <option>America/Los_Angeles</option>
                </select>
              </Field>

              <Field label="Height (cm)">
                <input
                  type="number"
                  step="0.1"
                  className="inp"
                  value={form.height_cm}
                  onChange={(e) => setField("height_cm", e.target.value)}
                  placeholder="170"
                />
              </Field>

              <div className="flex justify-end gap-2">
                {msg && (
                  <span className={`text-sm ${msg.startsWith("✅") ? "text-emerald-400" : "text-rose-400"}`}>{msg}</span>
                )}
                <button onClick={save} disabled={busy} className="btn">
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </Card>

          {/* Goals card */}
          <Card>
            <Header title="Goals" subtitle="Used for readiness & dashboard" />
            <div className="space-y-4">
              <Field label="Daily steps">
                <input
                  type="number"
                  className="inp"
                  value={form.goal_steps}
                  onChange={(e) => setField("goal_steps", Number(e.target.value))}
                />
              </Field>
              <Field label="Sleep hours / night">
                <input
                  type="number"
                  step="0.1"
                  className="inp"
                  value={form.goal_sleep_hours}
                  onChange={(e) =>
                    setField("goal_sleep_hours", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Workout minutes / day">
                <input
                  type="number"
                  className="inp"
                  value={form.goal_workout_min}
                  onChange={(e) =>
                    setField("goal_workout_min", Number(e.target.value))
                  }
                />
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

/* --- small UI helpers (same style as the rest of your app) --- */
function Card({ children }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      {children}
    </div>
  );
}
function Header({ title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-slate-400 text-sm">{subtitle}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      {children}
    </label>
  );
}

/* Tailwind shorthands used in this file:
   .btn  -> primary action
   .inp  -> input styling
   If you don't already have these utilities globally,
   add them to src/index.css as below.
*/
