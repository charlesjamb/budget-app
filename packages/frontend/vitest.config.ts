import { configDefaults, defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: [...configDefaults.exclude, "**/dist/**"],
  },
});
