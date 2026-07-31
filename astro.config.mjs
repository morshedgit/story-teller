// @ts-check
import { defineConfig } from 'astro/config';

// Fully static output. The build emits a plain `dist/` directory that Cloudflare
// Workers serves as static assets (see wrangler.jsonc) — no adapter, no server
// runtime, no _worker.js.
export default defineConfig({
  output: 'static',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
