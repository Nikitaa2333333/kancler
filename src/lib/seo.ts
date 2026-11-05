/* Боевой домен — kancler-fin.ru (SprintHost, 05.11.2026). */
export const PROD_SITE = 'https://kancler-fin.ru';

/* Пока PUBLIC_INDEXING != 'true', сайт закрыт от индексации (meta robots + robots.txt). */
export const INDEXING = import.meta.env.PUBLIC_INDEXING === 'true';
