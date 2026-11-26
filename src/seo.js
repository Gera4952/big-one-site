import { personalDataPages } from './personal-data.js';
/* Search pages: one page per direction of the price list, each with its own heading, title and
   description, so a query like «замена колодок Соколиная Гора» lands on the matching prices. */
import catalog from './data/services.json';
import { directionCopy } from './data/direction-copy.js';

const AREA = 'на Соколиной Горе';
const categoryRoutes = {
  'modal-412249': ['shinomontazh', 'Шиномонтаж и балансировка'],
  'modal-412311': ['peretyazhka-salona', 'Перетяжка салона'],
  'modal-412318': ['remont-dvigatelya', 'Ремонт двигателя'],
  'modal-412319': ['otoplenie-i-ohlazhdenie', 'Ремонт отопления и охлаждения'],
  'modal-412320': ['vyhlopnaya-sistema', 'Ремонт выхлопной системы'],
  'modal-412321': ['remont-podveski', 'Ремонт подвески'],
  'modal-412323': ['rulevoe-upravlenie', 'Ремонт рулевого управления'],
  'modal-412324': ['remont-tormozov', 'Ремонт тормозной системы'],
  'modal-412326': ['remont-transmissii', 'Ремонт трансмиссии'],
  'modal-413019': ['toplivnaya-sistema', 'Ремонт топливной системы'],
  'modal-413086': ['avtoelektrika', 'Автоэлектрика'],
};

export const rowsOf = (category) => category.groups.flatMap(group => group.rows);
const amount = (price) => Number(String(price).replace(/\D/g, '')) || 0;
export const minPrice = (category) => { const values = rowsOf(category).map(row => amount(row.price)).filter(Boolean); return values.length ? Math.min(...values) : 0; };
/* "1 работа", "24 работы", "233 работы", "36 работ" */
export const works = (n) => { const a = n % 10, b = n % 100; return `${n} ${a === 1 && b !== 11 ? 'работа' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'работы' : 'работ'}`; };

const categoriesWithPages = catalog.categories.map(category => {
  const [slug, h1] = categoryRoutes[category.id];
  return { ...category, slug, h1, from: minPrice(category) };
});

const bodyRepairs = ['Сварка и ремонт порогов', 'Сварка и ремонт днища', 'Сварка колёсных арок', 'Устранение сквозной коррозии кузова'];
const individualServices = [
  ['modal-412248', 'tehnicheskoe-obsluzhivanie', 'Техническое обслуживание автомобиля'],
  ['modal-412250', 'diagnostika-avtomobilya', 'Диагностика автомобиля'],
  ['modal-412277', 'svarochnye-raboty', 'Сварка порогов и днища'],
  ['modal-412276', 'shumoizolyatsiya', 'Шумоизоляция автомобиля'],
  ['modal-412278', 'antikor', 'Антикоррозийная обработка днища'],
  ['modal-412312', 'avtozvuk', 'Установка автозвука'],
  ['modal-423919', 'himchistka-salona', 'Химчистка салона'],
].map(([id, slug, h1]) => {
  const service = catalog.services.find(item => item.sourceId === id);
  const welding = slug === 'svarochnye-raboty';
  const rows = [{ name: welding ? 'Мелкие сварочные работы' : service.name, price: service.price }];
  if (welding) rows.push(...bodyRepairs.map(name => ({ name, price: 'После осмотра' })));
  return { id, name: service.name, slug, h1, groups: [{ name: '', rows }], from: welding ? 0 : amount(service.price) };
});

export const directions = [...categoriesWithPages, ...individualServices].map(direction => {
  const copy = directionCopy[direction.slug];
  return {
    ...direction, ...copy,
    path: `uslugi/${direction.slug}.html`,
    title: `${direction.h1} ${AREA} | Big One Garage`,
    description: copy.lead,
  };
});
export const directionBySlug = (slug) => directions.find(direction => direction.slug === slug);
export const directionById = (id) => directions.find(direction => direction.id === id);

/* Which page a path is: home, the full price list, or a direction page. */
export function pageOf(path = '/') {
  const match = path.match(/\/uslugi\/([a-z0-9-]+)\.html$/);
  if (match && directionBySlug(match[1])) return { type: 'direction', direction: directionBySlug(match[1]) };
  if (path.endsWith('/prices.html')) return { type: 'prices' };
  const document = Object.keys(personalDataPages).find(key => path.endsWith('/' + personalDataPages[key].path));
  return document ? { type: 'legal', document } : { type: 'home' };
}
