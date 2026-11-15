# Cambios

## 2.3.3 · noviembre de 2026

- Algunas prácticas no se marcaban aunque se hubieran hecho:
  - Ejercicio 1: «haber leído la bienvenida» solo contaba si se cerraba con sus botones de abajo; con la X, Esc o pulsando fuera, no. Ahora cuenta al abrirla.
  - Ejercicio 4: exigía además haber chocado antes con el aviso de licencia escaneando toda la /24. Ahora lo que cuenta es lo que enseña: un Basic Network Scan completado solo contra los equipos vivos. El aviso queda como paso opcional.
  - Ejercicio 8: ordenar por VPR solo contaba si antes se había pulsado «Desagrupar». Ahora también cuenta si se desagrupa después, con la tabla ya ordenada por VPR. Si se ordena con los grupos puestos, un aviso explica qué falta.
- Los 15 ejercicios cuya práctica tiene varias condiciones (1, 4, 7, 8, 11, 13 a 17, 22, 26 y 28 a 30) muestran la lista de lo que piden, con ✓ en lo que ya está hecho. Así se ve qué falta, en lugar de un «pendiente» sin más.
- Botón «Comprobar ahora» en cada práctica pendiente.
- Cada ejercicio dice **dónde se hace**: en qué escaneo, contra qué equipos y en qué pantalla. Antes un objetivo como «En Vulnerabilities pulsa Desagrupar» no aclaraba de qué escaneo, y con uno de un solo equipo (por ejemplo, solo 192.168.56.20) no hay nada que comparar. El recuadro mira dónde estás y lo dice:
  - «Estás en el sitio correcto», o
  - «El escaneo «192.168.56.20» no sirve para este ejercicio: hace falta un escaneo de los equipos vivos», con un botón «Llévame allí» que abre el escaneo que sirve, o «Ir al ejercicio 4» si aún no lo tienes.
  - En los ejercicios que crean un escaneo, «Crear el escaneo» abre el editor con la plantilla y los objetivos ya puestos.
- «Desagrupar» estaba en la esquina derecha de la tabla, justo debajo del panel de Entrenamiento: con los dos abiertos no se veía. Ahora está junto a «Filtro». Además, en pantallas de 1360 px o más, el panel abierto empuja el contenido en vez de taparlo.
- El botón «Agrupar / Desagrupar» parecía no hacer nada en español. En español, la tabla de vulnerabilidades agrupada no formaba los grupos SSL, SSH y Microsoft Windows (20 filas agrupada frente a 21 sin agrupar): la agrupación miraba el nombre del plugin, y en español ya está traducido. Ahora agrupa por el nombre original y la tabla tiene las mismas filas en los dos idiomas.

## 2.3.2 · noviembre de 2026

- El botón «Continuar» se quedaba en el ejercicio 1. La regla de la 2.3.1 seguía el último ejercicio abierto: al pulsar «Continuar con el ejercicio 1» ese pasaba a ser el último abierto, y vuelta a empezar. Además, el recuadro «Siguiente paso» usaba otra regla. Ahora la regla es una sola, en la portada, el panel y «Siguiente paso»: tu sitio es el último ejercicio cuyo quiz has respondido. Si está a medias, sigues en él; si está completo, pasas al siguiente sin terminar. Las prácticas que el simulador marca solas no te cambian de sitio.
- La línea de progreso de la portada dice «2 de 32 completados» en vez de «2 de 32 ejercicios», para no confundirlo con el ejercicio en el que vas.
- El botón azul de la portada, con el ratón encima, no llegaba al contraste mínimo (4,04:1); ahora tiene 5,9:1.

## 2.3.1 · noviembre de 2026

- El progreso parecía perderse. Se guardaba, pero un ejercicio solo cuenta como completado con la práctica y el quiz, y los que tenían una sola de las dos partes no se marcaban. Además, la portada y el panel volvían siempre al ejercicio 1. Ahora:
  - cada ejercicio a medias se marca «en curso», con «Quiz hecho · falta la práctica» o «Práctica hecha · falta el quiz»;
  - el panel resume «N completados · M en curso» y tiene un botón «Continuar» con el ejercicio en el que ibas;
  - el botón de la portada avanza con los ejercicios: te lleva al último que abriste si no está terminado o, si no, al siguiente después del último completado. La línea de progreso dice «siguiente: ejercicio N».
- Copia de seguridad en Configuración ▸ Simulador: descarga el progreso en un `.json` y restáuralo en otro navegador o en otra copia de `index.html`. Los navegadores guardan los datos por ubicación del archivo, así que una copia nueva en otra carpeta empieza vacía. Un archivo que no es una copia se rechaza sin tocar nada.
- Si el navegador no deja guardar (modo privado o sin espacio), se avisa en vez de fallar en silencio.

## 2.3.0 · noviembre de 2026

- En español, todo en español. La parte imitada de Nessus también: menús, botones, pestañas, tablas, plantillas, severidades, Configuración, ventanas y avisos. Los 74 plugins tienen nombre, sinopsis, descripción, solución y acción de remediación en español, y la salida del escáner se traduce línea a línea. En inglés se ve el texto original.
- El contenido didáctico usa los mismos nombres que los botones («pulsa Guardar y lanzar», «la pestaña Equipos»). En la prosa, «scan» pasa a «escaneo» y «host» a «equipo».
- La prueba de idioma vigila los dos sentidos: falla si queda español con la interfaz en inglés o inglés con la interfaz en español. Los únicos textos iguales en los dos idiomas son nombres propios (equipos, sistemas operativos, productos), revisados en `pruebas/idioma-iguales.json`.
- Ajustes al estilo de Apple: control segmentado con el texto centrado y una pastilla que se desliza a la opción elegida, e interruptor para el modo oscuro.
- Perfil editable en Configuración ▸ Mi cuenta: nombre, usuario, correo y puesto, con validación. El avatar y el usuario de la barra superior salen de ahí, y al pulsarlos se abre Mi cuenta.
- Recorridos guiados: «Atrás» funcionaba mal. Volvía al paso anterior, pero si ese paso ya estaba hecho el recorrido avanzaba solo otra vez. Ahora se queda en el paso y muestra «Siguiente».
- Las tarjetas de Recorridos guiados alinean sus botones abajo.
- Más separación entre «Entrenamiento» y el selector de idioma.
- Fechas en español («Hoy a las 13:46», «14 de noviembre a las 16:53»).

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
