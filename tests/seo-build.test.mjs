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
