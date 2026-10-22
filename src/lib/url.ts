/* Ссылка на свою страницу или файл с учётом префикса пути (см. astro.config.mjs).
   u('/keysy/') → '/keysy/' на SprintHost и '/kancler/keysy/' на GitHub Pages.
   Якоря (#zayavka) и внешние адреса через u() не пропускаем. */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (path: string) => `${base}${path.startsWith('/') ? path : `/${path}`}`;
