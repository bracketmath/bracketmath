// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://bracketmath.co.uk',
  integrations: [
    react(),
    sitemap({
      // Sitemap covers every public page Astro builds (calculators, guides, root).
      // We exclude nothing right now — every URL on the site is fair game for indexing.
      filter: (page) =>
        // Defensive: never accidentally ship a draft / preview URL.
        !page.includes('/draft/') && !page.includes('/preview/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    // Inline critical stylesheets to remove the render-blocking <link> tag.
    // 'always' is acceptable here because our CSS bundle is small (Tailwind v4 JIT).
    inlineStylesheets: 'always',
  },

  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  adapter: cloudflare(),
});
