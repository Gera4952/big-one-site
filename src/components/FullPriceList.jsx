import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';
import catalog from '../data/services.json';
import { directions, directionById, works } from '../seo.js';
import '../price-page.css';

const BASE = import.meta.env.BASE_URL;
const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');
const rowsOf = (category) => category.groups.flatMap(group => group.rows);
const amount = (price) => Number(String(price).replace(/\D/g, '')) || 0;
// Lowest listed price of a direction, shown as "от N ₽" next to its name.
export const fromPrice = (category) => {
  const values = rowsOf(category).map(row => amount(row.price)).filter(Boolean);
  return values.length ? `от ${Math.min(...values).toLocaleString('ru-RU')} ₽` : '';
};
const total = catalog.categories.reduce((n, category) => n + rowsOf(category).length, 0);

export function PriceRows({ groups, category, onSelect }) {
  return <div className="price-groups">{groups.map((group, i) => <div className="price-group" key={`${group.name}-${i}`}>
    {group.name && <h3>{group.name.replace(/:\s*$/, '')}</h3>}
    <div className="price-table">{group.rows.map((row, j) => <button type="button" key={`${row.name}-${j}`} className="price-work" onClick={() => onSelect([category, group.name.replace(/:\s*$/, ''), row.name].filter(Boolean).join(' — '))} aria-label={`${row.name}: ${row.price}. Обсудить работу`}>
      <span>{row.name.replace(/\s+[-–]\s+/g, ' — ')}</span><strong>{row.price}</strong>
    </button>)}</div>
  </div>)}</div>;
}

/* Home page: every direction as a compact row; opening it shows a few prices and a link to the full list. */
export function PricePreview() {
  // Phones show the first directions; the rest open with one tap (all of them stay in the page for search engines).
  const [all, setAll] = useState(false);
  return <div className={`price-preview ${all ? 'is-expanded' : ''}`} id="price-directions">
    <div className="price-preview-head"><h3>Все цены по разделам</h3><span>{works(total)}</span></div>
    <div className="price-directions">{catalog.categories.map(category => {
      const rows = rowsOf(category);
      return <details className="price-direction" key={category.id}>
        <summary><span className="direction-name">{category.name}<small>{works(rows.length)}</small></span><span className="direction-from">{fromPrice(category)}</span><CaretDown size={18} /></summary>
        <ul>{rows.slice(0, 4).map((row, index) => <li key={index}><span>{row.name}</span><strong>{row.price}</strong></li>)}</ul>
        <a className="direction-link" href={`${BASE}${directionById(category.id)?.path || `prices.html#${category.id}`}`}>Все цены: {category.name.toLowerCase()} — {rows.length}<ArrowRight size={18} /></a>
      </details>;
    })}</div>
    {!all && catalog.categories.length > 6 && <button type="button" className="price-more" onClick={() => setAll(true)}>Ещё {catalog.categories.length - 6} {catalog.categories.length - 6 === 1 ? 'направление' : catalog.categories.length - 6 < 5 ? 'направления' : 'направлений'}<CaretDown size={18} /></button>}
    <a className="button secondary price-all" href={`${BASE}prices.html`}>Открыть весь прайс<ArrowUpRight size={18} /></a>
    <p className="price-note">Цена зависит от машины и объёма работ. Точную сумму назовём до начала ремонта.</p>
  </div>;
}

export function FullPriceList({ onSelect, callback }) {
  const [query, setQuery] = useState('');
  useEffect(() => { const q = new URLSearchParams(location.search).get('q'); if (q) setQuery(q); }, []);
  const search = normalize(query.trim());
  const categories = catalog.categories
    .map(category => ({ ...category, groups: category.groups.map(group => ({ ...group, rows: group.rows.filter(row => normalize(`${category.name} ${group.name} ${row.name}`).includes(search)) })).filter(group => group.rows.length) }))
    .filter(category => category.groups.length);
  const count = categories.reduce((n, c) => n + rowsOf(c).length, 0);
  const jump = (event, id) => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ block: 'start' }); history.replaceState(null, '', `#${id}`); };
  return <section className="price-page wrap" id="prices">
    <a className="price-back" href={BASE}>← На главную</a>
    <p className="eyebrow">Автосервис на Соколиной Горе</p>
    <h1>Цены на ремонт и обслуживание</h1>
    <p className="section-intro">Найдите нужную работу и нажмите на неё — перезвоним и скажем точную цену для вашей машины.</p>
    <div className="price-tools">
      <label className="price-search"><MagnifyingGlass size={20} /><span className="sr-only">Поиск по работам</span>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Например: колодки, ГРМ, R 16" />
        {query && <button type="button" className="icon-button" onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={18} /></button>}
      </label>
      <nav className="price-chips" aria-label="Направления прайса">{categories.map(category => <a key={category.id} href={`#${category.id}`} onClick={e => jump(e, category.id)}>{category.name}<span>{rowsOf(category).length}</span></a>)}</nav>
    </div>
    <p className="price-count" role="status">{search ? 'Найдено работ' : 'Работ в прайсе'}: {count}</p>
    <div className="price-categories">{categories.map(category => <section className="price-category" id={category.id} key={category.id}>
      <h2><a href={`${BASE}${directionById(category.id)?.path || ''}`}>{category.name}</a><small>{fromPrice(category)}</small></h2>
      <PriceRows groups={category.groups} category={category.name} onSelect={onSelect} />
    </section>)}</div>
    {!count && <div className="price-empty"><p>Такой работы в прайсе нет. Расскажите, что нужно сделать, — скажем, возьмёмся ли и сколько это будет стоить.</p><button className="button primary" onClick={() => onSelect(query)}>Узнать стоимость<ArrowUpRight size={18} /></button></div>}
    {callback}
    <p className="price-note">Точную сумму назовём для вашей машины до начала ремонта.</p>
  </section>;
}

/* A direction of the price list as its own page: heading with the area, short description,
   all its prices, and links to the other directions. */
export function DirectionPrices({ direction, onSelect, callback }) {
  const category = catalog.categories.find(item => item.id === direction.id);
  return <section className="price-page wrap" id="prices">
    <nav className="breadcrumbs" aria-label="Навигация"><a href={BASE}>Главная</a><span aria-hidden="true">/</span><a href={`${BASE}prices.html`}>Цены</a><span aria-hidden="true">/</span><span aria-current="page">{direction.name}</span></nav>
    <h1>{direction.h1}</h1>
    <p className="section-intro">{direction.about}</p>
    <div className="direction-actions">
      <button className="button primary" onClick={() => onSelect(direction.name)}>Узнать стоимость<ArrowUpRight size={20} /></button>
      <span className="direction-summary">{works(direction.count)}{direction.from ? ` · от ${direction.from.toLocaleString('ru-RU')} ₽` : ''}</span>
    </div>
    <div className="price-categories"><section className="price-category">
      <PriceRows groups={category.groups} category={category.name} onSelect={onSelect} />
    </section></div>
    {callback}
    <p className="price-note">Цены «от» — минимальные. Точную сумму для вашей машины назовём до начала ремонта.</p>
    <nav className="other-directions" aria-label="Другие направления"><h2>Другие работы</h2>
      <div className="price-chips">{directions.filter(item => item.id !== direction.id).map(item => <a key={item.id} href={`${BASE}${item.path}`}>{item.name}</a>)}<a href={`${BASE}prices.html`}>Весь прайс</a></div>
    </nav>
  </section>;
}
