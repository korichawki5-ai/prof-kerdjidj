/* ══════════════════════════════════════════════════════════════════
   02-ui.js · Noyau d'interface partagé
   Thème · Chrome (header/footer injectés) · Toasts · Modales
   Palette de commandes (Ctrl+K) · Reveal · Compteurs · Spotlight
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const $  = (s,c)=> (c||document).querySelector(s);
const $$ = (s,c)=> Array.from((c||document).querySelectorAll(s));
const store = {
  get(k,d){ try{const v=localStorage.getItem(k); return v===null?d:v;}catch(e){return d;} },
  set(k,v){ try{localStorage.setItem(k,v);}catch(e){} }
};

/* ══════════ 1. THÈME CLAIR / SOMBRE ══════════ */
function applyTheme(t){
  document.documentElement.dataset.theme = t;
  store.set('pk-theme', t);
  $$('[data-theme-btn]').forEach(b=>{
    const u = b.querySelector('use');
    if(u) u.setAttribute('href', t==='dark' ? '#i-sun' : '#i-moon');
    b.setAttribute('aria-label', t==='dark' ? 'Mode clair' : 'Mode sombre');
  });
}
function toggleTheme(){ applyTheme(document.documentElement.dataset.theme==='dark' ? 'light' : 'dark'); }

/* ══════════ 2. SPRITE D'ICÔNES (injecté une seule fois) ══════════ */
const S = (d,extra='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ICONS = {
  pin:S('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  phone:S('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z"/>'),
  clock:S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  copy:S('<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>'),
  trend:S('<path d="M3 17.5 9.5 11l4 4L21 7.5"/><path d="M15.5 7.5H21v5.5"/>'),
  mail:S('<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/>'),
  book:S('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/>'),
  users:S('<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>'),
  user:S('<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>'),
  check:S('<path d="m4 12.5 5.2 5.2L20 7"/>'),
  checkc:S('<circle cx="12" cy="12" r="9.5"/><path d="m8 12.2 2.8 2.8L16.2 9.5"/>'),
  arrow:S('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  cal:S('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  star:S('<path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9Z"/>'),
  quiz:S('<circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 1 1 3.8 2.6c-.7.3-1.1.9-1.1 1.7v.4"/><path d="M12 17.4h.01"/>'),
  grid:S('<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>'),
  chart:S('<path d="M3 3v18h18"/><path d="M7 15.5v3M12 10v8.5M17 5.5V18"/>'),
  bell:S('<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>'),
  set:S('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.9 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 15a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.5-2.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 20 11a2 2 0 1 1 0 4Z"/>'),
  plus:S('<path d="M12 5v14M5 12h14"/>'),
  search:S('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>'),
  edit:S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  trash:S('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>'),
  up:S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M12 4v12"/>'),
  down:S('<path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M12 20V4"/>'),
  file:S('<path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8Z"/><path d="M14 2v6h6"/>'),
  play:S('<circle cx="12" cy="12" r="9.5"/><path d="m10 8.5 6 3.5-6 3.5Z"/>'),
  sun:S('<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>'),
  moon:S('<path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8Z"/>'),
  menu:S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  globe:S('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5a15 15 0 0 1 0 19 15 15 0 0 1 0-19Z"/>'),
  logout:S('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'),
  trophy:S('<path d="M7 4h10v6a5 5 0 0 1-10 0Z"/><path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9"/><path d="M12 15v3M8.5 21h7l-.7-3h-5.6Z"/>'),
  write:S('<path d="M12 19.5h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  chat:S('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.6-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/>'),
  abc:S('<path d="M3 17 6.5 7 10 17M4.2 13.6h4.6"/><path d="M14 7h3.2a2.4 2.4 0 0 1 0 4.8H14Zm0 4.8h3.6a2.6 2.6 0 0 1 0 5.2H14Z"/>'),
  school:S('<path d="m12 3 9 4.5-9 4.5-9-4.5Z"/><path d="M6 10v5.5c0 1.7 2.7 3 6 3s6-1.3 6-3V10"/><path d="M21 7.5V13"/>'),
  target:S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>'),
  layers:S('<path d="m12 2.5 9.5 5-9.5 5-9.5-5Z"/><path d="m2.5 12.5 9.5 5 9.5-5"/><path d="m2.5 17 9.5 5 9.5-5"/>'),
  bolt:S('<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12Z"/>'),
  flame:S('<path d="M12 22a6.5 6.5 0 0 0 6.5-6.5c0-4.2-3.4-6.2-4.6-9.8-.3-1-.9-1.7-1.9-1.7s-1.5.8-1.8 1.8c-.5 1.7-1.3 2.6-2.3 3.7A6.4 6.4 0 0 0 5.5 15.5 6.5 6.5 0 0 0 12 22Z"/><path d="M12 18.5a2.8 2.8 0 0 0 2.8-2.8c0-1.7-1.5-2.6-2-4.2-.4 1-1 1.6-1.7 2.3a2.8 2.8 0 0 0-.9 1.9A2.8 2.8 0 0 0 12 18.5Z"/>'),
  crown:S('<path d="M3 7l3.5 3L12 4l5.5 6L21 7l-1.8 11H4.8Z"/><path d="M4.8 18h14.4"/>'),
  seedling:S('<path d="M12 22v-8"/><path d="M12 14C12 9 8 6 3 6c0 5 4 8 9 8Z"/><path d="M12 14c0-4 3-7 8-7 0 4-3 7-8 7Z"/>'),
  leaf:S('<path d="M4 20c0-9 6-15 16-15 0 10-6 15-13 15H4Z"/><path d="M4 20c3-4 6-6 10-8"/>'),
  timer:S('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5"/><path d="M9 2.5h6"/><path d="m18.5 7 1.5-1.5"/>'),
  refresh:S('<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 4v5h-5"/>'),
  compass:S('<circle cx="12" cy="12" r="9.5"/><path d="m15.5 8.5-2 5.2-5.2 2 2-5.2Z"/>'),
  lock:S('<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  eye:S('<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>'),
  msg:S('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.6-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/>'),
  wa:S('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 5.2 5.2 0 0 0 3.2.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3Z" fill="currentColor" stroke="none"/>'),
  fb:S('<path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4A20 20 0 0 0 14.4 4c-2.3 0-3.9 1.4-3.9 4v2.5H8v3h2.5V21Z" fill="currentColor" stroke="none"/>'),
  ig:S('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none"/>'),
  yt:S('<path d="M22 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.5A2.5 2.5 0 0 0 2.4 7.3C2 8.8 2 12 2 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.5a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12Zm-12 3V9l5.2 3Z" fill="currentColor" stroke="none"/>'),
  tg:S('<path d="m21.5 4.3-2.9 15c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.1 2c-.2.2-.4.4-.9.4l.3-4.5 8.2-7.4c.4-.3-.1-.5-.6-.2L7.4 13.4l-4.3-1.3c-.9-.3-1-.9.2-1.4l16.8-6.5c.8-.3 1.5.2 1.4 1.1Z" fill="currentColor" stroke="none"/>'),
  x:S('<path d="M6 6l12 12M18 6 6 18"/>'),
  chev:S('<path d="m9 6 6 6-6 6"/>'),
  spark:S('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>'),
  award:S('<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>'),
  info:S('<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5"/><path d="M12 7.8h.01"/>'),
  filter:S('<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>'),
  drag:S('<circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/>'),
  bold:S('<path d="M7 4h6.5a4 4 0 0 1 0 8H7Z"/><path d="M7 12h7.5a4 4 0 0 1 0 8H7Z"/>'),
  italic:S('<path d="M15 4h-5M14 20H9M13.5 4 10.5 20"/>'),
  ulist:S('<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/>'),
  link:S('<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.5 6.3"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.3-1.3"/>'),
  save:S('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  send:S('<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5Z"/>')
};
function icon(n,cls){ return `<span class="ic ${cls||''}" aria-hidden="true">${ICONS[n]||''}</span>`; }
function svg(n,attr){ return (ICONS[n]||'').replace('<svg ','<svg '+(attr||'')+' '); }

function injectSprite(){
  if($('#pk-sprite')) return;
  const d = document.createElement('div');
  d.id='pk-sprite'; d.style.display='none';
  d.innerHTML = Object.entries(ICONS).map(([k,v])=>{
    const inner = v.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
    return `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`;
  }).join('');
  const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.id='pk-sprite'; s.setAttribute('aria-hidden','true'); s.style.display='none'; s.innerHTML=d.innerHTML;
  document.body.appendChild(s);
}

/* ══════════ 3. LOGO ══════════ */
function logo(size){
  const s = size||48;
  return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" aria-hidden="true">
    <defs><linearGradient id="pkG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4E7CFF"/><stop offset="1" stop-color="#0B2470"/></linearGradient></defs>
    <rect width="48" height="48" rx="15" fill="url(#pkG)"/>
    <path d="M9 14.6c0-1 .9-1.7 1.9-1.5l9.6 2.1c.9.2 1.5 1 1.5 1.9v15.2c0 1.2-1.1 2-2.2 1.7L10.4 31c-.8-.2-1.4-.9-1.4-1.8Z" fill="#fff" opacity=".22"/>
    <path d="M39 14.6c0-1-.9-1.7-1.9-1.5l-9.6 2.1c-.9.2-1.5 1-1.5 1.9v15.2c0 1.2 1.1 2 2.2 1.7l9.4-3c.8-.2 1.4-.9 1.4-1.8Z" fill="#fff" opacity=".40"/>
    <path d="M24 15.8 13.2 13.2v17.9L24 34.3l10.8-3.2V13.2Z" fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round"/>
    <path d="M24 15.8v18.5" stroke="#fff" stroke-width="1.7" opacity=".8"/>
    <circle cx="24" cy="9.2" r="3.5" fill="#fff"/>
    <path d="M24 5.7a3.5 3.5 0 0 1 0 7Z" fill="#C3D6FF"/>
  </svg>`;
}

/* ══════════ 4. CHROME : EN-TÊTE + PIED DE PAGE ══════════ */
const NAV = [
  {k:'navHome',     href:'/index.html'},
  {k:'navLevels',   href:'/levels.html'},
  {k:'navLessons',  href:'/lessons.html'},
  {k:'navEx',       href:'/exercises.html'},
  {k:'navTimetable',href:'/timetable.html'},
  {k:'navAbout',    href:'/about.html'},
  {k:'navFaq',      href:'/faq.html'},
  {k:'navContact',  href:'/contact.html'}
];
function buildHeader(active){
  const cfg = (window.PKdata && window.PKdata.settings) || {};
  const tel = cfg.phone || '+213 000 00 00 00';
  return `
  <div class="rdp"><i id="rdpBar"></i></div>
  <div class="top">
    <div class="w top__i">
      <div class="top__l">
        <span class="top__live"><i></i><span data-i18n="liveNow">حصة جارية الآن</span></span>
        <span class="top__it">${svg('pin','width="14" height="14"')}<span data-i18n="addrShort">خميس مليانة، الجزائر</span></span>
        <span class="top__it">${svg('phone','width="14" height="14"')}<a href="tel:${tel.replace(/\s/g,'')}" class="la" dir="ltr">${tel}</a></span>
        <span class="top__it">${svg('clock','width="14" height="14"')}<span data-i18n="hours">السبت – الخميس: 14:00 – 20:00</span></span>
      </div>
      <div class="top__l">
        <span class="top__it">${svg('mail','width="14" height="14"')}<a href="mailto:${cfg.email||'contact@prof-kerdjidj.dz'}">${cfg.email||'contact@prof-kerdjidj.dz'}</a></span>
      </div>
    </div>
  </div>
  <header class="hd" id="hdr">
    <div class="w hd__i">
      <a class="br" href="index.html">
        <span class="br__m">${logo(48)}</span>
        <span class="br__t">
          <span class="br__n"><span class="ar">الأستاذة قرجيج</span><span class="fr">Prof. Kerdjidj</span></span>
          <span class="br__sb"><span class="ar">منصة اللغة الفرنسية</span><span class="fr">Plateforme de Français</span></span>
        </span>
      </a>
      <nav class="nv" id="mainNav">
        ${NAV.map(n=>`<a class="nv__l${active===n.href?' on':''}" href="${n.href}" data-i18n="${n.k}"></a>`).join('')}
      </nav>
      <div class="hd__t">
        <button class="btn btn--g btn--i" id="pkSearch" data-i18n-tt="adSearch" title="Ctrl+K">${svg('search')}</button>
        <div class="lgsw" role="group" aria-label="Langue">
          <button data-lang="ar">AR</button><button data-lang="fr">FR</button>
        </div>
        <button class="btn btn--g btn--i" data-theme-btn title="Theme">${svg('moon')}</button>
        <a class="btn btn--p btn--sm" href="student/index.html">
          ${svg('users','width="17" height="17"')}<span data-i18n="navLogin">دخول التلميذ</span>
        </a>
        <button class="btn btn--g btn--i brg" id="brg" aria-label="Menu">${svg('menu')}</button>
      </div>
    </div>
  </header>`;
}
function buildFooter(){
  const cfg = (window.PKdata && window.PKdata.settings) || {};
  return `
  <footer class="ft">
    <div class="ft__wm" aria-hidden="true">KERDJIDJ</div>
    <div class="w">
      <div class="ft__g">
        <div>
          <div class="ft__br">
            <span class="br__m">${logo(46)}</span>
            <span class="br__t">
              <span class="br__n"><span class="ar">الأستاذة قرجيج</span><span class="fr">Prof. Kerdjidj</span></span>
              <span class="br__sb">Plateforme de Français</span>
            </span>
          </div>
          <p class="ft__ab" data-i18n="ftAbout"></p>
          <div class="soc">
            <a href="${cfg.facebook||'#'}" aria-label="Facebook">${svg('fb')}</a>
            <a href="${cfg.instagram||'#'}" aria-label="Instagram">${svg('ig')}</a>
            <a href="${cfg.youtube||'#'}" aria-label="YouTube">${svg('yt')}</a>
            <a href="${cfg.telegram||'#'}" aria-label="Telegram">${svg('tg')}</a>
          </div>
        </div>
        <div>
          <h4 data-i18n="ftNav">روابط سريعة</h4>
          <ul>${NAV.slice(0,6).map(n=>`<li><a href="${n.href}" data-i18n="${n.k}"></a></li>`).join('')}</ul>
        </div>
        <div>
          <h4 data-i18n="ftLevels">المستويات</h4>
          <ul>
            <li><a href="levels.html#1am">1AM — <span data-i18n="lv1"></span></a></li>
            <li><a href="levels.html#2am">2AM — <span data-i18n="lv2"></span></a></li>
            <li><a href="levels.html#3am">3AM — <span data-i18n="lv3"></span></a></li>
            <li><a href="levels.html#4am">4AM — <span data-i18n="lv4"></span></a></li>
          </ul>
          <h4 class="mt5" data-i18n="ftSpace">فضاء التلميذ</h4>
          <ul><li><a href="student/index.html" data-i18n="navLogin"></a></li></ul>
        </div>
        <div>
          <h4 data-i18n="ftContact">التواصل</h4>
          <div class="ft__c">${svg('pin')}<span data-i18n="addrShort"></span></div>
          <div class="ft__c">${svg('phone')}<a href="tel:${(cfg.phone||'').replace(/\s/g,'')}" class="la" dir="ltr">${cfg.phone||'+213 000 00 00 00'}</a></div>
          <div class="ft__c">${svg('mail')}<a href="mailto:${cfg.email||'contact@prof-kerdjidj.dz'}">${cfg.email||'contact@prof-kerdjidj.dz'}</a></div>
          <div class="ft__c">${svg('clock')}<span data-i18n="hours"></span></div>
        </div>
      </div>
      <div class="ft__b">
        <span>© <span class="la">2025</span> <span data-i18n="ftRights"></span></span>
        <span data-i18n="ftNote"></span>
        <span data-i18n="ftMade"></span>
      </div>
    </div>
  </footer>
  <a class="waf" href="${cfg.whatsappLink||'#'}" target="_blank" rel="noopener" aria-label="WhatsApp">
    <span class="waf__tip"><span data-i18n="ctWhatsapp">واتساب</span></span>${svg('wa')}
  </a>
  <button class="totop" id="toTop" aria-label="Top">${svg('up')}</button>`;
}
function mountChrome(active){
  injectSprite();
  const h = $('#site-header'); if(h){ h.innerHTML = buildHeader(active); }
  const f = $('#site-footer'); if(f){ f.innerHTML = buildFooter(); }
  bindChrome();
}

/* ══════════ 5. BINDINGS DU CHROME ══════════ */
function bindChrome(){
  // langue
  $$('.lgsw button').forEach(b=> b.addEventListener('click', ()=> window.PKi18n.set(b.dataset.lang)));
  // thème
  $$('[data-theme-btn]').forEach(b=> b.addEventListener('click', toggleTheme));
  // burger
  const brg = $('#brg'), nav = $('#mainNav');
  if(brg && nav){
    brg.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      brg.innerHTML = svg(open ? 'x' : 'menu');
    });
    $$('.nv__l', nav).forEach(a=>a.addEventListener('click',()=>{ nav.classList.remove('open'); brg.innerHTML=svg('menu'); }));
  }
  // header collant
  const hdr = $('#hdr');
  if(hdr) window.addEventListener('scroll', ()=> hdr.classList.toggle('stuck', window.scrollY > 12), {passive:true});
  // barre de progression de lecture
  const rdp = $('#rdpBar');
  if(rdp) window.addEventListener('scroll', ()=>{
    const h = document.documentElement.scrollHeight - window.innerHeight;
    rdp.style.width = (h > 0 ? (window.scrollY/h*100) : 0) + '%';
  }, {passive:true});
  // retour en haut
  const tt = $('#toTop');
  if(tt){
    window.addEventListener('scroll', ()=> tt.classList.toggle('show', window.scrollY > 700), {passive:true});
    tt.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  }
  // recherche (Ctrl+K)
  const ps = $('#pkSearch'); if(ps) ps.addEventListener('click', ()=> openPalette());
}

/* ══════════ 6. TOASTS ══════════ */
function toast(msg, type, ms){
  let box = $('.toasts');
  if(!box){ box = document.createElement('div'); box.className='toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' toast--'+type : '');
  const ic = type==='er' ? 'x' : type==='wn' ? 'info' : 'checkc';
  el.innerHTML = svg(ic,'width="19" height="19"') + `<span>${msg}</span>`;
  box.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(), 380); }, ms||3200);
  return el;
}

/* ══════════ 7. MODALES ══════════ */
function modal(title, body, actions){
  const w = document.createElement('div');
  w.className='mdl'; w.setAttribute('role','dialog'); w.setAttribute('aria-modal','true');
  w.innerHTML = `<div class="mdl__b">
      <div class="mdl__h"><h3>${title}</h3>
        <button class="btn btn--g btn--is" data-close aria-label="Close">${svg('x','width="16" height="16"')}</button></div>
      <div class="mdl__c">${body||''}</div>
      ${actions?`<div class="mdl__f">${actions}</div>`:''}
    </div>`;
  document.body.appendChild(w);
  document.body.style.overflow='hidden';
  const kill=()=>{ w.remove(); document.body.style.overflow=''; document.removeEventListener('keydown',esc); };
  const esc=e=>{ if(e.key==='Escape') kill(); };
  document.addEventListener('keydown',esc);
  w.addEventListener('click',e=>{ if(e.target===w || e.target.closest('[data-close]')) kill(); });
  return {el:w, close:kill};
}

/* ══════════ 8. PALETTE DE COMMANDES (Ctrl+K) ══════════ */
let PAL = [];
function setPalette(items){ PAL = items; }
function openPalette(){
  if($('.cmp')) return;
  const w = document.createElement('div'); w.className='cmp';
  w.innerHTML = `<div class="cmp__b">
    <div class="cmp__i">${svg('search')}<input type="text" id="cmpIn" autocomplete="off" spellcheck="false"
      data-i18n-ph="adSearch" placeholder="ابحث أو انتقل… (Ctrl+K)"><span class="kbd">ESC</span></div>
    <div class="cmp__l" id="cmpList"></div>
    <div class="cmp__f"><span><span class="kbd">↑↓</span> تنقّل</span><span><span class="kbd">↵</span> فتح</span><span><span class="kbd">ESC</span> إغلاق</span></div>
  </div>`;
  document.body.appendChild(w);
  const inp = $('#cmpIn', w), list = $('#cmpList', w);
  let sel = 0, items = PAL.slice();
  const render = ()=>{
    let html='', lastG=null;
    items.forEach((it,i)=>{
      if(it.group && it.group!==lastG){ html += `<div class="cmp__g">${it.group}</div>`; lastG=it.group; }
      html += `<div class="cmp__o${i===sel?' sel':''}" data-i="${i}">${svg(it.icon||'arrow')}<span>${it.label}</span>${it.kbd?`<span class="kbd">${it.kbd}</span>`:''}</div>`;
    });
    list.innerHTML = html || `<div class="empty" style="padding:36px"><b>${window.PKi18n.t('stuNoRes')}</b></div>`;
    $$('.cmp__o',list).forEach(o=>{
      o.addEventListener('mouseenter',()=>{ sel=+o.dataset.i; render(); });
      o.addEventListener('click',()=>run(items[+o.dataset.i]));
    });
    const s = $('.cmp__o.sel',list); if(s) s.scrollIntoView({block:'nearest'});
  };
  const run = it=>{ if(!it) return; close(); if(it.run) it.run(); else if(it.href) location.href=it.href; };
  const close = ()=>{ w.remove(); document.removeEventListener('keydown',key); document.body.style.overflow=''; };
  const key = e=>{
    if(e.key==='Escape'){ e.preventDefault(); close(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); sel=Math.min(items.length-1,sel+1); render(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); sel=Math.max(0,sel-1); render(); }
    else if(e.key==='Enter'){ e.preventDefault(); run(items[sel]); }
  };
  inp.addEventListener('input',()=>{
    const q = inp.value.trim().toLowerCase();
    items = q ? PAL.filter(i=> (i.label+' '+(i.sub||'')+' '+(i.keys||'')).toLowerCase().includes(q)) : PAL.slice();
    sel=0; render();
  });
  document.addEventListener('keydown',key);
  document.body.style.overflow='hidden';
  render(); setTimeout(()=>inp.focus(),40);
  w.addEventListener('click',e=>{ if(e.target===w) close(); });
}

/* ══════════ 9. ANIMATIONS AU DÉFILEMENT ══════════ */
function initReveal(root){
  const els = $$('.rv', root||document);
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('in')); return; }
  const io = new IntersectionObserver(en=>{
    en.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } });
  },{rootMargin:'0px 0px -7% 0px', threshold:.06});
  els.forEach(e=>io.observe(e));
}
function initCounters(root){
  $$('.cnt-up', root||document).forEach(el=>{
    if(el.dataset.done) return;
    const to = parseFloat(el.dataset.to||'0'), dec = +(el.dataset.dec||0), dur = +(el.dataset.dur||1600);
    const io = new IntersectionObserver(en=>{
      if(!en[0].isIntersecting) return; io.disconnect(); el.dataset.done='1';
      const t0 = performance.now();
      (function f(t){
        const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3);
        el.textContent = (to*e).toFixed(dec);
        if(p<1) requestAnimationFrame(f); else el.textContent = to.toFixed(dec);
      })(performance.now());
    },{threshold:.4});
    io.observe(el);
  });
}
function initProgress(root){
  $$('.prg i, .xpbar__t i', root||document).forEach(el=>{
    const w = el.dataset.w || el.style.width; if(!w) return;
    el.dataset.w = w; el.style.width = '0%';
    const io = new IntersectionObserver(en=>{
      if(!en[0].isIntersecting) return; io.disconnect();
      requestAnimationFrame(()=> el.style.width = w);
    },{threshold:.3});
    io.observe(el);
  });
  $$('.bars__v', root||document).forEach(el=>{
    const h = el.dataset.h || el.style.height; if(!h) return;
    el.dataset.h = h; el.style.height = '4px';
    const io = new IntersectionObserver(en=>{
      if(!en[0].isIntersecting) return; io.disconnect();
      requestAnimationFrame(()=> el.style.height = h);
    },{threshold:.3});
    io.observe(el);
  });
}
function replayFx(root){ initProgress(root); initCounters(root); }

/* ══════════ 10. SPOTLIGHT (reflet suivant le curseur) ══════════ */
function initSpot(root){
  $$('.spot', root||document).forEach(el=>{
    el.addEventListener('pointermove', e=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX-r.left)+'px');
      el.style.setProperty('--my', (e.clientY-r.top)+'px');
    });
  });
}

/* ══════════ 11. ONGLETS GÉNÉRIQUES ══════════ */
function initTabs(scopeSel, tabSel, panelSel){
  $$(scopeSel).forEach(scope=>{
    const tabs = $$(tabSel, scope);
    tabs.forEach(t=> t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.toggle('on', x===t));
      const id = t.dataset.tab;
      $$(panelSel).forEach(p=> p.classList.toggle('hide', p.dataset.panel!==id));
      const p = $(`${panelSel}[data-panel="${id}"]`);
      if(p){ p.classList.remove('lpn'); void p.offsetWidth; p.classList.add('lpn'); replayFx(p); }
      document.dispatchEvent(new CustomEvent('pk:tab',{detail:{id, scope}}));
    }));
  });
}

/* ══════════ 12. CONFETTIS (réussite) ══════════ */
function confetti(n){
  const c = document.createElement('div'); c.className='conf'; document.body.appendChild(c);
  const cols=['#1E4FD8','#4E7CFF','#0FA97C','#FFD43B','#7048E8','#FF8787'];
  for(let i=0;i<(n||70);i++){
    const p=document.createElement('i');
    p.style.left=Math.random()*100+'vw'; p.style.top='-20px';
    p.style.background=cols[i%cols.length];
    p.style.animationDuration=(1.6+Math.random()*1.6)+'s';
    p.style.animationDelay=(Math.random()*.5)+'s';
    p.style.opacity=.9;
    c.appendChild(p);
  }
  setTimeout(()=>c.remove(), 4200);
}

/* ══════════ 13. AMORÇAGE ══════════ */
function boot(active){
  const theme = store.get('pk-theme','light');
  document.documentElement.dataset.theme = theme;
  mountChrome(active);
  window.PKi18n.set(window.PKi18n.current());
  applyTheme(theme);
  initReveal(); initCounters(); initProgress(); initSpot();
  // raccourci Ctrl+K
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openPalette(); }
  });
  // palette par défaut : navigation
  if(!PAL.length){
    const g = window.PKi18n.current()==='ar' ? 'تنقّل' : 'Navigation';
    PAL = NAV.map(n=>({label:window.PKi18n.t(n.k), href:n.href, icon:'arrow', group:g}))
      .concat([{label:window.PKi18n.t('navLogin'), href:'/student/index.html', icon:'users', group:g}]);
  }
  document.dispatchEvent(new CustomEvent('pk:ready'));
  /* erreurs Firestore / Auth : une seul message clair, jamais de silence */
  document.addEventListener('pk:error', e=>{
    const d = (e && e.detail) || {};
    if(!d.toasted && d.message) toast(d.message, 'er', 5200);
  });
}

/* ══════════ API PUBLIQUE ══════════ */
window.PK = {
  $, $$, store, boot, mountChrome, buildHeader, buildFooter, logo, icon, svg, ICONS,
  toast, modal, openPalette, setPalette,
  initReveal, initCounters, initProgress, replayFx, initSpot, initTabs, confetti,
  applyTheme, toggleTheme,
  /* traduction : t('clé') → texte dans la langue courante */
  t: (k,lang)=> window.PKi18n.t(k,lang),
  setLang: (l)=> window.PKi18n.set(l),
  i18n: ()=> window.PKi18n,
  lang: ()=> window.PKi18n.current(),
  /* données + progression, pour usage direct depuis les pages */
  get data(){ return window.PKdata; },
  get xp(){ return window.PKxp; },
  get db(){ return window.PKdb; }
};
})();
