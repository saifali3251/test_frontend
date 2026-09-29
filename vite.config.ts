import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      // Overridable so this works both for `npm run dev` on a host (the
      // original default) and inside a Docker network (Holodeck's workspace
      // override sets this to http://backend:8000 — see
      // overrides/full-stack-application.compose.yaml).
      "/api": process.env.VITE_API_PROXY_TARGET || "http://localhost:18000",
    },
  },
});