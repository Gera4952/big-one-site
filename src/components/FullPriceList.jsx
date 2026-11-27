import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CaretDown, MapPin, MagnifyingGlass, Phone, X } from '@phosphor-icons/react';
import { directionBySlug, rowsOf, works } from '../seo.js';
import { serviceCatalog } from '../data/service-catalog.js';
import '../price-page.css';

const BASE = import.meta.env.BASE_URL;
const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/(^|\s)[rр]\s*(?=\d)/g, '$1r');
// Common inflections and alternate spellings used in customer requests.
const searchForms = [
  [/^колод(?:ка|ки|ок|ку|ками|ках|кам)$/, 'колодки'],
  [/^масл(?:о|а|у|ом|е)$/, 'масло'],
  [/^фильтр(?:а|ы|ов|ом|у|е)?$/, 'фильтр'],
  [/^диск(?:а|и|ов|ом|у|е)?$/, 'диск'],
  [/^гофр(?:а|ы|у|ой|е)$/, 'гофра'],
  [/^замен(?:а|ы|у|ить|ой|е)$/, 'замена'],
];
const searchTerms = text => (normalize(text).match(/[a-zа-я0-9]+/g) || []).map(word =>
  searchForms.find(([pattern]) => pattern.test(word))?.[1] || word
);
function matchesTerms(text, terms) {
  if (!terms.length) return true;
  const words = searchTerms(text);
  return terms.every(term => words.some(word => /^r\d+$/.test(term) ? word === term : word.includes(term)));
}
const workId = (groupIndex, rowIndex) => `work-${groupIndex + 1}-${rowIndex + 1}`;

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
  const matches = text => matchesTerms(text, terms);
  const serviceLabel = `${direction.catalogTitle} ${direction.h1} ${direction.name}`;
  let fallback;
  for (const [groupIndex, group] of direction.groups.entries()) {
    const rowIndex = group.rows.findIndex(row => matches(`${group.name} ${row.name}`));
    if (rowIndex !== -1) {
      return {
        direction,
        work: group.rows[rowIndex],
        group: group.name.replace(/:\s*$/, ''),
        anchor: workId(groupIndex, rowIndex),
      };
    }
    if (!fallback) {
      const fallbackIndex = group.rows.findIndex(row => matches(`${serviceLabel} ${group.name} ${row.name}`));
      if (fallbackIndex !== -1) {
        fallback = { direction, work: group.rows[fallbackIndex], group: group.name.replace(/:\s*$/, ''), anchor: workId(groupIndex, fallbackIndex) };
      }
    }
  }
  if (matches(`${serviceLabel} ${direction.catalogDescription}`)) return { direction };
  return fallback || null;
}

function DirectionPriceList({ direction, onSelect, priceList }) {
  const [query, setQuery] = useState('');
  const input = useRef(null);
  const terms = searchTerms(query);
  const groups = direction.groups.map((group, groupIndex) => ({
    ...group,
    groupIndex,
    rows: group.rows.map((row, rowIndex) => ({ ...row, id: workId(groupIndex, rowIndex) }))
      .filter(row => matchesTerms(`${group.name} ${row.name}`, terms)),
  })).filter(group => group.rows.length);
  const total = rowsOf(direction).length;
  const count = groups.reduce((sum, group) => sum + group.rows.length, 0);

  const list = <div className="price-groups">{groups.map(group => {
    const groupName = group.name.replace(/:\s*$/, '');
    return <div className="price-group" key={group.groupIndex}>
      {groupName && <h3>{groupName}</h3>}
      <div className="price-table">{group.rows.map(row => {
        const name = row.name.replace(/\s+[-–]\s+/g, ' — ');
        const work = [...new Set([direction.name, groupName, name].filter(Boolean))].join(' — ');
        return <button type="button" key={row.id} className="price-work" id={row.id}
          onClick={() => onSelect(work)} aria-label={`${name}: ${row.price}. Уточнить цену`}>
          <span>{name}</span><strong>{row.price}</strong><ArrowUpRight size={15} aria-hidden="true" />
        </button>;
      })}</div>
    </div>;
  })}</div>;

  if (total <= 12) return list;
  return <details className="price-expander" ref={priceList} open>
    <summary>Прайс · {works(total)}<CaretDown size={17} aria-hidden="true" /></summary>
    <div className="price-search" role="search">
      <MagnifyingGlass size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor="direction-search">Поиск по этому прайсу</label>
      <input id="direction-search" ref={input} type="search" placeholder={direction.path.endsWith('/shinomontazh.html') ? 'Например, R16' : 'Найти работу'} value={query}
        onChange={event => setQuery(event.target.value)} />
      {query && <button className="icon-button" type="button" aria-label="Очистить поиск по прайсу"
        onClick={() => { setQuery(''); input.current?.focus(); }}><X size={18} /></button>}
    </div>
    {terms.length > 0 && <p className="price-count" role="status">{count ? `Найдено: ${works(count)}` : 'Работ по этому запросу нет'}</p>}
    {count > 0 && list}
  </details>;
}

export function ServiceCatalog({ onSelect }) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    const initialQuery = new URLSearchParams(location.search).get('q');
    if (initialQuery) setQuery(initialQuery);
  }, []);
  const searchInput = useRef(null);

  function changeQuery(value) {
    setQuery(value);
    const url = new URL(location.href);
    if (value.trim()) url.searchParams.set('q', value);
    else url.searchParams.delete('q');
    history.replaceState(history.state, '', url);
  }

  const terms = searchTerms(query);
  const sections = catalogSections.map(section => ({
    ...section, services: section.services.map(direction => matchingService(direction, terms)).filter(Boolean),
  })).filter(section => section.services.length > 0);
  const count = sections.reduce((total, section) => total + section.services.length, 0);

  return <section className="price-page service-catalog wrap" id="prices">
    <nav className="breadcrumbs" aria-label="Хлебные крошки"><a href={BASE}>Главная</a><span aria-hidden="true">/</span><span aria-current="page">Все услуги</span></nav>
    <h1>Все услуги и цены</h1>
    <div className="price-tools">
      <div className="price-search" role="search"><MagnifyingGlass size={20} aria-hidden="true" /><label className="sr-only" htmlFor="catalog-search">Поиск по услугам и работам</label>
        <input id="catalog-search" type="search" ref={searchInput} value={query} onChange={event => changeQuery(event.target.value)} placeholder="Например, колодки или ГРМ" />
        {query && <button type="button" className="icon-button" onClick={() => { changeQuery(''); searchInput.current?.focus(); }} aria-label="Очистить поиск"><X size={18} /></button>}
      </div>
    </div>
    {terms.length > 0
      ? <p className="price-count" role="status">Найдено услуг: {count}</p>
      : <nav className="catalog-index" aria-label="Разделы каталога">{catalogSections.map(section => <a key={section.id} href={`#${section.id}`}>{section.navTitle || section.title}</a>)}</nav>}
    {sections.map(section => <section className="catalog-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`}>{section.title}</h2>
      <ul className="catalog-grid" role="list">
        {section.services.map(({ direction, work, group, anchor }) => <li key={direction.id} id={direction.id}>
          <a className="catalog-service" href={`${BASE}${direction.path}${anchor ? `#${anchor}` : ''}`}>
            <img src={`${BASE}assets/${direction.photo?.file || `service-${direction.image}.webp`}`} width={96} height={72} alt="" loading="lazy" decoding="async" />
            <div className="catalog-service-copy">
              <h3>{direction.catalogTitle}</h3>
              {!work && <p>{direction.catalogDescription}</p>}
              {!work && <StartingPrice direction={direction} />}
              {work && <p className="catalog-match">{[group, work.name.replace(/\s+[-–]\s+/g, ' — ')].filter(Boolean).join(' · ')} <strong>{work.price}</strong></p>}
            </div>
            <ArrowRight className="catalog-service-arrow" size={17} aria-hidden="true" />
          </a>
        </li>)}
      </ul>
    </section>)}
    <div className="catalog-help">
      <div>
        <h2>{count ? 'Не знаете, какую услугу выбрать?' : 'По запросу ничего не нашли'}</h2>
        <p>{count ? 'Расскажите, что беспокоит в машине.' : 'Попробуйте название детали или работы.'}</p>
      </div>
      <button className="button secondary" type="button" onClick={() => onSelect(count ? '' : query.trim(), true)}>Задать вопрос мастеру<ArrowUpRight size={18} aria-hidden="true" /></button>
    </div>
  </section>;
}

export function DirectionPrices({ direction, onSelect, contact }) {
  const priceList = useRef(null);
  useEffect(() => {
    const hash = location.hash;
    if (hash === '#direction-prices' && priceList.current) priceList.current.open = true;
    if (!/^#work-\d+-\d+$/.test(hash)) return;
    const row = document.getElementById(hash.slice(1));
    if (row) row.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);
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
      <section id="direction-prices">
        <h2>Работы и цены</h2>
        <p>{direction.priceNote || 'Точную стоимость согласуем перед ремонтом.'}</p>
        <p className="price-instruction">Чтобы уточнить стоимость, выберите строку прайса.</p>
        <DirectionPriceList direction={direction} onSelect={onSelect} priceList={priceList} />
      </section>
      {direction.heading && direction.text && <section>
        <h2>{direction.heading}</h2>
        <p>{direction.text}</p>
      </section>}
      {direction.question && direction.answer && <section>
        <h2>{direction.question}</h2>
        <p>{direction.answer}</p>
      </section>}
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
