// src/pages/Meals.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useLocation } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "../api";

/* foods (per 100g) */
const FOODS = [
  { id: 1, name: "Chicken Breast", protein_g: 31, fiber_g: 0 },
  { id: 2, name: "Oats", protein_g: 10.6, fiber_g: 10 },
  { id: 3, name: "Orange", protein_g: 0.9, fiber_g: 2.4 },
  { id: 4, name: "Greek Yogurt", protein_g: 10, fiber_g: 0 },
  { id: 5, name: "Broccoli", protein_g: 2.8, fiber_g: 2.6 },
];

const fmtDate = (s) => new Date(String(s).replace(" ", "T")).toLocaleString();
function computeTotals(items) {
  let protein = 0, fiber = 0;
  for (const it of items) {
    const f = FOODS.find(x => x.id === Number(it.food_id));
    if (!f) continue;
    const factor = (Number(it.grams) || 0) / 100;
    protein += (f.protein_g || 0) * factor;
    fiber += (f.fiber_g || 0) * factor;
  }
  return { protein_g: +protein.toFixed(1), fiber_g: +fiber.toFixed(1) };
}
function getUser() { try { return JSON.parse(localStorage.getItem("lh_user") || "null"); } catch { return null; } }
function toLocalInputValue(date = new Date()) {
  const pad = n => String(n).padStart(2, "0");
  const t = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
function toMySQLDateTime(localInput) {
  const d = new Date(localInput); const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const location = useLocation();

  useEffect(() => { if (location.state?.openLog === "meal") setShowNew(true); }, [location.state]);

  useEffect(() => {
    const user = getUser();
    if (!user) { setMeals([]); setLoading(false); return; }
    (async () => {
      try {
        const data = await apiGet(`/controllers/meals.php?user_id=${user.user_id}`);
        const normalized = (data.meals || []).map(m => ({
          id: m.meal_id,
          at: m.eaten_at,
          note: m.note || "",
          items: m.items || [],
          totals: m.totals || computeTotals(m.items || []),
        }));
        setMeals(normalized);
      } catch (e) {
        console.error("Load meals failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return meals;
    const s = q.toLowerCase();
    return meals.filter(m =>
      (m.note || "").toLowerCase().includes(s) ||
      m.items.some(it => (FOODS.find(f => f.id === Number(it.food_id))?.name || "").toLowerCase().includes(s))
    );
  }, [meals, q]);

  function addMeal(newMeal) { setMeals(v => [newMeal, ...v]); }
  function removeMeal(id) { setMeals(v => v.filter(m => m.id !== id)); }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Meals</h1>
          <div className="text-slate-400 text-sm">Log meals and auto-calc protein & fiber (writes to DB)</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search meals or foods..."
              className="bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 w-full"
            />
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-sm transition">
            <Plus className="h-4 w-4" />
            Log meal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No meals yet. Click{" "}
          <button onClick={() => setShowNew(true)} className="text-sky-400 hover:underline font-medium">Log meal</button>{" "}
          to add your first one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(m => (
            <MealCard key={m.id} meal={m} onDeleted={removeMeal} />
          ))}
        </div>
      )}

      {showNew && <NewMealModal onClose={() => setShowNew(false)} onSaved={addMeal} />}
    </Layout>
  );
}

function MealCard({ meal, onDeleted }) {
  async function handleDelete() {
    try {
      await apiDelete(`/controllers/meals.php?meal_id=${meal.id}`);
      onDeleted(meal.id);
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{fmtDate(meal.at)}</div>
          {meal.note && <div className="text-slate-400 text-sm">{meal.note}</div>}
        </div>
        <button onClick={handleDelete} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs">
          Delete
        </button>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {meal.items.map((it, idx) => {
          const f = FOODS.find(x => x.id === Number(it.food_id));
          return (
            <li key={idx} className="flex justify-between text-slate-300">
              <span>{f?.name || "Unknown"} <span className="text-slate-500">• {it.grams} g</span></span>
              <span className="text-slate-500">
                {(f?.protein_g ?? 0) * (it.grams / 100) > 0 ? `${((f?.protein_g ?? 0) * (it.grams / 100)).toFixed(1)}g P` : ""}
                {((f?.fiber_g ?? 0) * (it.grams / 100) > 0) && ` · ${((f?.fiber_g ?? 0) * (it.grams / 100)).toFixed(1)}g F`}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm">
        <div className="text-slate-400">Totals</div>
        <div className="font-semibold">{meal.totals.protein_g} g protein · {meal.totals.fiber_g} g fiber</div>
      </div>
    </div>
  );
}

function NewMealModal({ onClose, onSaved }) {
  const [at, setAt] = useState(toLocalInputValue(new Date()));
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ food_id: 1, grams: 150 }]);
  const [saving, setSaving] = useState(false);

  const totals = computeTotals(items);
  const setItem = (i, field, value) => setItems(arr => arr.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addRow = () => setItems(arr => [...arr, { food_id: 1, grams: 100 }]);
  const removeRow = (i) => setItems(arr => arr.filter((_, idx) => idx !== i));

  async function save() {
    setSaving(true);
    try {
      const payload = { at: toMySQLDateTime(at), note, items };
      const data = await apiPost("/controllers/meals.php", payload);
      if (!data?.ok) throw new Error(data?.error || "Unknown error");

      onSaved({ id: data.meal_id, at: payload.at, note: payload.note, items: payload.items, totals });
      onClose();
    } catch (err) {
      alert("❌ Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">New meal</div>
          <button className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm" onClick={onClose}>Close</button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Meal time</div>
            <input type="datetime-local" className="inp" value={at} onChange={(e) => setAt(e.target.value)} step="60" />
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
            <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., chicken & rice" />
          </label>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">Items</div>
              <button onClick={addRow} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Add item</button>
            </div>

            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-6 gap-2">
                  <select className="inp col-span-4" value={it.food_id} onChange={(e) => setItem(i, "food_id", Number(e.target.value))}>
                    {FOODS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <input type="number" className="inp col-span-2" value={it.grams} onChange={(e) => setItem(i, "grams", Number(e.target.value))} />
                  <div className="col-span-6 flex justify-end">
                    {items.length > 1 && <button className="text-xs text-rose-400 hover:underline" onClick={() => removeRow(i)}>Remove</button>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-sm text-slate-300">
              Totals (auto): <span className="font-semibold">{totals.protein_g} g protein</span> · <span className="font-semibold">{totals.fiber_g} g fiber</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm" onClick={onClose}>Cancel</button>
            <button className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white disabled:opacity-60"
              onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save meal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
