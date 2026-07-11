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
      },
    },
  },
});
