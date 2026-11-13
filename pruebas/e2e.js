// Prueba e2e del laboratorio: recorre los 24 ejercicios, vigila consola, red y accesibilidad.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const FILE = 'file://' + path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const SHOTS = process.argv[3] || path.join(__dirname, 'capturas');
fs.mkdirSync(SHOTS, { recursive: true });
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  ok  ' + m); } else { fails++; console.log('  FALLO ' + m); } };

async function axe(page, label) {
  await page.waitForTimeout(350);
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => (await axe.run({ exclude: [['.toast.out']] }, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })).violations.map(v => v.id + ' (' + v.nodes.length + '): ' + v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.any[0] && n.any[0].data && n.any[0].data.fgColor ? ` [${n.any[0].data.fgColor}/${n.any[0].data.bgColor} ${n.any[0].data.contrastRatio}]` : '')).join(' | ')));
  ok(r.length === 0, `axe ${label}: ${r.length ? r.join('; ') : '0 infracciones'}`);
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  for (const vp of [{ w: 1440, h: 900, n: 'desk' }, { w: 390, h: 844, n: 'movil' }]) {
    console.log(`\n== Viewport ${vp.w}px ==`);
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2, colorScheme: 'light' });
    const page = await ctx.newPage();
    const errors = [], external = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
    await page.goto(FILE);
    await page.waitForSelector('.hero');
    ok(!(await page.isVisible('.modal')), 'la portada se ve sin modales al entrar');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOTS}/${vp.n}-00-portada.png` });
    await axe(page, 'portada');
    await page.click('.hero >> text=Cómo funciona');
    await page.waitForSelector('.modal');
    ok(await page.isVisible('text=Bienvenido al laboratorio'), '«Cómo funciona» abre la bienvenida');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${vp.n}-01-bienvenida.png` });
    await axe(page, 'bienvenida');
    await page.click('#modal >> text=Empezar el ejercicio 1');
    await page.waitForTimeout(400);
    ok(await page.evaluate(() => drawerOpen && drawerEx === 0), 'el botón abre el ejercicio 1 (lección 0)');
    await page.screenshot({ path: `${SHOTS}/${vp.n}-02-ejercicio1.png` });
    await page.click('.drawer .tab:has-text("Glosario")');
    await page.waitForTimeout(300);
    await axe(page, 'glosario');
    await page.click('.drawer .tab:has-text("Ejercicios")');
    await page.click('.drawer header button[aria-label="Cerrar"]');
    await page.waitForTimeout(400);
    if (vp.n === 'desk') {
      ok(await page.isVisible('#coach'), 'el recuadro «Siguiente paso» está visible');
    } else {
      // En móvil se oculta mientras se ve la portada (no tapa sus botones) y vuelve al bajar
      ok(!(await page.isVisible('#coach')), 'en móvil «Siguiente paso» no tapa la portada');
      await page.mouse.move(200, 600);
      for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(150); }
      await page.waitForTimeout(300);
      ok(await page.isVisible('#coach'), 'en móvil «Siguiente paso» aparece al bajar');
    }
    await axe(page, 'lista de scans + siguiente paso');

    if (vp.n === 'desk') {
      // Velocidad instantánea y utilidades de prueba
      await page.evaluate(() => { S.speed = 10; save(); });
      const run = async (fn) => { await page.evaluate(fn); };
      const waitIdle = async () => page.waitForFunction(() => S.scans.every(s => s.runs.every(r => r.status !== 'running')), null, { timeout: 60000 });
      await page.evaluate(() => {
        window.mk = (t, name, targets, opt = {}) => {
          S.view.mode = 'scan'; newDraft(t); const d = UI.draft; d.name = name; d.settings.targets = targets;
          if (opt.creds) { d.creds.ssh = { method: 'password', user: 'auditor', pass: 'Lab2026!', elev: 'sudo' }; d.creds.win = { method: 'password', user: 'svc_nessus', pass: 'Lab2026!', domain: opt.nodomain ? '' : 'LAB' }; }
          if (opt.dyn) d.settings.dyn = opt.dyn;
          saveDraft(true); return S.scans[S.scans.length - 1].id;
        };
      });
      const LIVE = '192.168.56.1,192.168.56.10,192.168.56.20,192.168.56.30,192.168.56.40,192.168.56.50,192.168.56.60,192.168.56.70,192.168.56.80';

      // Módulo 1
      await page.click('.topnav button:has-text("Settings")');
      await page.waitForTimeout(200);
      ok(await page.isVisible('text=Nessus Essentials Plus'), 'About muestra Essentials Plus');
      await page.screenshot({ path: `${SHOTS}/${vp.n}-03-about.png`, fullPage: true });
      await axe(page, 'Settings › About');
      await page.click('.topnav button:has-text("Scans")');
      await page.click('text=New Scan');
      await page.waitForTimeout(200);
      ok(await page.locator('.tcard:not(.locked)').count() === 11, '11 plantillas disponibles en Essentials Plus');
      ok(await page.locator('.tcard.locked').count() === 17, '17 plantillas bloqueadas (Compliance, Web App, Expert, Manager)');
      await page.screenshot({ path: `${SHOTS}/${vp.n}-04-plantillas.png`, fullPage: true });
      await axe(page, 'plantillas');
      await run(() => mk('discovery', 'Descubrimiento lab', '192.168.56.0/24'));
      await waitIdle();
      await run(() => { mk('basic', 'Toda la red', '192.168.56.0/24'); closeModal(); });
      ok(await page.evaluate(() => !!S.events.licenseBlocked), 'una /24 con Basic Network Scan choca con la licencia');
      const basicId = await page.evaluate(L => mk('basic', 'Hosts vivos', L), LIVE);
      await waitIdle();

      // Módulo 2
      await page.evaluate(id => openScan(id, 'vulns'), basicId);
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-05-vulnerabilities.png`, fullPage: true });
      await axe(page, 'Vulnerabilities');
      await page.click('.tab:has-text("VPR Top Threats")');
      await page.waitForTimeout(200);
      const vprRows = await page.locator('.results table.t tbody tr').count();
      ok(vprRows === 10, `VPR Top Threats muestra 10 filas (${vprRows})`);
      const firstVpr = await page.locator('.vprb').first().innerText();
      ok(firstVpr === '9.9', `la primera amenaza es la de mayor VPR (Log4Shell 9.9): ${firstVpr}`);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-06-vpr-top-threats.png`, fullPage: true });
      await axe(page, 'VPR Top Threats');
      await page.evaluate(() => { openPlugin(97833); S.view.plugin = null; openHost('192.168.56.20'); S.view.host = null;
        UI.filters = [{ field: 'sev', op: 'eq', value: '4' }, { field: 'exploit', op: 'eq', value: 'true' }]; UI.match = 'all'; applyF(); UI.filters = [];
        ev('sortVPR'); });

      // Módulo 3
      await run(() => mk('credval', 'Validar credenciales', '192.168.56.1,192.168.56.10,192.168.56.20,192.168.56.30,192.168.56.40,192.168.56.50,192.168.56.60,192.168.56.70,192.168.56.80', { creds: true }));
      await waitIdle();
      const credId = await page.evaluate(L => mk('basic', 'Hosts vivos con credenciales', L, { creds: true }), LIVE);
      await waitIdle();
      await page.evaluate(id => { openScan(id, 'vulns'); openPlugin(187099); }, credId);
      await page.evaluate(() => { S.policies.push({ id: uid(), name: 'Semanal servidores', template: 'advanced', settings: defaultSettings('advanced'), creds: defaultCreds(), mod: Date.now() });
        const p = S.policies[S.policies.length - 1]; S.view.mode = 'scan'; newDraft('advanced', p.id); UI.draft.name = 'Semanal'; UI.draft.settings.targets = '192.168.56.10'; UI.draft.settings.schedule.enabled = true; UI.draft.settings.schedule.freq = 'Weekly'; saveDraft(false); });

      // Módulo 4: plantillas especializadas
      await page.evaluate(() => { S.view.mode = 'scan'; newDraft('dynamic'); UI.draft.top = 'dynamic'; UI.draft.settings.dyn.rules[0].value = 'CVE-2021-44228'; render(); });
      await page.waitForTimeout(200);
      const matchTxt = await page.locator('.st:has-text("plugins match")').innerText();
      ok(/\b2\b plugins match/.test(matchTxt), `el filtro dinámico encuentra los 2 plugins de Log4Shell: «${matchTxt.slice(0, 40)}»`);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-07-dynamic.png`, fullPage: true });
      await axe(page, 'editor Advanced Dynamic Scan');
      const dynId = await page.evaluate(L => mk('dynamic', 'Log4Shell', L, { creds: true, dyn: { match: 'all', rules: [{ field: 'cve', op: 'contains', value: 'CVE-2021-44228' }] } }), LIVE);
      await waitIdle();
      const dynPids = await page.evaluate(id => [...new Set(curRun(S.scans.find(s => s.id === id)).hosts.flatMap(h => h.items.map(i => i.pid)).filter(p => PLUGINS[p].sev > 0))], dynId);
      ok(dynPids.sort().join() === '156014,156032', `el scan dinámico solo devuelve Log4Shell: ${dynPids}`);
      const adNo = await page.evaluate(() => mk('ad', 'AD sin dominio', '192.168.56.10', { creds: true, nodomain: true }));
      await waitIdle();
      ok(await page.evaluate(id => { const h = curRun(S.scans.find(s => s.id === id)).hosts[0]; return !h.items.some(i => i.pid === 900101) && h.items.some(i => i.pid === 104410); }, adNo), 'AD Starter sin Domain no puede consultar el directorio (104410)');
      const adId = await page.evaluate(() => mk('ad', 'AD Starter', '192.168.56.10', { creds: true }));
      await waitIdle();
      await page.evaluate(id => { openScan(id, 'vulns'); openPlugin(900101); }, adId);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-08-ad-kerberoasting.png`, fullPage: true });
      await axe(page, 'detalle de plugin (AD)');
      await page.evaluate(L => { mk('findai', 'Find AI', L); mk('rmm', 'RMM', L, { creds: true }); }, LIVE);
      await waitIdle();
      await page.evaluate(() => mk('malware', 'Malware RRHH', '192.168.56.70', { creds: true }));
      await waitIdle();
      await page.evaluate(() => { const s = S.scans[S.scans.length - 1]; openScan(s.id, 'vulns'); openPlugin(900201); });

      // Módulo 5
      await page.evaluate(() => {
        S.rules.push({ id: uid(), host: '192.168.56.30', pid: 179072, exp: '', sev: 'hide', comment: 'backport', created: Date.now() });
        const d = new Date(); d.setDate(d.getDate() + 60);
        S.rules.push({ id: uid(), host: '192.168.56.50', pid: 41028, exp: d.toISOString().slice(0, 10), sev: '1', comment: 'CHG-1', created: Date.now() });
        save(); checkExercises();
      });
      await page.evaluate(id => openScan(id, 'rem'), credId);
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-09-remediations.png`, fullPage: true });
      await axe(page, 'Remediations');
      // Remedia Log4j y vuelve a escanear
      const remIdx = await page.evaluate(() => { const s = curScan(); const items = applyFilters(effItems(runView(curRun(s)))); return remediations(items).findIndex(r => /Log4j/.test(r.action)); });
      ok(remIdx >= 0, 'Remediations incluye la acción de Log4j');
      const mt = await page.evaluate(() => document.getElementById('modal').innerText.slice(0, 200)); if (mt) console.log('  MODAL ABIERTO: ' + mt);
      await page.locator('button:has-text("Simular parche")').nth(remIdx).click();
      await page.evaluate(id => launch(id), credId);
      await waitIdle();
      await page.evaluate(id => openScan(id, 'history'), credId);
      await page.waitForTimeout(200);
      ok(await page.evaluate(id => !curRun(S.scans.find(s => s.id === id)).hosts.find(h => h.ip === '192.168.56.40').items.some(i => i.pid === 156014), credId), 'tras el parche simulado, el nuevo scan ya no ve Log4Shell');
      await page.screenshot({ path: `${SHOTS}/${vp.n}-10-history.png`, fullPage: true });
      await axe(page, 'History');
      // Informes: HTML y CSV con filtro VPR
      await page.evaluate(id => openScan(id, 'vulns'), credId);
      const dl = page.waitForEvent('download');
      await page.evaluate(id => { reportModal(id); document.getElementById('rp-t').value = 'exec'; genReport(id); }, credId);
      ok(/_exec\.html$/.test((await dl).suggestedFilename()), 'informe ejecutivo HTML descargado');
      const dl2 = page.waitForEvent('download');
      await page.evaluate(id => { UI.filters = [{ field: 'vpr', op: 'gt', value: '7' }]; reportModal(id, 'csv'); genReport(id); UI.filters = []; }, credId);
      ok(/\.csv$/.test((await dl2).suggestedFilename()), 'CSV con filtro VPR > 7 descargado');
      const dl3 = page.waitForEvent('download');
      await page.evaluate(id => { exportDbModal(id); document.getElementById('db-p').value = 'Lab-2026-db!'; exportDb(id); }, credId);
      const db = await dl3; const buf = fs.readFileSync(await db.path());
      ok(buf.slice(0, 16).toString() === 'VSLAB-NESSUSDB-1' && !buf.includes('192.168.56'), 'Nessus DB cifrado (cabecera correcta y sin IPs en claro)');
      // Licencia Essentials: 5 IPs, sin informes HTML
      await page.evaluate(() => setTier('essentials'));
      await page.evaluate(() => { mk('basic', 'Seis IPs', '192.168.56.10-15'); closeModal(); });
      ok(await page.evaluate(() => S.scans[S.scans.length - 1].runs.length === 0), 'Essentials bloquea 6 IPs');
      await page.evaluate(() => mk('basic', 'Joyas de la corona', '192.168.56.10,192.168.56.20,192.168.56.40'));
      await waitIdle();
      await page.evaluate(() => { mk('basic', 'Tres más', '192.168.56.30,192.168.56.50,192.168.56.60'); });
      ok(await page.isVisible('text=Licensed host limit reached'), 'Essentials cuenta hosts distintos: 3 + 3 nuevos supera 5');
      await page.evaluate(() => closeModal());
      await page.evaluate(() => { const s = S.scans[S.scans.length - 2]; reportModal(s.id); });
      ok(await page.evaluate(() => document.querySelector('#rp-f option[value=html]').disabled && document.querySelector('#rp-f').value === 'csv'), 'en Essentials el informe HTML/PDF está bloqueado y queda CSV');
      await axe(page, 'informe con licencia Essentials');
      await page.evaluate(() => { closeModal(); setTier('plus'); });

      // Quizzes: responde uno por la interfaz y el resto por estado
      await page.evaluate(() => toggleDrawer(true, 'ex', 0));
      await page.locator('#quiz label').nth(0).click();
      await page.click('text=Comprobar respuesta');
      ok(await page.isVisible('text=No es correcta'), 'el quiz avisa de una respuesta incorrecta');
      await page.locator('#quiz label').nth(1).click();
      await page.click('text=Comprobar respuesta');
      ok(await page.evaluate(() => !!S.quiz.e0), 'el quiz acepta la respuesta correcta');
      await page.evaluate(() => { EXERCISES.forEach(e => S.quiz[e.id] = 1); save(); checkExercises(); drawerEx = null; renderDrawer(); });
      const pend = await page.evaluate(() => EXERCISES.filter(e => { try { return !e.check(); } catch (x) { return true; } }).map(e => e.id));
      ok(pend.length === 0, `los 24 ejercicios superan su comprobación automática${pend.length ? ' (faltan ' + pend.join(', ') + ')' : ''}`);
      ok(await page.evaluate(() => EXERCISES.length) === 24, '24 ejercicios en 5 módulos');
      await page.screenshot({ path: `${SHOTS}/${vp.n}-11-entrenamiento.png` });
      await axe(page, 'panel de entrenamiento completo');
      await page.click('.drawer .tab:has-text("Entrevista")');
      await page.locator('.iv summary').first().click();
      await page.screenshot({ path: `${SHOTS}/${vp.n}-12-entrevista.png` });
      await axe(page, 'entrevista');
      await page.evaluate(() => toggleDrawer(false));
      // Oscuro
      await page.evaluate(() => { S.theme = 'dark'; render(); openScan(S.scans.find(s => s.name === 'Hosts vivos con credenciales').id, 'vpr'); });
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-13-vpr-oscuro.png`, fullPage: true });
      await axe(page, 'VPR Top Threats en oscuro');
      await page.evaluate(() => go({ page: 'templates', mode: 'scan', ttab: 'scanner' }));
      await page.screenshot({ path: `${SHOTS}/${vp.n}-14-plantillas-oscuro.png`, fullPage: true });
      await axe(page, 'plantillas en oscuro');
      // Persistencia
      await page.reload();
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => S.scans.length > 10 && !document.querySelector('.modal')), 'el estado persiste y la bienvenida no vuelve a salir');
    } else {
      // Móvil: comprobaciones de maquetación
      await page.evaluate(() => { S.view.mode = 'scan'; go({ page: 'templates', mode: 'scan', ttab: 'scanner' }); });
      await page.waitForTimeout(200);
      const ow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.querySelector('main').scrollWidth + document.querySelector('main').getBoundingClientRect().left) - innerWidth);
      ok(ow <= 0, `sin desplazamiento horizontal a 390 px (${ow})`);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-04-plantillas.png`, fullPage: true });
      await axe(page, 'plantillas en móvil');
      await page.evaluate(() => openScan(S.scans[0].id, 'vulns'));
      await page.waitForTimeout(200);
      const ow2 = await page.evaluate(() => document.querySelector('main').scrollWidth - document.querySelector('main').clientWidth);
      ok(ow2 <= 0, `resultados sin desplazamiento horizontal a 390 px (${ow2})`);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-05-scan.png`, fullPage: true });
      await axe(page, 'resultados en móvil');
      await page.evaluate(() => toggleDrawer(true, 'ex', 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-06-entrenamiento.png` });
    }
    ok(errors.length === 0, `sin errores de consola${errors.length ? ': ' + errors.join(' | ') : ''}`);
    ok(external.length === 0, `sin peticiones externas${external.length ? ': ' + external.join(', ') : ''}`);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${passes} correctas, ${fails} fallos`);
  process.exit(fails ? 1 : 0);
})();
