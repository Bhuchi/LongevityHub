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
const PAGE_SIZE = 30;
const RANGE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All" },
];

/* --- Helper --- */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default function Wearables() {
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [range, setRange] = useState("7d");

  /* --- Fetch data from MySQL --- */
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        params.append("range", range);
        if (appliedSearch) params.append("date", appliedSearch);
        const res = await fetch(`${API_URL}/get_wearables.php?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!active) return;
        const list = Array.isArray(data?.rows)
          ? data.rows
          : Array.isArray(data)
          ? data
          : [];
        setRows(list);
        setHasMore(Boolean(data?.has_more));
        const totalDays = data?.total_days ?? (appliedSearch ? list.length : PAGE_SIZE);
        setTotalPages(Math.max(1, Math.ceil(totalDays / PAGE_SIZE)));
      } catch (err) {
        if (!active) return;
        console.error("⚠️ Error fetching wearables:", err);
        setError(err.message || "Failed to load wearables.");
        setRows([]);
        setHasMore(false);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [page, appliedSearch, range]);

  function applySearch() {
    setPage(1);
    setAppliedSearch(search);
  }

function clearSearch() {
  setSearch("");
  setAppliedSearch("");
  setPage(1);
}

const pageButtons = useMemo(() => {
  const base = new Set([1, totalPages, page - 1, page, page + 1]);
  const arr = [...base].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  return arr;
}, [page, totalPages]);

function jumpToPage() {
  if (!pageInput) return;
  const target = Math.max(1, Math.min(totalPages, Number(pageInput)));
  setPage(target);
}

function handleRangeChange(val) {
  setRange(val);
  setPage(1);
}

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
        credentials: "include",
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
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

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <label className="text-slate-400 text-sm flex items-center gap-2">
            <span>Filter by date:</span>
            <input
              type="date"
              className="inp max-w-[180px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={applySearch}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
            >
              Apply
            </button>
            {appliedSearch && (
              <button
                onClick={clearSearch}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-slate-400">Show:</span>
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleRangeChange(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-sm border transition ${
              range === opt.value
                ? "bg-sky-600 border-sky-500 text-white"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
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
          Steps trend (page {page} — {rows.length} days)
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
      {loading ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-950/40 border border-rose-800 p-8 text-center text-rose-200">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No wearable data {appliedSearch ? "for that date" : "yet"}. Upload a CSV file or add manually.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((r) => (
              <RowCard key={r.date} row={r} />
            ))}
          </div>
          {!appliedSearch && (
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {pageButtons.map((num, idx) => (
                    <React.Fragment key={num}>
                      {idx > 0 && pageButtons[idx - 1] !== num - 1 && (
                        <span className="text-slate-500 px-1">…</span>
                      )}
                      <button
                        className={`px-3 py-1 rounded-xl text-sm border ${
                          num === page
                            ? "bg-sky-600 border-sky-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                        onClick={() => setPage(num)}
                        disabled={num === page}
                      >
                        {num}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                <button
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next →
                </button>
              </div>

              <form
                className="flex items-center gap-2 text-sm text-slate-400"
                onSubmit={(e) => {
                  e.preventDefault();
                  jumpToPage();
                }}
              >
                <span>Jump to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="inp max-w-[120px]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm disabled:opacity-50"
                  disabled={!pageInput}
                >
                  Go
                </button>
              </form>
            </div>
          )}
        </>
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
  const [hrv, setHrv] = useState(70);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`${API_URL}/add_wearable.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date, steps, heart_rate, hrv }),
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

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">HRV (ms)</div>
            <input
              type="number"
              className="inp"
              value={hrv}
              onChange={(e) => setHrv(e.target.value)}
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
