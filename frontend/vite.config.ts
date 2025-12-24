import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]]
      }
    }),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router"],
          // Ant Design UI
          "vendor-antd": ["antd", "@ant-design/icons"],
          // Refine framework
          "vendor-refine": [
            "@refinedev/core",
            "@refinedev/antd",
            "@refinedev/react-router"
          ]
          // Note: @ant-design/charts is NOT included here - it's lazy loaded
          // and will be split into its own chunk automatically
        }
      }
    },
    // Increase warning limit slightly (we'll optimize further)
    chunkSizeWarningLimit: 600
  }
});
