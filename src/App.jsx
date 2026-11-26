import React, { useEffect, useRef, useState, useId } from 'react';
import { ArrowUpRight, ArrowRight, Phone, MapPin, List, X, CheckCircle, CaretDown, MagnifyingGlass, ChatCircleDots, WhatsappLogo, TelegramLogo, Star, Clock, ShieldCheck, Eye, Handshake, CreditCard, MapTrifold, ListChecks, Wrench, PencilSimple, Hammer, Armchair, SpeakerHifi, Drop, Gift } from '@phosphor-icons/react';
import catalog from './data/services.json';
import { FullPriceList, DirectionPrices, PriceRows, PricePreview, fromPrice } from './components/FullPriceList.jsx';
import { PersonalData } from './components/PersonalData.jsx';
import { consentVersion, personalDataPages } from './personal-data.js';
import { LeadCaptcha } from './components/LeadCaptcha.jsx';
import { directionById, pageOf, works } from './seo.js';
import { site, whatsappUrl, telegramUrl, maxUrl, vkUrl, hoursText, openStatus } from './site.js';

const BASE = import.meta.env.BASE_URL;
const leadsUrl = import.meta.env.VITE_SITE_LEADS_URL || site.leadsUrl;
const captchaSiteKey = leadsUrl ? import.meta.env.VITE_SITE_TURNSTILE_KEY : '';
const phone = 'tel:+79160981891';
const phoneLabel = '8 916 098 18 91';
const maps = 'https://yandex.ru/maps/org/the_big_one_garage/152908357603/';
const address = 'Москва, 9-я улица Соколиной Горы, 8, стр. 11';
const { services } = catalog;
const mapWidget = 'https://yandex.ru/map-widget/v1/org/the_big_one_garage/152908357603/';
const trustIcons = { shield: ShieldCheck, eye: Eye, handshake: Handshake, card: CreditCard, chat: ChatCircleDots, star: Star, list: ListChecks, wrench: Wrench, clock: Clock };
/* Promises the site already makes (steps and form notes); owner-confirmed items from site.json are added after them. */
const priceRows = catalog.categories.flatMap(category => category.groups.flatMap(group => group.rows.map(row => ({ ...row, category: category.name, group: group.name.replace(/:\s*$/, '') }))));
const workCount = priceRows.length;
const baseTrust = [
  { icon: 'list', title: `Прайс на ${works(workCount)} есть на сайте` },
  { icon: 'handshake', title: 'Цену называем до начала работ' },
  { icon: 'eye', title: 'Показываем, что сломалось и почему' },
];
/* Frequent jobs with the price straight from the price list, so the two never disagree. */
const findRow = (category, name, group) => priceRows.find(row => row.category === category && row.name === name && (!group || row.group.startsWith(group)));
const findService = (name) => services.find(service => service.name === name);
const categoryByName = (name) => catalog.categories.find(category => category.name === name);
const fallbackText = 'Цена зависит от машины и объёма работ. Точную сумму назовём до начала ремонта.';
/* What a card opens: price, a short description and the matching lines of the price list with a link
   to the direction page, so the card informs first and the form comes after. */
const sheet = ({ title, price, text, category, match, limit = 8 }) => {
  const source = category && categoryByName(category);
  const groups = source ? source.groups.map(group => ({ ...group, rows: group.rows.filter(row => !match || match.test(`${group.name} ${row.name}`)).slice(0, limit) })).filter(group => group.rows.length) : [];
  return { name: title, price, text: text || fallbackText, groups, details: [], link: source ? { href: directionLink(source.id), label: `Все цены: ${source.name.toLowerCase()}` } : null };
};
const popular = [
  { title: 'ТО', price: findService('Техническое обслуживание')?.price, text: findService('Техническое обслуживание')?.text },
  { title: 'Шиномонтаж R15', price: findRow('Шиномонтаж и балансировка', 'R 15', 'Шиномонтаж (комплекс 4 колеса балансировка) - Легковые')?.price, category: 'Шиномонтаж и балансировка', match: /^(Шиномонтаж \(комплекс|Замена готового комплекта).*Легковые/ },
  { title: 'Диагностика', price: findService('Диагностика')?.price, text: 'Найдём, что сломалось, и покажем вам — ещё до ремонта.' },
  { title: 'Замена колодок', price: findRow('Тормозная система', 'Колодки (передние) - замена')?.price, category: 'Тормозная система', match: /Колодки|Диск/ },
  { title: 'Замена ремня ГРМ', price: findRow('Двигатель', 'Ремень ГРМ - замена')?.price, category: 'Двигатель', match: /ГРМ/ },
  { title: 'Амортизаторы', price: findRow('Подвеска', 'Амортизатор (задний, отдельно стоящий) - замена')?.price, category: 'Подвеска', match: /Амортизатор/ },
].filter(item => item.price);
/* «Не только ТО»: what a network service usually does not do. Prices come from the price list. */
const salon = categoryByName('Перетяжка салона');
const crafts = [
  { id: 'body', icon: Hammer, title: 'Кузов и сварка', text: 'Варим кузов и днище.', prices: [['Сварочные работы', findService('Сварочные работы')?.price]],
    sheet: { title: 'Кузов и сварка', price: findService('Сварочные работы')?.price, text: 'Объём работ видно только на осмотре. Посмотрим машину и назовём цену до начала сварки.' } },
  { id: 'salon', icon: Armchair, title: 'Салон', text: 'Перетягиваем сиденья, руль и потолок. Делаем химчистку.', prices: [['Перетяжка', salon && fromPrice(salon)], ['Химчистка', findService('Химчистка салона')?.price]],
    sheet: { title: 'Перетяжка салона', price: salon && fromPrice(salon), text: 'Цена зависит от машины и материала. Химчистка считается отдельно.', category: 'Перетяжка салона', limit: 6 } },
  { id: 'noise', icon: ShieldCheck, title: 'Шумоизоляция и антикор', text: 'Чтобы в салоне было тише, а днище не ржавело.', prices: [['Шумоизоляция', findService('Шумоизоляция автомобиля')?.price], ['Антикор днища', findService('Обработка днища антикором')?.price]],
    sheet: { title: 'Шумоизоляция и антикор', price: findService('Шумоизоляция автомобиля')?.price, text: `Шумоизоляция: ${findService('Шумоизоляция автомобиля')?.text?.toLowerCase() || 'цену назовём после осмотра.'} Обработка днища антикором — ${findService('Обработка днища антикором')?.price || 'по запросу'}.` } },
  { id: 'audio', icon: SpeakerHifi, title: 'Автозвук', text: 'Ставим магнитолы, динамики и усилители.', prices: [['Установка', findService('Установка автомузыки')?.price]],
    sheet: { title: 'Автозвук', price: findService('Установка автомузыки')?.price, text: 'Цена зависит от комплекта и машины. Назовём её до начала работ.' } },
];
const visits = ['Сегодня', 'Завтра', 'На этой неделе', 'Пока только узнать цену'];
const leadLabel = (...parts) => parts.filter(Boolean).join(' · ');
const directionLink = (id) => `${BASE}${directionById(id)?.path || `prices.html#${id}`}`;
const quickLinks = [
  ['Шиномонтаж', directionLink('modal-412249')], ['Тормоза', directionLink('modal-412324')], ['Подвеска', directionLink('modal-412321')],
  ['Двигатель', directionLink('modal-412318')], ['Электрика', directionLink('modal-413086')],
];
const ratingText = site.rating ? `${Number(site.rating.value).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : null;
const reviewWord = (n) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'отзыв' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'отзыва' : 'отзывов'; };

/* Responsive photo from public/assets: <name>-720 and <name>-<full> in WebP with a JPEG fallback. */
function Photo({ name, full, width, height, sizes = '100vw', alt, className = '', priority = false }) {
  const set = (ext) => `${BASE}assets/${name}-720.${ext} 720w, ${BASE}assets/${name}-${full}.${ext} ${full}w`;
  return <picture className={className}>
    <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
    <img src={`${BASE}assets/${name}-${full}.jpg`} srcSet={set('jpg')} sizes={sizes} width={width} height={height} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />
  </picture>;
}

function Messengers({ className = '' }) {
  if (!whatsappUrl && !telegramUrl && !maxUrl) return null;
  return <div className={`messengers ${className}`.trim()}>
    {whatsappUrl && <a className="messenger whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><WhatsappLogo size={22} weight="fill" />WhatsApp</a>}
    {telegramUrl && <a className="messenger telegram" href={telegramUrl} target="_blank" rel="noreferrer"><TelegramLogo size={22} weight="fill" />Telegram</a>}
    {maxUrl && <a className="messenger max" href={maxUrl} target="_blank" rel="noreferrer"><ChatCircleDots size={22} weight="fill" />MAX</a>}
  </div>;
}

function OpenStatus({ className = '' }) {
  // Computed after the page opens: the prerendered HTML cannot know the visitor's time.
  const [status, setStatus] = useState(null);
  useEffect(() => { setStatus(openStatus()); const timer = setInterval(() => setStatus(openStatus()), 60000); return () => clearInterval(timer); }, []);
  if (!status) return null;
  return <small className={`open-status ${status.open ? 'is-open' : ''} ${className}`.trim()}><i aria-hidden="true" />{status.text}</small>;
}

const problems = [
  ['Пора на ТО', 'Масло, фильтры и плановое обслуживание.'],
  ['Стучит, шумит или вибрирует', 'Найдём, откуда звук.'],
  ['Горит ошибка или не заводится', 'Начнём с диагностики.'],
  ['Плохо тормозит', 'Проверим тормоза и скажем, что менять.'],
  ['Нужен шиномонтаж', 'Сезонная замена, балансировка, ремонт колёс.'],
];
const unknownProblem = ['Не знаю, что случилось', 'Расскажите, как это проявляется, — подскажем, с чего начать.'];
const steps = [
  ['Вы рассказываете, что случилось', 'Своими словами, без технических терминов.'],
  ['Мы находим причину и показываем её', 'Объясним, что сломалось и чем это грозит.'],
  ['Договариваемся о цене и чиним', 'Без вашего согласия ничего лишнего не делаем.'],
];
export const faq = [
  ['Нужно записываться заранее?', `Лучше да — тогда не придётся ждать${site.hours?.length ? `. Работаем ${hoursText().toLowerCase()}` : ''}. Позвоните или оставьте номер — подберём удобное время и скажем, сколько займёт ремонт.`],
  ['Вы чините мою марку?', 'Да. Берём машины любых марок и любого года выпуска.'],
  ['Можно узнать цену заранее?', 'Многие цены есть в прайсе на сайте. Точную сумму для вашей машины назовём после осмотра — иногда сначала нужна диагностика.'],
  ['Заявка на сайте — это уже запись?', 'Нет, заявка ни к чему не обязывает. Мы перезвоним и ответим на вопросы, а время визита договоримся отдельно.'],
  ['Можно приехать со своими запчастями?', 'Можно. Расскажите заранее, что у вас есть, — мастер скажет, подойдут ли они.'],
  ['Как вас найти?', `${address.replace('стр.', 'строение')}. Маршрут — в Яндекс Картах. Если не найдёте въезд, позвоните: ${phoneLabel}.`],
];

/* Open dialogs, newest last. Each one adds a history entry, so the phone's Back button closes
   the dialog instead of leaving the site; closing with the cross goes back through that entry. */
const openDialogs = [];
if (typeof window !== 'undefined') window.addEventListener('popstate', () => { openDialogs.pop()?.(); });
const nativeDialog = typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype;

function Dialog({ title, children, onClose }) {
  const titleId = useId(); const ref = useRef(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const close = () => history.back();
  useEffect(() => {
    const previous = document.activeElement;
    if (nativeDialog) ref.current.showModal(); else { ref.current.setAttribute('open', ''); ref.current.querySelector('.close')?.focus(); }
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const entry = () => closeRef.current();
    openDialogs.push(entry); history.pushState({ dialog: openDialogs.length }, '');
    const escape = (event) => { if (!nativeDialog && event.key === 'Escape') close(); };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('keydown', escape);
      // Removed by the page itself (not via Back): forget it; its history entry then does nothing.
      const index = openDialogs.indexOf(entry); if (index !== -1) openDialogs.splice(index, 1);
      document.body.style.overflow = old; previous?.focus?.();
    };
  }, []);
  return <>{!nativeDialog && <div className="dialog-backdrop" onClick={close} />}<dialog ref={ref} className={nativeDialog ? '' : 'dialog-fallback'} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === ref.current) close(); }} aria-labelledby={titleId} aria-modal="true">
    <div className="dialog-content">
      <button className="close icon-button" onClick={close} aria-label="Закрыть"><X size={22} /></button>
      <p className="eyebrow">The Big One Garage</p>
      <h2 id={titleId}>{title}</h2>
      {children}
    </div>
  </dialog></>;
}

/* Request id for duplicate protection; older iPhones have no crypto.randomUUID. */
function requestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/* "+7 (916) 098-18-91" while typing; 8… and 9… are read as Russian numbers. */
function formatPhone(value) {
  let d = value.replace(/\D/g, '');
  if (!d) return '';
  if (d[0] === '8') d = '7' + d.slice(1); else if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  return '+7' + (p[0] ? ` (${p[0]}` : '') + (p[0].length === 3 ? ')' : '') + (p[1] ? ` ${p[1]}` : '') + (p[2] ? `-${p[2]}` : '') + (p[3] ? `-${p[3]}` : '');
}
function PhoneInput({ label = false }) {
  const [value, setValue] = useState('');
  const [hint, setHint] = useState('');
  return <>
    <input required name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+7 (___) ___-__-__" maxLength={18} aria-label={label ? undefined : 'Ваш телефон'}
      value={value} onChange={e => { setValue(formatPhone(e.target.value)); setHint(''); }}
      onBlur={() => setHint(value && value.replace(/\D/g, '').length !== 11 ? 'Номер неполный: нужно 10 цифр после +7.' : '')} aria-invalid={Boolean(hint)} />
    {hint && <small className="field-hint">{hint}</small>}
  </>;
}

/* The same form sends from the homepage, service dialogs and price pages. */
function useLead(service) {
  const [status, setStatus] = useState('idle'), [error, setError] = useState(''), [started] = useState(Date.now());
  const [captchaToken, setCaptchaToken] = useState(''), [captchaAttempt, setCaptchaAttempt] = useState(0);
  const key = useRef(null);
  function resetCaptcha() { setCaptchaToken(''); setCaptchaAttempt(value => value + 1); }
  async function submit(e) {
    e.preventDefault(); if (status === 'sending') return;
    const form = e.currentTarget; const fields = Object.fromEntries(new FormData(form));
    if (!/^[78]\d{10}$/.test(fields.phone.replace(/\D/g, ''))) { setError('Введите российский номер: +7 и ещё 10 цифр.'); form.elements.phone.focus(); return; }
    for (const name of ['name', 'make', 'model', 'plate', 'message']) fields[name] = fields[name].trim();
    const missing = ['name', 'make', 'model', 'message'].find(name => !fields[name]);
    if (missing) { setError('Заполните обязательные поля.'); form.elements[missing].focus(); return; }
    if (captchaSiteKey && !captchaToken) { setError('Дождитесь завершения проверки безопасности.'); return; }
    const carName = [fields.make, fields.model].map(part => part.replaceAll('·', ' ')).join(' ');
    const car = fields.plate ? `${carName} · ${fields.plate.replaceAll('·', '').toUpperCase()}` : carName;
    key.current ??= requestId();
    setStatus('sending'); setError('');
    const params = new URLSearchParams(location.search); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(leadsUrl || `${BASE}api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ ...fields, car, consent_version: consentVersion, captcha_token: captchaToken, service, started, id: key.current, source: location.pathname, utm: Object.fromEntries([...params].filter(([k]) => /^utm_(source|medium|campaign|term|content)$/.test(k))) }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.ok !== true || (leadsUrl && !Number.isInteger(body.id))) throw new Error(body.error || 'Не получили подтверждение отправки.');
      setStatus('success'); window.dispatchEvent(new CustomEvent('bigone:lead-sent', { detail: { service } }));
    } catch (err) {
      if (captchaSiteKey) resetCaptcha();
      setStatus('idle'); setError(err.name === 'AbortError' ? 'Не получили подтверждение отправки. Позвоните нам или попробуйте ещё раз.' : err.message);
    } finally { clearTimeout(timer); }
  }
  return { status, error, submit, setCaptchaToken, captchaAttempt, resetCaptcha };
}

function LeadForm({ service = '', consultation = false, submitLabel }) {
  const [visit, setVisit] = useState('');
  const { status, error, submit, setCaptchaToken, captchaAttempt, resetCaptcha } = useLead(leadLabel(service, visit && `удобно: ${visit.toLowerCase()}`));
  if (status === 'success') return <div className="success" role="status"><CheckCircle size={36} weight="light" /><h3>Заявка отправлена</h3><p>Перезвоним по указанному номеру.</p><a href={phone}>Если вопрос срочный: {phoneLabel}</a></div>;
  return <form onSubmit={submit} className="lead-form">
    {service && <p className="selected-service">Ваш запрос: {service}</p>}
    <div className="lead-fields-grid">
      <label>Имя<input name="name" autoComplete="given-name" maxLength={80} required /></label>
      <label>Телефон<PhoneInput label /></label>
      <label>Марка<input name="make" maxLength={40} required /></label>
      <label>Модель<input name="model" maxLength={50} required /></label>
    </div>
    <label>Госномер <span className="optional">необязательно</span><input name="plate" autoCapitalize="characters" spellCheck={false} maxLength={20} placeholder="А123ВС 777" /></label>
    <label>Текст обращения<textarea name="message" placeholder="Например, стучит спереди на кочках" maxLength={2000} rows={3} required /></label>
    <ChoiceChips label="Когда удобно приехать?" options={visits} value={visit} onChange={setVisit} />
    <div className="honeypot" aria-hidden="true"><label>Ваш сайт<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="consent">
      <label><input type="checkbox" name="consent" required value="yes" />Даю согласие на обработку персональных данных для ответа на заявку.</label>
      <div className="consent-documents">
        <a href={BASE + personalDataPages.consent.path} target="_blank" rel="noopener">{personalDataPages.consent.title}</a>
        <a href={BASE + personalDataPages.privacy.path} target="_blank" rel="noopener">{personalDataPages.privacy.title}</a>
      </div>
    </div>
    {captchaSiteKey && <LeadCaptcha siteKey={captchaSiteKey} onToken={setCaptchaToken} attempt={captchaAttempt} onRetry={resetCaptcha} />}
    <p className="form-error" role="alert">{error}</p>
    <button className="button primary" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : submitLabel || (consultation ? 'Проконсультироваться' : 'Отправить заявку')}<ArrowUpRight size={20} /></button>
    <p className="form-note">{site.responseTime ? `${site.responseTime} ` : ''}Ни к чему не обязывает.</p>
  </form>;
}

function Callback({ service = '', title = 'Не хотите заполнять форму?', text = 'Оставьте номер — перезвоним сами.', compact = false }) {
  return <div className={`callback ${compact ? 'is-compact' : ''}`}>
    {title && <div className="callback-copy"><b>{title}</b><p>{text}</p></div>}
    <LeadForm service={service} submitLabel="Перезвоните мне" />
  </div>;
}

/* Single-choice chips that behave as one radio group for screen readers and keyboards. */
function ChoiceChips({ label, options, value, onChange }) {
  return <div className="choice"><span className="choice-label">{label}</span>
    <div className="choice-options" role="radiogroup" aria-label={label}>{options.map(option => <button type="button" role="radio" aria-checked={value === option} key={option} onClick={() => onChange(value === option ? '' : option)}>{option}</button>)}</div>
  </div>;
}

/* «Акция» из site.json → promo: одна карточка под первым экраном. Пусто (null) — блока нет. */
function Promo({ promo, onAsk }) {
  return <section className="promo wrap" id="promo" aria-labelledby="promo-title">
    <div className="promo-card">
      <span className="promo-icon" aria-hidden="true"><Drop size={26} weight="fill" /><Gift size={18} weight="fill" /></span>
      <div className="promo-copy">
        {promo.eyebrow && <small className="eyebrow">{promo.eyebrow}</small>}
        <h2 id="promo-title">{promo.title}</h2>
        {promo.text && <p>{promo.text}</p>}
        {promo.free && <p className="promo-price">{promo.was && <s>{promo.was}</s>}<b>0 ₽</b><span>{promo.free}</span></p>}
        {promo.note && <small className="promo-note">{promo.note}</small>}
      </div>
      <div className="promo-actions">
        <button className="button primary" onClick={() => onAsk(promo.service || promo.title)}>{promo.button || 'Записаться'}<ArrowUpRight size={20} /></button>
      </div>
    </div>
  </section>;
}

function Heading({ eyebrow, title, link }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{link}</div>;
}

/* `path` is passed when the page is prerendered at build time; in the browser it is the current address. */
/* Reviews: a dark summary with the rating (when it is filled in site.json) and quotes; the light Yandex widget
   opens in its own frame only on request, so it does not glare on the dark page. */
function Reviews() {
  const [open, setOpen] = useState(false);
  return <section className="reviews section wrap" id="reviews">
    <Heading eyebrow="Отзывы" title="Что о нас пишут" />
    <div className="reviews-panel">
      <div className="reviews-summary">
        {site.rating ? <div className="reviews-score"><b>{ratingText}</b><span className="stars" aria-label={`Рейтинг ${ratingText} из 5`}>{[0, 1, 2, 3, 4].map(i => <Star key={i} size={22} weight={i < Math.round(site.rating.value) ? 'fill' : 'regular'} />)}</span><small>{site.rating.count} {reviewWord(site.rating.count)}</small></div>
          : <div className="reviews-score is-empty" aria-hidden="true"><ChatCircleDots size={34} /></div>}
        <div className="reviews-copy">
          <h3>Отзывы на Яндекс Картах</h3>
          <p>Их пишут наши клиенты. Почитайте перед визитом, а после ремонта расскажите, как всё прошло.</p>
        </div>
        <div className="reviews-buttons">
          <button type="button" className="button primary" aria-expanded={open} aria-controls="reviews-widget" onClick={() => setOpen(value => !value)}>{open ? 'Свернуть отзывы' : 'Читать отзывы'}<CaretDown size={18} className={open ? 'is-flipped' : ''} /></button>
          <a className="button secondary" href={`${maps}reviews/?add-review=true`} target="_blank" rel="noreferrer"><PencilSimple size={18} />Оставить отзыв</a>
        </div>
      </div>
      {site.quotes?.length > 0 && <div className="quotes">{site.quotes.map(quote => <figure className="quote" key={quote.text}><blockquote>«{quote.text}»</blockquote><figcaption>{quote.author} · Яндекс Карты</figcaption></figure>)}</div>}
    </div>
    {open && <div className="review-card" id="reviews-widget">
      <iframe title="Отзывы The Big One Garage на Яндекс Картах" src="https://yandex.ru/maps-reviews-widget/152908357603?comments" referrerPolicy="strict-origin-when-cross-origin" />
      <a className="review-card-link" href={`${maps}reviews/`} target="_blank" rel="noreferrer">Все отзывы на Яндекс Картах<ArrowUpRight size={16} /></a>
    </div>}
  </section>;
}

export function App({ path = typeof location === 'undefined' ? BASE : location.pathname }) {
  const page = pageOf(path), home = page.type === 'home';
  const [menu, setMenu] = useState(false), [modal, setModal] = useState(null);
  const openSheet = (item) => { setMenu(false); setModal({ type: 'service', service: sheet(item) }); };
  const ask = (service = '', consultation = false) => { setMenu(false); setModal({ type: 'lead', service, consultation }); window.dispatchEvent(new CustomEvent('bigone:lead-open', { detail: { service } })); };
  const nav = [['problems', 'Что случилось'], ['prices', 'Цены'], ['reviews', 'Отзывы'], ['about', 'Как работаем'], ['contacts', 'Контакты']];
  return <>
    <a className="skip" href="#main">Перейти к содержанию</a>
    <header className="header">
      <a className="brand" href={BASE}>The Big One <span>Garage</span></a>
      <nav aria-label="Основная навигация" className={menu ? 'open' : ''}>
        {nav.map(([id, label]) => <a key={id} href={`${home ? '' : BASE}#${id}`} onClick={() => setMenu(false)}>{label}</a>)}
        <a className="nav-prices" href={`${BASE}prices.html`} onClick={() => setMenu(false)}>Полный прайс</a>
      </nav>
      <a className="header-phone" href={phone} aria-label={`Позвонить: ${phoneLabel}`}><Phone size={20} /><span>{phoneLabel}</span></a>
      <button className="menu-toggle icon-button" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={24} /> : <List size={24} />}</button>
    </header>

    <main id="main">{page.type === 'legal' ? <PersonalData document={page.document} />
      : page.type === 'prices' ? <FullPriceList onSelect={ask} callback={<Callback title="Не нашли нужную работу?" text="Оставьте номер — перезвоним и скажем цену для вашей машины." />} />
      : page.type === 'direction' ? <DirectionPrices direction={page.direction} onSelect={ask} callback={<Callback title="Узнать цену для вашей машины" text="Оставьте номер — перезвоним и скажем, сколько это будет стоить." service={page.direction.name} />} /> : <>
      <section className="hero">
        <Photo className="hero-photo" name="hero" full={1254} width={1254} height={1254} sizes="(max-width: 760px) 100vw, 50vw" alt="Механик за работой в автомобильной мастерской — иллюстрация" priority />
        <div className="hero-copy">

          {site.rating && <a className="hero-rating" href="#reviews"><Star size={18} weight="fill" /><b>{ratingText}</b><span>{site.rating.count} {reviewWord(site.rating.count)} на Яндекс Картах</span></a>}
          <h1><small className="eyebrow">Автосервис на Соколиной Горе</small>Ремонт и обслуживание <span>любых автомобилей</span></h1>
          <p className="hero-intro">Берём машины любых марок. Делаем ТО, находим причину поломки и чиним — от колодок до двигателя.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => ask('', true)}>Консультация<ArrowUpRight size={20} /></button>
            <a className="button secondary" href={phone}><Phone size={20} />Позвонить</a>
          </div>
          <a className="hero-address" href={maps} target="_blank" rel="noreferrer"><MapPin size={20} /><span>{address}<OpenStatus /></span><ArrowUpRight size={16} /></a>
        </div>
      </section>

      <section className="finder wrap" aria-label="Быстрый поиск">
        <form className="finder-search" action={`${BASE}prices.html`} method="get" role="search">
          <MagnifyingGlass size={20} /><label className="sr-only" htmlFor="finder-q">Найти работу и цену</label>
          <input id="finder-q" name="q" type="search" placeholder="Колодки, ГРМ, R16…" enterKeyHint="search" />
          <button className="button primary" type="submit">Найти</button>
        </form>
        <nav className="chips finder-links" aria-label="Популярные разделы">{quickLinks.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
      </section>

      <section className="trust wrap" id="trust" aria-label="Почему нам доверяют">
        <div className="trust-grid">{[...baseTrust, ...(site.trust || [])].map(item => { const Icon = trustIcons[item.icon] || CheckCircle; return <div className="trust-item" key={item.title}><Icon size={24} /><div><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</div></div>; })}</div>
        <a className="trust-reviews" href="#reviews">{site.rating ? <><Star size={18} weight="fill" /><b>{ratingText}</b>{site.rating.count} {reviewWord(site.rating.count)} на Яндекс Картах</> : <><Star size={18} weight="fill" />Читать отзывы клиентов на Яндекс Картах</>}<ArrowRight size={16} /></a>
      </section>

      {site.promo?.title && <Promo promo={site.promo} onAsk={ask} />}

      <section className="problems wrap section" id="problems">
        <Heading eyebrow="Разбираться в ремонте не нужно" title="Что случилось с машиной?" />
        <div className="problem-grid">
          <button className="problem-card problem-unknown" onClick={() => ask(unknownProblem[0], true)}><span className="problem-text"><h3>{unknownProblem[0]}</h3><p>Опишите своими словами, подскажем</p></span><ArrowUpRight size={20} /></button>
          {problems.map(([title]) => <button className="problem-card" key={title} onClick={() => ask(title)}><span className="problem-text"><h3>{title}</h3></span><ArrowUpRight size={20} /></button>)}
        </div>
      </section>

      <section className="services wrap section" id="prices">
        <Heading eyebrow="От ТО до серьёзного ремонта" title="Популярные работы и цены" link={<a className="heading-link" href={`${BASE}prices.html`}>Весь прайс<ArrowRight size={18} /></a>} />
        <div className="popular-grid">{popular.map(item => <button type="button" className="popular-card" key={item.title} onClick={() => openSheet(item)}>
          <span className="popular-title">{item.title}</span><b>{item.price}</b><span className="popular-more" aria-hidden="true"><ArrowRight size={18} /></span>
        </button>)}</div>
        <PricePreview />
      </section>

      <section className="crafts section" id="crafts">
        <div className="wrap">
          <Heading eyebrow="Не только ремонт" title="А ещё кузов, салон и звук" />
          <div className="crafts-grid">
            {crafts.map(({ id, icon: Icon, title, text, prices, sheet: info }, index) => <button type="button" className={`craft-card craft-${id}`} key={id} onClick={() => openSheet(info)}>
              {index === 0 && <Photo className="craft-photo" name="body" full={1280} width={1280} height={853} sizes="(max-width: 760px) 100vw, 40vw" alt="" />}
              <span className="craft-icon"><Icon size={26} /></span>
              <span className="craft-body"><h3>{title}</h3><p>{text}</p>
                <span className="craft-prices">{prices.filter(([, price]) => price).map(([label, price]) => <span key={label}><small>{label}</small><b>{price}</b></span>)}</span>
              </span>
              <span className="craft-more">Цены<ArrowRight size={16} /></span>
            </button>)}
          </div>
        </div>
      </section>

      <Reviews />

      <section className="about section" id="about">
        <div className="wrap">
          <Heading eyebrow="Как мы работаем" title={<>Сначала находим причину.<br />Потом чиним.</>} />
          <div className="about-photos">
            <figure className="about-photo"><Photo name="workshop" full={1280} width={1280} height={853} sizes="(max-width: 760px) 86vw, 45vw" alt="Рабочая зона автосервиса: подъёмник, инструмент и автомобили в ремонте" /></figure>
            <figure className="about-photo"><Photo name="body" full={1280} width={1280} height={853} sizes="(max-width: 760px) 86vw, 45vw" alt="Кузов автомобиля на подъёмнике во время кузовного ремонта" /></figure>
          </div>
          <ol className="steps">{steps.map(([title, text], i) => <li key={title}><span className="step-number">{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
        </div>
      </section>

      <section className="faq section wrap" id="faq">
        <Heading eyebrow="Перед визитом" title="Частые вопросы" />
        <div className="faq-list">{faq.map(([q, a]) => <details key={q}><summary>{q}<CaretDown size={20} /></summary><p>{a}</p></details>)}</div>
      </section>

      <section className="contact section" id="contacts">
        <div className="wrap contact-grid">
          <div className="contact-info">
            <p className="eyebrow">Контакты</p>
            <h2>Приезжайте или позвоните</h2>
            <a className="contact-phone" href={phone}><Phone size={24} />{phoneLabel}</a>
            <Messengers className="contact-messengers" />
            {hoursText() && <div className="contact-line contact-hours"><Clock size={20} /><span>{hoursText()}<OpenStatus /></span></div>}
            <a className="contact-line" href={maps} target="_blank" rel="noreferrer"><MapPin size={20} /><span>{address}<small>Построить маршрут</small></span><ArrowUpRight size={18} /></a>
            <figure className="map-card">
              <iframe title="The Big One Garage на Яндекс Картах" src={mapWidget} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
              <figcaption><a href={maps} target="_blank" rel="noreferrer"><MapTrifold size={18} />Открыть маршрут в Яндекс Картах<ArrowUpRight size={16} /></a></figcaption>
            </figure>
            {site.entry && <p className="contact-entry"><b>Как заехать.</b> {site.entry}</p>}
            <a className="contact-line" href="mailto:thebigonegarage@bk.ru"><span>thebigonegarage@bk.ru<small>Написать на почту</small></span><ArrowUpRight size={18} /></a>
            {!site.hours?.length && <p className="form-note">Время визита уточняйте по телефону.</p>}
          </div>
          <div className="contact-form"><h3>Оставьте номер — перезвоним</h3><LeadForm /></div>
        </div>
      </section>
    </>}</main>

    <footer className="site-footer"><div className="wrap footer-grid">
      <div className="footer-brand"><a href={BASE} className="brand">The Big One <span>Garage</span></a></div>
      <div className="footer-col"><b>Контакты</b><a href={phone}>{phoneLabel}</a>{hoursText() && <span>{hoursText()}</span>}<a href={maps} target="_blank" rel="noreferrer">{address}</a><a href="mailto:thebigonegarage@bk.ru">thebigonegarage@bk.ru</a></div>
      <div className="footer-col"><b>Разделы</b><a href={`${BASE}prices.html`}>Полный прайс</a>{nav.map(([id, label]) => <a key={id} href={`${home ? '' : BASE}#${id}`}>{label}</a>)}</div>
      {(whatsappUrl || telegramUrl || maxUrl || vkUrl) && <div className="footer-col"><b>Мы на связи</b>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>}{telegramUrl && <a href={telegramUrl} target="_blank" rel="noreferrer">Telegram</a>}{maxUrl && <a href={maxUrl} target="_blank" rel="noreferrer">MAX</a>}{vkUrl && <a href={vkUrl} target="_blank" rel="noreferrer">ВКонтакте</a>}<a href={`${maps}reviews/`} target="_blank" rel="noreferrer">Отзывы на Яндекс Картах</a></div>}
      <div className="footer-legal"><span>© {new Date().getFullYear()} The Big One Garage</span>{Object.values(personalDataPages).map(({ path, title }) => <a key={path} href={BASE + path}>{title}</a>)}</div>
    </div></footer>

    {modal && <Dialog title={modal.type === 'service' ? modal.service.name : modal.consultation ? 'Задать вопрос мастеру' : 'Узнать стоимость ремонта'} onClose={() => setModal(null)}>
      {modal.type === 'service' ? <>
        <p className="modal-price">{modal.service.price}</p>
        <p className="modal-description">{modal.service.text}</p>
        {modal.service.link && <a className="text-link dialog-direction" href={modal.service.link.href}>{modal.service.link.label}<ArrowRight size={18} /></a>}
        {modal.service.groups?.length > 0 && <PriceRows groups={modal.service.groups} category={modal.service.name} onSelect={ask} />}
        {modal.service.details.length > 0 && <ul className="service-details">{modal.service.details.map(d => <li key={d}><CheckCircle size={19} />{d}</li>)}</ul>}
        <p className="price-note">Точную цену для вашей машины назовём после осмотра.</p>
        <Callback compact service={modal.service.name} title="Узнать цену для вашей машины" text="Оставьте номер — перезвоним и скажем, сколько это будет стоить." />
        <button className="text-link dialog-more" onClick={() => setModal({ type: 'lead', service: modal.service.name })}>Описать проблему подробнее<ArrowRight size={18} /></button>
      </> : <LeadForm key={modal.service} service={modal.service} consultation={modal.consultation} />}
    </Dialog>}
  </>;
}
