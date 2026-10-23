// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { PROD_SITE } from './src/lib/seo';

// Выделенный порт проекта — 4340 (4330 занят ktm-site, 4321 — lihty).
// Домен ещё не выбран: PROD_SITE в src/lib/seo.ts — заглушка, CI/локально
// подставляет PUBLIC_SITE. Пока домена нет, сайт закрыт от индексации.
const SITE = process.env.PUBLIC_SITE || PROD_SITE;

// Префикс пути. На GitHub Pages сайт лежит в подпапке (/kancler), на SprintHost —
// с корня домена (переменная не задана → '/'). В коде ссылки на свои страницы и
// файлы ТОЛЬКО через helper `u()` из src/lib/url.ts — иначе на Pages они сломаются.
const BASE = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  build: { format: 'directory' },
  // черновые варианты главной в карту сайта не попадают
  integrations: [sitemap({ filter: (page) => !page.includes('/variant-') })],
});
