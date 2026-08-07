import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/worker.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "esnext",
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: true
});
