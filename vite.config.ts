import { defineConfig } from "vite";

export default defineConfig({
  // logsLevel: "silent" //=> error info /
  css: {
    postcss: './postcss.config.js',
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  },
  server: {
    // open: "index.html",
    host: '0.0.0.0',
    port: 4000,
    // strictPort: true,
    watch: {
      usePolling: true,
      interval: 500
    }
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      input: './index.html'
    }
  }
})