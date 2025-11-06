import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";

/* ---------- demo foods catalog (per 100g) ---------- */
const FOODS = [
  { id: 1, name: "Chicken Breast", protein_g: 31, fiber_g: 0 },
  { id: 2, name: "Oats", protein_g: 10.6, fiber_g: 10 },
  { id: 3, name: "Orange", protein_g: 0.9, fiber_g: 2.4 },
  { id: 4, name: "Greek Yogurt", protein_g: 10, fiber_g: 0 },
  { id: 5, name: "Broccoli", protein_g: 2.8, fiber_g: 2.6 },
];

/* ---------- helpers ---------- */
const LS_KEY = "lh_meals";
const fmtDate = (iso) => new Date(iso).toLocaleString();

function computeTotals(items) {
  // items: [{food_id, grams}]
  let protein = 0, fiber = 0;
  for (const it of items) {
    const f = FOODS.find(x => x.id === Number(it.food_id));
    if (!f) continue;
    const factor = (Number(it.grams) || 0) / 100;
    protein += f.protein_g * factor;
    fiber += f.fiber_g * factor;
  }
  return { protein_g: Number(protein.toFixed(1)), fiber_g: Number(fiber.toFixed(1)) };
}

/* ---------- main page ---------- */
export default function Meals() {
  const [meals, setMeals] = useState([]); // [{id, at, note, items, totals}]
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);

  // load/save localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    setMeals(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(meals));
  }, [meals]);

  const filtered = useMemo(() => {
    if (!q.trim()) return meals;
    const s = q.toLowerCase();
    return meals.filter(m =>
      (m.note || "").toLowerCase().includes(s) ||
      m.items.some(it => (FOODS.find(f => f.id === Number(it.food_id))?.name || "").toLowerCase().includes(s))
    );
  }, [meals, q]);

  function addMeal(m) {
    setMeals(v => [{ ...m, id: Date.now() }, ...v]);
  }
  function removeMeal(id) {
    setMeals(v => v.filter(m => m.id !== id));
  }
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Meals</h1>
          <div className="text-slate-400 text-sm">
            Log meals and auto-calc protein & fiber (demo)
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* search box */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-64">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search meals or foods..."
              className="bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 w-full"
            />
          </div>

          {/* ✅ THIS is the one that opens the modal */}
          <button
            onClick={() => setShowNew(true)}      // ⬅️ use setShowNew here
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Log meals
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
          No meals yet. Click{" "}
          <button
            onClick={() => setShowNew(true)}
            className="text-sky-400 hover:underline font-medium"
          >
            New meal
          </button>{" "}
          to add your first one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(m => (
            <MealCard key={m.id} meal={m} onDelete={() => removeMeal(m.id)} />
          ))}
        </div>
      )}

      {showNew && <NewMealModal onClose={() => setShowNew(false)} onSave={addMeal} />}
    </Layout>
  );
}

/* ---------- cards & modal ---------- */
function MealCard({ meal, onDelete }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{fmtDate(meal.at)}</div>
          {meal.note && <div className="text-slate-400 text-sm">{meal.note}</div>}
        </div>
        <button onClick={onDelete} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs">Delete</button>
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

function NewMealModal({ onClose, onSave }) {
  const [at, setAt] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ food_id: 1, grams: 150 }]); // start with one row
  const [saving, setSaving] = useState(false);
  const totals = computeTotals(items);

  function setItem(i, field, value) {
    setItems(arr => arr.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  function addRow() { setItems(arr => [...arr, { food_id: 1, grams: 100 }]); }
  function removeRow(i) { setItems(arr => arr.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave({ at: new Date(at).toISOString(), note, items, totals });
    setSaving(false);
    onClose();
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
            <input type="datetime-local" className="inp" value={at} onChange={e => setAt(e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
            <input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., chicken & rice" />
          </label>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">Items</div>
              <button onClick={addRow} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Add item</button>
            </div>

            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-6 gap-2">
                  <select className="inp col-span-4" value={it.food_id} onChange={e => setItem(i, 'food_id', Number(e.target.value))}>
                    {FOODS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <input type="number" className="inp col-span-2" value={it.grams} onChange={e => setItem(i, 'grams', Number(e.target.value))} />
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
            <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save meal"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
