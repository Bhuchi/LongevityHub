import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Utensils, Dumbbell, Moon, Watch } from "lucide-react";

export default function LogModal({ isOpen, onClose, type: initialType }) {
  const [activeType, setActiveType] = useState("");

  // decide what to show when the modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialType) {
        // opened from shortcut: meal/workout/sleep
        setActiveType(initialType);
      } else {
        // opened from + Log button: show 4 tiles
        setActiveType("");
      }
    } else {
      // when closed, clear state
      setActiveType("");
    }
  }, [isOpen, initialType]);

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
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-slate-100 relative shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            {/* If no type picked yet → show chooser */}
            {!activeType ? (
              <>
                <h2 className="text-xl font-semibold mb-2">Log New Entry</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Choose what you’d like to log today.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <LogTypeCard
                    icon={<Utensils className="h-6 w-6 text-amber-400" />}
                    label="Meal"
                    onClick={() => setActiveType("meal")}
                  />
                  <LogTypeCard
                    icon={<Dumbbell className="h-6 w-6 text-sky-400" />}
                    label="Workout"
                    onClick={() => setActiveType("workout")}
                  />
                  <LogTypeCard
                    icon={<Moon className="h-6 w-6 text-violet-400" />}
                    label="Sleep"
                    onClick={() => setActiveType("sleep")}
                  />
                  <LogTypeCard
                    icon={<Watch className="h-6 w-6 text-emerald-400" />}
                    label="Wearable"
                    onClick={() => setActiveType("wearable")}
                  />
                </div>
              </>
            ) : (
              // otherwise show the form straight away
              <LogForm
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

function LogTypeCard({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
    >
      {icon}
      <div className="mt-2 text-sm font-medium">{label}</div>
    </button>
  );
}

function LogForm({ type, onBack, onDone }) {
  const placeholders = {
    meal: "e.g., Chicken breast, 120g + Rice 80g",
    workout: "e.g., 45 min, Chest day, Moderate intensity",
    sleep: "e.g., 23:30 - 07:00",
    wearable: "e.g., Steps: 8400, HRV: 72ms",
  };

  const colors = {
    meal: "text-amber-400",
    workout: "text-sky-400",
    sleep: "text-violet-400",
    wearable: "text-emerald-400",
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="text-xs text-sky-400 hover:underline mb-2"
      >
        ← Back
      </button>
      <h3 className="text-lg font-semibold mb-3 capitalize">Log {type}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert(`✅ ${type} logged successfully (demo mode).`);
          onDone();
        }}
        className="space-y-4"
      >
        <input
          type="text"
          placeholder={placeholders[type]}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          required
        />
        <button
          type="submit"
          className={`w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold ${colors[type]}`}
        >
          Save {type}
        </button>
      </form>
    </div>
  );
}
