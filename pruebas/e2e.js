// Prueba e2e del laboratorio: recorre los 32 ejercicios, los 6 recorridos guiados y los 12 capítulos del manual;
// vigila consola, red, accesibilidad y el peso del archivo.
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
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2, colorScheme: 'light', locale: 'es-ES' });
    const page = await ctx.newPage();
    const errors = [], external = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
    await page.goto(FILE);
    await page.waitForSelector('.hero');
    // 2.6.1 · Primera visita: el perfil empieza vacío (nunca con los datos del autor) y se piden los datos
    await page.waitForSelector('.modal.ob-modal');
    ok(await page.evaluate(() => S.profile.name === '' && !/Yoandy|yoandy/.test(document.querySelector('#top').textContent) && /invitado/.test(document.querySelector('#top .user').textContent) && /Antes de empezar/.test(document.querySelector('.modal').textContent)), 'la primera vez el perfil está vacío, sin datos del autor, y se piden tus datos');
    if (vp.n === 'desk') {
      await axe(page, 'primer arranque: tu perfil');
      await page.click('.modal button:has-text("Guardar y empezar")'); await page.waitForTimeout(200);
      ok(await page.isVisible('text=Escribe tu nombre o pulsa «Ahora no»'), 'sin nombre no se guarda y lo explica');
    }
    await page.fill('#ob-name', 'Laura Gómez Ruiz'); await page.fill('#ob-role', 'Analista de riesgos'); await page.press('#ob-role', 'Enter'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => S.profile.name === 'Laura Gómez Ruiz' && S.profile.user === 'laura' && S.profile.role === 'Analista de riesgos' && !document.querySelector('#modal .modal')), 'con Enter se guarda tu perfil y el usuario se deduce del nombre (laura)');
    ok(!(await page.isVisible('.modal')), 'la portada se ve sin modales al entrar');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOTS}/${vp.n}-00-portada.png` });
    await axe(page, 'portada');
    await page.click('.hero >> text=Cómo funciona');
    await page.waitForSelector('.modal');
    ok(await page.isVisible('text=Bienvenido a WhiteFox'), '«Cómo funciona» abre la bienvenida');
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
          if (opt.set) Object.assign(d.settings, opt.set);
          if (opt.ssh) d.creds.ssh = Object.assign({ method: 'password', elev: 'Nothing' }, opt.ssh);
          saveDraft(true); return S.scans[S.scans.length - 1].id;
        };
      });
      const LIVE = '192.168.56.1,192.168.56.10,192.168.56.20,192.168.56.30,192.168.56.40,192.168.56.50,192.168.56.60,192.168.56.70,192.168.56.80';

      // Barra superior: menús «?» y Ajustes
      await page.click('[data-tour=top-m-ajustes]');
      await page.click('#m-ajustes .seg button:has-text("Rápida")');
      await page.click('#m-ajustes .sw');
      ok(await page.evaluate(() => S.speed === 4 && S.theme === 'dark' && document.getElementById('m-ajustes').classList.contains('open')), 'Ajustes cambia velocidad y tema sin cerrarse');
      await axe(page, 'menú Ajustes abierto');
      await page.keyboard.press('Escape');
      ok(await page.evaluate(() => !document.querySelector('.menu.open') && document.activeElement.getAttribute('aria-label') === 'Ajustes'), 'Esc cierra el menú y devuelve el foco a su botón');
      await page.evaluate(() => { S.theme = 'light'; S.speed = 10; save(); render(); });
      await page.click('[data-tour=top-m-help]');
      await axe(page, 'menú Ayuda abierto');
      await page.click('#m-help >> text=Atajos de teclado');
      ok(await page.isVisible('text=Abrir el manual'), 'Ayuda ▸ Atajos de teclado abre la lista de atajos');
      await page.evaluate(() => closeModal());

      // Módulo 1
      await page.click('.topnav button:has-text("Configuración")');
      await page.waitForTimeout(200);
      ok(await page.isVisible('text=Nessus Essentials Plus'), 'About muestra Essentials Plus');
      await page.screenshot({ path: `${SHOTS}/${vp.n}-03-about.png`, fullPage: true });
      await axe(page, 'Settings › About');
      await page.click('.topnav button:has-text("Escaneos")');
      await page.click('text=Nuevo escaneo');
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
      await page.click('.tab:has-text("Principales amenazas VPR")');
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
      const matchTxt = await page.locator('.st:has-text("plugins cumplen")').innerText();
      ok(/\b2\b plugins cumplen/.test(matchTxt), `el filtro dinámico encuentra los 2 plugins de Log4Shell: «${matchTxt.slice(0, 40)}»`);
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
      ok(await page.isVisible('text=Límite de equipos con licencia alcanzado'), 'Essentials cuenta hosts distintos: 3 + 3 nuevos supera 5');
      await page.evaluate(() => closeModal());
      await page.evaluate(() => { const s = S.scans[S.scans.length - 2]; reportModal(s.id); });
      ok(await page.evaluate(() => document.querySelector('#rp-f option[value=html]').disabled && document.querySelector('#rp-f').value === 'csv'), 'en Essentials el informe HTML/PDF está bloqueado y queda CSV');
      await axe(page, 'informe con licencia Essentials');
      await page.evaluate(() => { closeModal(); setTier('plus'); });


      // 2.1 · Ejercicios nuevos (módulos 5, 6 y 7)
      await page.evaluate(() => mk('basic', 'Todos los puertos db01', '192.168.56.60', { set: { discovery: 'all' } }));
      await waitIdle();
      await page.evaluate(() => { const s = S.scans.find(x => x.name === 'Hosts vivos'); auditTrail(s.id); document.getElementById('at-p').value = '187099'; document.getElementById('at-h').value = '192.168.56.70'; auditRun(s.id); });
      ok(await page.isVisible('text=Comprobación local omitida'), 'Audit Trail explica por qué Chrome no aparece sin credenciales');
      await page.evaluate(() => closeModal());
      const malId = await page.evaluate(() => mk('basic', 'Credenciales mal', '192.168.56.30', { ssh: { user: 'auditor', pass: 'equivocada' } }));
      await waitIdle();
      ok(await page.evaluate(id => curRun(S.scans.find(s => s.id === id)).hosts[0].items.some(i => i.pid === 104410), malId), 'una contraseña equivocada produce el plugin 104410');
      await page.evaluate(id => { const s = S.scans.find(x => x.id === id); s.creds.ssh.pass = 'Lab2026!'; save(); launch(id); }, malId);
      await waitIdle();
      await page.evaluate(() => mk('advanced', 'Accuracy avoid web01', '192.168.56.30', { set: { accuracy: 'avoid' } }));
      await page.evaluate(() => mk('basic', 'Web01 con pruebas web', '192.168.56.30', { set: { assessment: 'webknown' } }));
      await page.evaluate(() => { const f = Object.fromEntries(FAMILIES.map(x => [x, true])); f[FAMILIES[0]] = false; mk('advanced', 'Sin una familia', '192.168.56.10', { set: { families: f } }); });
      await waitIdle();
      // Quiz de ordenar por la interfaz: mover con flechas, comprobar en falso y después el orden correcto
      const i30 = await page.evaluate(() => EXERCISES.findIndex(e => e.id === 'e30'));
      await page.evaluate(i => toggleDrawer(true, 'ex', i), i30);
      await page.waitForTimeout(400);
      ok(await page.locator('#quiz .oq-i').count() === 5, 'el quiz de ordenar muestra 5 hallazgos');
      await page.locator('#quiz .oq-i').nth(1).locator('button[aria-label^="Subir"]').click();
      ok(await page.evaluate(() => UI.ord.e30[0] === 0), 'la flecha «Subir» reordena la lista');
      await axe(page, 'quiz de ordenar');
      await page.click('.drawer button:has-text("Comprobar orden")');
      ok(await page.isVisible('text=en su sitio'), 'un orden incorrecto dice cuántos están en su sitio');
      await page.evaluate(() => { UI.ord.e30 = [0, 2, 1, 3, 4]; renderDrawer(); });
      await page.click('.drawer button:has-text("Comprobar orden")');
      ok(await page.evaluate(() => !!S.quiz.e30), 'acepta el empate Zerologon / MS17-010 como correcto');
      // Caso final: solo cuenta lo hecho después de empezar
      const i31 = await page.evaluate(() => EXERCISES.findIndex(e => e.id === 'e31'));
      await page.evaluate(i => toggleDrawer(true, 'ex', i), i31);
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => !EXERCISES.find(e => e.id === 'e31').check()), 'el caso final no se da por hecho con el trabajo anterior');
      await page.click('.drawer button:has-text("Empezar el caso")');
      await page.evaluate(() => toggleDrawer(false));
      await page.evaluate(L => { mk('discovery', 'Caso · lunes', '192.168.56.0/24'); window.caseCred = mk('basic', 'Caso · martes', L, { creds: true }); mk('ad', 'Caso · miércoles', '192.168.56.10', { creds: true }); }, LIVE);
      await waitIdle();
      await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 30); S.rules.push({ id: uid(), host: '192.168.56.50', pid: 41028, exp: d.toISOString().slice(0, 10), sev: '1', comment: 'CHG-3 · aprobado por negocio', created: Date.now() }); save();
        openScan(window.caseCred, 'rem'); });
      await page.waitForTimeout(600);
      await page.evaluate(() => { const s = curScan(); const items = applyFilters(effItems(runView(curRun(s)))); const k = remediations(items).findIndex(r => r.max === 4); labPatch(k); launch(s.id); });
      await waitIdle();
      await page.evaluate(() => { reportModal(window.caseCred); document.getElementById('rp-f').value = 'html'; document.getElementById('rp-t').value = 'exec'; genReport(window.caseCred); });
      await page.waitForTimeout(400);
      const parts = await page.evaluate(() => EXERCISES.find(e => e.id === 'e31').parts().filter(p => !p[1]).map(p => p[0]));
      ok(parts.length === 0, `el caso final marca sus 6 partes${parts.length ? ' (faltan ' + parts.join(', ') + ')' : ''}`);

      // 2.1 · Recorridos guiados: un conductor genérico pulsa o rellena exactamente lo que señala cada paso
      const FILLS = { '[data-path=name]': 'Descubrimiento guiado', '#targets': '192.168.56.0/24', '[data-path="creds.ssh.user"]': 'auditor', '[data-path="creds.ssh.pass"]': 'Lab2026!', '[data-path="creds.win.user"]': 'svc_nessus', '[data-path="creds.win.pass"]': 'Lab2026!', '[data-path="creds.win.domain"]': 'LAB', '#r-p': '179072' };
      const driveTour = async (id) => {
        await page.evaluate(i => tourStart(i), id);
        for (let k = 0; k < 25; k++) {
          await page.waitForTimeout(650);
          const st = await page.evaluate(() => TOUR ? { sel: TOURS[TOUR.id].steps[TOUR.i].sel, until: !!TOURS[TOUR.id].steps[TOUR.i].until } : null);
          if (!st) return true;
          if (!st.until) { await page.click('.tour-bub .tb-f .btn.primary'); continue; }
          const tag = await page.evaluate(sl => { const e = document.querySelector(sl); return e ? (e.classList.contains('menu') ? 'MENU' : e.tagName) : null; }, st.sel);
          if (!tag) { await waitIdle(); continue; }
          if (tag === 'INPUT' || tag === 'TEXTAREA') await page.fill(st.sel, FILLS[st.sel] || 'x');
          else await page.evaluate(sl => { const e = document.querySelector(sl); (e.classList.contains('menu') ? e.querySelector('button') : e).click(); }, st.sel);
        }
        return false;
      };
      await page.evaluate(() => go({ top: 'scans', page: 'tours' }));
      await page.waitForTimeout(500);
      await axe(page, 'Recorridos guiados');
      await page.evaluate(() => tourStart('consola'));
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-15-recorrido.png` });
      await axe(page, 'recorrido abierto');
      await page.keyboard.press('Escape');
      ok(await page.evaluate(() => !TOUR && !document.getElementById('tour')), 'Esc cierra el recorrido');
      for (const id of ['consola', 'primer', 'resultados', 'credenciales', 'regla', 'remediar']) {
        const done = await driveTour(id);
        ok(done && await page.evaluate(i => !!(S.tours || {})[i], id), `recorrido «${id}» de principio a fin`);
        await page.evaluate(() => { closeModal(); UI.menu = null; });
      }
      await waitIdle();
      // «Atrás» en un recorrido vuelve al paso anterior aunque ya esté cumplido, y se queda ahí
      await page.evaluate(() => { closeModal(); tourStart('primer'); });
      await page.waitForTimeout(500);
      await page.click('#tour .tour-bub'); await page.evaluate(() => go({ top: 'scans', page: 'templates', mode: 'scan', ttab: 'scanner' }));
      await page.waitForFunction(() => TOUR && TOUR.i >= 1, null, { timeout: 5000 });
      const iAntes = await page.evaluate(() => TOUR.i);
      await page.click('#tour button:has-text("Atrás")');
      await page.waitForTimeout(1500);
      ok(await page.evaluate(n => TOUR && TOUR.i === n - 1 && !!document.querySelector('#tour .tb-f .btn.primary'), iAntes), '«Atrás» en un recorrido vuelve al paso anterior y no salta solo hacia delante');
      await page.click('#tour .tb-f .btn.primary'); await page.waitForTimeout(400);
      ok(await page.evaluate(n => TOUR && TOUR.i >= n, iAntes), 'tras volver atrás, «Siguiente» continúa el recorrido');
      await page.evaluate(() => tourEnd(false));

      // 2.1 · Manual: 12 capítulos con su imagen
      await page.evaluate(() => { toggleDrawer(false); go({ top: 'scans', page: 'scans', folder: 'my' }); });
      await page.waitForTimeout(400);
      await page.keyboard.press('?');
      await page.waitForTimeout(500);
      ok(await page.evaluate(() => S.view.page === 'manual'), 'la tecla ? abre el manual');
      const ids = await page.evaluate(() => MANUAL.map(c => c.id));
      let imgs = 0;
      for (const id of ids) { await page.evaluate(i => manOpen(i), id); await page.waitForTimeout(350); imgs += await page.evaluate(() => document.querySelectorAll('.mframe img.ok').length); }
      ok(ids.length === 12 && imgs === 12, `12 capítulos con su imagen cargada (${imgs})`);
      await page.evaluate(() => manOpen('priorizar')); await page.waitForSelector('#man-t'); await page.waitForTimeout(400);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SHOTS}/${vp.n}-16-manual.png` });
      await axe(page, 'manual');
      await page.click('.mframe');
      await page.waitForTimeout(400);
      await axe(page, 'imagen del manual ampliada');
      await page.evaluate(() => closeModal());
      const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
      const files = fs.readdirSync(path.join(__dirname, '..', 'manual', 'img')).filter(f => f.endsWith('.webp'));
      ok(files.length === 12 && files.every(f => html.includes(fs.readFileSync(path.join(__dirname, '..', 'manual', 'img', f)).toString('base64'))), 'las imágenes incrustadas son las de manual/img (npm run manual al día)');
      ok(fs.statSync(path.join(__dirname, '..', 'index.html')).size < 1.5 * 1024 * 1024, `index.html pesa menos de 1,5 MB (${(fs.statSync(path.join(__dirname, '..', 'index.html')).size / 1024).toFixed(0)} KB)`);

      // 2.1 · Esqueletos solo mientras se espera de verdad
      await page.evaluate(() => { S.speed = 1; const id = mk('basic', 'Scan lento', '192.168.56.10,192.168.56.20,192.168.56.30'); openScan(id, 'hosts'); });
      await page.waitForTimeout(1500);
      ok(await page.evaluate(() => document.querySelector('main table.t[aria-busy=true]') && document.querySelectorAll('main tr.sk[aria-hidden=true]').length === 2), 'mientras escanea, la tabla está ocupada y muestra 2 filas esqueleto');
      await axe(page, 'scan en marcha con esqueletos');
      await page.evaluate(() => { S.speed = 10; });
      await waitIdle();
      ok(await page.evaluate(() => !document.querySelector('main tr.sk')), 'al terminar desaparecen los esqueletos');

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
      ok(pend.length === 0, `los 32 ejercicios superan su comprobación automática${pend.length ? ' (faltan ' + pend.join(', ') + ')' : ''}`);
      ok(await page.evaluate(() => EXERCISES.length === 32 && MODS.length === 7), '32 ejercicios en 7 módulos');
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
      // Idioma: cambio en vivo a inglés, persistencia, accesibilidad y vuelta a español
      await page.evaluate(() => { S.theme = 'light'; go({ top: 'scans', page: 'scans', folder: 'my' }); });
      await page.click('.langsw button[lang=en]');
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => document.documentElement.lang === 'en' && S.lang === 'en' && document.querySelector('.trainbtn .lbl').textContent === 'Training' && EXERCISES[0].title.startsWith('Before')), 'ES · EN cambia la interfaz y el contenido a inglés al instante');
      await page.screenshot({ path: `${SHOTS}/${vp.n}-20-ingles.png` });
      await axe(page, 'portada en inglés');
      await page.evaluate(() => manOpen('priorizar')); await page.waitForSelector('#man-t'); await page.waitForTimeout(400);
      ok(await page.evaluate(() => document.querySelector('#man-t').textContent.startsWith('Prioritising') && /Screenshot of/.test(document.querySelector('.mimg img').alt)), 'el manual y el texto alternativo de su imagen salen en inglés');
      await axe(page, 'manual en inglés');
      await page.evaluate(() => toggleDrawer(true, 'ex', 3));
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => document.querySelector('.drawer header h2').textContent === 'Training' && [...document.querySelectorAll('.drawer .tab')].map(t => t.textContent).join(',') === 'Exercises,Glossary,Interview,Guide' && /^Exercise 4 · /.test(document.querySelector('.drawer .lvl').textContent)), 'el panel de entrenamiento sale en inglés');
      await axe(page, 'ejercicio en inglés');
      await page.evaluate(() => toggleDrawer(false));
      await page.reload(); await page.waitForTimeout(400);
      ok(await page.evaluate(() => S.lang === 'en' && document.documentElement.lang === 'en'), 'el idioma elegido se guarda');
      ok(await page.evaluate(() => fresh().lang === 'en'), 'restablecer el laboratorio conserva el idioma (no mezcla ES y EN)');
      await page.evaluate(() => setLang('es'));
      await page.waitForTimeout(200);
      ok(await page.evaluate(() => document.documentElement.lang === 'es' && EXERCISES[0].title.startsWith('Antes') && TOURS.consola.steps[0].x.startsWith('Aquí')), 'la vuelta a español restaura todo el contenido original');
      ok(await page.evaluate(() => document.querySelector('.disclaimer .d-long').textContent.startsWith('Herramienta') && document.getElementById('tabbar').getAttribute('aria-label') === 'Navegación principal' && document.getElementById('drawer').getAttribute('aria-label') === 'Entrenamiento'), 'la vuelta a español también restaura el aviso legal y las etiquetas que no se repintan');
      // Los nombres de scan son datos del usuario: no se traducen aunque coincidan con el diccionario
      await page.evaluate(() => { S.scans[0].name = 'Ruta completada'; save(); setLang('en'); go({ top: 'scans', page: 'scans', folder: 'my' }); });
      await page.waitForTimeout(450);
      ok(await page.evaluate(() => [...document.querySelectorAll('td.name [data-notr]')].some(x => x.textContent === 'Ruta completada')), 'en inglés el nombre de un scan no se traduce');
      await page.evaluate(() => { setLang('es'); go({ top: 'settings', page: 'settings', sub: 'lab' }); });
      await page.waitForTimeout(450);
      ok(await page.isVisible('main .seg button[lang=en]'), 'Settings ▸ Simulador también tiene el selector de idioma');
      // Estados vacíos con explicación y acción
      await page.evaluate(() => { openScan(S.scans.find(s => s.name === 'Hosts vivos con credenciales').id, 'vulns'); UI.search = 'zzzz-sin-resultados'; render(); }); await page.waitForTimeout(450);
      ok(await page.isVisible('.empty .empty-i') && await page.isVisible('.empty button:has-text("Quitar filtros")'), 'un filtro sin resultados explica qué pasa y ofrece quitar los filtros');
      await page.click('.empty button:has-text("Quitar filtros")'); await page.waitForTimeout(200);
      ok(await page.evaluate(() => !document.querySelector('main .empty') && UI.search === ''), '«Clear filters» vuelve a mostrar los resultados');
      // Manual: cada paso en un bloque, sin columnas estrechas
      await page.evaluate(() => manOpen('resultados')); await page.waitForTimeout(450);
      const narrow = await page.evaluate(() => [...document.querySelectorAll('.man-steps li>span')].filter(x => x.getBoundingClientRect().width < 200).length);
      ok(narrow === 0, 'los pasos del manual no se parten en una columna estrecha');
      // Sin desbordamiento horizontal en tableta y escritorio
      for (const w of [820, 1100, 1440]) {
        await page.setViewportSize({ width: w, height: 900 });
        for (const f of ["go({top:'scans',page:'scans',folder:'my'})", "S.view.mode='scan';newDraft('basic')", "go({top:'settings',page:'settings',sub:'lab'})", "manOpen('remediar')"]) {
          await page.evaluate(f); await page.waitForTimeout(450);
          const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth + Math.max(0, document.querySelector('main').scrollWidth - document.querySelector('main').clientWidth));
          if (o > 0) ok(false, `desbordamiento a ${w} px en ${f}: ${o}`);
        }
      }
      ok(true, 'sin desbordamiento horizontal a 820, 1100 y 1440 px');
      await page.setViewportSize({ width: vp.w, height: vp.h });
      // Barra lateral plegada: etiqueta emergente con el nombre
      await page.setViewportSize({ width: 900, height: 800 });
      await page.evaluate(() => go({ top: 'scans', page: 'scans', folder: 'my' })); await page.waitForTimeout(450);
      await page.hover('#side button[data-tour="side-policies"]');
      ok(await page.evaluate(() => { const t = document.getElementById('sidetip'); return !t.hidden && t.textContent.startsWith('Políticas'); }), 'la barra lateral plegada muestra el nombre al pasar el ratón');
      await page.setViewportSize({ width: vp.w, height: vp.h });
      // 2.3 · En español, también la parte de Nessus: botones, pestañas, plugins y salida
      await page.evaluate(() => { openScan(S.scans.find(s => s.name === 'Hosts vivos con credenciales').id, 'vulns'); });
      await page.waitForTimeout(450);
      ok(await page.evaluate(() => [...document.querySelectorAll('.ph .btn')].map(b => b.textContent.trim()).join('|').includes('Configurar') && [...document.querySelectorAll('.tabs .tab')].some(t => t.textContent.startsWith('Equipos')) && !!document.querySelector('.sevb, .sev') && document.body.innerText.includes('Crítica')), 'en español los botones, pestañas y severidades de Nessus salen en español');
      await page.evaluate(() => { S.view.plugin = 97833; render(); });
      await page.waitForTimeout(450);
      ok(await page.evaluate(() => /Sinopsis/.test(document.body.innerText) && /Solución/.test(document.body.innerText) && /actualización de seguridad/.test(document.body.innerText)), 'el detalle del plugin sale en español (nombre, sinopsis, solución)');
      await page.evaluate(() => { setLang('en'); });
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => /Synopsis/.test(document.body.innerText) && /Security Update/.test(document.body.innerText)), 'en inglés el plugin vuelve a su texto original');
      await page.evaluate(() => { setLang('es'); });
      // 2.3 · Perfil editable en Configuración ▸ Mi cuenta
      await page.evaluate(() => go({ top: 'settings', page: 'settings', sub: 'account' }));
      await page.waitForTimeout(450);
      await page.fill('#pf-user', 'x');
      await page.click('main button:has-text("Guardar cambios")');
      ok(await page.isVisible('#pf-msg >> text=El usuario admite'), 'el perfil avisa si el usuario no es válido');
      await page.fill('#pf-name', 'Ana López Pérez'); await page.fill('#pf-user', 'ana.lopez'); await page.fill('#pf-email', 'ana@empresa.example');
      await page.click('main button:has-text("Guardar cambios")');
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => S.profile.user === 'ana.lopez' && document.querySelector('#top .user .avatar').textContent === 'AL' && document.querySelector('#top .user').textContent.includes('ana.lopez')), 'guardar el perfil actualiza el avatar y el usuario de la barra superior');
      await axe(page, 'Mi cuenta');
      await page.evaluate(() => { S.profile = { ...PROFILE0 }; save(); render(); });
      // 2.3 · Ajustes: control segmentado con la pastilla en la opción elegida e interruptor del modo oscuro
      await page.click('[data-tour=top-m-ajustes]');
      ok(await page.evaluate(() => { const g = document.querySelector('#m-ajustes .seg[aria-label="Velocidad de simulación"]'); const b = g.querySelector('button[aria-pressed=true]'); return getComputedStyle(b).justifyContent === 'center' && g.style.getPropertyValue('--i') === String([...g.children].indexOf(b)); }), 'el segmentado centra el texto y la pastilla está bajo la opción elegida');
      await page.click('#m-ajustes .sw');
      ok(await page.evaluate(() => S.theme === 'dark' && document.querySelector('#m-ajustes .sw').getAttribute('aria-checked') === 'true' && document.querySelector('#m-ajustes .sw').getBoundingClientRect().width < 60), 'el interruptor del modo oscuro cambia el tema y conserva su tamaño');
      await page.keyboard.press('Escape');
      await page.evaluate(() => { S.theme = 'light'; save(); render(); });
      // 2.3 · Recorridos: los botones de las tarjetas alineados
      await page.evaluate(() => go({ top: 'scans', page: 'tours' })); await page.waitForTimeout(450);
      ok(await page.evaluate(() => { const ys = [...document.querySelectorAll('.tcard2 .btn')].map(b => Math.round(b.getBoundingClientRect().bottom)); const fila = ys.slice(0, 4); return new Set(fila).size === 1; }), 'en Recorridos guiados los botones de cada fila están alineados');
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
      // Barra de pestañas inferior y hoja «Más»
      await page.evaluate(() => { toggleDrawer(false); go({ top: 'scans', page: 'scans', folder: 'my' }); });
      await page.waitForTimeout(200);
      ok(await page.isVisible('#tabbar') && await page.evaluate(() => document.querySelectorAll('#tabbar button').length === 5 && document.querySelector('#tabbar [aria-current=page]').dataset.tab === 'scans'), 'la barra de pestañas tiene 5 destinos y marca Scans');
      await page.click('#tabbar [data-tab=learn]'); await page.waitForTimeout(200);
      ok(await page.evaluate(() => S.view.page === 'manual' && document.querySelector('#tabbar [aria-current=page]').dataset.tab === 'learn'), 'la pestaña Aprender abre el manual');
      await page.click('#tabbar [data-tab=train]'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => drawerOpen), 'la pestaña Práctica abre el entrenamiento');
      await page.evaluate(() => toggleDrawer(false));
      await page.click('#tabbar [data-tab=more]'); await page.waitForTimeout(400);
      ok(await page.isVisible('.modal.sheet >> text=Políticas') && !(await page.isVisible('.modal.sheet footer')), 'la hoja «Más» se abre sin pie de ventana');
      await page.screenshot({ path: `${SHOTS}/${vp.n}-07-mas.png` });
      await axe(page, 'hoja «Más»');
      await page.click('.modal.sheet .seg button[lang=en]'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => S.lang === 'en' && document.querySelector('#tabbar [data-tab=train] span').textContent === 'Practice'), 'el idioma se cambia desde «Más» en móvil');
      await page.evaluate(() => { closeModal(); setLang('es'); });
      ok(await page.evaluate(() => document.querySelector('.disclaimer .d-short').getBoundingClientRect().height < 24), 'el aviso legal ocupa una línea en móvil');
    }
    if (vp.n === 'desk') {
      // 2.3.1 · Progreso: lo empezado se ve, se guarda y se continúa donde lo dejaste (navegador nuevo, sin datos)
      const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-ES', acceptDownloads: true });
      const q = await c2.newPage(); q.on('pageerror', e => errors.push(String(e)));
      await q.goto(FILE); await q.waitForTimeout(900);
      await q.click('.modal.ob-modal button:has-text("Ahora no")'); await q.waitForTimeout(300);
      ok(await q.evaluate(() => S.profile.name === '' && S.profile.asked && /invitado/.test(document.querySelector('#top .user').textContent) && !!document.querySelector('#top .user .avatar svg')), '«Ahora no» deja un perfil de invitado, con icono genérico, y no vuelve a preguntar');
      await q.evaluate(() => cardModal('all')); await q.waitForTimeout(300);
      ok(await q.isVisible('.modal.ob-modal >> text=Tu tarjeta lleva tu nombre'), 'sin nombre, la tarjeta de logros pide primero tu nombre');
      await q.fill('#ob-name', 'Marta Ruiz'); await q.click('.modal button:has-text("Guardar y empezar")'); await q.waitForTimeout(300);
      await q.click('.hero >> text=Empezar el ejercicio 1'); await q.waitForTimeout(400);
      ok(await q.evaluate(() => document.querySelectorAll('.drawer .req li').length === 2 && !document.querySelector('.drawer .req li.ok')), 'el ejercicio 1 muestra la lista de lo que falta de la práctica');
      await q.evaluate(() => { toggleDrawer(false); welcome(); }); await q.waitForTimeout(300); await q.keyboard.press('Escape'); await q.waitForTimeout(200);
      await q.evaluate(() => { toggleDrawer(true, 'ex', 0); }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => !!S.events.welcome && document.querySelectorAll('.drawer .req li.ok').length === 1), 'la bienvenida cuenta como leída aunque se cierre con Esc, y la lista lo marca');
      await q.evaluate(() => { toggleDrawer(true, 'glossary'); }); await q.waitForTimeout(200);
      await q.waitForTimeout(300);
      ok(await q.evaluate(() => !!S.prog.e0), 'tras abrir la bienvenida y el glosario, la práctica del ejercicio 1 queda superada sola');
      await q.evaluate(() => { delete S.prog.e0; save(); drawerTab = 'ex'; drawerEx = 0; renderDrawer(); }); await q.waitForTimeout(200);
      await q.click('.drawer button:has-text("Comprobar ahora")'); await q.waitForTimeout(200);
      ok(await q.evaluate(() => !!S.prog.e0 && !!document.querySelector('.drawer .st.ok')), '«Comprobar ahora» vuelve a comprobar y marca la práctica');
      // 2.3.3 · Ejercicio 8: ordenar por VPR con grupos no cuenta, pero avisa; al desagrupar después, sí
      await q.evaluate(() => { toggleDrawer(false); openScan(S.scans.find(s => s.runs.some(r => r.status === 'completed')).id, 'vulns'); UI.groups = true; render(); }); await q.waitForTimeout(300);
      await q.evaluate(() => sortBy('vpr')); await q.waitForTimeout(300);
      ok(await q.evaluate(() => !!S.events.sortVPRgrouped && !S.events.sortVPR) && await q.isVisible('text=Para el ejercicio, pulsa «Desagrupar»'), 'ordenar por VPR con grupos avisa de que hay que desagrupar y no cuenta');
      await q.click('main button:has-text("Desagrupar")'); await q.waitForTimeout(300);
      ok(await q.evaluate(() => !!S.events.groupsOff && !!S.events.sortVPR && !!S.prog.e7), 'al desagrupar con la tabla ya ordenada por VPR, la práctica del ejercicio 8 queda superada');
      const filas = () => q.evaluate(() => { UI.groups = true; render(); return +((document.querySelector('main').textContent.match(/(\d+) (filas|rows)/) || [])[1]); });
      const nEs = await filas(); await q.evaluate(() => setLang('en')); await q.waitForTimeout(300); const nEn = await filas(); await q.evaluate(() => setLang('es')); await q.waitForTimeout(300);
      ok(nEs > 0 && nEs === nEn && await q.evaluate(() => document.querySelector('main').textContent.includes('SSL (varios problemas)')), `con grupos, la tabla tiene las mismas filas en español y en inglés (${nEs} / ${nEn}) y forma el grupo SSL`);
      await q.evaluate(() => { toggleDrawer(true, 'ex', EXERCISES.findIndex(e => e.id === 'e8')); }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => document.querySelectorAll('.drawer .req li').length === 2 && document.querySelector('.drawer .req').textContent.includes('Ese mismo escaneo')), 'el ejercicio de escaneo con credenciales lista sus dos condiciones (SSH y Windows)');
      // 2.3.3 · Filtro en español, como lo hace una persona: eligiendo por el texto visible («Crítica», «Exploit disponible», «sí»)
      await q.evaluate(() => { toggleDrawer(false); delete S.events.filterCritExploit; openScan(S.scans[0].id, 'vulns'); }); await q.waitForTimeout(300);
      await q.click('main button:has-text("Filtro")'); await q.waitForTimeout(200);
      await q.locator('.filters select').nth(3).selectOption({ label: 'Crítica' });
      await q.click('.filters button:has-text("Añadir filtro")'); await q.waitForTimeout(200);
      await q.locator('.filters select').nth(4).selectOption({ label: 'Exploit disponible' }); await q.waitForTimeout(200);
      await q.locator('.filters select').nth(6).selectOption({ label: 'sí' });
      await q.click('.filters button:has-text("Aplicar")'); await q.waitForTimeout(300);
      ok(await q.evaluate(() => !!S.events.filterCritExploit && UI.filters.some(f => f.field === 'exploit' && f.value === 'true')), 'en español, el filtro «Exploit disponible · es igual a · sí» cuenta para el ejercicio 7 (el valor sigue siendo «true» aunque se traduzca el texto)');
      ok(await q.evaluate(() => { const s = curScan(); const it = applyFilters(effItems(runView(curRun(s)))); return it.length > 0 && it.every(x => x.p.exploit && x.sev === 4); }), 'y la tabla muestra críticos con exploit, no una lista vacía');
      ok(await q.evaluate(() => { const m = document.querySelector('main').textContent; return !m.includes('Clear Filters') && m.includes('Quitar filtros'); }), 'con un filtro activo, el botón «Quitar filtros» también está en español');
      await q.evaluate(() => { UI.filters = [{ field: 'family', op: 'eq', value: '' }]; UI.filterOpen = true; render(); }); await q.waitForTimeout(200);
      await q.locator('.filters select').nth(3).selectOption({ label: 'Servidores web' });
      await q.click('.filters button:has-text("Aplicar")'); await q.waitForTimeout(300);
      ok(await q.evaluate(() => { const s = curScan(); return UI.filters[0].value === 'Web Servers' && applyFilters(effItems(runView(curRun(s)))).length > 0; }), 'en español, filtrar por la familia «Servidores web» encuentra resultados');
      await q.evaluate(() => { UI.filters = []; UI.filterOpen = false; delete S.events.filterCritExploit; delete S.events.filterUsed; delete S.prog.e5; save(); render(); });
      // 2.3.3 · «Desagrupar» va junto a Filtro y el panel abierto no lo tapa
      await q.evaluate(() => { openScan(S.scans[0].id, 'vulns'); toggleDrawer(true, 'ex', EXERCISES.findIndex(e => e.id === 'e7')); }); await q.waitForTimeout(500);
      ok(await q.evaluate(() => { const g = document.getElementById('groups-btn'), f = [...g.parentElement.querySelectorAll('button')].find(b => /Filtro/.test(b.textContent)); return !!f && g.getBoundingClientRect().right < document.getElementById('drawer').getBoundingClientRect().left; }), '«Desagrupar» está junto a «Filtro» y el panel de Entrenamiento abierto no lo tapa');
      ok(await q.evaluate(() => { const m = document.getElementById('main'); return m.scrollWidth <= m.clientWidth + 1; }), 'con el panel abierto, la pantalla del escaneo no se desborda');
      // 2.3.3 · «Dónde se hace»: un escaneo de un solo equipo no sirve para el ejercicio 8 y lo dice
      await q.evaluate(() => { const s = JSON.parse(JSON.stringify(S.scans[0])); s.id = 901; s.name = '192.168.56.20'; s.runs[0].hosts = s.runs[0].hosts.slice(0, 1); S.scans.push(s); save(); openScan(901, 'vulns'); }); await q.waitForTimeout(400);
      ok(await q.evaluate(() => { const w = document.getElementById('ex-where').textContent; return /Dónde se hace/.test(w) && /«192\.168\.56\.20» no sirve/.test(w) && /Hazlo en el ejercicio 4/.test(w); }), 'el ejercicio 8 dice dónde se hace y avisa de que un escaneo de un solo equipo no sirve');
      await axe(q, 'ejercicio con «Dónde se hace»');
      await q.evaluate(() => { const s = JSON.parse(JSON.stringify(S.scans[0])); s.id = 902; s.name = 'Vivos'; const h0 = s.runs[0].hosts[0]; s.runs[0].hosts = ['1', '10', '20', '30', '40', '50'].map(x => ({ ...h0, ip: '192.168.56.' + x })); S.scans.push(s); save(); renderDrawer(); }); await q.waitForTimeout(300);
      await q.click('#ex-where button:has-text("Llévame allí")'); await q.waitForTimeout(500);
      ok(await q.evaluate(() => S.view.scan === 902 && S.view.tab === 'vulns' && /Estás en el sitio correcto/.test(document.getElementById('ex-where').textContent)), '«Llévame allí» abre el escaneo que sirve y el recuadro confirma que estás en el sitio correcto');
      await q.evaluate(() => { drawerEx = EXERCISES.findIndex(e => e.id === 'e3'); renderDrawer(); }); await q.waitForTimeout(200);
      await q.click('#ex-where button:has-text("Crear el escaneo")'); await q.waitForTimeout(500);
      ok(await q.evaluate(() => S.view.page === 'editor' && UI.draft.template === 'basic' && UI.draft.settings.targets.split(', ').length === 9 && /Estás en el sitio correcto/.test(document.getElementById('ex-where').textContent)), '«Crear el escaneo» abre el editor con la plantilla y los 9 equipos vivos ya puestos');
      // 2.4.0 · Copiar un escaneo (como «More ▸ Copy to» de Nessus): misma configuración, sin resultados, y se abre para cambiarla
      await q.evaluate(() => { window._prog = JSON.stringify(S.prog); S.scans.find(s => s.id === 902).settings.targets = '192.168.56.1, 192.168.56.10'; save(); UI.draft = null; drawerEx = EXERCISES.findIndex(e => e.id === 'e8'); renderDrawer(); }); await q.waitForTimeout(300);
      ok(await q.isVisible('#ex-where button:has-text("Copiar «Vivos»")'), 'el ejercicio de credenciales ofrece copiar tu escaneo de los equipos vivos');
      await q.click('#ex-where button:has-text("Copiar «Vivos»")'); await q.waitForTimeout(500);
      ok(await q.evaluate(() => { const c = S.scans[S.scans.length - 1]; return S.view.page === 'editor' && UI.draft.id === c.id && c.name === 'Copia de Vivos' && c.runs.length === 0 && c.settings.targets === '192.168.56.1, 192.168.56.10' && c.template === 'basic'; }), 'la copia se llama «Copia de Vivos», hereda plantilla y objetivos, no trae resultados y se abre en el editor');
      await q.evaluate(() => { UI.draft = null; openScan(902, 'vulns'); }); await q.waitForTimeout(300);
      await q.click('main .actions button:has-text("Copiar")'); await q.waitForTimeout(400);
      ok(await q.evaluate(() => S.scans.some(s => s.name === 'Copia de Vivos (2)')), 'una segunda copia no repite el nombre: «Copia de Vivos (2)»');
      await axe(q, 'editor de una copia');
      await q.evaluate(() => { UI.draft = null; go({ top: 'scans', page: 'scans', folder: 'my' }); }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => document.querySelectorAll('main button[aria-label="Copiar"]').length === S.scans.filter(s => s.folder === 'my').length), 'cada fila de Mis escaneos tiene su botón «Copiar»');
      await q.evaluate(() => { S.scans = S.scans.filter(s => !/^Copia de Vivos/.test(s.name)); delete S.events.scanCopy; S.prog = JSON.parse(window._prog); save(); });
      // 2.5.0 · Foto de perfil, insignias por módulo y tarjeta de logros descargable (PNG generado en el navegador)
      await q.evaluate(() => { window._st = JSON.stringify({ prog: S.prog, quiz: S.quiz, modDone: S.modDone, profile: S.profile }); go({ top: 'settings', page: 'settings', sub: 'account' }); }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => document.querySelectorAll('.bdg').length === 7 && !document.querySelector('.bdg.on')), 'Mi cuenta muestra las 7 insignias, bloqueadas al empezar');
      await q.setInputFiles('main input[type=file]', { name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => !S.profile.photo) && await q.isVisible('text=Elige una imagen PNG, JPG, WebP o GIF'), 'un archivo que no es imagen se rechaza con un aviso');
      const fotoB64 = await q.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#2a9d8f'; x.fillRect(0, 0, 600, 400); x.fillStyle = '#264653'; x.beginPath(); x.arc(300, 200, 120, 0, 7); x.fill(); return c.toDataURL('image/png').split(',')[1]; });
      await q.setInputFiles('main input[type=file]', { name: 'yo.png', mimeType: 'image/png', buffer: Buffer.from(fotoB64, 'base64') }); await q.waitForTimeout(800);
      ok(await q.evaluate(() => /^data:image\/jpeg;base64,/.test(S.profile.photo) && S.profile.photo.length < 60000 && !!document.querySelector('#top img.avatar') && !!document.querySelector('main img.avatar.lg')), 'la foto se recorta, se guarda como JPEG ligero y sale en la barra superior y en Mi cuenta');
      ok(await q.evaluate(() => { S.profile.photo = 'javascript:alert(1)'; render(); const bad = !document.querySelector('#top img.avatar') && !!document.querySelector('#top span.avatar'); return bad; }), 'una «foto» que no es una imagen en base64 (por ejemplo, de una copia manipulada) no se usa');
      await q.setInputFiles('main input[type=file]', { name: 'yo.png', mimeType: 'image/png', buffer: Buffer.from(fotoB64, 'base64') }); await q.waitForTimeout(800);
      await q.click('main button:has-text("Guardar cambios")'); await q.waitForTimeout(300);
      ok(await q.evaluate(() => /^data:image\/jpeg/.test(S.profile.photo) && document.querySelector('main img.avatar.lg').getBoundingClientRect().width >= 80), '«Guardar cambios» conserva la foto, y el avatar de Mi cuenta se ve grande (88 px)');
      await q.evaluate(() => { const n = Date.now(); MODS.slice(0, 2).forEach(m => m[1].forEach(id => { S.prog[id] = n; S.quiz[id] = n; })); save(); checkExercises(); render(); }); await q.waitForTimeout(400);
      ok(await q.evaluate(() => document.querySelectorAll('.bdg.on').length === 2 && document.querySelectorAll('.bdg.on button').length === 2 && /Explorador de red/.test(document.querySelector('.bdg.on').textContent)), 'al terminar los módulos 1 y 2 se consiguen sus insignias, con botón de descarga');
      await axe(q, 'Mi cuenta con foto e insignias');
      const pngInfo = f => { const b = fs.readFileSync(f); return { png: b.slice(1, 4).toString() === 'PNG', w: b.readUInt32BE(16), h: b.readUInt32BE(20), kb: Math.round(b.length / 1024) }; };
      await q.click('button:has-text("Ver y descargar mi tarjeta de logros")'); await q.waitForSelector('.modal img.card-prev'); await q.waitForTimeout(400);
      ok(await q.evaluate(() => { const i = document.querySelector('.modal img.card-prev'); return i.complete && i.naturalWidth === 1200 && i.naturalHeight === 1200; }), 'la vista previa de la tarjeta de logros es una imagen de 1200 × 1200');
      await axe(q, 'vista previa de la tarjeta');
      const [dlCard] = await Promise.all([q.waitForEvent('download'), q.click('.modal a:has-text("Descargar PNG")')]);
      const pc = pngInfo(await dlCard.path());
      ok(/^whitefox-logros-marta\.png$/.test(dlCard.suggestedFilename()) && pc.png && pc.w === 1200 && pc.h === 1200, `la tarjeta se descarga como PNG de 1200 × 1200 (${dlCard.suggestedFilename()}, ${pc.kb} KB)`);
      await q.evaluate(() => closeModal());
      await q.click('.bdg.on button >> nth=0'); await q.waitForSelector('.modal img.card-prev'); await q.waitForTimeout(400);
      const [dlB] = await Promise.all([q.waitForEvent('download'), q.click('.modal a:has-text("Descargar PNG")')]);
      const pb = pngInfo(await dlB.path());
      ok(/^whitefox-insignia-1-marta\.png$/.test(dlB.suggestedFilename()) && pb.png && pb.w === 1080 && pb.h === 1080, `cada insignia se descarga como PNG de 1080 × 1080 (${dlB.suggestedFilename()}, ${pb.kb} KB)`);
      ok(await q.evaluate(() => { const h = [...document.querySelectorAll('.modal .share a')].map(a => a.href); return ['https://wa.me/?text=', 'https://www.linkedin.com/feed/?shareActive=true&text=', 'https://x.com/intent/post?text=', 'https://t.me/share/url?url=', 'mailto:'].every(p => h.some(x => x.startsWith(p))) && h.every(x => /Explorador%20de%20red/.test(x)) && [...document.querySelectorAll('.modal .share a[target]')].every(a => a.rel.includes('noopener')); }), 'compartir en WhatsApp, LinkedIn, X, Telegram y correo, con el texto de la insignia y rel="noopener"');
      await q.click('.modal button:has-text("Copiar texto")'); await q.waitForTimeout(300);
      ok(await q.isVisible('text=Texto copiado') || await q.isVisible('#share-txt'), '«Copiar texto» copia el texto o, si el navegador no deja, lo muestra para copiarlo');
      ok(await q.evaluate(() => !/\bscan\b|Policies/.test(MODS[2][2].sum.map(cvTx).join(' '))), 'el texto de las tarjetas también pasa por el traductor: «escaneo» y «Políticas», no «scan» ni «Policies»');
      await q.evaluate(() => { closeModal(); toggleDrawer(true, 'ex'); drawerEx = null; renderDrawer(); }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => { const s = document.querySelector('.mod-sum'); return !!s && !!s.querySelector('summary svg') && /Explorador de red/.test(s.textContent) && !!s.querySelector('button'); }), 'el panel de Entrenamiento muestra la insignia del módulo terminado y permite descargarla');
      await q.evaluate(() => { setLang('en'); go({ top: 'settings', page: 'settings', sub: 'account' }); }); await q.waitForTimeout(400);
      ok(await q.evaluate(() => /My badges/.test(document.querySelector('main').textContent) && /Network Explorer/.test(document.querySelector('main').textContent)), 'las insignias también están en inglés');
      await q.evaluate(() => { setLang('es'); toggleDrawer(false); const s = JSON.parse(window._st); Object.assign(S, { prog: s.prog, quiz: s.quiz, modDone: s.modDone, profile: s.profile }); save(); go({ top: 'scans', page: 'scans', folder: 'my' }); }); await q.waitForTimeout(300);
      // 2.6.0 · Acerca de WhiteFox: autor, versión, independencia, licencia y ecosistema
      await q.evaluate(() => { window._ab = JSON.stringify({ prog: S.prog, events: S.events }); });
      const pkgVer = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;
      ok(await q.evaluate(v => APP_VERSION === v, pkgVer), `la versión de la aplicación coincide con pruebas/package.json (${pkgVer})`);
      await q.click('#top button[aria-label="Ayuda"]'); await q.waitForTimeout(200);
      await q.click('#top button:has-text("Acerca de WhiteFox")'); await q.waitForTimeout(400);
      ok(await q.evaluate(() => { const m = document.querySelector('.modal.about-modal'); if (!m) return false; const x = m.textContent; return /Yoandy Ramírez Delgado/.test(x) && /Junior Pentester · eJPTv2/.test(x) && /v2\.\d+\.\d+/.test(x) && /no está afiliada/.test(x) && /Todos los derechos reservados/.test(x) && /¿Sigues con dudas\?/.test(x); }), 'la ayuda (?) abre «Acerca de WhiteFox» con el autor, la versión, el aviso de independencia, la licencia y la ayuda');
      ok(await q.evaluate(() => { const h = [...document.querySelectorAll('.about a')].map(a => a.href); const need = ['https://github.com/heindall92', 'https://www.linkedin.com/in/yoandyrd92/', 'https://yoandyramirez.com', 'mailto:yoandyramirezdelgado@gmail.com', 'https://heindall92.github.io/WhiteFox/', 'https://github.com/heindall92/WhiteFox/issues/new']; return need.every(n => h.some(x => x.startsWith(n))) && document.querySelectorAll('.ab-eco li').length === 7 && [...document.querySelectorAll('.about a[target]')].every(a => a.rel.includes('noopener')); }), 'tiene los enlaces del autor, la web y el código, las 7 herramientas del ecosistema y rel="noopener"');
      await axe(q, 'Acerca de WhiteFox');
      await q.evaluate(() => { closeModal(); go({ top: 'settings', page: 'settings', sub: 'about' }); }); await q.waitForTimeout(300);
      await q.click('#side button:has-text("Acerca de WhiteFox")'); await q.waitForTimeout(300);
      ok(await q.evaluate(() => !!document.querySelector('.modal.about-modal')), 'también se abre desde Configuración ▸ Laboratorio');
      await q.evaluate(() => { closeModal(); setLang('en'); aboutWF(); }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => /About WhiteFox/.test(document.querySelector('.modal').textContent) && /Independence notice/.test(document.querySelector('.modal').textContent)), 'y está en inglés');
      await q.evaluate(() => { closeModal(); setLang('es'); const s = JSON.parse(window._ab); S.prog = s.prog; S.events = s.events; save(); go({ top: 'scans', page: 'scans', folder: 'my' }); }); await q.waitForTimeout(300);
      await q.evaluate(() => { S.scans = S.scans.filter(s => s.id !== 901 && s.id !== 902); UI.draft = null; save(); });
      await q.evaluate(() => { for (const k of ['sortVPR', 'sortVPRgrouped', 'groupsOff']) delete S.events[k]; delete S.prog.e7; UI.groups = true; save(); go({ top: 'scans', page: 'scans', folder: 'my' }); toggleDrawer(true, 'ex', 0); }); await q.waitForTimeout(500);
      await q.evaluate(() => { delete S.prog.e0; delete S.events.welcome; delete S.events.glossary; save(); drawerEx = 0; renderDrawer(); });
      await q.locator('#quiz label').nth(1).click(); await q.click('text=Comprobar respuesta'); await q.waitForTimeout(300);
      await q.evaluate(() => { drawerEx = 2; renderDrawer(); toggleDrawer(false); });
      await q.reload(); await q.waitForTimeout(700);
      ok(await q.isVisible('.hero >> text=Continuar con el ejercicio 1'), 'tras recargar, la portada ofrece continuar el ejercicio que dejaste a medias');
      await q.evaluate(() => { toggleDrawer(true, 'ex'); drawerEx = null; renderDrawer(); }); await q.waitForTimeout(300);
      ok(await q.evaluate(() => document.querySelector('.ex[data-ex=e0]').classList.contains('half') && /Quiz hecho · falta la práctica/.test(document.querySelector('.ex[data-ex=e0]').textContent) && /0 completados · 1 en curso/.test(document.querySelector('.ov-sum').textContent)), 'un ejercicio con el quiz hecho se marca «en curso» y se guarda');
      ok(await q.isVisible('.ex-cont >> text=Continuar: ejercicio 1'), 'el panel tiene «Continuar» con el ejercicio en el que ibas');
      await q.evaluate(() => { const n = Date.now(); ['e0', 'e1'].forEach(id => { S.prog[id] = n; S.quiz[id] = n; }); S.lastEx = 'e1'; save(); toggleDrawer(false); go({ top: 'scans', page: 'scans', folder: 'my' }); });
      await q.waitForTimeout(450);
      ok(await q.isVisible('.hero >> text=Continuar con el ejercicio 3') && await q.isVisible('.hero >> text=siguiente: ejercicio 3'), 'con los ejercicios 1 y 2 completados, la portada sigue en el 3');
      await q.evaluate(() => { const n = Date.now(); ['e2', 'e3', 'e4'].forEach(id => { S.prog[id] = n; S.quiz[id] = n; }); S.quiz.e0 = 0; S.lastEx = 'e4'; save(); render(); });
      await q.waitForTimeout(300);
      ok(await q.isVisible('.hero >> text=Continuar con el ejercicio 6'), 'el botón avanza con los ejercicios aunque quede uno anterior a medias');
      // Caso real: 1 a medias, 2 y 3 completos, prácticas de ejercicios posteriores marcadas solas por el simulador
      await q.evaluate(() => { const n = Date.now(); S.prog = {}; S.quiz = { e0: n }; ['e1', 'e2'].forEach(id => { S.prog[id] = n; S.quiz[id] = n; }); ['e17', 'e20', 'e13', 'e14'].forEach(id => S.prog[id] = n); S.lastEx = 'e0'; coachHidden = false; save(); render(); });
      await q.waitForTimeout(400);
      ok(await q.isVisible('.hero >> text=Continuar con el ejercicio 4') && await q.isVisible('.hero >> text=siguiente: ejercicio 4') && /ejercicio 4 de 32/.test(await q.evaluate(() => (document.getElementById('coach') || {}).textContent || '')), 'portada, línea de progreso y «Siguiente paso» coinciden: ejercicio 4');
      await q.click('.hero >> text=Continuar con el ejercicio 4'); await q.waitForTimeout(300);
      await q.evaluate(() => { toggleDrawer(false); go({ top: 'scans', page: 'scans', folder: 'my' }); }); await q.waitForTimeout(400);
      ok(await q.isVisible('.hero >> text=Continuar con el ejercicio 4'), 'pulsar «Continuar» no hace volver atrás el botón');
      await axe(q, 'panel con progreso a medias');
      // Copia de seguridad: descargar y restaurar
      await q.evaluate(() => { toggleDrawer(false); go({ top: 'settings', page: 'settings', sub: 'lab' }); }); await q.waitForTimeout(450);
      const [dl] = await Promise.all([q.waitForEvent('download'), q.click('main button:has-text("Descargar progreso")')]);
      const bk = path.join(SHOTS, 'copia.json'); await dl.saveAs(bk);
      await q.evaluate(() => { S.quiz = {}; S.prog = {}; save(); render(); });
      await q.setInputFiles('main input[type=file]', bk); await q.waitForTimeout(500);
      ok(await q.evaluate(() => !!S.quiz.e0 && !!S.quiz.e1), 'restaurar la copia recupera el progreso');
      fs.writeFileSync(path.join(SHOTS, 'mala.json'), '{"x":1}');
      await q.setInputFiles('main input[type=file]', path.join(SHOTS, 'mala.json')); await q.waitForTimeout(300);
      ok(await q.isVisible('text=no es una copia de WhiteFox') && !!(await q.evaluate(() => S.quiz.e0)), 'un archivo que no es una copia se rechaza sin tocar el progreso');
      // Si el navegador no deja guardar, se avisa
      await q.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('lleno', 'QuotaExceededError'); }; save(); });
      await q.waitForTimeout(300);
      ok(await q.isVisible('text=no deja guardar el progreso'), 'si el navegador no deja guardar, avisa en vez de fallar en silencio');
      await c2.close();
    }
    ok(errors.length === 0, `sin errores de consola${errors.length ? ': ' + errors.join(' | ') : ''}`);
    ok(external.length === 0, `sin peticiones externas${external.length ? ': ' + external.join(', ') : ''}`);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${passes} correctas, ${fails} fallos`);
  process.exit(fails ? 1 : 0);
})();
