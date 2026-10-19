import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes every file path relative, so the built site works on
// GitHub Pages under /gatepass/ (or any other repo name) without changes.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
