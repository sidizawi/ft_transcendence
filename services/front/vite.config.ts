import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8000,
    host: true,
    allowedHosts: true,
    watch: {
      usePolling: true
    }
  },
  preview: {
    port: 8000
  }
});