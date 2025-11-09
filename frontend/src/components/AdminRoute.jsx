import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdmin } from "../auth";

export default function AdminRoute() {
  const location = useLocation();
  if (!isAdmin()) {
    return <Navigate to="/" replace state={{ from: location, reason: "forbidden" }} />;
  }
  return <Outlet />;
}
