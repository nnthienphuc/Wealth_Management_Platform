import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  server: {
    port: 5177,
    open: true,
    proxy: {
      "/media": {
        target: "http://localhost:5034",
        changeOrigin: true,
        secure: false,
      },
      "/api/v2": {
        target: "http://localhost:5034",
        changeOrigin: true,
        secure: false,
      },
      "/TickerNotes": {
        target: "http://localhost:5034",
        changeOrigin: true,
        secure: false,
      }
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});