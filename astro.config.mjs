// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://bracketmath.co.uk',

  // Force every emitted URL — sitemap entries, internal links, and Astro.url.pathname
  // during SSG — to include a trailing slash. Cloudflare Pages already 307s no-slash
  // → with-slash, so the *served* URL has always been the with-slash version. Setting
  // this explicitly ensures the `<link rel="canonical">` tag (built from
  // Astro.url.pathname in Layout.astro) matches the served URL exactly, which fixes the
  // canonical-vs-redirect loop that was causing Google to report "Redirect error" for
  // every non-homepage URL on launch (Day 2 of indexing, 15 May 2026).
  trailingSlash: 'always',

  integrations: [

    react(),
    sitemap({
      // Sitemap covers every public page Astro builds (calculators, guides, root).
      //
      // GATE-DRAFT EXCLUSIONS (remove when promoting Batch 2 — see
      // GATE-WINDOW-BUILD-LOG.md and OPERATOR-PLAYBOOK.md §7):
      // The three new calculators below build to HTML locally for preview but
      // must NOT appear in sitemap-0.xml until the operator opens the gate.
      // The post-gate agent removes these three exclusions in the same commit
      // that promotes Batch 2 of pages.csv.
      filter: (page) =>
        // Defensive: never accidentally ship a draft / preview URL.
        !page.includes('/draft/') &&
        !page.includes('/preview/') &&
        // GATE-DRAFT excluded URLs — see header comment.
        !page.endsWith('/calculators/should-i-incorporate/') &&
        !page.endsWith('/calculators/should-i-incorporate') &&
        !page.endsWith('/calculators/vat-scheme-selector/') &&
        !page.endsWith('/calculators/vat-scheme-selector') &&
        !page.endsWith('/calculators/hicbc/') &&
        !page.endsWith('/calculators/hicbc'),
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
