import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { Search, Plus, Save, FileSpreadsheet, ChevronRight } from "lucide-react";

export default function AdminFood() {
  const [demoMode, setDemoMode] = useState(true);
  const [foods, setFoods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]); // nutrients
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Load foods
  useEffect(() => {
    if (demoMode) {
      const base = sampleFoods();
      const filtered = q
        ? base.filter(f => (f.name + (f.brand || "")).toLowerCase().includes(q.toLowerCase()))
        : base;
      setFoods(filtered);
      if (!selected && filtered.length) setSelected(filtered[0]);
      return;
    }

    fetch(`/api/foods.php?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(setFoods)
      .catch(() => setMsg("Failed to load foods"));
  }, [demoMode, q]);

  // Load nutrients for selected food
  useEffect(() => {
    if (!selected) return;
    if (demoMode) {
      setRows(sampleFoodNutrients(selected.food_id));
      return;
    }
    fetch(`/api/food_nutrients.php?food_id=${selected.food_id}`)
      .then(r => r.json())
      .then(setRows)
      .catch(() => setMsg("Failed to load nutrients"));
  }, [demoMode, selected?.food_id]);

  function addFood() {
    if (!name.trim()) return;
    const newFood = {
      food_id: Date.now(),
      name: name.trim(),
      brand: brand.trim() || null,
    };
    setFoods([newFood, ...foods]);
    setSelected(newFood);
    setName("");
    setBrand("");
    setMsg("✅ Food added (demo)");
    setRows(sampleFoodNutrients(newFood.food_id));
  }

  function setAmount(nutrient_id, val) {
    setRows(rs =>
      rs.map(r =>
        r.nutrient_id === nutrient_id
          ? { ...r, amount_per_100g: val }
          : r
      )
    );
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 500));
    setMsg("✅ Saved (demo)");
    setBusy(false);
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-500/20 grid place-items-center">
            <FileSpreadsheet className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin — Food & Nutrients</h1>
            <p className="text-slate-400 text-sm">Manage food catalog and nutrient data</p>
          </div>
        </div>
        <button
          onClick={() => setDemoMode(d => !d)}
          className={`text-xs px-2 py-1 rounded-lg border ${
            demoMode
              ? "border-emerald-600 text-emerald-300 bg-emerald-600/10"
              : "border-slate-700 text-slate-300"
          }`}
        >
          {demoMode ? "Demo" : "Live"}
        </button>
      </div>

      {/* layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Foods List */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-300 font-semibold">Foods</div>
          </div>

          {/* Add form */}
          <div className="flex gap-2 mb-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Food name"
              className="inp flex-1"
            />
            <input
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="Brand (opt)"
              className="inp w-32"
            />
            <button onClick={addFood} className="btn flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="h-4 w-4 text-slate-400 absolute left-2 top-2.5" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search foods"
              className="inp pl-8 w-full"
            />
          </div>

          {/* Food list */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <ul className="divide-y divide-slate-800 max-h-[420px] overflow-auto">
              {foods.map(f => (
                <li
                  key={f.food_id}
                  onClick={() => setSelected(f)}
                  className={`px-3 py-2 cursor-pointer hover:bg-slate-800 ${
                    selected?.food_id === f.food_id ? "bg-slate-800" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-100">{f.name}</div>
                      <div className="text-xs text-slate-400">{f.brand || "—"}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                </li>
              ))}
              {foods.length === 0 && (
                <li className="px-3 py-8 text-center text-slate-400">No foods</li>
              )}
            </ul>
          </div>
        </div>

        {/* Nutrients Editor */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-300 font-semibold">Composition (per 100g)</div>
            <div className="flex items-center gap-2">
              {msg && (
                <span
                  className={`text-xs ${
                    msg.startsWith("✅") ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {msg}
                </span>
              )}
              <button
                onClick={save}
                disabled={!selected || busy}
                className="btn flex items-center gap-1 disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          {!selected ? (
            <div className="text-slate-400 text-sm">Select a food to edit nutrients</div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-slate-200 font-semibold">{selected.name}</div>
                <div className="text-slate-500 text-sm">{selected.brand || "—"}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400">
                    <tr className="text-left">
                      <th className="py-2">Nutrient</th>
                      <th>Amount</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rows.map(r => (
                      <tr key={r.nutrient_id}>
                        <td className="py-2">{r.name}</td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            value={r.amount_per_100g ?? ""}
                            onChange={e => setAmount(r.nutrient_id, Number(e.target.value))}
                            className="inp w-24"
                          />
                        </td>
                        <td className="text-slate-400">{r.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Tip: values are per 100g. Extend nutrients on the backend (e.g., carbs, fat, kcal).
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* --- Demo Data --- */
function sampleFoods() {
  return [
    { food_id: 1, name: "Chicken Breast", brand: null },
    { food_id: 2, name: "Oats", brand: null },
    { food_id: 3, name: "Orange", brand: null },
    { food_id: 4, name: "Greek Yogurt", brand: "Fage" },
    { food_id: 5, name: "Broccoli", brand: null },
  ];
}

function sampleFoodNutrients(food_id) {
  const base = [
    { nutrient_id: 1, name: "Protein", unit: "g", amount_per_100g: 0 },
    { nutrient_id: 2, name: "Fiber", unit: "g", amount_per_100g: 0 },
  ];
  if (food_id === 1) { base[0].amount_per_100g = 31; base[1].amount_per_100g = 0; }
  if (food_id === 2) { base[0].amount_per_100g = 10.6; base[1].amount_per_100g = 10; }
  if (food_id === 3) { base[0].amount_per_100g = 0.9; base[1].amount_per_100g = 2.4; }
  if (food_id === 4) { base[0].amount_per_100g = 10; base[1].amount_per_100g = 0; }
  if (food_id === 5) { base[0].amount_per_100g = 2.8; base[1].amount_per_100g = 2.6; }
  return base.map(x => ({ ...x }));
}
