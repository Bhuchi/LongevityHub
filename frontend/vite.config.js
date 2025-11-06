import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // ✅ สำคัญมาก ทำให้ทุก path โหลดได้ถูกต้อง
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // เปิดเบราว์เซอร์อัตโนมัติ
  },
  resolve: {
    alias: { "@": "/src" },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
