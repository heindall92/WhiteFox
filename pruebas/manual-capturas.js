// Genera las imágenes del manual a partir de la propia aplicación y las incrusta en index.html.
// Para cada capítulo: prepara el estado, busca los elementos reales, dibuja los marcadores numerados,
// recorta la zona útil, la codifica en WebP y la guarda en manual/img/. Después reescribe el bloque
// /* MANUAL_IMG */ … /* /MANUAL_IMG */ de index.html. Uso: npm run manual
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'manual', 'img');
const QUALITY = 0.74, SCALE = 1.25;
fs.mkdirSync(OUT, { recursive: true });

// m: marcadores (selector CSS, o «js:» con una expresión que devuelve el elemento). ctx: zonas que deben verse.
const CAPS = [
  { id: 'consola', full: true, setup: `go({top:'scans',page:'scans',folder:'my'});`, after: `const h=document.querySelector('main .ph');if(h)$('main').scrollTop=h.offsetTop-24;`,
    m: ['[data-tour=nav-scans]', '[data-tour=nav-settings]', '[data-tour=side-my-scans]', '[data-tour=side-policies]', '[data-tour=side-manual]', '.side .community', '.trainbtn', '[data-tour=new-scan]'] },
  { id: 'discovery', setup: `S.view.mode='scan';newDraft('discovery');UI.draft.name='Descubrimiento lab';UI.draft.settings.targets='192.168.56.0/24';render();`,
    m: ['[data-path=name]', '#targets', `[onclick="dsec('discovery')"]`, '[data-tour=dd-m-save]'], ctx: ['main .card'] },
  { id: 'licencia', setup: `go({top:'settings',page:'settings',sub:'about'});`,
    m: [`js:[...document.querySelectorAll('main dt')].find(d=>(d.textContent.startsWith('License Type')||d.textContent.startsWith('Tipo de licencia'))).nextElementSibling`, `js:[...document.querySelectorAll('main dt')].find(d=>(d.textContent.startsWith('Licensed Hosts')||d.textContent.startsWith('Equipos con licencia'))).nextElementSibling`, 'main .cmp', 'main table.t'] },
  { id: 'resultados', setup: `openScan(window.CAP.cred,'hosts');`,
    m: ['main .results .tabs', 'main tr[onclick^=openHost]', 'main tr[onclick^=openHost] .bar', 'main .side-stack .card:first-child dl', 'main .side-stack .card:nth-child(2) svg'], ctx: ['main .results'] },
  { id: 'priorizar', setup: `openScan(window.CAP.cred,'vpr');`,
    m: ['main tbody tr:first-child .vprb', 'main tbody tr:first-child .sev', 'main tbody tr:first-child td:nth-child(4)', 'main tbody tr:first-child td:nth-child(5)'], ctx: ['main .results>.card'] },
  { id: 'credenciales', setup: `S.view.mode='scan';newDraft('basic');UI.draft.top='credentials';UI.draft.creds.ssh.user='auditor';UI.draft.creds.ssh.pass='Lab2026!';render();`,
    m: [`[onclick="dtop('credentials')"]`, '[data-tour=cc-ssh]', '[data-path="creds.ssh.user"]', '[data-tour=cc-win]', 'main .epane .note'], ctx: ['main .card'] },
  { id: 'filtros', setup: `openScan(window.CAP.cred,'vulns');setTimeout(()=>{UI.filterOpen=true;UI.filters=[{field:'sev',op:'eq',value:'4'},{field:'exploit',op:'eq',value:'true'}];render();},450);`,
    m: ['main .search', 'main button[aria-expanded]', 'main .filters .frow:first-child select', 'main .filters .frow:nth-child(2)', 'main .filters .btn.primary'], ctx: ['main .filters', 'main .results .tabs'] },
  { id: 'reglas', modal: true, setup: `go({top:'scans',page:'rules'});setTimeout(()=>{ruleModal();const d=new Date();d.setDate(d.getDate()+60);const v={'r-h':'192.168.56.30','r-p':'179072','r-e':d.toISOString().slice(0,10),'r-s':'hide','r-c':'CHG-2041 · backport verificado con scan con credenciales · aprueba J. Ruiz'};for(const k in v)document.getElementById(k).value=v[k];document.activeElement.blur();},450);`,
    m: ['#r-h', '#r-p', '#r-e', '#r-s', '#r-c'] },
  { id: 'remediar', setup: `openScan(window.CAP.cred,'rem');`,
    m: ['main .results>.card>.toolbar:not(.filters)>span', 'main .results tbody tr:first-child td:first-child', 'main .results thead th:nth-child(3)', 'main .results tbody tr:first-child button[onclick^=labPatch]'], ctx: ['main .results>.card'] },
  { id: 'informes', modal: true, setup: `openScan(window.CAP.cred,'vulns');setTimeout(()=>{reportModal(window.CAP.cred);document.activeElement.blur();},450);`,
    m: ['#rp-f', '#rp-t', '#modal .mb .st:last-child', '#modal footer .btn.primary'] },
  { id: 'plantillas', setup: `go({page:'templates',mode:'scan',ttab:'scanner'});`, after: `const t=document.querySelector('[data-tour=tpl-credval]');$('main').scrollTop=t.closest('.tgrid').offsetTop-60;`,
    m: ['[data-tour=tpl-credval]', '[data-tour=tpl-dynamic]', '[data-tour=tpl-malware]', '[data-tour=tpl-ad]', '[data-tour=tpl-findai]', '[data-tour=tpl-rmm]'] },
  { id: 'policies', setup: `S.view.mode='scan';newDraft('advanced');UI.draft.name='Semanal servidores';UI.draft.sec='schedule';UI.draft.settings.schedule.enabled=true;render();`,
    m: [`[onclick="dsec('schedule')"]`, 'main .epane input[type=checkbox]', '[data-path="settings.schedule.freq"]', '[data-path="settings.schedule.start"]'], ctx: ['main .card'] },
];

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: SCALE, colorScheme: 'light', reducedMotion: 'reduce', locale: 'es-ES' });
  const page = await ctx.newPage();
  page.on('pageerror', e => { console.error('Error en la página:', e.message); process.exitCode = 1; });
  await page.goto('file://' + HTML);
  await page.waitForSelector('main');
  // Laboratorio con datos: descubrimiento y un scan con credenciales de los hosts vivos
  await page.evaluate(() => {
    closeModal(); localStorage.clear(); S = fresh(); S.profile = { name: 'Laura Gómez Ruiz', user: 'laura', email: '', role: 'Analista de riesgos', asked: 1 }; seed(); S.speed = 10; S.events.welcome = Date.now(); coachHidden = true; save();
    const mk = (t, name, targets, creds) => { S.view.mode = 'scan'; newDraft(t); const d = UI.draft; d.name = name; d.settings.targets = targets;
      if (creds) { d.creds.ssh = { method: 'password', user: 'auditor', pass: 'Lab2026!', elev: 'sudo' }; d.creds.win = { method: 'password', user: 'svc_nessus', pass: 'Lab2026!', domain: 'LAB' }; }
      saveDraft(true); return S.scans[S.scans.length - 1].id; };
    mk('discovery', 'Descubrimiento lab', '192.168.56.0/24');
    window.CAP = { cred: mk('basic', 'Hosts vivos con credenciales', '192.168.56.1,192.168.56.10,192.168.56.20,192.168.56.30,192.168.56.40,192.168.56.50,192.168.56.60,192.168.56.70,192.168.56.80', true) };
  });
  await page.waitForFunction(() => S.scans.every(s => s.runs.every(r => r.status !== 'running')), null, { timeout: 60000 });
  await page.addStyleTag({ content: '#coach,.toasts,#tour{display:none!important}' });
  const enc = await ctx.newPage();
  await enc.setContent('<canvas id="c"></canvas>');
  const result = {};
  for (const [k, c] of CAPS.entries()) {
    await page.evaluate(() => { closeModal(); UI.menu = null; UI.filters = []; UI.filterOpen = false; });
    await page.evaluate(c.setup);
    await page.waitForTimeout(1100);
    if (c.after) { await page.evaluate(c.after); await page.waitForTimeout(250); }
    const info = await page.evaluate(({ c }) => {
      const pick = q => q.startsWith('js:') ? (0, eval)(q.slice(3)) : document.querySelector(q);
      const els = c.m.map(pick);
      const miss = c.m.filter((q, i) => !els[i] || !els[i].getClientRects().length);
      if (miss.length) return { miss };
      const R = el => el.getBoundingClientRect();
      const W = innerWidth, H = innerHeight;
      let box;
      if (c.full) box = { l: 0, t: 0, r: W, b: H };
      else if (c.modal) { const r = R(document.querySelector('#modal .modal')); box = { l: r.left - 18, t: r.top - 18, r: r.right + 18, b: r.bottom + 18 }; }
      else {
        const rs = els.map(R).concat((c.ctx || []).map(q => document.querySelector(q)).filter(Boolean).map(R));
        const m = document.querySelector('main').getBoundingClientRect();
        box = { l: m.left + 10, r: m.right - 10, t: Math.min(...rs.map(r => r.top)) - 40, b: Math.max(...rs.map(r => r.bottom)) + 40 };
      }
      box = { l: Math.max(0, Math.round(box.l)), t: Math.max(0, Math.round(box.t)), r: Math.min(W, Math.round(box.r)), b: Math.min(H, Math.round(box.b)) };
      // Marcadores: contorno sobre el elemento y número en su esquina, siempre dentro del recorte
      const layer = document.createElement('div'); layer.id = 'cap-marks';
      layer.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none';
      els.forEach((el, i) => {
        const r = R(el);
        const o = document.createElement('div');
        o.style.cssText = `position:fixed;left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px;border:2px solid #1f6fc5;border-radius:9px;box-shadow:0 0 0 3px rgba(31,111,197,.18)`;
        const n = document.createElement('div');
        const x = Math.min(Math.max(r.left - 13, box.l + 4), box.r - 30), y = Math.min(Math.max(r.top - 13, box.t + 4), box.b - 30);
        n.textContent = i + 1;
        n.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:26px;height:26px;border-radius:50%;background:#1f6fc5;color:#fff;font:700 14px/26px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 3px #fff,0 4px 10px rgba(0,0,0,.3)`;
        layer.append(o, n);
      });
      document.body.append(layer);
      const ch = MANUAL.find(x => x.id === c.id);
      const labels = ch.steps.slice(0, els.length).map((s, i) => (i + 1) + ': ' + (s.match(/<b>(.*?)<\/b>/) || [, ''])[1].replace(/<[^>]+>/g, ''));
      return { box, alt: `Captura de «${ch.t}» con los números ${labels.join('; ')}.` };
    }, { c });
    if (info.miss) { console.error(`✗ ${c.id}: no encuentro ${info.miss.join(', ')}`); process.exitCode = 1; continue; }
    const { box } = info;
    const png = await page.screenshot({ clip: { x: box.l, y: box.t, width: box.r - box.l, height: box.b - box.t } });
    await page.evaluate(() => document.getElementById('cap-marks').remove());
    const webp = await enc.evaluate(async ({ b64, q }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.getElementById('c'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img, 0, 0); return cv.toDataURL('image/webp', q).split(',')[1];
    }, { b64: png.toString('base64'), q: QUALITY });
    const file = path.join(OUT, String(k + 1).padStart(2, '0') + '-' + c.id + '.webp');
    fs.writeFileSync(file, Buffer.from(webp, 'base64'));
    result[c.id] = { src: 'data:image/webp;base64,' + webp, w: box.r - box.l, h: box.b - box.t, alt: info.alt };
    console.log(`✓ ${c.id}: ${box.r - box.l}×${box.b - box.t} · ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  if (process.exitCode) { console.error('No se incrusta nada: hay capítulos sin imagen.'); return; }
  const total = Object.keys(result).reduce((a, k) => a + fs.statSync(path.join(OUT, String(CAPS.findIndex(c => c.id === k) + 1).padStart(2, '0') + '-' + k + '.webp')).size, 0);
  let html = fs.readFileSync(HTML, 'utf8');
  const re = /\/\* MANUAL_IMG \*\/[\s\S]*?\/\* \/MANUAL_IMG \*\//;
  if (!re.test(html)) throw new Error('No encuentro el bloque MANUAL_IMG en index.html');
  html = html.replace(re, () => '/* MANUAL_IMG */const MANUAL_IMG=' + JSON.stringify(result) + ';/* /MANUAL_IMG */');
  fs.writeFileSync(HTML, html);
  console.log(`Incrustadas ${Object.keys(result).length} imágenes · ${(total / 1024).toFixed(0)} KB en WebP · index.html: ${(fs.statSync(HTML).size / 1024).toFixed(0)} KB`);
})();
