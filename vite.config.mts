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
    // the robot's lazy chunk is three.js, which alone is past the default 500 kB
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        // The libraries every visit loads, in their own file: the site redeploys
        // on every data sync, and this way returning visitors keep the
        // (unchanged) libraries cached. Only these: anything else (Lenis, three.js
        // for the robot) stays in the lazy chunks that need it.
        codeSplitting: {
          groups: [
            {
              name: "vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|framer-motion|motion-dom|motion-utils|lucide-react|clsx|tailwind-merge)[\\/]/,
            },
          ],
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
