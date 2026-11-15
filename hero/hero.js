/* ===== Portada (hero) ===== */
const HERO_IMG='__HERO_IMG__';
let heroPlayed=false;
function vHero(){
 const n=EXERCISES.length,done=EXERCISES.filter(exDone).length,i=EXERCISES.findIndex(e=>!exDone(e));
 const nx=i<0?null:EXERCISES[i],quedan=n-done;
 const estado=!done?'':quedan?`Te quedan ${quedan} ejercicios.`:'¡Ruta completada!';
 const cta=!done&&!S.prog[EXERCISES[0].id]?`<button class="btn primary lg" onclick="toggleDrawer(true,'ex',0)">${ic('play','sm')}Empezar el ejercicio 1</button>`
  :nx?`<button class="btn primary lg" onclick="toggleDrawer(true,'ex',${i})">${ic('play','sm')}Continuar con el ejercicio ${i+1}</button>`
  :`<button class="btn primary lg" onclick="toggleDrawer(true,'ex')">${ic('badge','sm')}Repasar los ejercicios</button>`;
 const words=(t,from)=>t.split(' ').map((w,k)=>heroPlayed?esc(w):`<span class="w"><span style="--i:${from+k}">${esc(w)}</span></span>`).join(' ');
 const l1='WhiteFox',l2='Aprende a escanear, priorizar y decidir';heroPlayed=true;
 const runs=S.scans.flatMap(s=>s.runs.filter(r=>r.status==='completed'));
 const last=runs.sort((a,b)=>(b.end||0)-(a.end||0))[0];
 const crit=last?effItems(last).filter(x=>x.sev===4).length:0;
 const used=licensedUsed(),L=lic(),pct=Math.round(done/n*100);
 const stat=(icon,t,v,c,extra='')=>`<div class="hstat"><span class="si" aria-hidden="true">${ic(icon)}</span><div style="min-width:0;flex:1"><p class="st-t">${t}</p><p class="st-v">${v}</p><p class="st-c">${c}</p>${extra}</div></div>`;
 return`<section class="hero" aria-labelledby="hero-t">
  <div class="hero-art" role="img" aria-label="Persona en la cima de una montaña sobre un mar de nubes al amanecer" style="background-image:url('${HERO_IMG}')"></div>
  <div class="hero-txt">
   <p class="eyebrow">${ic('radar','sm')}Laboratorio de gestión de vulnerabilidades · 192.168.56.0/24</p>
   <h1 id="hero-t" aria-label="${l1}. ${l2}"><span aria-hidden="true"><span class="l1">${words(l1,0)}</span><span class="l2">${words(l2,l1.split(' ').length)}</span></span></h1>
   <p class="lead">${estado?`<b>${estado}</b> `:''}Descubre la red, escanea con y sin credenciales, prioriza por VPR, gestiona falsos positivos y presenta un informe a dirección. Todo simulado, sin conexión y sin riesgo.</p>
   <div class="hero-cta">${cta}<button class="btn lg" onclick="welcome()">${ic('book','sm')}Cómo funciona</button></div>
   <div class="hero-prog"><div class="row"><span class="dot" aria-hidden="true"></span><span class="num">${done} de ${n} ejercicios · ${pct}%</span>${nx?`<span>· siguiente: ${esc(nx.lvl)}</span>`:''}</div><div class="meter" role="progressbar" aria-label="Progreso de la ruta" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${done}"><i style="width:${pct}%"></i></div></div>
  </div></section>
 <h2 class="sec-t">${ic('gauge','sm')}Tu práctica</h2>
 <div class="hstats">
  ${stat('book','Ejercicios completados',`<span class="num">${done}</span> / ${n}`,quedan?`${quedan} por hacer`:'Ruta completada',`<div class="meter"><i style="width:${pct}%"></i></div>`)}
  ${stat('radar','Scans completados',`<span class="num">${runs.length}</span>`,last?'Último: '+fmtDate(last.end):'Aún no has lanzado ninguno')}
  ${stat('alert','Críticos en el último scan',`<span class="num">${crit}</span>`,last?'Con plugin rules aplicadas':'Lanza un scan para verlos')}
  ${stat('server','Licensed hosts',`<span class="num">${used}</span> / ${L.ips}`,esc(L.name),`<div class="meter"><i style="width:${Math.min(100,used/L.ips*100)}%"></i></div>`)}
 </div>`;
}
