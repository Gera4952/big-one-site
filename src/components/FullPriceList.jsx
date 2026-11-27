import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CaretDown, MapPin, MagnifyingGlass, Phone, X } from '@phosphor-icons/react';
import { directionBySlug, rowsOf, works } from '../seo.js';
import { serviceCatalog } from '../data/service-catalog.js';
import '../price-page.css';

const BASE = import.meta.env.BASE_URL;
const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/(^|\s)[rр]\s*(?=\d)/g, '$1r');
const catalogSections = serviceCatalog.map(({ id, title, navTitle, services }) => ({
  id, title, navTitle, services: services.map(item => directionBySlug(item.slug)),
}));

function StartingPrice({ direction }) {
  return <p className="service-starting-price">
    <strong>{direction.from ? `от ${direction.from.toLocaleString('ru-RU')} ₽` : 'После осмотра'}</strong>
    {direction.priceFor && <> <span>{direction.priceFor}</span></>}
  </p>;
}

function matchingService(direction, terms) {
  if (!terms.length) return { direction };
  const matches = (text) => {
    const label = normalize(text);
    return terms.every(term => label.includes(term));
  };
  const serviceLabel = `${direction.catalogTitle} ${direction.h1} ${direction.name}`;
  for (const group of direction.groups) {
    const work = group.rows.find(row => matches(`${serviceLabel} ${group.name} ${row.name}`));
    if (work) return { direction, work, group: group.name.replace(/:\s*$/, '') };
  }
  return matches(`${serviceLabel} ${direction.catalogDescription}`) ? { direction } : null;
}

export function PriceRows({ groups, category, onSelect }) {
  return <div className="price-groups">{groups.map((group, i) => <div className="price-group" key={`${group.name}-${i}`}>
    {group.name && <h3>{group.name.replace(/:\s*$/, '')}</h3>}
    <div className="price-table">{group.rows.map((row, j) => <button type="button" key={`${row.name}-${j}`} className="price-work" onClick={() => onSelect([category, group.name.replace(/:\s*$/, ''), row.name].filter((part, index, parts) => part && parts.indexOf(part) === index).join(' — '))} aria-label={`${row.name}: ${row.price}. Обсудить работу`}>
      <span>{row.name.replace(/\s+[-–]\s+/g, ' — ')}</span><strong>{row.price}</strong>
    </button>)}</div>
  </div>)}</div>;
}

export function ServiceCatalog({ onSelect }) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    const initialQuery = new URLSearchParams(location.search).get('q');
    if (initialQuery) setQuery(initialQuery);
  }, []);
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const sections = catalogSections.map(section => ({
    ...section, services: section.services.map(direction => matchingService(direction, terms)).filter(Boolean),
  })).filter(section => section.services.length > 0);
  const count = sections.reduce((total, section) => total + section.services.length, 0);

  return <section className="price-page service-catalog wrap" id="prices">
    <nav className="breadcrumbs" aria-label="Хлебные крошки"><a href={BASE}>Главная</a><span aria-hidden="true">/</span><span aria-current="page">Все услуги</span></nav>
    <h1>Все услуги и цены</h1>
    <p className="section-intro">Выберите услугу, чтобы посмотреть работы и цены.</p>
    <div className="price-tools">
      <div className="price-search" role="search"><MagnifyingGlass size={20} aria-hidden="true" /><label className="sr-only" htmlFor="catalog-search">Поиск по услугам и работам</label>
        <input id="catalog-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Например, колодки или ГРМ" />
        {query && <button type="button" className="icon-button" onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={18} /></button>}
      </div>
    </div>
    {terms.length > 0
      ? <p className="price-count" role="status">Найдено услуг: {count}</p>
      : <nav className="catalog-index" aria-label="Разделы каталога">{catalogSections.map(section => <a key={section.id} href={`#${section.id}`}>{section.navTitle || section.title}</a>)}</nav>}
    {sections.map(section => <section className="catalog-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`}>{section.title}</h2>
      <ul className="catalog-grid" role="list">
        {section.services.map(({ direction, work, group }) => <li key={direction.id} id={direction.id}>
          <a className="catalog-service" href={`${BASE}${direction.path}${work ? '#direction-prices' : ''}`}>
            <img src={`${BASE}assets/${direction.photo?.file || `service-${direction.image}.webp`}`} width={96} height={72} alt="" loading="lazy" decoding="async" />
            <div className="catalog-service-copy">
              <h3>{direction.catalogTitle}</h3>
              <p>{direction.catalogDescription}</p>
              {!work && <StartingPrice direction={direction} />}
              {work && <p className="catalog-match">{[group, work.name, work.price].filter(Boolean).join(' · ')}</p>}
            </div>
            <ArrowRight className="catalog-service-arrow" size={17} aria-hidden="true" />
          </a>
        </li>)}
      </ul>
    </section>)}
    <div className="catalog-help">
      <div>
        <h2>{count ? 'Не знаете, какую услугу выбрать?' : 'По запросу ничего не нашли'}</h2>
        <p>Опишите, что происходит с машиной. Мастер подскажет, с какой проверки начать.</p>
      </div>
      <button className="button secondary" type="button" onClick={() => onSelect(count ? '' : query.trim(), true)}>Задать вопрос мастеру<ArrowUpRight size={18} aria-hidden="true" /></button>
    </div>
  </section>;
}

export function DirectionPrices({ direction, onSelect, contact }) {
  const priceList = useRef(null);
  useEffect(() => {
    if (location.hash === '#direction-prices' && priceList.current) priceList.current.open = true;
  }, []);
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
        <StartingPrice direction={direction} />
        <div className="direction-actions">
          <button className="button primary" type="button" onClick={consult}>Консультация<ArrowUpRight size={19} /></button>
          <a className="button secondary" href="#direction-prices" onClick={() => { if (priceList.current) priceList.current.open = true; }}>Смотреть цены</a>
        </div>
      </div>
      <figure className="direction-photo">
        <img src={`${BASE}assets/${media.file}`} width={512} height={320} alt={media.alt} decoding="async" />
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
          ? <details className="price-expander" ref={priceList} open>
              <summary>Прайс · {works(rows.length)}<CaretDown size={17} /></summary>
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
        <button className="button primary" type="button" onClick={() => onSelect(direction.name)}>Оставить заявку<ArrowUpRight size={19} /></button>
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
