// src/auth.js (as you have it)
export function getUser() {
  try { return JSON.parse(localStorage.getItem("lh_user") || "null"); }
  catch { return null; }
}
export function isPremium() { return getUser()?.role === "premium"; }
export function isAdmin()   { return getUser()?.role === "admin"; }
export function isLoggedIn(){ return !!getUser(); }
export function logout() {
  localStorage.removeItem("lh_user");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("lh:auth-changed"));
  }
}
