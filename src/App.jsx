import { useEffect, useRef, useState, useId } from 'react';
import { ArrowUpRight, ArrowRight, Phone, MapPin, List, X, CheckCircle, CaretDown, MagnifyingGlass, ChatCircleDots, WhatsappLogo, TelegramLogo, Star, Clock, ShieldCheck, Eye, Handshake, CreditCard, MapTrifold, ListChecks, Wrench, PencilSimple } from '@phosphor-icons/react';
import { ServiceCatalog, DirectionPrices } from './components/FullPriceList.jsx';
import { PersonalData } from './components/PersonalData.jsx';
import { consentVersion, personalDataPages } from './personal-data.js';
import { LeadCaptcha } from './components/LeadCaptcha.jsx';
import { directionById, directions, pageOf, rowsOf, works } from './seo.js';
import { site, whatsappUrl, telegramUrl, maxUrl, vkUrl, hoursText, openStatus } from './site.js';

const BASE = import.meta.env.BASE_URL;
const leadsUrl = import.meta.env.VITE_SITE_LEADS_URL || site.leadsUrl;
const captchaSiteKey = leadsUrl ? import.meta.env.VITE_SITE_TURNSTILE_KEY : '';
const phone = 'tel:+79160981891';
const phoneLabel = '8 916 098 18 91';
const maps = 'https://yandex.ru/maps/org/the_big_one_garage/152908357603/';
const address = 'Москва, 9-я улица Соколиной Горы, 8, стр. 11';
const contact = { phone, phoneLabel, address, maps, hours: hoursText() };
const mapWidget = 'https://yandex.ru/map-widget/v1/org/the_big_one_garage/152908357603/';
const trustIcons = { shield: ShieldCheck, eye: Eye, handshake: Handshake, card: CreditCard, chat: ChatCircleDots, star: Star, list: ListChecks, wrench: Wrench, clock: Clock };
/* Promises the site already makes (steps and form notes); owner-confirmed items from site.json are added after them. */
const workCount = directions.flatMap(rowsOf).length;
const photoCredits = directions.filter(({ photo }) => photo?.credit);
const baseTrust = [
  { icon: 'list', title: `Прайс на ${works(workCount)} есть на сайте` },
  { icon: 'handshake', title: 'Цену называем до начала работ' },
  { icon: 'eye', title: 'Показываем, что сломалось и почему' },
];
const mainServices = [
  { id: 'modal-412277', title: 'Сварка кузова', text: 'Пороги, днище и арки', image: 'welding' },
  { id: 'modal-412248', title: 'Плановое ТО', text: 'Масло, фильтры и осмотр', image: 'maintenance' },
  { id: 'modal-412250', title: 'Диагностика', text: 'Поиск причины неисправности', image: 'diagnostics' },
  { id: 'modal-412249', title: 'Шиномонтаж', text: 'Замена шин и балансировка', image: 'tires' },
  { id: 'modal-412321', title: 'Ремонт подвески', text: 'Амортизаторы, рычаги и ступицы', image: 'suspension' },
  { id: 'modal-412324', title: 'Ремонт тормозов', text: 'Колодки, диски и суппорты', image: 'brakes' },
];
const visits = ['Сегодня', 'Завтра', 'На этой неделе', 'Пока только узнать цену'];
const leadLabel = (...parts) => parts.filter(Boolean).join(' · ');
const directionLink = (id) => `${BASE}${directionById(id)?.path || `prices.html#${id}`}`;
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

function Brand() {
  return <a className="brand" href={BASE}><img src={`${BASE}assets/big-one-garage-logo.webp`} alt="The Big One Garage" width={299} height={170} /></a>;
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
  ['Стучит на кочках', 'modal-412321'],
  ['Горит Check Engine', 'modal-412250'],
  ['Скрежет при торможении', 'modal-412324'],
  ['Не заводится', 'modal-413086'],
];
const steps = [
  ['Принимаем машину', 'Запишем жалобу и уточним, когда она проявляется.'],
  ['Показываем, что нашли', 'Объясним, что нужно сделать сейчас и что можно отложить.'],
  ['Согласуем работы и цену', 'Если появятся дополнительные работы, обсудим их с вами до ремонта.'],
];
export const faq = [
  ['Как записаться на ремонт?', 'Позвоните или оставьте заявку. Назовите марку и модель, расскажите, что беспокоит. Подберём удобное время визита и скажем, с какой проверки начнём.'],
  ['Сколько будет стоить ремонт?', 'Цены на типовые работы есть в прайсе. Если знаете, что нужно заменить, назовите модель машины, и мы сориентируем по стоимости. Если причина поломки пока неясна, сначала осмотрим машину и согласуем цену.'],
  ['Что, если найдёте другие неисправности?', 'Расскажем, что обнаружили, сколько стоит устранить проблему и можно ли отложить ремонт. Дополнительные работы делаем только после вашего согласия.'],
  ['Какие автомобили вы обслуживаете?', 'Работаем с автомобилями любых марок и годов выпуска. При записи сообщите модель, год и двигатель, если знаете. Это поможет подобрать детали и оценить работу.'],
  ['Можно приехать со своими запчастями?', 'Да. Перед визитом сообщите артикул или пришлите фото упаковки. Мастер подскажет, подходят ли детали к вашей машине.'],
  ['Заявка на сайте сразу бронирует время?', 'Мы перезвоним по указанному номеру, ответим на вопросы и подтвердим время визита, если вы решите записаться.'],
  ['Где находится сервис?', `${address.replace('стр.', 'строение')}.${hoursText() ? ` ${hoursText()}.` : ''} Ссылка на маршрут есть в разделе «Контакты и проезд».`],
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

function LeadForm({ service = '' }) {
  const [visit, setVisit] = useState('');
  const { status, error, submit, setCaptchaToken, captchaAttempt, resetCaptcha } = useLead(leadLabel(service, visit && `удобно: ${visit.toLowerCase()}`));
  if (status === 'success') return <div className="success" role="status"><CheckCircle size={36} weight="light" /><h3>Заявка отправлена</h3><p>Перезвоним по указанному номеру.</p><a href={phone}>Если вопрос срочный: {phoneLabel}</a></div>;
  return <form onSubmit={submit} className="lead-form">
    {service && <p className="selected-service">{service}</p>}
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
    <button className="button primary" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}<ArrowUpRight size={20} /></button>
    <p className="form-note">{site.responseTime || 'Перезвоним, чтобы ответить на вопрос и согласовать визит.'}</p>
  </form>;
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
      <div className="promo-copy">
        {promo.eyebrow && <small className="eyebrow">{promo.eyebrow}</small>}
        <h2 id="promo-title">{promo.title}</h2>
        {promo.text && <p>{promo.text}</p>}
        {promo.was && promo.free && <p className="promo-price"><s>{promo.was}</s><b>0 ₽</b><span>{promo.free}</span></p>}
        {promo.note && <small className="promo-note">{promo.note}</small>}
      </div>
      <div className="promo-actions">
        <button className="button secondary" type="button" onClick={() => onAsk(promo.service || promo.title)}>{promo.button || 'Записаться'}<ArrowUpRight size={20} /></button>
      </div>
    </div>
  </section>;
}

function Heading({ eyebrow, title, link }) {
  return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{link}</div>;
}

/* `path` is passed when the page is prerendered at build time; in the browser it is the current address. */
/* Reviews are expanded by default; the visitor can collapse the live Yandex widget. */
function Reviews() {
  const [open, setOpen] = useState(true);
  return <section className="reviews section wrap" id="reviews">
    <Heading title="Отзывы клиентов" />
    <div className="reviews-panel">
      <div className="reviews-summary">
        {site.rating ? <div className="reviews-score"><b>{ratingText}</b><span className="stars" aria-label={`Рейтинг ${ratingText} из 5`}>{[0, 1, 2, 3, 4].map(i => <Star key={i} size={22} weight={i < Math.round(site.rating.value) ? 'fill' : 'regular'} />)}</span><small>{site.rating.count} {reviewWord(site.rating.count)}</small></div>
          : null}
        <div className="reviews-copy">
          <h3>Отзывы на Яндекс Картах</h3>
        </div>
        <div className="reviews-buttons">
          <button type="button" className="button secondary" aria-expanded={open} aria-controls="reviews-widget" onClick={() => setOpen(value => !value)}>{open ? 'Свернуть отзывы' : 'Читать отзывы'}<CaretDown size={18} className={open ? 'is-flipped' : ''} /></button>
          <a className="text-link" href={`${maps}reviews/?add-review=true`} target="_blank" rel="noreferrer"><PencilSimple size={18} />Оставить отзыв</a>
        </div>
      </div>
      {site.quotes?.length > 0 && <div className="quotes">{site.quotes.map(quote => <figure className="quote" key={quote.text}><blockquote>«{quote.text}»</blockquote><figcaption>{quote.author} · Яндекс Карты</figcaption></figure>)}</div>}
    </div>
    {open && <div className="review-card" id="reviews-widget">
      <iframe title="Отзывы The Big One Garage на Яндекс Картах" src="https://yandex.ru/maps-reviews-widget/152908357603?comments" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      <a className="review-card-link" href={`${maps}reviews/`} target="_blank" rel="noreferrer">Все отзывы на Яндекс Картах<ArrowUpRight size={16} /></a>
    </div>}
  </section>;
}

export function App({ path = typeof location === 'undefined' ? BASE : location.pathname }) {
  const page = pageOf(path), home = page.type === 'home';
  const [menu, setMenu] = useState(false), [modal, setModal] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef(null);
  const navigation = useRef(null);
  const menuButton = useRef(null);
  useEffect(() => {
    let previous;
    const update = () => {
      const pastTop = window.scrollY > 16;
      if (pastTop === previous) return;
      previous = pastTop;
      setScrolled(pastTop);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (!menu) return;
    navigation.current?.querySelector('a')?.focus({ preventScroll: true });
    const dismiss = (event) => {
      if (!header.current?.contains(event.target)) setMenu(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [menu]);
  const closeMenuOnEscape = (event) => {
    if (event.key !== 'Escape' || !menu) return;
    setMenu(false);
    menuButton.current?.focus();
  };
  const ask = (service = '', consultation = false) => { setMenu(false); setModal({ service, consultation }); window.dispatchEvent(new CustomEvent('bigone:lead-open', { detail: { service } })); };
  const nav = [['#reviews', 'Отзывы'], ['#about', 'Как работаем'], ['#contacts', 'Контакты']];
  return <>
    <a className="skip" href="#main">Перейти к содержанию</a>
    <header ref={header} className={`header${scrolled ? ' is-scrolled' : ''}`} onKeyDown={closeMenuOnEscape}>
      <div className="header-inner wrap">
        <Brand />
        <nav ref={navigation} id="site-navigation" aria-label="Основная навигация" className={menu ? 'open' : ''}>
          <a href={`${BASE}prices.html`} aria-current={page.type === 'prices' ? 'page' : undefined} onClick={() => setMenu(false)}>Услуги и цены</a>
          {nav.map(([hash, label]) => <a key={hash} href={`${home ? '' : BASE}${hash}`} onClick={() => setMenu(false)}>{label}</a>)}
        </nav>
        <a className="header-phone" href={phone} aria-label={`Позвонить: ${phoneLabel}`}><Phone size={20} /><span>{phoneLabel}</span></a>
        <button ref={menuButton} className="menu-toggle icon-button" type="button" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} aria-controls="site-navigation" onClick={() => setMenu(!menu)}>{menu ? <X size={24} /> : <List size={24} />}</button>
      </div>
    </header>

    <main id="main">{page.type === 'legal' ? <PersonalData document={page.document} photoCredits={photoCredits} />
      : page.type === 'prices' ? <ServiceCatalog onSelect={ask} />
      : page.type === 'direction' ? <DirectionPrices direction={page.direction} onSelect={ask} contact={contact} /> : <>
      <section className="hero wrap">
        <div className="hero-copy">
          {site.rating && <a className="hero-rating" href="#reviews"><Star size={18} weight="fill" /><b>{ratingText}</b><span>{site.rating.count} {reviewWord(site.rating.count)} на Яндекс Картах</span></a>}
          <p className="hero-location">Автосервис на Соколиной Горе</p>
          <h1>Ремонт и обслуживание автомобилей</h1>
          <p className="hero-intro">ТО, диагностика, ремонт и сварка кузова. Работаем с автомобилями любых марок.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => ask('', true)}>Консультация<ArrowUpRight size={20} /></button>
            <a className="button secondary" href={`${BASE}prices.html`}>Услуги и цены</a>
          </div>
          <a className="hero-address" href={maps} target="_blank" rel="noreferrer"><MapPin size={20} /><span>{address}<OpenStatus /></span><ArrowUpRight size={16} /></a>
        </div>
        <Photo className="hero-photo" name="hero" full={1254} width={1254} height={1254} sizes="(max-width: 759px) calc(100vw - 32px), (max-width: 1300px) 50vw, 620px" alt="Механик за работой в автомобильной мастерской — иллюстрация" priority />
      </section>

      <section className="services wrap section" id="prices">
        <Heading title="Услуги" link={<a className="heading-link" href={`${BASE}prices.html`}>Все услуги<ArrowRight size={18} /></a>} />
        <form className="finder-search" action={`${BASE}prices.html`} method="get" role="search">
          <MagnifyingGlass size={20} /><label className="sr-only" htmlFor="finder-q">Найти работу и цену</label>
          <input id="finder-q" name="q" type="search" placeholder="Колодки, ГРМ, R16…" enterKeyHint="search" />
          <button className="button secondary" type="submit">Найти</button>
        </form>
        <div className="service-grid">{mainServices.map(({ id, title, text, image }) => <a className="service-card" key={id} href={directionLink(id)}>
          <span className="service-card-photo"><img src={`${BASE}assets/service-${image}.webp`} width={512} height={320} alt="" loading="lazy" decoding="async" /></span>
          <div className="service-card-copy"><h3>{title}</h3><p>{text}</p><ArrowRight size={18} aria-hidden="true" /></div>
        </a>)}</div>
      </section>

      <section className="trust wrap" id="trust" aria-label="Почему нам доверяют">
        <div className="trust-grid">{[...baseTrust, ...(site.trust || [])].map(item => { const Icon = trustIcons[item.icon] || CheckCircle; return <div className="trust-item" key={item.title}><Icon size={24} /><div><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</div></div>; })}</div>
        <a className="trust-reviews" href="#reviews">{site.rating ? <><Star size={18} weight="fill" /><b>{ratingText}</b>{site.rating.count} {reviewWord(site.rating.count)} на Яндекс Картах</> : <><Star size={18} weight="fill" />Читать отзывы клиентов на Яндекс Картах</>}<ArrowRight size={16} /></a>
      </section>

      {site.promo?.title && <Promo promo={site.promo} onAsk={ask} />}

      <section className="problems wrap section" id="problems">
        <Heading title="Что случилось с машиной?" />
        <div className="problem-grid">
          {problems.map(([title, id]) => <a className="problem-card" key={title} href={directionLink(id)}><h3>{title}</h3><ArrowRight size={20} aria-hidden="true" /></a>)}
          <button className="problem-card problem-unknown" type="button" onClick={() => ask('', true)}><span className="problem-text"><span className="problem-title">Не знаю, в чём причина</span><p>Опишите, что заметили</p></span><ArrowUpRight size={20} aria-hidden="true" /></button>
        </div>
      </section>

      <section className="about section" id="about">
        <div className="wrap">
          <section className="about-layout" id="masters" aria-labelledby="masters-title">
            <div className="about-copy">
              <h2 id="masters-title">Мастера с многолетним опытом</h2>
              <p>В нашей команде мастера по диагностике, слесарному ремонту и кузовной сварке. Работаем с разными марками. Можно приехать на плановое ТО или обратиться со сложной неисправностью, которая проявляется время от времени.</p>
            </div>
            <figure className="about-photo"><Photo name="workshop" full={1280} width={1280} height={853} sizes="(max-width: 759px) calc(100vw - 32px), (max-width: 1300px) 50vw, 620px" alt="Рабочая зона автосервиса Big One Garage" /></figure>
          </section>
          <div className="repair-process">
            <Heading title="Как проходит ремонт" />
            <ol className="steps" role="list">{steps.map(([title, text], i) => <li key={title}><span className="step-number" aria-hidden="true">{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
          </div>
        </div>
      </section>

      <Reviews />

      <section className="faq section wrap" id="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">Частые вопросы</h2>
        <div className="faq-list">{faq.map(([q, a]) => <details key={q}><summary>{q}<CaretDown size={20} aria-hidden="true" /></summary><p>{a}</p></details>)}</div>
        <button className="text-link faq-ask" type="button" onClick={() => ask('', true)}>Задать вопрос мастеру<ArrowUpRight size={18} aria-hidden="true" /></button>
      </section>

      <section className="contact section" id="contacts">
        <div className="wrap contact-grid">
          <div className="contact-info">
            <h2>Контакты и проезд</h2>
            <a className="contact-phone" href={phone}><Phone size={24} />{phoneLabel}</a>
            <Messengers className="contact-messengers" />
            {hoursText() && <div className="contact-line contact-hours"><Clock size={20} /><span>{hoursText()}<OpenStatus /></span></div>}
            <a className="contact-line" href={maps} target="_blank" rel="noreferrer"><MapPin size={20} /><span>{address}<small>Построить маршрут</small></span><ArrowUpRight size={18} /></a>
            {site.entry && <p className="contact-entry"><b>Как заехать.</b> {site.entry}</p>}
            <a className="contact-line" href="mailto:thebigonegarage@bk.ru"><span>thebigonegarage@bk.ru<small>Написать на почту</small></span><ArrowUpRight size={18} /></a>
            <button className="button primary contact-cta" type="button" onClick={() => ask('', true)}>Оставить заявку<ArrowUpRight size={20} /></button>
            {!site.hours?.length && <p className="form-note">Время визита уточняйте по телефону.</p>}
          </div>
          <figure className="map-card">
            <iframe title="The Big One Garage на Яндекс Картах" src={mapWidget} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            <figcaption><a href={maps} target="_blank" rel="noreferrer"><MapTrifold size={18} />Открыть маршрут в Яндекс Картах<ArrowUpRight size={16} /></a></figcaption>
          </figure>
        </div>
      </section>
    </>}</main>

    <footer className="site-footer"><div className="wrap footer-grid">
      <div className="footer-brand"><Brand /></div>
      <div className="footer-col"><b>Контакты</b><a href={phone}>{phoneLabel}</a>{hoursText() && <span>{hoursText()}</span>}<a href={maps} target="_blank" rel="noreferrer">{address}</a><a href="mailto:thebigonegarage@bk.ru">thebigonegarage@bk.ru</a></div>
      <div className="footer-col"><b>Разделы</b><a href={`${BASE}prices.html`}>Все услуги</a>{nav.map(([hash, label]) => <a key={hash} href={`${home ? '' : BASE}${hash}`}>{label}</a>)}</div>
      {(whatsappUrl || telegramUrl || maxUrl || vkUrl) && <div className="footer-col"><b>Мы на связи</b>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>}{telegramUrl && <a href={telegramUrl} target="_blank" rel="noreferrer">Telegram</a>}{maxUrl && <a href={maxUrl} target="_blank" rel="noreferrer">MAX</a>}{vkUrl && <a href={vkUrl} target="_blank" rel="noreferrer">ВКонтакте</a>}<a href={`${maps}reviews/`} target="_blank" rel="noreferrer">Отзывы на Яндекс Картах</a></div>}
      <div className="footer-legal">
        <span>© {new Date().getFullYear()} The Big One Garage</span>
        {Object.values(personalDataPages).map(({ path, title }) => <a key={path} href={BASE + path}>{title}</a>)}
      </div>
    </div></footer>

    {modal && <Dialog title={modal.consultation ? 'Задать вопрос мастеру' : 'Узнать стоимость ремонта'} onClose={() => setModal(null)}>
      <LeadForm key={modal.service} service={modal.service} />
    </Dialog>}
  </>;
}
