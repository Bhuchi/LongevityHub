import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role="member" }) {
  // demo auth: read from localStorage (set by Login/Register)
  const me = JSON.parse(localStorage.getItem("lh_user") || "null");
  if (!me) return <Navigate to="/login" replace />;
  if (role === "admin" && me.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
