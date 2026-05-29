import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
    }
  }
});
