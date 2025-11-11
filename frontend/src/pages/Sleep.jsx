// src/pages/Sleep.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { Plus, Search } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "../api";

// helpers for <input type="datetime-local">
const pad = n => String(n).padStart(2, "0");
function toLocalInputValue(date = new Date()) {
  const t = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
function toMySQL(localInput) {
  const d = new Date(localInput);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
const fmt = (sql) => new Date(String(sql).replace(" ", "T")).toLocaleString();

export default function Sleep() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/controllers/sleep.php");
        const rows = (data.sessions || []).map(s => ({
          id: s.sleep_id,
          start: s.start_time,
          end: s.end_time,
          minutes: s.minutes,
        }));
        setList(rows);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter(x =>
      fmt(x.start).toLowerCase().includes(s) ||
      fmt(x.end).toLowerCase().includes(s)
    );
  }, [list, q]);

  async function del(row) {
    try {
      await apiDelete(`/controllers/sleep.php?sleep_id=${row.id}`);
      setList(v => v.filter(x => x.id !== row.id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sleep</h1>
          <div className="text-slate-400 text-sm">
            Log your sleep sessions (overlap-safe by DB trigger).
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              className="bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 w-full"
            />
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Log sleep
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No sleep yet. Click{" "}
          <button
            className="text-sky-400 hover:underline"
            onClick={() => setShowNew(true)}
          >
            Log sleep
          </button>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(row => (
            <div
              key={row.id}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {fmt(row.start)} → {fmt(row.end)}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
                    onClick={() => setEditing(row)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
                    onClick={() => del(row)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-slate-400 text-sm mt-1">
                {row.minutes} minutes
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <SleepModal
          title="Log sleep"
          onClose={() => setShowNew(false)}
          onSave={async payload => {
            const res = await apiPost("/controllers/sleep.php", payload);
            const row = {
              id: res.sleep_id,
              start: payload.start,
              end: payload.end,
              minutes: Math.max(
                0,
                Math.round(
                  (new Date(payload.end) - new Date(payload.start)) / 60000
                )
              ),
            };
            setList(v => [row, ...v]);
          }}
        />
      )}

      {editing && (
        <SleepModal
          title="Edit sleep"
          initial={{
            start: toLocalInputValue(new Date(editing.start)),
            end: toLocalInputValue(new Date(editing.end)),
          }}
          onClose={() => setEditing(null)}
          onSave={async payload => {
            await apiPut("/controllers/sleep.php", {
              sleep_id: editing.id,
              ...payload,
            });
            setList(v =>
              v.map(x =>
                x.id === editing.id
                  ? {
                      ...x,
                      start: payload.start,
                      end: payload.end,
                      minutes: Math.max(
                        0,
                        Math.round(
                          (new Date(payload.end) - new Date(payload.start)) /
                            60000
                        )
                      ),
                    }
                  : x
              )
            );
          }}
        />
      )}
    </Layout>
  );
}

function SleepModal({ title, initial, onClose, onSave }) {
  const [start, setStart] = useState(
    initial?.start || toLocalInputValue(new Date())
  );
  const [end, setEnd] = useState(
    initial?.end || toLocalInputValue(new Date())
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const payload = { start: toMySQL(start), end: toMySQL(end) };
      await onSave(payload);
      onClose();
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{title}</div>
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
              onChange={e => setStart(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">End</div>
            <input
              type="datetime-local"
              className="inp"
              value={end}
              onChange={e => setEnd(e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white disabled:opacity-60"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
