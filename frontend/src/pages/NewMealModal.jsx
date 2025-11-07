// src/components/NewMealModal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";   // 👈 add this line

// this must match the key in Meals.jsx
const LS_KEY = "lh_meals";

// NOTE: this is the same shape that Meals.jsx uses: {id, at, note, items, totals}
export default function NewMealModal({ onClose }) {
    const navigate = useNavigate();
    const [at, setAt] = useState(new Date().toISOString().slice(0, 16));
    const [note, setNote] = useState("");
    const [items, setItems] = useState([{ food_id: 1, grams: 150 }]); // one row
    const [saving, setSaving] = useState(false);

    // this is the same foods list that’s in Meals.jsx — keep IDs the same
    const FOODS = [
        { id: 1, name: "Chicken Breast", protein_g: 31, fiber_g: 0 },
        { id: 2, name: "Oats", protein_g: 10.6, fiber_g: 10 },
        { id: 3, name: "Orange", protein_g: 0.9, fiber_g: 2.4 },
        { id: 4, name: "Greek Yogurt", protein_g: 10, fiber_g: 0 },
        { id: 5, name: "Broccoli", protein_g: 2.8, fiber_g: 2.6 },
    ];

    function computeTotals(items) {
        let protein_g = 0;
        let fiber_g = 0;
        for (const it of items) {
            const f = FOODS.find((x) => x.id === Number(it.food_id));
            if (!f) continue;
            protein_g += (f.protein_g || 0) * (it.grams / 100);
            fiber_g += (f.fiber_g || 0) * (it.grams / 100);
        }
        return {
            protein_g: Number(protein_g.toFixed(1)),
            fiber_g: Number(fiber_g.toFixed(1)),
        };
    }

    const totals = computeTotals(items);

    function setItem(i, field, value) {
        setItems((arr) =>
            arr.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
        );
    }

    function addRow() {
        setItems((arr) => [...arr, { food_id: 1, grams: 100 }]);
    }

    function removeRow(i) {
        setItems((arr) => arr.filter((_, idx) => idx !== i));
    }
    async function save() {
        setSaving(true);

        // 1) Read existing meals from localStorage
        const existing = JSON.parse(localStorage.getItem(LS_KEY) || "[]");

        // 2) Build new meal record
        const newMeal = {
            id: Date.now(),
            at,
            note,
            items,
            totals,
        };

        // 3) Save new list
        const next = [newMeal, ...existing];
        localStorage.setItem(LS_KEY, JSON.stringify(next));

        // 4) Optional delay (for animation consistency)
        await new Promise((r) => setTimeout(r, 250));

        setSaving(false);
        onClose();

        // 5) ✅ Navigate to Meals page
        navigate("/meals");
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-5 relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                >
                    Close
                </button>
                <h2 className="text-lg font-semibold mb-4 text-slate-100">New meal</h2>

                <div className="grid gap-3">
                    {/* Meal time */}
                    <label className="block">
                        <div className="text-sm text-slate-400 mb-1">Meal time</div>
                        <input
                            type="datetime-local"
                            value={at}
                            onChange={(e) => setAt(e.target.value)}
                            className="inp"
                        />
                    </label>

                    {/* Note */}
                    <label className="block">
                        <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
                        <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g., chicken & rice"
                            className="inp"
                        />
                    </label>

                    {/* Items */}
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-slate-400">Items</div>
                            <button
                                onClick={addRow}
                                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                            >
                                Add item
                            </button>
                        </div>

                        <div className="space-y-2">
                            {items.map((it, i) => (
                                <div key={i} className="grid grid-cols-6 gap-2">
                                    <select
                                        className="inp col-span-4"
                                        value={it.food_id}
                                        onChange={(e) =>
                                            setItem(i, "food_id", Number(e.target.value))
                                        }
                                    >
                                        {FOODS.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        className="inp col-span-2"
                                        value={it.grams}
                                        onChange={(e) =>
                                            setItem(i, "grams", Number(e.target.value))
                                        }
                                    />
                                    <div className="col-span-6 flex justify-end">
                                        {items.length > 1 && (
                                            <button
                                                onClick={() => removeRow(i)}
                                                className="text-xs text-slate-400 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 text-sm text-slate-300">
                            Totals (auto):{" "}
                            <span className="font-semibold">
                                {totals.protein_g} g protein
                            </span>{" "}
                            ·{" "}
                            <span className="font-semibold">{totals.fiber_g} g fiber</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2">
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
                            {saving ? "Saving…" : "Save meal"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
