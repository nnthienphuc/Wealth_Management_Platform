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
    port: 5176,
    open: true,
    proxy: {
      "/media": "http://localhost:5034",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});