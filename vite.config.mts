import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

// images/ and data/ stay at the repo root (the sync pipeline writes data/), so
// copy them next to the build instead of moving them under public/.
function copyRootDirs(dirs: string[]): Plugin {
  return {
    name: "copy-root-dirs",
    apply: "build",
    closeBundle() {
      for (const d of dirs) {
        if (existsSync(root + d)) cpSync(root + d, root + "dist/" + d, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyRootDirs(["images", "data"])],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Libraries in their own file: the site redeploys on every data sync, and
        // this way returning visitors keep the (unchanged) libraries cached.
        // Lenis stays out so it is still only fetched for a mouse or trackpad.
        codeSplitting: {
          groups: [{ name: "vendor", test: /[\\/]node_modules[\\/](?!lenis[\\/])/ }],
        },
      },
    },
  },
  server: {
    // the Express API (server.js) runs alongside on :3000 during `npm run dev`
    proxy: {
      "/api": "http://localhost:3000",
      "/resume.pdf": "http://localhost:3000",
    },
  },
});
