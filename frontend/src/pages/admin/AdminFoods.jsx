import React, { useMemo, useState } from "react";
import {
  Salad,
  ArrowLeft,
  Plus,
  Save,
  Search,
  ChevronRight,
  Info,
} from "lucide-react";
import Navbar from "../../components/Navbar"; // ✅ use your existing navbar
import { useNavigate } from "react-router-dom";

const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg ${className}`}>
    {children}
  </div>
);

const Button = ({ variant = "solid", size = "md", className = "", children, ...props }) => {
  const base = "rounded-xl font-semibold transition inline-flex items-center justify-center gap-2";
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-3.5 py-2",
  };
  const variants = {
    solid: "bg-sky-600 hover:bg-sky-500 text-white",
    ghost: "bg-slate-800/60 hover:bg-slate-800 text-slate-100 border border-slate-700",
    subtle: "bg-slate-900/60 hover:bg-slate-800/70 text-slate-200 border border-slate-700",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default function AdminFoods() {
  const navigate = useNavigate();

  // Demo data
  const [foods, setFoods] = useState([
    { id: 1, name: "Chicken Breast", brand: "", nutrients: { Protein: { amt: 31, unit: "g" }, Fiber: { amt: 0, unit: "g" } } },
    { id: 2, name: "Oats", brand: "", nutrients: { Protein: { amt: 13, unit: "g" }, Fiber: { amt: 10, unit: "g" } } },
    { id: 3, name: "Orange", brand: "", nutrients: { Protein: { amt: 1, unit: "g" }, Fiber: { amt: 2.4, unit: "g" } } },
    { id: 4, name: "Greek Yogurt", brand: "Fage", nutrients: { Protein: { amt: 10, unit: "g" }, Fiber: { amt: 0, unit: "g" } } },
    { id: 5, name: "Broccoli", brand: "", nutrients: { Protein: { amt: 2.8, unit: "g" }, Fiber: { amt: 2.6, unit: "g" } } },
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [nutrientDraft, setNutrientDraft] = useState({}); // { Protein: { amt, unit }, ... }

  const units = useMemo(() => ["g", "mg", "mcg", "kcal"], []);

  const selected = foods.find((f) => f.id === selectedId);
  const displayFoods = useMemo(() => {
    if (!query) return foods;
    return foods.filter((f) =>
      `${f.name} ${f.brand}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [foods, query]);

  // sync draft with selected
  React.useEffect(() => {
    if (!selected) return;
    const draft = Object.fromEntries(
      Object.entries(selected.nutrients).map(([k, v]) => [
        k,
        { amt: v.amt, unit: v.unit },
      ])
    );
    setNutrientDraft(draft);
    setNewBrand(selected.brand || "");
  }, [selectedId]); // eslint-disable-line

  const handleNutrientChange = (key, field, value) => {
    setNutrientDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === "amt" ? (value === "" ? "" : Number(value)) : value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // demo
    setFoods((prev) =>
      prev.map((f) =>
        f.id === selected.id
          ? { ...f, brand: newBrand.trim(), nutrients: nutrientDraft }
          : f
      )
    );
    setSaving(false);
  };

  const addFood = () => {
    const name = prompt("Food name:");
    if (!name) return;
    const id = Date.now();
    setFoods([{ id, name: name.trim(), brand: "", nutrients: {} }, ...foods]);
    setSelectedId(id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-600/15 border border-sky-700/40 grid place-items-center">
                <Salad className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin — Food & Nutrients</h1>
                <p className="text-slate-400 text-sm">
                  Manage food catalog and nutrient data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Admin Page
              </Button>
              <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg">
                Demo
              </span>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: foods list */}
            <Card className="lg:col-span-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Foods</h2>
                <Button variant="ghost" size="sm" onClick={addFood}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="flex gap-2 mb-3">
                <div className="relative w-full">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search foods"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2 max-h-[520px] overflow-auto pr-1">
                {displayFoods.map((f) => {
                  const active = f.id === selectedId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedId(f.id)}
                      className={`w-full text-left rounded-xl border px-3 py-3 group flex items-center justify-between
                     ${active ? "bg-slate-800/60 border-sky-700/50" : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/50"}`}
                    >
                      <div>
                        <div className="font-medium">{f.name}</div>
                        {f.brand ? (
                          <div className="text-xs text-slate-400">{f.brand}</div>
                        ) : (
                          <div className="text-xs text-slate-500">—</div>
                        )}
                      </div>
                      <ChevronRight className={`h-4 w-4 ${active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Right: composition editor */}
            <Card className="lg:col-span-2 p-5">
              {!selected ? (
                <div className="text-slate-400 text-sm">Select a food to edit.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-slate-400">Composition (per 100g)</div>
                      <h3 className="text-xl font-semibold">{selected.name}</h3>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[1fr_160px] gap-3 mb-4">
                    <input
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      placeholder="Brand (optional)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Info className="h-4 w-4" />
                      Tip: values are per 100g.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.keys(nutrientDraft).length === 0 && (
                      <div className="text-slate-400 text-sm">
                        No nutrients yet. Add Protein/Fiber/etc. in your backend or extend demo here.
                      </div>
                    )}

                    {Object.entries(nutrientDraft).map(([key, v]) => (
                      <div key={key} className="grid md:grid-cols-[160px_1fr_120px] gap-3 items-center">
                        <div className="text-slate-300">{key}</div>
                        <input
                          type="number"
                          step="0.1"
                          value={v.amt}
                          onChange={(e) => handleNutrientChange(key, "amt", e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                        />
                        <select
                          value={v.unit}
                          onChange={(e) => handleNutrientChange(key, "unit", e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                        >
                          {units.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="pt-5">
                    <div className="text-xs text-slate-500">
                      Tip: Extend nutrients (e.g., carbs, fat, kcal) on the backend and map them into this editor.
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
