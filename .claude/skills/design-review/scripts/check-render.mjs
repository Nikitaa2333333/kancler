#!/usr/bin/env node
/**
 * Проверка ОТРИСОВАННЫХ страниц «Канцлера» по своду правил (references/rules.md).
 * Открывает страницы в фоновом браузере на 390 и 1280 px и ищет то, что
 * пользователь раньше находил сам на скриншотах. Скриншотов не делает.
 *
 * Запуск (нужен dev-сервер: npm run dev → http://127.0.0.1:4340):
 *   node .claude/skills/design-review/scripts/check-render.mjs [http://127.0.0.1:4340] [/путь …]
 * Без путей — все страницы сайта (список PAGES ниже; новую страницу — дописать).
 * Код возврата 1, если что-то найдено.
 *
 * Коды находок:
 *  D  перечисление с тире/точкой-маркером (`.list`) — тире запрещены: знак, линии или плашки
 *  N  номер «01», «02»… перед заголовком пункта — номера сняты везде
 *  F  линия над первым пунктом списка / под последним (линии только МЕЖДУ пунктами)
 *  P  плашка внутри плашки (цветной скруглённый блок внутри цветного блока)
 *  S  тень (box-shadow с размытием) — тени запрещены
 *  C  цвет фона не из палитры (tokens.css, свод палитры)
 *  T  текст не цветом графита/белого (синий, серый) вне кнопок и ссылок-кнопок
 *  H  заголовок пункта не крупнее своего текста
 *  L  ссылка внутри фразы абзаца — ссылки выносим отдельной кнопкой/строкой
 *  W  кнопка переносится на две строки
 *  G  дыра: между соседними блоками > 200 px пустоты (1280)
 *  K  надзаголовок над H1 первого экрана
 *  U  пункт списка со строчной буквы или с «;» в конце (функция item() в lib/typo.ts)
 *  Q  кавычки «» в заголовке карточки тарифа/пакета
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4340').replace(/\/$/, '');
const only = args.filter((a) => a.startsWith('/'));
const PAGES = only.length ? only : [
  '/', '/buhgalterskiy-uchet/', '/upravlencheskiy-uchet/', '/kaznacheyskoe-soprovozhdenie/',
  '/keysy/', '/keysy/finansovyy-analiz-gk/', '/keysy/shtrafstoyanka/', '/keysy/vozvrat-46-mln/', '/kontakty/',
];

function loadPlaywright() {
  for (const root of [process.cwd(), '/opt/node-tools']) {
    if (existsSync(join(root, 'node_modules', 'playwright'))) return createRequire(join(root, 'package.json'))('playwright');
  }
  return createRequire(import.meta.url)('playwright');
}

/* Палитра (tokens.css → «ПАЛИТРА — СВОД»). Фоны вне списка — находка C. */
const PALETTE = ['#ffffff', '#f2eeeb', '#e9e5dc', '#0062ad', '#004a85', '#e3eaf6', '#f1e7d6', '#e2eadc', '#78e08f', '#141414', '#1a1a1a'];

function audit({ vw, palette }) {
  const out = [];
  const add = (code, el, text) => {
    const sec = el.closest('section[id]');
    out.push({ code, where: sec ? '#' + sec.id : (el.closest('footer') ? 'подвал' : 'страница'), text });
  };
  const cs = (el) => getComputedStyle(el);
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs(el).visibility !== 'hidden' && cs(el).display !== 'none'; };
  const short = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const hex = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    if (a < 0.05) return null;
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  const skip = (el) => el.closest('.ftr, header, .hdr, [data-design-ok], .charts, [class*="chart"], .fig, figure, .cc__img, .aud, .aui, svg');

  // D — тире-маркеры
  document.querySelectorAll('main li').forEach((li) => {
    if (!vis(li) || skip(li) || li.closest('nav')) return;
    const b = getComputedStyle(li, '::before');
    if (b.content !== 'none' && b.content !== 'normal' && parseFloat(b.width) < 14 && parseFloat(b.height) < 14 && (b.backgroundColor !== 'rgba(0, 0, 0, 0)' || /[—–·•-]/.test(b.content))) add('D', li, short(li));
  });

  // N — «01» перед заголовком
  document.querySelectorAll('span, b, i, p').forEach((el) => {
    if (el.children.length || !vis(el) || skip(el)) return;
    if (/^0\d$/.test(el.textContent.trim())) add('N', el, `«${el.textContent.trim()}» у пункта «${short(el.parentElement)}»`);
  });

  // F — линия над первым / под последним пунктом
  document.querySelectorAll('ul, ol, .faq, dl').forEach((list) => {
    if (!vis(list) || skip(list) || list.closest('nav')) return;
    const kids = [...list.children].filter(vis);
    if (kids.length < 2) return;
    const first = kids[0], last = kids[kids.length - 1];
    if (parseFloat(cs(first).borderTopWidth) > 0 && cs(first).borderTopStyle !== 'none') add('F', first, 'линия над первым: ' + short(first));
    if (parseFloat(cs(last).borderBottomWidth) > 0 && cs(last).borderBottomStyle !== 'none') add('F', last, 'линия под последним: ' + short(last));
    if (parseFloat(cs(list).borderTopWidth) > 0 && cs(list).borderTopStyle !== 'none') add('F', list, 'линия над списком: ' + short(first));
  });
  document.querySelectorAll('tbody, table').forEach((t) => {
    if (!vis(t) || skip(t)) return;
    const first = t.querySelector('tr');
    if (first && [...first.children].some((c) => parseFloat(cs(c).borderTopWidth) > 1.5 && vw > 720)) add('F', first, 'толстая линия над первой строкой таблицы');
  });

  // P — плашка в плашке; C — фон не из палитры; S — тень
  const isPlate = (el) => {
    const bg = hex(cs(el).backgroundColor); if (!bg) return false;
    const r = el.getBoundingClientRect();
    return parseFloat(cs(el).borderTopLeftRadius) > 4 && r.width > 140 && r.height > 56;
  };
  const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const b = hex(cs(n).backgroundColor); if (b) return b; } return '#ffffff'; };
  document.querySelectorAll('main *').forEach((el) => {
    if (!vis(el) || skip(el)) return;
    const s = cs(el);
    const bg = hex(s.backgroundColor);
    if (bg && !palette.includes(bg) && !el.matches('input, textarea, mark, .btn, .btn *, a.btn')) add('C', el, `фон ${bg}: ${short(el)}`);
    const sh = s.boxShadow.match(/(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px/); if (sh && parseFloat(sh[3]) > 0 && !el.matches(':focus')) add('S', el, 'тень: ' + short(el));
    // P — мелкая подложка другого цвета внутри цветной плашки (чип, пилюля, квадратик с цифрой, №124)
    if (bg && !el.matches('.sec, section, .btn, .btn *, input, textarea, button, .req, .req *, mark') && el.getBoundingClientRect().width >= 16) {
      const pb = bgOf(el.parentElement);
      if (bg !== pb && pb !== '#ffffff' && !isPlate(el)) add('P', el, `подложка ${bg} на плашке ${pb}: ${short(el) || el.className}`);
    }
    if (isPlate(el) && !el.matches('.sec, section, .btn, input, textarea, button, .req')) {
      const own = hex(s.backgroundColor);
      const parentBg = bgOf(el.parentElement);
      if (own !== parentBg && parentBg !== '#ffffff' && !el.closest('.req')) add('P', el, `плашка ${own} на плашке ${parentBg}: ${short(el)}`);
    }
  });

  // T — цветной/серый текст в модуле
  document.querySelectorAll('main p, main li, main h2, main h3, main h4, main dt, main dd, main td, main th, main span').forEach((el) => {
    if (!vis(el) || skip(el) || el.closest('a.btn, .btn, button, label, input, .req__err, mark')) return;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    const c = hex(cs(el).color); const op = parseFloat(cs(el).opacity);
    if (c && !['#141414', '#ffffff', '#1a1a1a'].includes(c)) add('T', el, `цвет ${c}: ${short(el)}`);
    else if (op < 0.95 && !el.closest('[data-reveal], .probs')) add('T', el, `полупрозрачный текст: ${short(el)}`);
  });

  // H — заголовок пункта не крупнее текста
  document.querySelectorAll('main h3, main h4').forEach((h) => {
    if (!vis(h) || skip(h)) return;
    const p = h.nextElementSibling;
    if (p && p.matches('p:not([class*="price"])') && vis(p) && parseFloat(cs(h).fontSize) <= parseFloat(cs(p).fontSize)) add('H', h, `${cs(h).fontSize} ≤ ${cs(p).fontSize}: ${short(h)}`);
  });

  // L — ссылка внутри фразы
  document.querySelectorAll('main p a, main li a').forEach((a) => {
    if (!vis(a) || skip(a) || a.matches('.btn')) return;
    const p = a.closest('p, li');
    if ((p.textContent || '').trim().length > (a.textContent || '').trim().length + 15) add('L', a, `ссылка в тексте: «${short(a)}»`);
  });

  // W — кнопка в две строки
  document.querySelectorAll('.btn').forEach((b) => {
    if (!vis(b)) return;
    const lh = parseFloat(cs(b).lineHeight) || parseFloat(cs(b).fontSize) * 1.3;
    const range = document.createRange(); range.selectNodeContents(b);
    const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
    if (lines.size > 1 && b.getBoundingClientRect().height > lh * 2) add('W', b, short(b));
  });

  // U — пункт списка со строчной / с «;»
  document.querySelectorAll('main li').forEach((li) => {
    if (!vis(li) || skip(li) || li.closest('nav, .faq')) return;
    const t = (li.textContent || '').replace(/\s+/g, ' ').trim();
    if (/^[a-zа-яё]/.test(t) || /;$/.test(t)) add('U', li, short(li));
  });
  // Q — кавычки в заголовках карточек
  document.querySelectorAll('main article h3').forEach((h) => { if (vis(h) && !skip(h) && /^«.*»$/.test(h.textContent.trim())) add('Q', h, short(h)); });

  // K — надзаголовок над H1
  const h1 = document.querySelector('h1');
  if (h1 && h1.previousElementSibling && vis(h1.previousElementSibling) && h1.previousElementSibling.matches('p')) add('K', h1, 'текст над H1: ' + short(h1.previousElementSibling));

  // G — дыры между блоками (только компьютер)
  if (vw >= 1200) {
    const secs = [...document.querySelectorAll('main > section, main > .sec')].filter(vis);
    for (let i = 0; i < secs.length - 1; i++) {
      const a = secs[i], b = secs[i + 1];
      const contentBottom = (s) => Math.max(...[...s.querySelectorAll('*')].filter(vis).map((e) => e.getBoundingClientRect().bottom), s.getBoundingClientRect().top);
      const contentTop = (s) => Math.min(...[...s.querySelectorAll('h2, h3, p, li, img, .btn, dt, dd, input, figure')].filter(vis).map((e) => e.getBoundingClientRect().top), s.getBoundingClientRect().bottom);
      const gap = contentTop(b) - contentBottom(a);
      if (gap > 200) add('G', b, `${Math.round(gap)} px пустоты перед блоком`);
    }
  }
  return out;
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
let total = 0;
for (const vw of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width: vw, height: 900 }, reducedMotion: 'reduce' });
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important} .probs *{opacity:1!important}' });
    const found = await page.evaluate(audit, { vw, palette: PALETTE });
    const uniq = [...new Map(found.map((f) => [f.code + f.where + f.text, f])).values()];
    if (uniq.length) {
      console.log(`\n${path} @${vw}`);
      for (const f of uniq) console.log(`  ${f.code}  ${f.where.padEnd(14)} ${f.text}`);
    }
    total += uniq.length;
  }
  await page.close();
}
await browser.close();
console.log(total ? `\nНаходок: ${total}` : 'Находок нет');
process.exit(total ? 1 : 0);
