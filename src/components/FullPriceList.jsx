import { useEffect, useState } from 'react';
import { ArrowUpRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import { directions, rowsOf, works } from '../seo.js';
import '../price-page.css';

const BASE = import.meta.env.BASE_URL;
const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');

export function PriceRows({ groups, category, onSelect }) {
  return <div className="price-groups">{groups.map((group, i) => <div className="price-group" key={`${group.name}-${i}`}>
    {group.name && <h3>{group.name.replace(/:\s*$/, '')}</h3>}
    <div className="price-table">{group.rows.map((row, j) => <button type="button" key={`${row.name}-${j}`} className="price-work" onClick={() => onSelect([category, group.name.replace(/:\s*$/, ''), row.name].filter(Boolean).join(' — '))} aria-label={`${row.name}: ${row.price}. Обсудить работу`}>
      <span>{row.name.replace(/\s+[-–]\s+/g, ' — ')}</span><strong>{row.price}</strong>
    </button>)}</div>
  </div>)}</div>;
}

export function FullPriceList({ onSelect, callback }) {
  const [query, setQuery] = useState('');
  useEffect(() => { const q = new URLSearchParams(location.search).get('q'); if (q) setQuery(q); }, []);
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const categories = directions
    .map(category => ({ ...category, groups: category.groups.map(group => ({
      ...group,
      rows: group.rows.filter(row => {
        const label = normalize(`${category.name} ${group.name} ${row.name}`);
        return terms.every(term => label.includes(term));
      }),
    })).filter(group => group.rows.length) }))
    .filter(category => category.groups.length);
  const count = categories.reduce((n, c) => n + rowsOf(c).length, 0);
  const jump = (event, id) => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ block: 'start' }); history.replaceState(null, '', `#${id}`); };
  return <section className="price-page wrap" id="prices">
    <a className="price-back" href={BASE}>← На главную</a>
    <p className="eyebrow">Автосервис на Соколиной Горе</p>
    <h1>Все услуги и цены</h1>
    <p className="section-intro">Найдите нужную работу и нажмите на неё — перезвоним и скажем точную цену для вашей машины.</p>
    <div className="price-tools">
      <label className="price-search"><MagnifyingGlass size={20} /><span className="sr-only">Поиск по работам</span>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Например: колодки, ГРМ, R 16" />
        {query && <button type="button" className="icon-button" onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={18} /></button>}
      </label>
      <nav className="price-chips" aria-label="Направления прайса">{categories.map(category => <a key={category.id} href={`#${category.id}`} onClick={e => jump(e, category.id)}>{category.name}<span>{rowsOf(category).length}</span></a>)}</nav>
    </div>
    <p className="price-count" role="status">{terms.length ? 'Найдено работ' : 'Работ в прайсе'}: {count}</p>
    <div className="price-categories">{categories.map(category => <section className="price-category" id={category.id} key={category.id}>
      <h2><a href={`${BASE}${category.path}`}>{category.name}</a>{category.from > 0 && <small>от {category.from.toLocaleString('ru-RU')} ₽</small>}</h2>
      <PriceRows groups={category.groups} category={category.name} onSelect={onSelect} />
    </section>)}</div>
    {!count && <div className="price-empty"><p>Такой работы в прайсе нет. Расскажите, что нужно сделать, — скажем, возьмёмся ли и сколько это будет стоить.</p><button className="button primary" onClick={() => onSelect(query, true)}>Консультация<ArrowUpRight size={18} /></button></div>}
    {callback}
    <p className="price-note">Точную сумму назовём для вашей машины до начала ремонта.</p>
  </section>;
}

/* A direction of the price list as its own page: heading with the area, short description,
   all its prices, and links to the other directions. */
export function DirectionPrices({ direction, onSelect, callback }) {
  return <section className="price-page wrap" id="prices">
    <nav className="breadcrumbs" aria-label="Навигация"><a href={BASE}>Главная</a><span aria-hidden="true">/</span><a href={`${BASE}prices.html`}>Все услуги</a><span aria-hidden="true">/</span><span aria-current="page">{direction.name}</span></nav>
    <h1>{direction.h1}</h1>
    <p className="section-intro">{direction.about}</p>
    <div className="direction-actions">
      <button className="button primary" onClick={() => onSelect(direction.name, true)}>Консультация<ArrowUpRight size={20} /></button>
      {Boolean(direction.count || direction.from) && <span className="direction-summary">{direction.count ? works(direction.count) : ''}{direction.from ? `${direction.count ? ' · ' : ''}от ${direction.from.toLocaleString('ru-RU')} ₽` : ''}</span>}
    </div>
    <div className="price-categories"><section className="price-category">
      <PriceRows groups={direction.groups} category={direction.count ? direction.name : ''} onSelect={onSelect} />
    </section></div>
    {callback}
    <p className="price-note">Цены «от» — минимальные. Точную сумму для вашей машины назовём до начала ремонта.</p>
    <nav className="other-directions" aria-label="Другие направления"><h2>Другие работы</h2>
      <div className="price-chips">{directions.filter(item => item.id !== direction.id).map(item => <a key={item.id} href={`${BASE}${item.path}`}>{item.name}</a>)}<a href={`${BASE}prices.html`}>Все услуги</a></div>
    </nav>
  </section>;
}
