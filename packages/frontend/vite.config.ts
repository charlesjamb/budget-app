import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: lazyPlugins(() => [
    TanStackRouterVite({ routeFileIgnorePattern: "\\.test\\.tsx?$" }),
    react(),
  ]),
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ["**/routeTree.gen.ts"],
    },
  },
});
