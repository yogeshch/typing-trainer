import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [preact(), tailwind()],
  output: 'static',
  server: { port: 4321 },
  vite: {
    ssr: { noExternal: [] },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  },
});
