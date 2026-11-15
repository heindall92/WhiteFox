# Avisos de terceros

WhiteFox es obra de Yoandy Ramírez Delgado y no tiene licencia abierta: ver [`LICENSE`](LICENSE). Estos componentes de terceros conservan su propia licencia.

## Incluidos en la aplicación (`index.html`) y en el README

### Lucide (iconos)

- Versión 0.460.0, https://lucide.dev. Sus trazos SVG van copiados en línea en `index.html` y en `docs/assets/icons/`.
- Licencia ISC. Su aviso de copyright y de permiso tiene que acompañar a cualquier copia:

```
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## Solo para las pruebas (no van dentro de la aplicación)

Se instalan con `npm install` en `pruebas/` y no se copian en el repositorio.

| Paquete | Licencia | Uso |
|---|---|---|
| [Playwright](https://playwright.dev) 1.63.0 | Apache-2.0 | Abre Chromium para el e2e, la prueba de idioma y las imágenes del manual |
| [axe-core](https://github.com/dequelabs/axe-core) 4.10.2 | MPL-2.0 | Comprueba la accesibilidad (WCAG 2.2 AA) |

## Herramientas de trabajo (no van en la aplicación)

Están declaradas en `.claude/settings.json` como plugins del entorno de desarrollo. No se copia nada de su código ni de su texto:

- [Elephant-Goldfish Model](https://github.com/google/elephant-goldfish-model) (Apache-2.0);
- [unslop](https://github.com/heydamir/unslop) de Damir Sokolovsky (CC BY 4.0);
- [humanizer](https://github.com/blader/humanizer) (MIT).

## Marcas

*Nessus* y *Tenable* son marcas de sus propietarios. WhiteFox es una herramienta de estudio independiente, no afiliada ni respaldada por Tenable. La interfaz se ha recreado a partir de la documentación pública, sin código, logotipos ni textos de Tenable. La empresa, los equipos y los hallazgos son inventados. Los CVE y los IDs de plugin por debajo de 900000 son públicos.
