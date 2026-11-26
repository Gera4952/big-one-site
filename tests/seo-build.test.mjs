import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.env.SEO_BUILD_DIR || 'dist/client';
const read = file => readFile(path.join(root, file), 'utf8');

test('each sitemap address has its own complete, indexable HTML document', async () => {
  const sitemap = await read('sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.ok(urls.length >= 15);
  assert.equal(new Set(urls).size, urls.length);
  const origin = urls[0], titles = new Set(), descriptions = new Set();
  for (const url of urls) {
    assert.ok(url.startsWith(origin), url);
    const html = await read(url.slice(origin.length) || 'index.html');
    const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const token of [/<!doctype\b/gi, /<html(?:\s|>)/gi, /<head(?:\s|>)/gi, /<h1(?:\s|>)/gi, /<\/html>/gi]) {
      assert.equal([...markup.matchAll(token)].length, 1, `${url}: ${token}`);
    }
    assert.equal(markup.match(/<link rel="canonical" href="([^"]+)"/)?.[1], url);
    assert.doesNotMatch(markup, /<meta name="robots" content="[^"]*noindex/i);
    const title = markup.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = markup.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && !titles.has(title), url);
    assert.ok(description && !descriptions.has(description), url);
    titles.add(title); descriptions.add(description);
  }
  const robots = await read('robots.txt');
  assert.ok(robots.includes(`Sitemap: ${origin}sitemap.xml`));
  assert.ok(robots.includes('Clean-param: q /prices.html'));
  assert.match(await read('404.html'), /name="robots" content="noindex"/);
  assert.match(await read('yandex_92a4c3b43cfeaaa8.html'), /Verification: 92a4c3b43cfeaaa8/);
  for (const route of ['tehnicheskoe-obsluzhivanie', 'diagnostika-avtomobilya']) {
    assert.ok(urls.includes(`${origin}uslugi/${route}.html`));
    assert.ok((await read('index.html')).includes(`href="/uslugi/${route}.html"`));
  }
});

test('service pages have crawlable content, linked prices and a consultation button', async () => {
  const catalog = await read('prices.html');
  const home = await read('index.html');
  const routes = [...new Set([...catalog.matchAll(/href="\/(uslugi\/[a-z0-9-]+\.html)"/g)].map(match => match[1]))];
  assert.ok(routes.length >= 18);
  assert.equal([...catalog.matchAll(/class="catalog-service"/g)].length, routes.length);
  assert.equal([...catalog.matchAll(/class="service-starting-price"><strong>от /g)].length, routes.length);
  assert.doesNotMatch(catalog, /class="price-work"/);
  assert.doesNotMatch(catalog, /class="lead-form"/);
  assert.doesNotMatch(home, /class="lead-form"/);
  assert.match(home, /<summary>Сколько будет стоить ремонт\?/);
  assert.match(home, /"@type":"Question","name":"Сколько будет стоить ремонт\?"/);
  assert.ok(home.indexOf('id="prices"') < home.indexOf('id="promo"'));
  for (const route of routes) {
    const html = await read(route);
    assert.match(html, /class="direction-lead"/, route);
    assert.match(html, /class="service-starting-price"><strong>от /, route);
    const photo = html.match(/<figure class="direction-photo"><img src="\/(assets\/[^"]+\.webp)"/);
    assert.ok(photo, `${route} must have a service image`);
    assert.doesNotMatch(html, /Иллюстрация к услуге/, route);
    assert.ok((await readFile(path.join(root, photo[1]))).length > 0, photo[1]);
    assert.match(html, /href="#direction-prices"/, route);
    assert.match(html, /id="direction-prices"/, route);
    assert.match(html, /Консультация/, route);
    assert.match(html, /"@type":"Service"/, route);
    assert.doesNotMatch(html, /class="lead-form"/, route);
    const related = [...html.matchAll(/href="\/(uslugi\/[a-z0-9-]+\.html)"/g)];
    assert.ok(related.length >= 2, route);
    for (const [, target] of related) assert.ok(routes.includes(target), `${route} → ${target}`);
  }
});

test('legal documents are noindex, absent from sitemap, with photo credits only in the policy', async () => {
  const sitemap = await read('sitemap.xml');
  for (const route of ['privacy.html', 'personal-data-consent.html']) {
    const html = await read(route);
    const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0];
    assert.match(head, /<meta name="robots" content="noindex, follow">/);
    assert.ok(!sitemap.includes(route));
    assert.ok(!(await read('robots.txt')).includes(`Disallow: /${route}`));
    assert.match(html, /<h1>/);
  }
  const privacy = await read('privacy.html');
  assert.match(privacy, /id="photo-credits-title">Источники фотографий/);
  assert.match(privacy, /Снимки кадрированы под страницы услуг/);
  assert.match(privacy, /creativecommons.org/);
  for (const route of ['index.html', 'prices.html', 'uslugi/remont-dvigatelya.html', 'personal-data-consent.html']) {
    const html = await read(route);
    assert.doesNotMatch(html, /Источники фотографий/);
    assert.match(html, /href="\/privacy.html"/);
    assert.match(html, /href="\/personal-data-consent.html"/);
  }
});
