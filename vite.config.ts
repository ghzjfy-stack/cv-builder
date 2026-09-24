import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { paymentApiPlugin } from "./server/vitePlugin.js";

/** Classic <script src="lib/..."> tags are not bundled by Vite — copy them into dist. */
function copyLibAssets(): Plugin {
  return {
    name: "qc-copy-lib-assets",
    closeBundle() {
      const from = resolve("lib");
      const to = resolve("dist/lib");
      if (!existsSync(from)) return;
      cpSync(from, to, { recursive: true });
    },
  };
}

export default defineConfig({
  root: ".",
  appType: "spa",
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  plugins: [paymentApiPlugin(), copyLibAssets()],
});
