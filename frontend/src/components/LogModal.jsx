import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Utensils, Dumbbell, Moon, Watch } from "lucide-react";
import { apiPost } from "../api";
import { FOODS } from "../data/foods";

const TYPE_META = {
  meal: { label: "Meal", icon: <Utensils className="h-6 w-6 text-amber-400" /> },
  workout: { label: "Workout", icon: <Dumbbell className="h-6 w-6 text-sky-400" /> },
  sleep: { label: "Sleep", icon: <Moon className="h-6 w-6 text-violet-400" /> },
  wearable: { label: "Wearable", icon: <Watch className="h-6 w-6 text-emerald-400" /> },
};

const INTENSITIES = ["easy", "moderate", "hard"];
const ACTIVITIES = ["run", "cycle", "strength", "swim", "yoga", "other"];

const pad = (n) => String(n).padStart(2, "0");
const toLocalInputValue = (date = new Date()) => {
  const t = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
};
const toMySQLDateTime = (localInput) => {
  const d = new Date(localInput);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function LogModal({ isOpen, onClose, type: initialType }) {
  const [activeType, setActiveType] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType || "");
    } else {
      setActiveType("");
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-slate-100 relative shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            {!activeType ? (
              <>
                <h2 className="text-xl font-semibold mb-2">Log entry</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Choose what you’d like to log. Each form writes directly to the database.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(TYPE_META).map(([type, meta]) => (
                    <button
                      key={type}
                      onClick={() => setActiveType(type)}
                      className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
                    >
                      {meta.icon}
                      <div className="mt-2 text-sm font-medium">{meta.label}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <FormRouter
                type={activeType}
                onBack={() => setActiveType("")}
                onDone={onClose}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormRouter({ type, onBack, onDone }) {
  switch (type) {
    case "meal":
      return <MealQuickForm onBack={onBack} onDone={onDone} />;
    case "workout":
      return <WorkoutQuickForm onBack={onBack} onDone={onDone} />;
    case "sleep":
      return <SleepQuickForm onBack={onBack} onDone={onDone} />;
    case "wearable":
      return <WearableQuickForm onBack={onBack} onDone={onDone} />;
    default:
      return null;
  }
}

function MealQuickForm({ onBack, onDone }) {
  const [at, setAt] = useState(toLocalInputValue(new Date()));
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ food_id: 1, grams: 150 }]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const sanitizedItems = useMemo(
    () =>
      items
        .map((it) => ({
          food_id: Number(it.food_id) || 0,
          grams: Number(it.grams) || 0,
        }))
        .filter((it) => it.food_id > 0 && it.grams > 0),
    [items]
  );

  async function handleSave(e) {
    e.preventDefault();
    if (!sanitizedItems.length) {
      setStatus("Add at least one food item.");
      return;
    }
    const mysql = toMySQLDateTime(at);
    if (!mysql) {
      setStatus("Invalid date/time.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await apiPost("/controllers/meals.php", {
        at: mysql,
        note,
        items: sanitizedItems,
      });
      setStatus("✅ Meal logged");
      setTimeout(onDone, 600);
    } catch (err) {
      setStatus(err.message || "Meal log failed");
    } finally {
      setSaving(false);
    }
  }

  const updateItem = (idx, field, value) =>
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  const addItem = () => setItems((prev) => [...prev, { food_id: 1, grams: 100 }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <FormHeader label="Meal" onBack={onBack} />
      <label className="block">
        <div className="text-sm text-slate-400 mb-1">Time eaten</div>
        <input
          type="datetime-local"
          className="inp w-full"
          value={at}
          onChange={(e) => setAt(e.target.value)}
          required
        />
      </label>

      <label className="block">
        <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
        <input
          className="inp w-full"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Chicken & rice bowl"
        />
      </label>

      <div className="space-y-3">
        <div className="text-sm text-slate-400">Food items</div>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <select
              className="inp flex-1"
              value={item.food_id}
              onChange={(e) => updateItem(idx, "food_id", e.target.value)}
            >
              {FOODS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="inp w-24"
              value={item.grams}
              min={1}
              onChange={(e) => updateItem(idx, "grams", e.target.value)}
            />
            {items.length > 1 && (
              <button
                type="button"
                className="px-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                onClick={() => removeItem(idx)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-sky-400 hover:underline"
        >
          + Add food
        </button>
      </div>

      {status && <div className="text-sm text-slate-300">{status}</div>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold"
      >
        {saving ? "Saving…" : "Save meal"}
      </button>
    </form>
  );
}

function WorkoutQuickForm({ onBack, onDone }) {
  const [start, setStart] = useState(toLocalInputValue(new Date()));
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState("moderate");
  const [activity, setActivity] = useState("strength");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    const mysql = toMySQLDateTime(start);
    if (!mysql) {
      setStatus("Invalid start time.");
      return;
    }
    const durationMin = Number(duration) || 0;
    if (durationMin <= 0) {
      setStatus("Duration must be greater than 0.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await apiPost("/controllers/workouts.php", {
        started_at: mysql,
        duration_min: durationMin,
        intensity,
        note,
        activities: [
          {
            activity_type: activity,
            minutes: durationMin,
            intensity,
            note: "",
          },
        ],
      });
      setStatus("✅ Workout logged");
      setTimeout(onDone, 600);
    } catch (err) {
      setStatus(err.message || "Workout log failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <FormHeader label="Workout" onBack={onBack} />
      <label className="block">
        <div className="text-sm text-slate-400 mb-1">Start time</div>
        <input
          type="datetime-local"
          className="inp w-full"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="text-sm text-slate-400 mb-1">Duration (min)</div>
          <input
            type="number"
            className="inp w-full"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
            required
          />
        </label>
        <label className="block">
          <div className="text-sm text-slate-400 mb-1">Intensity</div>
          <select
            className="inp w-full"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
          >
            {INTENSITIES.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <div className="text-sm text-slate-400 mb-1">Primary activity</div>
        <select
          className="inp w-full"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        >
          {ACTIVITIES.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <div className="text-sm text-slate-400 mb-1">Note (optional)</div>
        <input
          className="inp w-full"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Bench + rows"
        />
      </label>

      {status && <div className="text-sm text-slate-300">{status}</div>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold"
      >
        {saving ? "Saving…" : "Save workout"}
      </button>
    </form>
  );
}

function SleepQuickForm({ onBack, onDone }) {
  const defaultStart = new Date();
  defaultStart.setHours(23, 0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 7 * 3600 * 1000);

  const [start, setStart] = useState(toLocalInputValue(defaultStart));
  const [end, setEnd] = useState(toLocalInputValue(defaultEnd));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    const startSQL = toMySQLDateTime(start);
    const endSQL = toMySQLDateTime(end);
    if (!startSQL || !endSQL) {
      setStatus("Invalid timestamps.");
      return;
    }
    if (new Date(end) <= new Date(start)) {
      setStatus("End must be after start.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await apiPost("/controllers/sleep.php", {
        start: startSQL,
        end: endSQL,
      });
      setStatus("✅ Sleep logged");
      setTimeout(onDone, 600);
    } catch (err) {
      setStatus(err.message || "Sleep log failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <FormHeader label="Sleep" onBack={onBack} />
      <label className="block">
        <div className="text-sm text-slate-400 mb-1">Start</div>
        <input
          type="datetime-local"
          className="inp w-full"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
      </label>

      <label className="block">
        <div className="text-sm text-slate-400 mb-1">End</div>
        <input
          type="datetime-local"
          className="inp w-full"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
        />
      </label>

      {status && <div className="text-sm text-slate-300">{status}</div>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold"
      >
        {saving ? "Saving…" : "Save sleep"}
      </button>
    </form>
  );
}

function WearableQuickForm({ onBack, onDone }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [steps, setSteps] = useState(8000);
  const [hr, setHr] = useState(60);
  const [hrv, setHrv] = useState(70);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    if (!date) {
      setStatus("Select a date.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await apiPost("/add_wearable.php", {
        date,
        steps: Number(steps) || 0,
        heart_rate: Number(hr) || null,
        hrv: Number(hrv) || null,
      });
      setStatus("✅ Wearable data logged");
      setTimeout(onDone, 600);
    } catch (err) {
      setStatus(err.message || "Wearable log failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <FormHeader label="Wearable" onBack={onBack} />
      <label className="block">
        <div className="text-sm text-slate-400 mb-1">Date</div>
        <input
          type="date"
          className="inp w-full"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <div className="text-sm text-slate-400 mb-1">Steps</div>
          <input
            type="number"
            className="inp w-full"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            min={0}
          />
        </label>
        <label className="block">
          <div className="text-sm text-slate-400 mb-1">Resting HR</div>
          <input
            type="number"
            className="inp w-full"
            value={hr}
            onChange={(e) => setHr(e.target.value)}
            min={0}
          />
        </label>
        <label className="block">
          <div className="text-sm text-slate-400 mb-1">HRV</div>
          <input
            type="number"
            className="inp w-full"
            value={hrv}
            onChange={(e) => setHrv(e.target.value)}
            min={0}
          />
        </label>
      </div>

      {status && <div className="text-sm text-slate-300">{status}</div>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold"
      >
        {saving ? "Saving…" : "Save wearable data"}
      </button>
    </form>
  );
}

function FormHeader({ label, onBack }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-sky-400 hover:underline"
      >
        ← Back
      </button>
      <div className="text-lg font-semibold">{label}</div>
    </div>
  );
}
