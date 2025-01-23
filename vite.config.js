import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true
    },
    // Enable history fallback for client-side routing
    historyApiFallback: true
  },
  preview: {
    // Also enable for preview server
    historyApiFallback: true
  }
});
