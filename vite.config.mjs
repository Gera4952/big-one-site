import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* Organization details for search engines (schema.org AutoRepair), built from src/data/site.json
   so the hours and rating on the page and in search results never disagree. */
function structuredData() {
  return {
    name: "structured-data",
    transformIndexHtml() {
      const site = JSON.parse(readFileSync(new URL("./src/data/site.json", import.meta.url), "utf8"));
      const data = {
        "@context": "https://schema.org",
        "@type": "AutoRepair",
        name: "The Big One Garage",
        telephone: "+7 916 098-18-91",
        email: "thebigonegarage@bk.ru",
        priceRange: "₽₽",
        address: { "@type": "PostalAddress", streetAddress: "9-я улица Соколиной Горы, 8, стр. 11", postalCode: "105275", addressLocality: "Москва", addressCountry: "RU" },
        areaServed: "Москва, Соколиная Гора",
        hasMap: "https://yandex.ru/maps/org/the_big_one_garage/152908357603/",
      };
      if (site.hours?.length) data.openingHoursSpecification = site.hours.map(rule => ({ "@type": "OpeningHoursSpecification", dayOfWeek: rule.days.map(day => DAY[day]), opens: rule.open, closes: rule.close }));
      const profiles = [site.whatsapp && `https://wa.me/${String(site.whatsapp).replace(/\D/g, "")}`, site.telegram && `https://t.me/${site.telegram}`, site.vk && `https://vk.com/${site.vk}`].filter(Boolean);
      if (profiles.length) data.sameAs = profiles;
      if (site.rating) data.aggregateRating = { "@type": "AggregateRating", ratingValue: site.rating.value, reviewCount: site.rating.count };
      // Absolute addresses for link previews and search engines; site.siteUrl changes with the domain.
      const url = (process.env.SITE_URL || site.siteUrl || "https://envacrm.ru/big-site/").replace(/\/?$/, "/");
      data['@id'] = `${url}#garage`;
      data.url = url; data.image = `${url}og-image.jpg`;
      data.sameAs = [data.hasMap, ...profiles];
      const base = process.env.SITE_BASE_PATH || "/big-site/";
      // Ownership codes from Yandex Webmaster and Google Search Console, when set in site.json.
      const verification = [["yandex-verification", site.yandexVerification], ["google-site-verification", site.googleVerification]]
        .filter(([, content]) => content).map(([name, content]) => ({ tag: "meta", attrs: { name, content }, injectTo: "head" }));
      // Yandex Metrika: the official counter code, first in <head> of every page (site.json → metrikaId).
      const metrika = Number(site.metrikaId) ? [
        { tag: "script", attrs: { type: "text/javascript" }, injectTo: "head-prepend", children: `
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${Number(site.metrikaId)}', 'ym');
    ym(${Number(site.metrikaId)}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
` },
        { tag: "noscript", injectTo: "body-prepend", children: `<div><img src="https://mc.yandex.ru/watch/${Number(site.metrikaId)}" style="position:absolute; left:-9999px;" alt="" /></div>` },
      ] : [];
      return [
        ...metrika,
        ...verification,
        { tag: "link", attrs: { rel: "canonical", href: url }, injectTo: "head" },
        { tag: "link", attrs: { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }, injectTo: "head" },
        { tag: "link", attrs: { rel: "icon", type: "image/png", sizes: "32x32", href: `${base}favicon-32.png` }, injectTo: "head" },
        { tag: "link", attrs: { rel: "apple-touch-icon", href: `${base}apple-touch-icon.png` }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:url", content: url }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image", content: `${url}og-image.jpg` }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:locale", content: "ru_RU" }, injectTo: "head" },
        { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" }, injectTo: "head" },
        { tag: "script", attrs: { type: "application/ld+json" }, children: JSON.stringify(data), injectTo: "head" },
      ];
    },
  };
}

export default defineConfig({
  base: process.env.SITE_BASE_PATH || "/big-site/",
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    proxy: { "/big-site/api": "http://127.0.0.1:5191", "/api": "http://127.0.0.1:5191" },
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  // The prerender build (src/entry-server.jsx) bundles the icon package instead of importing it at run time.
  ssr: { noExternal: ["@phosphor-icons/react"] },
  plugins: [react(), structuredData()],
});
