import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/ViewerPlugin.js"),
      name: "vue-image-zoomify",
      fileName: (format) => `vue-image-zoomify.${format}.js`,
    },
  },
  rollupOptions: {
    external: ["vue"],
    output: {
      globals: {
        vue: "Vue",
      },
    },
  },
  plugins: [vue()],
});
