# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Big One website decisions

- Separate portable public website, no CRM code or database dependencies.
- User selected the first editorial concept, dark charcoal background and smaller hero typography.
- Reference: exec-b907daa2-06d8-4cca-9f26-304b61681171.png.
- Local-only delivery; user publishes through Git. Initial base path /big-site/, configurable to /.
- Leads go to the service email thebigonegarage@bk.ru via server SMTP, never simulated success.
- Reviews use Yandex organization 152908357603 with original-source link. Show a dark carousel of attributed review summaries on the home page, with three cards on desktop and a link to all Yandex Maps reviews.
- Hero keeps the generated illustration (owner's choice, 2026-10-20), not a photograph of the actual business. Real owner-supplied photos: workshop-* and body-* in «Как мы работаем», entrance-* in contacts.

- Emphasize service for all vehicle makes, models and years; use symptom-based entry points and plain-language explanations before the detailed price list.

- Primary CTA is «Консультация», with a no-obligation explanation. Use «Проконсультироваться» for «Не знаю, что случилось» and the help flow; do not claim consultation is free without confirmation.

- 2026-10-20: mobile-first redesign (dark base kept, rounded cards, red gradient accents, bottom-sheet dialogs, compact problem tiles, price directions as accordions, sticky search and direction chips on the price page). Photos served as responsive WebP/JPEG (<name>-720 and full size). (The frozen first version big-site2 was removed on 2026-11-16.)

- 2026-10-22: one location, not a chain — do not copy network features (station choice, app, cabinet). Keep the page calm: the owner found it too wordy. First screen stays simple (location, heading, short intro, «Консультация» + «Услуги и цены», address with open status, and phone in the header) — no forms or chips there. Cards carry a title and a price or one short line, no paragraphs of small text. «Частые работы» take prices from services.json by name; the full form asks «Когда удобно приехать?». Map replaced the entrance photo in contacts. Hours, WhatsApp, Telegram, VK come from the 2GIS card; owner should confirm. CRM booking integration comes later.
- 2026-10-22 SEO: pages are prerendered at build (`src/entry-server.jsx` + `scripts/prerender.mjs`, then hydrated in `main.jsx`): home, prices.html and one page per price direction at `uslugi/<slug>.html` (headings, titles and descriptions in `src/seo.js`, texts only list works that are in the price list). Render must stay deterministic: anything time- or URL-dependent is set in an effect. sitemap.xml, robots.txt, canonical and JSON-LD (AutoRepair, FAQPage, OfferCatalog, BreadcrumbList) are generated from `site.json → siteUrl`; the domain will change, so never hard-code addresses.
- 2026-11-16 portability: the site is self-contained and may move to any host. Leads go straight to the CRM «Заявки» (`site.json → leadsUrl`, CRM `POST /api/leads/site`, any origin allowed by default); with `leadsUrl: null` they go to the optional Node mail server in `server/`. Never import CRM code; the only link to the CRM is that URL.

- Mobile layout uses readable text, quiet separators and clear actions for prices and contact. Prefer plain lists over repeated card grids, and keep decorative labels and effects out of the reading flow.

- Prefer real photographs of a credible service operation or a recognizable stage of the repair. Verify what the image shows and its reuse terms. Use the actual workshop photos where they fit and keep photo credits in the privacy policy (privacy.html), including author, source, license links and the cropping notice. Policy and consent pages stay accessible but use noindex and are excluded from sitemap.xml. For generated illustrations, prefer tight crops of the tool and part, appropriate protective equipment, and as few visible hands as the scene needs. Service page images have no visible caption.

- Use the service logo from Big One CRM and align the header with the shared content width. Prefer warm graphite, a single red accent, shop photos, and simple dividers.

- Keep /prices.html as a service directory. Each card has a short description, a starting price drawn from the price list, and a link to the service page. Keep the full price list on the individual service pages.

- 2026-11-27 UX refinement: avoid generic AI landing-page patterns (repeated oversized image grids, decorative badges, vague expertise claims). Keep the existing graphite/red identity. Home services use compact rows with prices and the exact work each starting price covers. Consultation opens direct phone/messenger choices plus an optional callback form; vehicle details required by the lead API remain required. Optional plate and visit time are disclosed separately. Service price lists are expanded by default.
