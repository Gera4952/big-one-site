import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CaretDown, MapPin, MagnifyingGlass, Phone, X } from '@phosphor-icons/react';
import { directionBySlug, directions, rowsOf, works } from '../seo.js';
import '../price-page.css';

const BASE = import.meta.env.BASE_URL;
const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');

export function PriceRows({ groups, category, onSelect }) {
  return <div className="price-groups">{groups.map((group, i) => <div className="price-group" key={`${group.name}-${i}`}>
    {group.name && <h3>{group.name.replace(/:\s*$/, '')}</h3>}
    <div className="price-table">{group.rows.map((row, j) => <button type="button" key={`${row.name}-${j}`} className="price-work" onClick={() => onSelect([category, group.name.replace(/:\s*$/, ''), row.name].filter((part, index, parts) => part && parts.indexOf(part) === index).join(' — '))} aria-label={`${row.name}: ${row.price}. Обсудить работу`}>
      <span>{row.name.replace(/\s+[-–]\s+/g, ' — ')}</span><strong>{row.price}</strong>
    </button>)}</div>
  </div>)}</div>;
}

export function FullPriceList({ onSelect }) {
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

  return <section className="price-page wrap" id="prices">
    <a className="price-back" href={BASE}>← На главную</a>
    <p className="eyebrow">Автосервис на Соколиной Горе</p>
    <h1>Все услуги и цены</h1>
    <p className="section-intro">Выберите направление или найдите конкретную работу по названию. Нажмите на работу в прайсе, чтобы обсудить её с мастером.</p>
    <div className="price-tools">
      <div className="price-search"><MagnifyingGlass size={20} aria-hidden="true" /><label className="sr-only" htmlFor="catalog-search">Поиск по работам</label>
        <input id="catalog-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Например: колодки, ГРМ, R 16" />
        {query && <button type="button" className="icon-button" onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={18} /></button>}
      </div>
      <nav className="price-chips" aria-label="Перейти к разделу">{categories.map(category => <a key={category.id} href={`#${category.id}`}>{category.name}<span>{rowsOf(category).length}</span></a>)}</nav>
    </div>
    <p className="price-count" role="status">{terms.length ? 'Найдено работ' : 'Работ в прайсе'}: {count}</p>
    <div className="price-categories">{categories.map(category => <section className="price-category" id={category.id} key={category.id}>
      <h2>{category.name}{category.from > 0 && <small>от {category.from.toLocaleString('ru-RU')} ₽</small>}</h2>
      <div className="catalog-links"><a className="text-link" href={BASE + category.path} aria-label={`Об услуге «${category.name}»`}>Об услуге<ArrowRight size={16} /></a></div>
      <details className="price-expander" open={terms.length > 0}>
        <summary>Работы и цены · {rowsOf(category).length}<CaretDown size={17} aria-hidden="true" /></summary>
        <PriceRows groups={category.groups} category={category.name} onSelect={onSelect} />
      </details>
    </section>)}</div>
    {!count && <div className="price-empty"><p>Такой работы в прайсе нет. Расскажите, что нужно сделать, — скажем, возьмёмся ли и сколько это будет стоить.</p><button className="button primary" onClick={() => onSelect(query, true)}>Консультация<ArrowUpRight size={18} /></button></div>}
    {Boolean(count) && <div className="catalog-help">
      <p>Не нашли нужную работу или сомневаетесь, что выбрать?</p>
      <button className="button secondary" type="button" onClick={() => onSelect('', true)}>Задать вопрос мастеру<ArrowUpRight size={18} /></button>
    </div>}
  </section>;
}

export function DirectionPrices({ direction, onSelect, contact }) {
  const priceList = useRef(null);
  const rows = rowsOf(direction);
  const related = direction.related.map(directionBySlug);
  const media = direction.photo || { file: `service-${direction.image}.webp`, alt: '' };
  const consult = () => onSelect(direction.name, true);
  return <article className="price-page direction-page wrap">
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <a href={BASE}>Главная</a><span aria-hidden="true">/</span><a href={`${BASE}prices.html`}>Все услуги</a>
      <span className="breadcrumb-current-separator" aria-hidden="true">/</span><span aria-current="page">{direction.name}</span>
    </nav>
    <header className="direction-hero">
      <div>
        <p className="direction-location"><MapPin size={16} aria-hidden="true" />Москва, Соколиная Гора</p>
        <h1>{direction.h1}</h1>
        <p className="direction-lead">{direction.lead}</p>
        <div className="direction-actions">
          <button className="button primary" type="button" onClick={consult}>Консультация<ArrowUpRight size={19} /></button>
          <a className="button secondary" href="#direction-prices" onClick={() => { if (priceList.current) priceList.current.open = true; }}>Смотреть цены</a>
        </div>
      </div>
      <figure className="direction-photo">
        <img src={`${BASE}assets/${media.file}`} width={512} height={320} alt={media.alt} decoding="async" />
        {!direction.photo && <figcaption>Иллюстрация к услуге</figcaption>}
      </figure>
    </header>
    <div className="direction-content">
      <section>
        <h2>{direction.heading}</h2>
        <p>{direction.text}</p>
      </section>
      <section id="direction-prices">
        <h2>Работы и цены</h2>
        <p>{direction.priceNote || 'В прайсе указаны ориентиры. Сумму для вашей машины согласуем перед ремонтом.'}</p>
        {rows.length > 12
          ? <details className="price-expander" ref={priceList}>
              <summary>Открыть прайс · {works(rows.length)}<CaretDown size={17} /></summary>
              <PriceRows groups={direction.groups} category={direction.name} onSelect={onSelect} />
            </details>
          : <PriceRows groups={direction.groups} category={direction.name} onSelect={onSelect} />}
      </section>
      <section>
        <h2>{direction.question}</h2>
        <p>{direction.answer}</p>
      </section>
    </div>
    <section className="direction-contact">
      <div>
        <h2>Обсудить работу с мастером</h2>
        <p><a href={contact.maps} target="_blank" rel="noreferrer">{contact.address}</a>{contact.hours && <> · {contact.hours.toLowerCase()}</>}</p>
      </div>
      <div className="direction-actions">
        <button className="button primary" type="button" onClick={consult}>Оставить заявку<ArrowUpRight size={19} /></button>
        <a className="button secondary" href={contact.phone}><Phone size={18} />{contact.phoneLabel}</a>
      </div>
    </section>
    <nav className="other-directions" aria-label="Смежные услуги">
      <h2>Смежные услуги</h2>
      <ul>{related.map(item => <li key={item.id}><a href={BASE + item.path}>{item.h1}<ArrowRight size={17} /></a></li>)}
        <li><a href={`${BASE}prices.html`}>Все услуги<ArrowRight size={17} /></a></li>
      </ul>
    </nav>
  </article>;
}
