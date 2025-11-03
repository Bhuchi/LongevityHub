import React from "react";
import { Link, NavLink } from "react-router-dom";

const link = "px-3 py-2 rounded-lg hover:bg-slate-800 text-sm";
const active = ({isActive}) => isActive ? link+" bg-slate-800 text-sky-300" : link+" text-slate-300";

export default function Navbar(){
  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-sky-400 font-semibold">LongevityHub</Link>
        <div className="flex items-center gap-1">
          <NavLink to="/" className={active}>Dashboard</NavLink>
          <NavLink to="/meals" className={active}>Meals</NavLink>
          <NavLink to="/workouts" className={active}>Workouts</NavLink>
          <NavLink to="/sleep" className={active}>Sleep</NavLink>
          <NavLink to="/wearables" className={active}>Wearables</NavLink>
          <NavLink to="/trends" className={active}>Trends</NavLink>
          <NavLink to="/profile" className={active}>Profile</NavLink>
          <NavLink to="/admin" className={active}>Admin</NavLink>
        </div>
      </div>
    </nav>
  );
}
