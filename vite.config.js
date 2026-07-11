import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['/js/applications-ui.js'],
      input: {
        main: resolve(__dirname, 'index.html'),
        regler: resolve(__dirname, 'regler.html'),
        ansog: resolve(__dirname, 'ansog.html'),
        admin: resolve(__dirname, 'admin.html'),
        donation: resolve(__dirname, 'donation.html'),
        tak: resolve(__dirname, 'tak.html'),
      },
    },
  },
});
