import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        regler: resolve(__dirname, 'regler.html'),
        ansog: resolve(__dirname, 'ansog.html'),
        admin: resolve(__dirname, 'admin.html'),
        politi: resolve(__dirname, 'politi.html'),
        ems: resolve(__dirname, 'ems.html'),
        firma: resolve(__dirname, 'firma.html'),
        bande: resolve(__dirname, 'bande.html'),
        allowlist: resolve(__dirname, 'allowlist.html'),
        donation: resolve(__dirname, 'donation.html'),
      },
    },
  },
});
