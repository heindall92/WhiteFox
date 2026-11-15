# Cambios

## 2.2.1 · noviembre de 2026

- Licencia: «Todos los derechos reservados» a nombre de Yoandy Ramírez Delgado, en `LICENSE` (en español y en inglés). Sin licencia abierta.
- `THIRD-PARTY-NOTICES.md` recoge las licencias de terceros. El aviso ISC completo de Lucide va también dentro de `index.html`, como exige su licencia.
- `index.html` lleva el aviso de copyright y las etiquetas `author` y `copyright`.
- `pruebas/package.json` pasa a `UNLICENSED` y corrige el campo `version`, que estaba vacío.

## 2.2.0 · noviembre de 2026

- Inglés completo. El selector ES · EN está en la barra superior, en Ajustes y en «Más» (móvil). El cambio es inmediato y se guarda; la primera vez sigue el idioma del navegador. Están traducidos los 32 ejercicios, los 12 capítulos del manual, los 6 recorridos, el glosario, la entrevista, la guía, las 14 notas del instructor, los avisos y el informe descargado. Las capturas del manual siguen en español; su texto alternativo sale en inglés.
- Prueba nueva `npm run idioma`: recorre unas 700 pantallas en los dos idiomas y falla si con la interfaz en inglés queda un texto en español. Detecta marcadores del español y textos que salen idénticos en ES y EN sin ser datos de Nessus.
- Móvil: barra de pestañas abajo (Scans, Aprender, Práctica, Settings, Más). «Más» es una hoja que se cierra deslizando hacia abajo, con Policies, Plugin Rules, Trash, recorridos, glosario, idioma y tema.
- Tableta: con la barra lateral plegada, al pasar el ratón o el foco por un icono aparece su nombre.
- Manual: los pasos se partían en una columna de 28 px y se leían palabra a palabra. Ahora cada paso es una tarjeta junto a la imagen, y «Errores típicos» y «Qué le dirías a dirección» van lado a lado.
- Portada: el texto se separa del borde izquierdo y queda en una columna más estrecha.
- Estados vacíos con icono, explicación y acción (Plugin Rules, Policies, carpetas, scan sin lanzar, notas, remediaciones, VPR, filtros sin resultados). Si una vista falla, se explica y hay un botón para volver a My Scans.
- Pulido según la skill unslop de @heydamir: etiquetas en tipo frase en vez de mayúsculas espaciadas, logo de un solo color, títulos a peso 600, tarjetas de cifras sin iconos de relleno y ninguna exclamación en la interfaz.
- Tokens de tipografía (base 14, ratio 1,2) y de espaciado (múltiplos de 4).
- Se corrige: el editor se salía de su tarjeta a 820 px, y el aviso y el recuadro «Siguiente paso» se pisaban en tableta. En móvil el aviso legal ocupa una línea.
- Diseño: `docs/designs/2.2-idioma-y-diseno.md`.

## 2.1.0 · noviembre de 2026

- **El laboratorio se llama WhiteFox.** Logo con el icono paw-print de Lucide (no hay zorro en Lucide) y portada con el título «WhiteFox · Aprende a escanear, priorizar y decidir».
- **Manual** en la barra lateral (Aprender ▸ Manual, o la tecla `?`): 12 capítulos con una imagen numerada de la pantalla real, los pasos, los errores típicos y «Qué le dirías a dirección». Las imágenes se generan desde la propia aplicación (`npm run manual`) y se amplían con un clic.
- **Recorridos guiados** (Aprender ▸ Recorridos guiados): 6 recorridos que señalan el botón real y avanzan cuando haces la acción. Botón «Muéstrame dónde» en los ejercicios y «Recorrido de 60 s» en la bienvenida.
- **8 ejercicios nuevos** (32 en 7 módulos): puertos no estándar, Audit Trail, credenciales que fallan, Accuracy, pruebas web, familias de plugins, ordenar la cola de remediación (pregunta de arrastrar) y un caso final de una semana.
- **Ruta**: tiempo estimado por módulo, módulo técnico opcional para el perfil de riesgo, «Lo que ya sabes» al cerrar un módulo y pistas que se abren solas tras dos fallos.
- **Fluidez**: transición entre vistas (View Transitions), entrada coreografiada, esqueletos mientras un scan está en marcha, avisos apilados y píldora en la barra lateral. Con «reducir movimiento», solo fundidos.
- **Portada** sin el interruptor de tema (ya está en la barra superior) y con el zorro entero también en el móvil y la tableta.
- **README** con un banner como el de Blue-Jr (pata de cristal y ondas; logo con el icono paw-print de Lucide).
- **Barra superior** con dos menús nuevos: **«?»** (manual, recorridos, la consola en 60 segundos, glosario, cómo funciona y atajos de teclado) y **Ajustes** (tema, velocidad de simulación, licencia del laboratorio, bienvenida, más ajustes y restablecer). `Esc` cierra el menú y devuelve el foco a su botón. En el móvil el botón de tema se queda dentro de Ajustes.
- **Portada** con un zorro ártico sobre la nieve (WebP de 35 KB incrustado; la anterior pesaba unos 84 KB). El encuadre deja cielo sobre las orejas y la roca entera desde 1100 px.
- **Rendimiento**: durante un scan la vista ya no se redibuja 4 veces por segundo, solo cuando aparece un host.
- Se corrige: las pestañas de resultados se partían en varias líneas y el icono de ayuda de la licencia se salía de su sitio.
- Diseño revisado con el método Elephant-Goldfish: `docs/designs/2.1-pedagogia.md`.

## 2.0.0 · noviembre de 2026

- Simula Nessus Essentials Plus (20 IPs, informes HTML y PDF) y permite cambiar a Essentials (5 IPs, solo CSV y `.nessus`). La licencia cuenta hosts distintos.
- Las 11 plantillas de la 10.x. Nuevas: Ping-Only Discovery, Credential Validation, Advanced Dynamic Scan, Malware Scan, Active Directory Starter, Find AI y Remote Monitoring and Management. Las de pago aparecen bloqueadas con la versión que las incluye.
- Hallazgos nuevos de Active Directory, malware, IA y acceso remoto (IDs 900000+, inventados).
- Pestaña VPR Top Threats y barra de severidades en History.
- «Simular parche» en Remediations para practicar remediar y verificar.
- Bienvenida, recuadro «Siguiente paso», ayuda contextual, glosario, preguntas de entrevista y 24 ejercicios en 5 módulos.
- Nessus DB cifrado (AES-256-GCM) y PDF con el diálogo de impresión.
- Iconos de Lucide, movimiento con los criterios de Emil Kowalski y vista móvil.
- Se corrigen contrastes, pestañas y barra lateral plegada (axe).
- Prueba e2e con 55 comprobaciones y CI en GitHub Actions.

## 1.0.0 · noviembre de 2026

- Primera versión: 5 plantillas, red de 9 equipos, 15 ejercicios, Plugin Rules, informes HTML y CSV y exportación `.nessus`.
