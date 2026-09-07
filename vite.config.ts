import { defineConfig } from "vite";
import { paymentApiPlugin } from "./server/vitePlugin.js";

export default defineConfig({
  root: ".",
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  plugins: [paymentApiPlugin()],
});
