import { personalDataPages } from './personal-data.js';
/* Search pages: one page per direction of the price list, each with its own heading, title and
   description, so a query like «замена колодок Соколиная Гора» lands on the matching prices. */
import catalog from './data/services.json';

const AREA = 'на Соколиной Горе';
// Category ids come from the original price list (services.json); the slug is the page address.
const DIRECTIONS = {
  'modal-412249': { slug: 'shinomontazh', h1: `Шиномонтаж и балансировка ${AREA}`, snippet: 'Комплекс на 4 колеса, балансировка и ремонт шин. Цены по диаметру для легковых авто и кроссоверов.', about: 'Комплекс на 4 колеса и замена готового комплекта с балансировкой, R13–R22, отдельные операции и ремонт колёс: легковые автомобили, кроссоверы, внедорожники и микроавтобусы.' },
  'modal-412311': { slug: 'peretyazhka-salona', h1: `Перетяжка салона ${AREA}`, about: 'Руль, ручка АКПП, подлокотник, торпеда, потолок, сиденья и дверные карты — для автомобилей эконом, среднего и большого класса.' },
  'modal-412318': { slug: 'remont-dvigatelya', h1: `Ремонт двигателя ${AREA}`, about: 'Ремень и цепь ГРМ, прокладки, головка блока, маслосъёмные колпачки, замер компрессии и регулировка клапанов.' },
  'modal-412319': { slug: 'otoplenie-i-ohlazhdenie', h1: `Ремонт отопления и охлаждения ${AREA}`, about: 'Радиатор и вентилятор печки, радиатор охлаждения, помпа, термостат и патрубки.' },
  'modal-412320': { slug: 'vyhlopnaya-sistema', h1: `Ремонт выхлопной системы ${AREA}`, about: 'Глушитель, резонатор, гофра, приёмная труба, прокладки и сварка глушителя.' },
  'modal-412321': { slug: 'remont-podveski', h1: `Ремонт подвески ${AREA}`, about: 'Диагностика, амортизаторы и стойки, рычаги, сайлентблоки, шаровые опоры, ступичные подшипники и стабилизатор.' },
  'modal-412323': { slug: 'rulevoe-upravlenie', h1: `Ремонт рулевого управления ${AREA}`, about: 'Рулевая рейка, тяги и наконечники, насос и жидкость ГУР.' },
  'modal-412324': { slug: 'remont-tormozov', h1: `Ремонт тормозной системы ${AREA}`, about: 'Колодки, диски и барабаны, суппорты, трубки и шланги, прокачка, датчики ABS и диагностика.' },
  'modal-412326': { slug: 'remont-transmissii', h1: `Ремонт трансмиссии ${AREA}`, about: 'Сцепление, масло в КПП и АКПП, приводы, карданный вал, замена и ремонт КПП.' },
  'modal-413019': { slug: 'toplivnaya-sistema', h1: `Ремонт топливной системы ${AREA}`, about: 'Датчик уровня топлива, лямбда-зонд, топливная магистраль и промывка бака.' },
  'modal-413086': { slug: 'avtoelektrika', h1: `Автоэлектрика ${AREA}`, about: 'АКБ, генератор и стартер, фары и лампы, электропроводка, замок зажигания и стеклоочистители.' },
};

export const rowsOf = (category) => category.groups.flatMap(group => group.rows);
const amount = (price) => Number(String(price).replace(/\D/g, '')) || 0;
export const minPrice = (category) => { const values = rowsOf(category).map(row => amount(row.price)).filter(Boolean); return values.length ? Math.min(...values) : 0; };
/* "1 работа", "24 работы", "233 работы", "36 работ" */
export const works = (n) => { const a = n % 10, b = n % 100; return `${n} ${a === 1 && b !== 11 ? 'работа' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'работы' : 'работ'}`; };

const categoriesWithPages = catalog.categories.filter(category => DIRECTIONS[category.id]).map(category => {
  const meta = DIRECTIONS[category.id], from = minPrice(category), count = rowsOf(category).length;
  const short = meta.h1.replace(` ${AREA}`, '');
  return {
    id: category.id, name: category.name, slug: meta.slug, h1: meta.h1, about: meta.about, from, count, groups: category.groups,
    path: `uslugi/${meta.slug}.html`,
    title: `${meta.h1} — цены | Big One Garage`,
    description: `${short} на Соколиной Горе в Москве. ${meta.snippet || meta.about}`,
  };
});

const individualServices = [
  { slug: 'tehnicheskoe-obsluzhivanie', serviceId: 'modal-412248', h1: `ТО автомобиля ${AREA}`,
    about: 'На ТО меняем масло и фильтры, проверяем тормоза и согласовываем с вами список работ. Состав обслуживания зависит от пробега, регламента производителя и состояния машины.' },
  { slug: 'diagnostika-avtomobilya', serviceId: 'modal-412250', h1: `Диагностика автомобиля ${AREA}`,
    about: 'Если машина шумит, плохо заводится или загорелся индикатор на панели, опишите симптомы. Начнём с проверки нужных систем и согласуем ремонт, когда найдём причину.' },
  { slug: 'svarochnye-raboty', serviceId: 'modal-412277', h1: `Сварка порогов и днища автомобиля ${AREA}`,
    about: 'Ремонтируем пороги, днище и другие повреждённые участки кузова. Перед сваркой осматриваем металл и согласовываем, какие участки нужно восстановить или заменить.',
    extraJobs: ['Сварка и ремонт порогов', 'Сварка и ремонт днища', 'Сварка колёсных арок', 'Устранение сквозной коррозии кузова'] },
  { slug: 'shumoizolyatsiya', serviceId: 'modal-412276', h1: `Шумоизоляция автомобиля ${AREA}` },
  { slug: 'antikor', serviceId: 'modal-412278', h1: `Обработка днища антикором ${AREA}`,
    about: 'Антикоррозийная обработка днища. Состав работ согласуем после осмотра автомобиля.' },
  { slug: 'avtozvuk', serviceId: 'modal-412312', h1: `Установка автозвука ${AREA}`,
    about: 'Устанавливаем магнитолы, динамики и усилители. Стоимость зависит от комплекта и автомобиля.' },
  { slug: 'himchistka-salona', serviceId: 'modal-423919', h1: `Химчистка салона автомобиля ${AREA}`,
    about: 'Чистим обивку и поверхности салона. Объём работ и цену уточняем после осмотра.' },
].map(({ slug, serviceId, h1, about, extraJobs }) => {
  const service = catalog.services.find(item => item.sourceId === serviceId);
  const description = about || service.text;
  const rows = [{ name: extraJobs ? 'Мелкие сварочные работы' : service.name, price: service.price }];
  if (extraJobs) rows.push(...extraJobs.map(name => ({ name, price: 'После осмотра' })));
  return { id: serviceId, name: service.name, slug, h1, about: description, path: `uslugi/${slug}.html`,
    title: `${h1} — ${extraJobs ? 'цены' : service.price} | Big One Garage`,
    description: `${h1}, Москва. ${description}`,
    groups: [{ name: '', rows }],
    from: extraJobs ? 0 : amount(service.price),
  };
});

export const directions = [...categoriesWithPages, ...individualServices];
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
