# J.A.R.V.I.S. — Asistente personal para Android

JARVIS es una aplicación web progresiva (PWA). No requiere APK: se abre desde Chrome y puede añadirse a la pantalla de inicio cuando el navegador ofrece la opción de instalación.

## Estado del proyecto

- Interfaz futurista y reloj: incluidos.
- PWA: manifiesto, icono, Service Worker y caché: incluidos.
- Voz local: reconocimiento de voz del navegador y respuestas habladas: incluidos; dependen de Chrome, permisos y voces instaladas.
- Comandos locales: hora, fecha, operaciones sencillas y notas locales.
- Conexión a IA: el cliente y un proxy de servidor seguro están preparados, pero el Worker aún debe desplegarse y configurarse. No hay una API key dentro de este repositorio.

Consulta [docs/ETAPAS.md](docs/ETAPAS.md) para las pruebas y los pasos de publicación y conexión.

## Publicar en GitHub Pages

1. En el repositorio abre **Settings → Pages**.
2. En **Build and deployment → Source**, selecciona **GitHub Actions** y guarda.
3. Abre **Actions** y espera a que **Deploy JARVIS PWA** termine en verde.
4. Abre: https://francisco102127.github.io/jarvis-assistant-/

Si el flujo falla, abre el trabajo rojo y revisa el primer mensaje que aparece bajo **Error**.

## Seguridad de la IA

La clave del proveedor de IA debe guardarse como secreto en el Worker, nunca en archivos del navegador, GitHub Pages o este repositorio. La API puede generar cargos; una persona adulta debe administrar la cuenta y revisar precios y límites antes de activarla.
