/* Домен пока не выбран — заглушка. Заменить на боевой, когда клиент решит. */
export const PROD_SITE = 'https://kancler.example';

/* Пока PUBLIC_INDEXING != 'true', сайт закрыт от индексации (meta robots + robots.txt). */
export const INDEXING = import.meta.env.PUBLIC_INDEXING === 'true';
