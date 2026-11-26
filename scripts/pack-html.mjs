#!/usr/bin/env node
/* Ready HTML pages for a website builder or any plain hosting (run with `npm run pack:html`).
   Each page becomes one self-contained .html file: styles and script are written inside it, so only the
   pictures and fonts in assets/ are separate files. Output: dist/html-pack/ and dist/bigone-site-html.zip. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(root, 'dist', 'client');
const out = path.join(root, 'dist', 'html-pack');
if (!existsSync(path.join(client, 'index.html'))) throw new Error('Run the build first: SITE_BASE_PATH=/ npm run build');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = path.join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [full];
});
rmSync(out, { recursive: true, force: true });
cpSync(client, out, { recursive: true });

const bundled = new Set();
const read = (href) => {
  const file = path.join(client, href.replace(/^\//, ''));
  bundled.add(file);
  return readFileSync(file, 'utf8');
};
const pages = walk(out).filter((file) => file.endsWith('.html'));
for (const file of pages) {
  let html = readFileSync(file, 'utf8');
  html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g, (_, href) => `<style>${read(href)}</style>`);
  html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
  // The script goes to the end of the page: the markup is already there and the script only brings it to life.
  let scripts = '';
  html = html.replace(/<script type="module"[^>]*src="([^"]+\.js)"[^>]*><\/script>/g, (_, href) => {
    scripts += `<script type="module">${read(href).replace(/<\/script/gi, '<\\/script')}</script>`;
    return '';
  });
  // A function, not a string: the script contains "$'"-like sequences that String.replace would expand.
  html = html.replace('</body>', () => `${scripts}</body>`);
  writeFileSync(file, html);
}
// The script and styles now live inside the pages.
for (const file of bundled) rmSync(path.join(out, path.relative(client, file)), { force: true });

// Apache hosting (Masterhost, Beget, reg.ru, Timeweb …): addresses without .html, the 404 page, compression, caching.
// Every block is wrapped in IfModule, so a host without a module still serves the site.
writeFileSync(path.join(out, '.htaccess'), `AddDefaultCharset UTF-8
DirectoryIndex index.html
ErrorDocument 404 /404.html
AddType image/webp .webp
AddType font/woff2 .woff2

<IfModule mod_rewrite.c>
  RewriteEngine On
  # После выпуска SSL-сертификата уберите # у трёх строк ниже: сайт будет открываться только по https.
  # RewriteCond %{HTTPS} !=on
  # RewriteCond %{HTTP:X-Forwarded-Proto} !https
  # RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  # www.bigonegarage.ru -> bigonegarage.ru
  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
  RewriteRule ^ %{REQUEST_SCHEME}://%1%{REQUEST_URI} [L,R=301]
  # /prices и /uslugi/shinomontazh открывают prices.html и uslugi/shinomontazh.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.+?)/?$ $1.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml text/plain application/xml text/xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType image/jpeg "access plus 7 days"
  ExpiresByType image/webp "access plus 7 days"
  ExpiresByType image/png "access plus 7 days"
  ExpiresByType image/svg+xml "access plus 7 days"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
`);
writeFileSync(path.join(out, 'ИНСТРУКЦИЯ.txt'), `The Big One Garage — сайт в виде готовых HTML-страниц

Каждая страница — один файл: стили и скрипт уже внутри.
Отдельно лежат только картинки и шрифты (папка assets) и иконки.

Страницы:
${pages.map((file) => '  /' + path.relative(out, file).split(path.sep).join('/')).filter((p) => p !== '/404.html').join('\n')}
  /404.html — страница «не найдено»

ОБЫЧНЫЙ ХОСТИНГ (Masterhost, Beget, reg.ru, Timeweb …)
Загрузите всё содержимое этой папки в корневую папку сайта (ту, где хостинг ждёт index.html),
включая скрытый файл .htaccess. Распакуйте архив на компьютере и загрузите файлы, а не сам архив,
или загрузите архив в файловый менеджер хостинга и распакуйте его там.
Файл .htaccess: адреса без .html, страница 404, сжатие, кеш. После выпуска SSL включите в нём
переадресацию на https (три строки помечены).

КОНСТРУКТОР (MatroNet и т. п.)
1. Загрузите папку assets и файлы favicon.svg, favicon-32.png, apple-touch-icon.png, og-image.jpg
   так, чтобы они открывались по адресам https://ваш-домен/assets/hero-720.jpg, https://ваш-домен/favicon.svg.
2. Для каждой страницы создайте страницу с тем же адресом (например /prices.html; если конструктор
   не разрешает .html — /prices) и замените весь её код содержимым файла целиком.
3. Если конструктор добавляет свою шапку, меню или стили — отключите их для этих страниц.
4. Отправьте тестовую заявку с сайта: она должна появиться в CRM в разделе «Заявки».

Заявки уходят прямо в CRM (адрес — в site.json → leadsUrl), отдельный сервер не нужен.
Если картинки в конструкторе получают другой адрес — сообщите его, страницы пересоберутся под него.
`);
const zip = path.join(root, 'dist', 'bigone-site-html.zip');
rmSync(zip, { force: true });
const result = spawnSync('zip', ['-qr', zip, '.'], { cwd: out, stdio: 'inherit' });
console.log(`HTML pack: ${pages.length} pages in dist/html-pack/${result.status === 0 ? ' and dist/bigone-site-html.zip' : ' (zip not available)'}`);
