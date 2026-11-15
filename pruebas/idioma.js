// Detector de restos en español: recorre todas las pantallas con la interfaz en inglés y
// falla si queda algún texto o atributo accesible en español. Con --dump <archivo> guarda la lista.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const FILE = 'file://' + path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', 'index.html'));
const di = process.argv.indexOf('--dump'), DUMP = di > 0 ? process.argv[di + 1] : null;
const found = new Map();
let screens = 0, ALL = null;

async function snap(page, label) {
  await page.waitForTimeout(60);
  const r = await page.evaluate(() => {
    const SP = /[áéíóúñ¿¡ÁÉÍÓÚÑ]|\b(el|la|los|las|del|que|con|para|por|una|unos|es|son|está|esta|este|estos|sin|pero|como|tus?|sus?|al|lo|se|y|ya|hay|aquí|cuando|también|puedes|pulsa|ejercicios?|hallazgos?|equipos?|escaneos?|ajustes|idioma|recorridos?|siguiente|cerrar|abrir|elige|ningún|ninguno|todavía|aún|desde|hasta|entre|sobre|cada|solo|otro|otra|nuevo|nueva|ejemplo|pendiente|completad[oa]s?|correcto|vuelve|paso|pasos|activos?|riesgo|tema|claro|oscuro|velocidad|lenta|licencia|simulad[oa]|simulador|glosario|entrevista|entrenamiento|ayuda|atajos|teclado|restablecer|laboratorio|empezar|comprobar|respuesta|orden|pista|capítulo|módulo|carpetas|papelera|buscar|guardar|cancelar|volver|informe|salir|terminar|saltar|opcional|minutos|guía|aprender|ejercicio|quiz de|bienvenid[oa]|usuario|contraseña|dominio|hosts vivos|plantillas?|ninguna|nada|todos|todas|mis|tu)\b/i;
    const EN = new RegExp('(?<![\\p{L}\\d_])(the|and|of|to|is|are|was|were|with|for|this|that|from|by|be|have|can|will|not|your|you|scan|scans|host|hosts|issues?|found|open|remote|available|enabled|disabled|details|information|settings|policy|policies|report|launch|export|configure|severity|output|solution|description|synopsis|critical|high|medium|low|vulnerabilit(?:y|ies)|rules?|new|back|save|cancel|close|license|licensed|templates?|folders?|trash|history|notes|search|filter|name|status|credentials|password|username|domain|discovery|advanced|basic|schedule|running|completed|default|custom|yes|days?|minutes?|today|upgrade|enable|disable|groups?)(?![\\p{L}\\d_])', 'iu');
    const PROPER = /Domain Admins|Service Principal Name|Netlogon Remote Protocol|ARP who-is|diffie-hellman[\w-]*|Tenable Vulnerability Management|Nessus (Professional|Expert|Essentials Plus|Essentials|DB)|VMware vCenter SOAP API|User-Agent|GET \/[^\n]*|Host: [^\n]*|https?:\/\/\S+|Remote Desktop|Service Pack \d|Microsoft Windows[^\n]*|Linux Kernel[^\n]*/g;
    const ES_MODE = document.documentElement.lang === 'es', RX0 = ES_MODE ? EN : SP, RX = { test: x => RX0.test(ES_MODE ? x.replace(PROPER, ' ') : x) };
    const OK = new Set(['su', 'su+sudo', 'Normal', 'Español', 'Yoandy Ramírez Delgado', 'Ramírez']);
    const skip = el => { if (!el) return true; if (el.closest('[data-notr]')) return true; const l = el.closest('[lang=es]'); return !!l && l !== document.documentElement; };
    const out = new Set(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) {
        const p = n.parentNode;
        if (!p || /^(SCRIPT|STYLE)$/.test(p.nodeName) || skip(p)) continue;
        const t = n.nodeValue.trim(); if (t && !OK.has(t) && RX.test(t)) out.add(t);
      } else {
        if (skip(n)) continue;
        for (const a of ['aria-label', 'title', 'placeholder', 'alt']) { const v = n.getAttribute(a); if (v && !OK.has(v) && RX.test(v)) out.add('@' + a + ': ' + v); }
        if ((n.nodeName === 'INPUT' || n.nodeName === 'TEXTAREA') && n.value && !OK.has(n.value) && RX.test(n.value)) out.add('@value: ' + n.value);
      }
    }
    const all = new Set();
    const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while ((n = w2.nextNode())) {
      if (n.nodeType === 3) { const p = n.parentNode; if (!p || /^(SCRIPT|STYLE)$/.test(p.nodeName) || skip(p)) continue; const t = n.nodeValue.trim(); if (t) all.add(t); }
      else if (!skip(n)) for (const a of ['aria-label', 'title', 'placeholder', 'alt']) { const v = n.getAttribute(a); if (v) all.add(v.trim()); }
    }
    return [[...out], [...all]];
  });
  screens++;
  if (ALL) { for (const t of r[1]) if (!ALL.has(t)) ALL.set(t, label); }
  for (const t of r[0]) if (!found.has(t)) found.set(t, label);
}

async function crawl(browser, locale) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(FILE);
  await page.waitForSelector('.hero');
  const lang = await page.evaluate(() => S.lang);
  const E = fn => page.evaluate(fn);
  await E(() => { S.speed = 10; save(); });
  await snap(page, 'portada');
  // Menús de la barra superior
  for (const id of ['m-help', 'm-ajustes']) { await E(`toggleMenu('${id}')`); await snap(page, 'menú ' + id); await E(`toggleMenu('${id}')`); }
  // Ventanas
  for (const f of ['welcome()', 'shortcuts()', 'resetLab()']) { await E(f); await page.waitForTimeout(120); await snap(page, f); await E('closeModal()'); }
  // Plantillas y editor de cada plantilla en todas sus secciones
  await E("go({top:'scans',page:'templates'})"); await snap(page, 'plantillas');
  await E("S.view.mode='policy';go({top:'scans',page:'templates'})"); await snap(page, 'plantillas policy');
  const tpls = await E(() => TEMPLATES.map(t => t.id));
  for (const mode of ['scan', 'policy']) for (const t of tpls) {
    await E(`S.view.mode='${mode}';newDraft('${t}')`);
    for (const top of ['settings', 'credentials', 'plugins', 'dynamic']) {
      const secs = top === 'settings' ? ['general', 'schedule', 'notify', 'discovery', 'assessment', 'report', 'advanced'] : top === 'credentials' ? ['ssh', 'win', 'snmp', 'host', 'db', 'misc'] : [null];
      for (const sec of secs) { await E(`UI.draft.top='${top}';${sec ? `UI.draft.sec='${sec}';` : ''}if(UI.draft.settings.schedule)UI.draft.settings.schedule.enabled=true;render()`); await snap(page, `editor ${mode} ${t} ${top} ${sec || ''}`); }
    }
  }
  // Scans con resultados
  await E(() => {
    window.mk = (t, name, targets, opt = {}) => {
      S.view.mode = 'scan'; newDraft(t); const d = UI.draft; d.name = name; d.settings.targets = targets;
      if (opt.creds) { d.creds.ssh = { method: 'password', user: 'auditor', pass: 'Lab2026!', elev: 'sudo' }; d.creds.win = { method: 'password', user: 'svc_nessus', pass: 'Lab2026!', domain: 'LAB' }; }
      if (opt.bad) d.creds.ssh = { method: 'password', user: 'auditor', pass: 'mal', elev: 'Nothing' };
      if (opt.dyn) d.settings.dyn = opt.dyn;
      saveDraft(true); return S.scans[S.scans.length - 1].id;
    };
  });
  const LIVE = '192.168.56.1,192.168.56.10,192.168.56.20,192.168.56.30,192.168.56.40,192.168.56.50,192.168.56.60,192.168.56.70,192.168.56.80';
  const ids = [];
  for (const [t, o] of [['discovery', {}], ['basic', { creds: 1 }], ['basic', {}], ['basic', { bad: 1 }], ['ad', { creds: 1 }], ['malware', { creds: 1 }], ['findai', {}], ['rmm', { creds: 1 }], ['credval', { creds: 1 }], ['dynamic', { dyn: { rules: [{ f: 'cve', op: 'contains', v: 'CVE-2021-44228' }] } }]]) {
    ids.push(await E(`mk('${t}','Lab-${ids.length + 1}','${t === 'ad' ? '192.168.56.10' : LIVE}',${JSON.stringify(o)})`));
  }
  await snap(page, 'scans lanzados (avisos)');
  await page.waitForFunction(() => S.scans.every(s => s.runs.every(r => r.status !== 'running')), null, { timeout: 90000 });
  await E("go({top:'scans',page:'scans',folder:'my'})"); await snap(page, 'lista de scans');
  for (const id of ids) {
    for (const tab of ['hosts', 'vulns', 'vpr', 'rem', 'notes', 'history']) { await E(`openScan(${id},'${tab}')`); await snap(page, `scan ${id} ${tab}`); }
    await E(`S.view.tab='hosts';const r=curRun(curScan());if(r&&r.hosts[0]){S.view.host=r.hosts[0].ip;render();}`); await snap(page, `scan ${id} host`);
    await E(`auditTrail(${id})`); await page.waitForTimeout(80); await snap(page, `audit ${id}`);
    await E(`document.getElementById('at-p').value='187099';const h=document.getElementById('at-h');if(h)h.value='192.168.56.70';auditRun(${id})`).catch(() => {}); await snap(page, `audit run ${id}`); await E('closeModal()');
    await E(`reportModal(${id})`).catch(() => {}); await snap(page, `informe ${id}`); await E('closeModal()');
  }
  // Detalle de cada plugin presente
  const pids = await E(() => { const s = new Set(); S.scans.forEach(sc => sc.runs.forEach(r => r.hosts.forEach(h => h.items.forEach(i => s.add(i.pid))))); return [...s]; });
  await E(`openScan(${ids[1]},'vulns')`);
  for (const p of pids) { await E(`S.view.plugin=${p};render()`); await snap(page, 'plugin ' + p); }
  await E(`S.view.plugin=null;UI.filterOpen=true;addFilter(true);render()`); await snap(page, 'filtros');
  await E(`UI.groups=false;render()`); await snap(page, 'sin grupos');
  // Policies, reglas, ajustes
  for (const p of ['policies', 'rules']) { await E(`go({top:'scans',page:'${p}'})`); await snap(page, p); }
  await E('ruleModal()'); await snap(page, 'nueva regla'); await E('closeModal()');
  for (const sub of ['about', 'account', 'advanced', 'ca', 'lab', 'proxy', 'pwd', 'smtp']) { await E(`go({top:'settings',page:'settings',sub:'${sub}'})`); await snap(page, 'settings ' + sub); }
  // Aprender: recorridos y manual
  await E("go({top:'scans',page:'tours'})"); await snap(page, 'recorridos');
  const man = await E(() => MANUAL.map(m => m.id));
  for (const m of man) { await E(`manOpen('${m}')`); await snap(page, 'manual ' + m); await E(`manZoom('${m}')`); await snap(page, 'zoom ' + m); await E('closeModal()'); }
  // Entrenamiento: lista, cada ejercicio (pendiente, con práctica y completo), glosario, entrevista y guía
  await E('toggleDrawer(true)'); await snap(page, 'entrenamiento');
  const n = await E(() => EXERCISES.length);
  for (let i = 0; i < n; i++) { await E(`drawerEx=${i};renderDrawer()`); await snap(page, 'ejercicio ' + i); await E(`answer(${i})`); await snap(page, 'ejercicio respuesta ' + i); }
  await E(`UI.qfail={};EXERCISES.forEach(e=>{UI.qfail[e.id]=2});drawerEx=4;renderDrawer();document.querySelector('#quiz input').checked=true;answer(4)`); await snap(page, 'quiz fallado');
  await E(`S.case0=Date.now();drawerEx=EXERCISES.findIndex(e=>e.id==='e31');renderDrawer()`); await snap(page, 'caso final');
  await E(`EXERCISES.forEach(e=>{S.prog[e.id]=1;S.quiz[e.id]=1});modCheck();drawerEx=null;renderDrawer()`); await snap(page, 'todo completado');
  for (const t of ['glossary', 'interview', 'guide']) { await E(`drawerTab='${t}';renderDrawer()`); await snap(page, t); }
  await E('toggleDrawer(false)');
  await E("go({top:'scans',page:'scans',folder:'my'})"); await snap(page, 'portada completa');
  // Recorridos guiados: cada paso, y el aviso de «te has salido»
  const tours = await E(() => Object.keys(TOURS));
  for (const t of tours) {
    await E(`tourStart('${t}')`); await page.waitForTimeout(500);
    for (let k = 0; k < 12; k++) { await snap(page, `tour ${t} ${k}`); const more = await E(() => { if (!TOUR) return false; TOUR.i++; TOUR.drawn = -1; tourSync(); return !!TOUR; }); await page.waitForTimeout(80); if (!more) break; }
    await E('closeModal()');
  }
  await E(`tourStart('consola')`); await page.waitForTimeout(300); await E(`go({top:'settings',page:'settings',sub:'about'});TOUR.i=2`); await page.waitForTimeout(1200); await snap(page, 'tour fuera');
  await E('tourEnd(false)'); await page.waitForTimeout(200); await snap(page, 'tour fin');
  // Volver a español: no debe quedar inglés de la interfaz del laboratorio
  await E("setLang('es')");
  const back = await E(() => [document.documentElement.lang, EXERCISES[0].title, document.querySelector('.trainbtn .lbl').textContent]);
  const data = await E(() => JSON.stringify(PLUGINS) + JSON.stringify(TEMPLATES) + JSON.stringify(LOCKED));
  await ctx.close();
  return { lang, back, errors, data };
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  // Pasada en español: todos los textos que se ven
  ALL = new Map(); const es = await crawl(browser, 'es-ES'); const ES = ALL; ALL = new Map(); const esFound = [...found]; found.clear(); const esScreens = screens; screens = 0;
  // Pasada en inglés
  const { lang, back, errors, data } = await crawl(browser, 'en-GB'); const EN = ALL;
  console.log('idioma inicial: es-ES → ' + es.lang + ' · en-GB → ' + lang);
  console.log('vuelta a español: ' + back.join(' | '));
  // Textos idénticos en las dos pasadas que tienen palabras y no son datos de Nessus (plugins, plantillas): restos sin traducir
  const norm = t => t.replace(/\d+/g, '#');
  const ALLOW = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'idioma-iguales.json'), 'utf8')));
  for (const [t, l] of EN) {
    if (!ES.has(t) || ALLOW.has(norm(t)) || !/[a-záéíóúñ]{4,}/.test(t) || data.includes(JSON.stringify(t).slice(1, -1))) continue;
    if (!found.has(t)) found.set('= ' + t, l);
  }
  console.log('textos ES ' + ES.size + ' · EN ' + EN.size + ' · iguales ' + [...EN.keys()].filter(t => ES.has(t)).length);
  for (const [t, l] of esFound) found.set('[ES] ' + t, l); screens += esScreens;
  errors.push(...es.errors);
  await browser.close();
  const list = [...found.entries()];
  if (DUMP) fs.writeFileSync(DUMP, JSON.stringify(list, null, 1));
  if (process.argv.includes('--allow')) fs.writeFileSync(path.join(__dirname, 'idioma-iguales.json'), JSON.stringify([...new Set(list.filter(([t]) => t.startsWith('= ')).map(([t]) => norm(t.slice(2))))].sort(), null, 0).replace(/","/g, '",\n"'));
  console.log(`\n${screens} pantallas revisadas · ${list.length} textos en español · ${errors.length} errores de consola`);
  list.slice(0, 400).forEach(([t, l]) => console.log(`  [${l}] ${t.slice(0, 160)}`));
  errors.slice(0, 10).forEach(e => console.log('  ERROR ' + e.slice(0, 200)));
  process.exit(list.length || errors.length || lang !== 'en' || back[0] !== 'es' ? 1 : 0);
})();
