/* ============================================================
   IndexNow — позвать робота Яндекса на изменённые страницы (05.11.2026,
   по образцу КТМ). Шаг в CI после выкладки на SprintHost.

   Какие страницы: файлы, изменённые между двумя коммитами, переводятся в
   адреса картой sourcesFor ниже. Общие файлы (Base.astro, global.css,
   шапка, подвал) страницу не «меняют» — иначе любая правка подвала
   отправит весь сайт. Адреса берутся из собранной карты dist/sitemap-*.xml:
   noindex-страницы и черновики в IndexNow не уходят.

   Запуск:
     node scripts/indexnow.mjs --since <sha>   изменённое после коммита (CI)
     node scripts/indexnow.mjs --url /keysy/   конкретные адреса
     node scripts/indexnow.mjs --all           вся карта сайта
     … --dry                                   показать, не отправлять
   Нужна собранная dist/. Ключ — public/<KEY>.txt, его не удалять.
   ============================================================ */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

const HOST = 'kancler-fin.ru';
const KEY = 'a6f3c1e9d27b4f8e9c5a0b1d3e7f2468';

/* страница → её исходники (папки и файлы) */
function sourcesFor(path) {
  const page = path.replace(/^\/|\/$/g, '');
  if (page === '') return ['src/pages/index.astro', 'src/components/sections', 'src/components/AudienceUI.astro', 'src/data/home.ts'];
  if (page === 'buhgalterskiy-uchet') return ['src/pages/buhgalterskiy-uchet', 'src/data/buh.ts'];
  if (page === 'upravlencheskiy-uchet') return ['src/pages/upravlencheskiy-uchet', 'src/data/upr.ts'];
  if (page === 'kaznacheyskoe-soprovozhdenie') return ['src/pages/kaznacheyskoe-soprovozhdenie', 'src/data/kazna.ts'];
  if (page === 'keysy') return ['src/pages/keysy/index.astro', 'src/data/cases.ts', 'src/components/page/CaseCards.astro'];
  if (page.startsWith('keysy/')) return ['src/pages/keysy/[slug].astro', 'src/data/cases.ts', 'public/images/cases'];
  if (page === 'kontakty') return ['src/pages/kontakty', 'src/data/company.ts'];
  return [`src/pages/${page}`];
}

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dry = args.includes('--dry');

const sitemapUrls = readdirSync('dist')
  .filter((f) => /^sitemap-\d+\.xml$/.test(f))
  .flatMap((f) => [...readFileSync(`dist/${f}`, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));

const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

let urls = [];
if (args.includes('--all')) {
  urls = sitemapUrls;
} else if (opt('--url')) {
  urls = args
    .filter((a, i) => args[i - 1] === '--url')
    .map((p) => new URL(p, `https://${HOST}`).href);
} else {
  const since = opt('--since');
  const changed = [];
  if (since && !/^0+$/.test(since)) {
    try {
      changed.push(...git(`diff --name-only ${since} HEAD`).split('\n').filter(Boolean));
    } catch {
      console.log(`IndexNow: коммита ${since} нет в истории — изменённые страницы не определить`);
    }
  }
  const touches = (src) => changed.some((f) => f === src || f.startsWith(`${src}/`));
  urls = sitemapUrls.filter((u) => sourcesFor(new URL(u).pathname).some(touches));
}

if (!urls.length) {
  console.log('IndexNow: изменённых страниц нет — ничего не отправляем');
} else {
  console.log(`IndexNow: ${urls.length} адрес(ов)\n  ${urls.join('\n  ')}`);
  if (!dry) {
    const res = await fetch('https://yandex.com/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(0, 10000) }),
    });
    /* 200/202 — принято; 403 — ключ не найден; 422 — адрес не нашего хоста */
    console.log(`IndexNow: HTTP ${res.status} ${await res.text()}`);
    if (!res.ok) process.exitCode = 1;
  }
}
