import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rrezartprebreza.github.io',
  base: '/education-ai-skills',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
