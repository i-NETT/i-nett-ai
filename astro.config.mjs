import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

// Dev-only sink for /report-pdf-test: writes a generated PDF to
// .pdf-test-output/ so it can be opened and inspected. This is a Vite dev
// middleware rather than an Astro endpoint on purpose — an endpoint under
// src/pages/ would need `prerender = false`, which fails the static build with
// NoAdapterInstalled. configureServer never runs during `astro build`.
function pdfTestSink() {
  return {
    name: 'inett-pdf-test-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/save-pdf', (req, res, next) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const { name, base64 } = JSON.parse(body);
            const safe = String(name || 'report').replace(/[^a-zA-Z0-9._-]/g, '_');
            const dir = path.join(process.cwd(), '.pdf-test-output');
            fs.mkdirSync(dir, { recursive: true });
            const file = path.join(dir, safe + '.pdf');
            const buf = Buffer.from(base64, 'base64');
            fs.writeFileSync(file, buf);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ file, bytes: buf.length }));
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e && e.message));
          }
        });
      });
    },
  };
}

export default defineConfig({
  site: 'https://i-nett.ai',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
    format: 'directory'
  },
  compressHTML: true,
  prefetch: {
    defaultStrategy: 'hover'
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Internal QA harness — noindex'd, but keep it out of the sitemap too.
      filter: (page) => !page.includes('/report-pdf-test'),
      serialize(item) {
        if (item.url === 'https://i-nett.ai/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        }
        if (item.url.includes('/fortify-ai') || item.url.includes('/roi-calculator')) {
          item.priority = 0.9;
        }
        if (item.url.includes('/locations/san-diego')) {
          item.priority = 0.8;
        }
        return item;
      }
    })
  ],
  vite: {
    build: {
      cssCodeSplit: true
    },
    plugins: [pdfTestSink()]
  }
});
