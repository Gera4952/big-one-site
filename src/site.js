import site from './data/site.json';

export { site };
export const whatsappUrl = site.whatsapp ? `https://wa.me/${String(site.whatsapp).replace(/\D/g, '')}` : null;
const telegramPhone = String(site.telegramPhone || '').replace(/\D/g, '');
export const telegramUrl = /^[1-9]\d{6,14}$/.test(telegramPhone) ? `https://t.me/+${telegramPhone}` : null;
const maxProfile = String(site.maxProfileUrl || '').trim();
export const maxUrl = /^https:\/\/max\.ru\/u\/[A-Za-z0-9_-]+\/?$/.test(maxProfile) ? maxProfile : null;
export const vkUrl = site.vk ? `https://vk.com/${String(site.vk).replace(/^@/, '')}` : null;

/* Opening hours, always in Moscow time whatever the visitor's clock says. */
const ZONE = 'Europe/Moscow';
const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_ON = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
const minutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const hoursFor = (day) => (site.hours || []).find(rule => rule.days.includes(day));

function moscowNow(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(date).map(part => [part.type, part.value]));
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), time: Number(parts.hour) * 60 + Number(parts.minute) };
}

/* "Пн–Сб 10:00–20:00 · Вс 11:00–18:00"; every day with the same hours reads "Ежедневно 10:00–20:00". */
export function hoursText() {
  if (!site.hours?.length) return null;
  return site.hours.map(rule => {
    if (rule.days.length === 7) return `Ежедневно ${rule.open}–${rule.close}`;
    const days = [...rule.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    const order = days.map(d => (d + 6) % 7);
    const continuous = order.every((d, i) => i === 0 || d === order[i - 1] + 1);
    const label = days.length > 2 && continuous ? `${DAY_SHORT[days[0]]}–${DAY_SHORT[days.at(-1)]}` : days.map(d => DAY_SHORT[d]).join(', ');
    return `${label} ${rule.open}–${rule.close}`;
  }).join(' · ');
}

/* { open: true, text: "Открыто до 20:00" } or { open: false, text: "Откроемся завтра в 10:00" } */
export function openStatus(date = new Date()) {
  if (!site.hours?.length) return null;
  const { day, time } = moscowNow(date);
  const today = hoursFor(day);
  if (today && time >= minutes(today.open) && time < minutes(today.close)) return { open: true, text: `Сейчас открыто, до ${today.close}` };
  if (today && time < minutes(today.open)) return { open: false, text: `Откроемся сегодня в ${today.open}` };
  for (let shift = 1; shift <= 7; shift++) {
    const next = (day + shift) % 7; const rule = hoursFor(next);
    if (rule) return { open: false, text: `Откроемся ${shift === 1 ? 'завтра' : DAY_ON[next]} в ${rule.open}` };
  }
  return null;
}

/* Yandex Metrika: the counter code itself is written into <head> of every page at build time
   (vite.config.mjs, site.json → metrikaId). Here only the goals are attached. */
export function startAnalytics() {
  const id = Number(site.metrikaId);
  if (!id || typeof window.ym !== 'function') return;
  // Goals: create them in Metrika as JavaScript events with these identifiers.
  const goals = [['a[href^="tel:"]', 'phone_click'], ['a[href^="https://wa.me/"]', 'whatsapp_click'], ['a[href^="https://t.me/"]', 'telegram_click'], ['a[href*="yandex.ru/maps"]', 'route_click']];
  document.addEventListener('click', event => {
    for (const [selector, goal] of goals) if (event.target.closest?.(selector)) window.ym(id, 'reachGoal', goal);
  }, true);
  window.addEventListener('bigone:lead-open', () => window.ym(id, 'reachGoal', 'lead_open'));
  window.addEventListener('bigone:lead-sent', () => window.ym(id, 'reachGoal', 'lead_sent'));
}
