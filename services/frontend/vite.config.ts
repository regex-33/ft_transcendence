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
    port: 3000,
    // strictPort: true,
    watch: {
      usePolling: true,
      interval: 500
    },
    allowedHosts: [
      'regex-33.com',
      '.regex-33.com']
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      input: './index.html'
    }
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment' // optional
  }
})
    // allowedHosts: [
    //   'frontend',
    //   'localhost',
    //   '127.0.0.1',
    //   'nginx',
    //   'regex-33.com',
    //   '.regex-33.com']