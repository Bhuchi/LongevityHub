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
} from "recharts";

const API_URL = "http://localhost:8888"; // ✅ your MAMP root (no /api)

/* --- Helper --- */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default function Wearables() {
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);

  /* --- Fetch data from MySQL --- */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/get_wearables.php`);
        const data = await res.json();
        setRows(data);
      } catch (err) {
        console.error("⚠️ Error fetching wearables:", err);
      }
    }
    load();
  }, []);

  /* --- Upload CSV file --- */
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/add_wearables_upload.php`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "ok") {
        alert(`✅ Imported ${data.rows_imported} records`);
        window.location.reload();
      } else {
        alert("❌ Upload failed: " + (data.error || "unknown error"));
      }
    } catch (err) {
      alert("⚠️ Error: " + err.message);
    }
  }

  /* --- Compute averages --- */
  const avg = useMemo(() => {
    if (rows.length === 0)
      return { steps: 0, heart_rate: 0, calories: 0 };

    const sum = rows.reduce(
      (a, r) => ({
        steps: a.steps + (r.steps || 0),
        heart_rate: a.heart_rate + (r.heart_rate || 0),
        calories: a.calories + (r.calories || 0),
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

  return (
    <Layout>
      {/* --- Header --- */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wearables</h1>
          <div className="text-slate-400 text-sm">
            Daily stats from your wearable device
          </div>
        </div>
        <button className="btn" onClick={() => setShow(true)}>
          Add manual entry
        </button>
      </div>

      {/* --- CSV Import Section --- */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="text-slate-300 flex items-center gap-2">
            <span>📂</span>
            <div>
              <div className="font-semibold">Wearables CSV</div>
              <div className="text-sm text-slate-400">
                Import steps / HRV / resting HR from supported devices.
              </div>
            </div>
          </div>
          <div className="ml-auto flex gap-3">
            <a
              href={`${API_URL}/wearable_template.csv`}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              download
            >
              Download template
            </a>
            <label className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm text-white cursor-pointer">
              Upload file
              <input type="file" accept=".csv" hidden onChange={handleUpload} />
            </label>
          </div>
        </div>
      </div>

      {/* --- Average Cards --- */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Avg Steps" value={avg.steps.toLocaleString()} />
        <StatCard label="Avg Heart Rate" value={`${avg.heart_rate} bpm`} />
        <StatCard label="Avg Calories" value={`${avg.calories} kcal`} />
      </div>

      {/* --- Chart --- */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 mb-6">
        <div className="text-slate-400 text-sm mb-2">
          Steps trend (past {rows.length} days)
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={[...rows].reverse()}>
            <Line
              type="monotone"
              dataKey="steps"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
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

      {/* --- Data List --- */}
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No wearable data yet. Upload a CSV file or add manually.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r, i) => (
            <RowCard key={i} row={r} />
          ))}
        </div>
      )}

      {show && <NewEntryModal onClose={() => setShow(false)} />}
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

function RowCard({ row }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div>
        <div className="font-semibold">{fmtDate(row.date)}</div>
        <div className="text-slate-400 text-sm">
          {row.steps?.toLocaleString() || 0} steps · {row.heart_rate || "-"} bpm ·{" "}
          {row.calories || "-"} kcal
        </div>
      </div>
    </div>
  );
}

/* --- Add Manual Entry Modal --- */
function NewEntryModal({ onClose }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [steps, setSteps] = useState(7000);
  const [heart_rate, setHR] = useState(72);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`${API_URL}/add_wearable.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, steps, heart_rate, hrv: 70 }),
      });
      alert("✅ Entry added successfully");
      window.location.reload();
    } catch (err) {
      alert("⚠️ Error: " + err.message);
    } finally {
      setSaving(false);
      onClose();
    }
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
