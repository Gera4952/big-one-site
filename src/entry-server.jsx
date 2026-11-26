/* Build-time rendering: every public page as ready HTML, so search engines and slow phones get
   the content before any script runs. The browser then takes over the same markup (main.jsx). */
import { renderToString } from 'react-dom/server';
import { App, faq } from './App.jsx';
import { directions, works } from './seo.js';
import { site, hoursText } from './site.js';
import catalog from './data/services.json';

export { directions, works, faq, site, catalog, hoursText };
export const render = (path) => renderToString(<App path={path} />);
