#!/usr/bin/env node
/* Turns the built single-page site into ready HTML pages for search engines:
   the home page, the full price list and one page per direction, each with its own title,
   description, canonical address and structured data; then writes sitemap.xml and robots.txt.
   Every address comes from site.json → siteUrl, so moving to another domain is one edit there. */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { personalDataPages } from '../src/personal-data.js';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(root, 'dist', 'client');
const entry = path.join(root, 'dist', 'ssr', 'entry-server.js');
for (const file of [path.join(client, 'index.html'), entry]) if (!existsSync(file)) throw new Error('Prerender input is missing: ' + file);

const { render, directions, faq, site, catalog } = await import(pathToFileURL(entry).href);
const base = process.env.SITE_BASE_PATH || '/big-site/';
// SITE_URL overrides site.json for one build (e.g. the html pack for another domain).
const siteUrl = (process.env.SITE_URL || site.siteUrl || '').replace(/\/?$/, '/');
if (!/^https?:\/\//.test(siteUrl)) throw new Error('site.json → siteUrl must be an absolute address, e.g. https://example.ru/');
const template = readFileSync(path.join(client, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('index.html has no empty <div id="root"></div> to fill');

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const amount = (price) => Number(String(price).replace(/\D/g, '')) || 0;
const priceOf = (name) => catalog.services.find(service => service.name === name)?.price;

function page({ file, route, title, description, ld = [] }) {
  const url = siteUrl + file.replace(/(^|\/)index\.html$/, '');
  let html = template
    .replace(/<title>[^<]*<\/title>/, () => `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, (_, start) => start + escape(description))
    .replace(/(<meta property="og:title" content=")[^"]*/, (_, start) => start + escape(title))
    .replace(/(<meta property="og:description" content=")[^"]*/, (_, start) => start + escape(description))
    .replace(/(<link rel="canonical" href=")[^"]*/, (_, start) => start + escape(url))
    .replace(/(<meta property="og:url" content=")[^"]*/, (_, start) => start + escape(url))
    .replace('</head>', () => `${ld.map(jsonLd).join('')}</head>`);
  const body = render(base + route);
  if (body.length < 2000) throw new Error(`Prerender of ${file} produced almost no content`);
  // data-page says which page this file is, so it opens correctly under any address (/prices, /prices.html, a builder's own URL).
  html = html.replace('<div id="root"></div>', () => `<div id="root" data-page="${escape(base + route)}">${body}</div>`);
  const target = path.join(client, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, html);
  return url;
}

const breadcrumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });
const serviceData = (direction) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': siteUrl + direction.path + '#service',
  url: siteUrl + direction.path,
  name: direction.h1,
  description: direction.description,
  provider: { '@id': siteUrl + '#garage' },
  areaServed: { '@type': 'City', name: 'Москва' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: direction.name,
    itemListElement: direction.groups.flatMap(group => group.rows.filter(row => amount(row.price)).map(row => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: [group.name.replace(/:\s*$/, ''), row.name].filter(Boolean).join(' — ') },
      priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'RUB', [String(row.price).startsWith('от ') ? 'minPrice' : 'price']: amount(row.price) },
    }))),
  },
});

const phone = '8 916 098 18 91';
const highlights = [['ТО', priceOf('Техническое обслуживание')], ['диагностика', priceOf('Диагностика')]].filter(([, p]) => p).map(([n, p]) => `${n} ${p}`).join(', ');
const urls = [];
urls.push(page({
  file: 'index.html', route: '',
  title: 'Автосервис на Соколиной Горе, Москва — The Big One Garage',
  description: `ТО, сварка порогов и днища, диагностика и ремонт автомобилей на Соколиной Горе в Москве. ${highlights}. Телефон ${phone}.`,
  ld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
}));
urls.push(page({
  file: 'prices.html', route: 'prices.html',
  title: `Все услуги автосервиса и цены | The Big One Garage, Соколиная Гора`,
  description: `Каталог услуг The Big One Garage в Москве. ТО, диагностика, ремонт, кузовные работы и уход за салоном. Стартовые цены и перечни работ по каждому направлению. Телефон ${phone}.`,
  ld: [breadcrumbs([['Главная', siteUrl], ['Все услуги', siteUrl + 'prices.html']])],
}));
for (const direction of directions) {
  urls.push(page({
    file: direction.path, route: direction.path, title: direction.title, description: direction.description,
    ld: [breadcrumbs([['Главная', siteUrl], ['Все услуги', siteUrl + 'prices.html'], [direction.name, siteUrl + direction.path]]), serviceData(direction)],
  }));
}

for (const { path: route, title } of Object.values(personalDataPages)) {
  urls.push(page({
    file: route, route, title: `${title} | The Big One Garage`,
    description: `${title} посетителей сайта автосервиса The Big One Garage.`,
  }));
}

writeFileSync(path.join(client, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(loc => `  <url><loc>${escape(loc)}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(path.join(client, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${base}api/\nClean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content&yclid\nClean-param: q ${base}prices.html\n\nSitemap: ${siteUrl}sitemap.xml\n`);
if (base === '/') copyFileSync(path.join(root, 'deploy', 'apache.htaccess'), path.join(client, '.htaccess'));
// The 404 page is plain HTML: point its links at the current base path.
const notFound = path.join(client, '404.html');
if (existsSync(notFound)) {
  let html = readFileSync(notFound, 'utf8').replaceAll('/big-site/', base);
  // The same Metrika counter as on the other pages, so visits to missing addresses are counted too.
  const counter = template.match(/<script type="text\/javascript">[\s\S]*?mc\.yandex\.ru\/metrika[\s\S]*?<\/script>/)?.[0];
  if (counter && !html.includes('mc.yandex.ru/metrika')) html = html.replace('<head>', () => `<head>\n${counter}`);
  writeFileSync(notFound, html);
}
console.log(`Prerendered ${urls.length} pages, sitemap.xml and robots.txt for ${siteUrl}`);
