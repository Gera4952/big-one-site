import { useEffect, useRef, useState } from 'react';

const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let pendingScript;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!pendingScript) {
    pendingScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      const failed = () => { script.remove(); reject(new Error('Turnstile failed to load')); };
      script.onload = () => {
        if (!window.turnstile) { failed(); return; }
        window.turnstile.ready(() => resolve(window.turnstile));
      };
      script.onerror = failed;
      document.head.append(script);
    }).catch(error => { pendingScript = undefined; throw error; });
  }
  return pendingScript;
}

export function LeadCaptcha({ siteKey, onToken, attempt, onRetry }) {
  const container = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    let active = true, widget, api;
    loadTurnstile().then(turnstile => {
      if (!active) return;
      api = turnstile;
      widget = api.render(container.current, {
        sitekey: siteKey,
        action: 'site_lead',
        size: container.current.clientWidth < 300 ? 'compact' : 'flexible',
        theme: 'dark',
        'response-field': false,
        callback: token => { if (active) { setFailed(false); onToken(token); } },
        'expired-callback': () => { if (active) onToken(''); },
        'error-callback': () => { if (active) { onToken(''); setFailed(true); } },
      });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (widget != null) api.remove(widget); };
  }, [attempt, onToken, siteKey]);
  return <div className="lead-captcha">
    <div ref={container} />
    {failed && <p className="form-error">Проверка не загрузилась. <button type="button" onClick={onRetry}>Повторить</button></p>}
  </div>;
}
