import React from "react";
export default function QuickLog({ onClose }){
  return (
    <Modal onClose={onClose} title="Quick Log">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="card p-4 cursor-pointer hover:bg-slate-800">Meal</div>
        <div className="card p-4 cursor-pointer hover:bg-slate-800">Workout</div>
        <div className="card p-4 cursor-pointer hover:bg-slate-800">Sleep</div>
      </div>
    </Modal>
  );
}
