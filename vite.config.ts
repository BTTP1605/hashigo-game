import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — GitHub Pages のリポジトリ名に依存しない相対パス出力
export default defineConfig({
  plugins: [react()],
  base: "./",
});
