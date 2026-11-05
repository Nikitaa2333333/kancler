/* robots.txt собирается по флагу PUBLIC_INDEXING (05.11.2026): на боевом kancler-fin.ru —
   разрешающий с картой сайта; на тестовой копии GitHub Pages и локально — закрыт целиком,
   чтобы копия не попала в индекс дублем. */
import type { APIRoute } from 'astro';
import { INDEXING } from '../lib/seo';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap-index.xml`, site).href;
  const body = INDEXING
    ? `User-agent: *\nDisallow: /spasibo/\nDisallow: /variant-collage/\nClean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid\n\nSitemap: ${sitemap}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
