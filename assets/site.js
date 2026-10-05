// סרגל עליון ותחתון משותפים לאתר: <site-header> ו-<site-footer>.
// שימוש: בתוך <head> -> <script src="/assets/site.js"></script>
// ובגוף הדף: <site-header></site-header> ... <site-footer></site-footer>
// בדף הבית מוסיפים את התכונה home כדי להסתיר את הקישור "דף הבית".
// אפשר לכוון את רוחב התוכן: <site-header style="--tp-max:42rem">
(function () {
  var PAYBOX = 'https://links.payboxapp.com/dZ5410C6mZb';

  // הטקסטים של הסרגל התחתון – לשנות כאן
  var FOOTER_NOTE = 'אני התלהבתי, הבינה עזרה לבצע, אתם מוזמנים להשתמש (ולהזכיר מאיפה זה בא)';
  var FOOTER_THANKS = 'רוצים להגיד תודה? קפה קטן יתקבל בשמחה';

  var LOGO =
    '<svg class="logo" viewBox="0 0 100 100" fill="none" aria-hidden="true">' +
    '<path d="M50 14 L86 35 V75 L50 96 L14 75 V35 Z" stroke="#0284C7" stroke-width="6.5" stroke-linejoin="round"/>' +
    '<path d="M50 55 V96" stroke="#0284C7" stroke-width="5.5" stroke-linecap="round"/>' +
    '<path d="M14 35 L50 55 L86 35" stroke="#1E1B4B" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<circle cx="50" cy="34.5" r="7.5" fill="#EAB308"/></svg>';

  var ICON_ATTRS = 'class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var HOME_ICON =
    '<svg ' + ICON_ATTRS + '><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>' +
    '<path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
  var COFFEE_ICON =
    '<svg ' + ICON_ATTRS + '><path d="M10 2v2"/><path d="M14 2v2"/><path d="M6 2v2"/>' +
    '<path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/></svg>';

  var NAME =
    '<span class="name">תאיר פניני</span><span class="sep" aria-hidden="true">|</span><span class="slogan">מרחב לחשיבה</span>';

  var BASE_CSS =
    ':host{all:initial;display:block;direction:rtl;font-family:"Assistant",system-ui,sans-serif;' +
    '--ink:#1E1B4B;--accent:#0284C7;--accent-dark:#0369A1;--text:#334155;--muted:#64748B;--line:#E2E8F0;--surface:#FFFFFF}' +
    '*{box-sizing:border-box}' +
    '.in{max-width:var(--tp-max,72rem);margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
    'a{color:inherit;text-decoration:none}' +
    'a:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:8px}' +
    '.brand{display:flex;align-items:center;gap:10px;color:var(--ink);min-width:0}' +
    '.logo{display:block;flex-shrink:0}' +
    '.name{font-weight:700}' +
    '.sep{color:#CBD5E1;font-weight:400}' +
    '.slogan{color:var(--accent);font-weight:600}' +
    '.ic{width:1.15em;height:1.15em;flex-shrink:0;display:block}' +
    '.acts{display:flex;align-items:center;gap:8px}' +
    '.link{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;color:var(--muted);font-weight:600}' +
    '.link:hover{background:#F1F5F9;color:var(--ink)}';

  var HEADER_CSS =
    ':host{position:sticky;top:0;z-index:50}' +
    '.bar{background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:12px 0}' +
    '.brand{font-size:1.2rem;line-height:1.2}' +
    '.logo{width:38px;height:38px}' +
    '.acts{font-size:1rem}' +
    // בפלאפון: הכפתורים הופכים לאייקונים עגולים, הטקסט נשאר גדול
    '@media (max-width:560px){' +
    '.in{padding:0 16px;gap:8px}' +
    '.brand{font-size:1.1rem;gap:8px}.logo{width:34px;height:34px}' +
    '.link{width:42px;height:42px;padding:0;justify-content:center}' +
    '.ic{width:22px;height:22px}' +
    '.lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}';

  var FOOTER_CSS =
    ':host{margin-top:auto;position:relative;z-index:10}' +
    'footer{border-top:1px solid var(--line);padding:20px 0;color:var(--muted)}' +
    '.in{justify-content:center}' +
    '.in{flex-direction:column;gap:8px}' +
    '.note{margin:0;font-size:.95rem;line-height:1.5;text-align:center;text-wrap:balance}' +
    '.sign{font-size:.95rem;color:var(--ink);display:flex;align-items:center;gap:8px}' +
    '.sign .logo{width:22px;height:22px}' +
    '.sign .sep{margin:0 .35em}' +
    '.sign .slogan{font-weight:600}' +
    '.thanks{display:inline-flex;align-items:center;gap:6px;font-size:.85rem;color:var(--muted);opacity:.85}' +
    '.thanks .ic{width:1em;height:1em}' +
    '.thanks:hover{opacity:1;color:var(--ink);text-decoration:underline;text-underline-offset:3px}' +
    '@media (max-width:560px){.in{padding:0 16px}}';

  // כאן ייכנס בעתיד סרגל ניווט
  function actions(isHome) {
    return isHome ? '' : '<a class="link" href="/" title="דף הבית">' + HOME_ICON + '<span class="lbl">דף הבית</span></a>';
  }

  function define(name, render) {
    if (customElements.get(name)) return;
    customElements.define(name, class extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;
        this.attachShadow({ mode: 'open' }).innerHTML = render(this.hasAttribute('home'));
      }
    });
  }

  define('site-header', function (isHome) {
    return '<style>' + BASE_CSS + HEADER_CSS + '</style>' +
      '<div class="bar"><div class="in">' +
      '<a class="brand" href="/" aria-label="תאיר פניני | מרחב לחשיבה – לדף הבית">' + LOGO + NAME + '</a>' +
      '<nav class="acts" aria-label="ניווט באתר">' + actions(isHome) + '</nav>' +
      '</div></div>';
  });

  define('site-footer', function () {
    return '<style>' + BASE_CSS + FOOTER_CSS + '</style>' +
      '<footer><div class="in">' +
      '<a class="sign" href="/">' + LOGO + '<span>' + NAME + '</span></a>' +
      '<p class="note">' + FOOTER_NOTE + '</p>' +
      '<a class="thanks" href="' + PAYBOX + '" target="_blank" rel="noopener noreferrer">' + COFFEE_ICON + FOOTER_THANKS + '</a>' +
      '</div></footer>';
  });

  // favicon וגופן, אם הדף עוד לא טוען אותם
  var head = document.head;
  if (!document.querySelector('link[rel~="icon"]')) {
    var icon = document.createElement('link');
    icon.rel = 'icon'; icon.type = 'image/svg+xml'; icon.href = '/favicon.svg';
    head.appendChild(icon);
  }
  if (!document.querySelector('link[href*="family=Assistant"]')) {
    var font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap';
    head.appendChild(font);
  }
})();
