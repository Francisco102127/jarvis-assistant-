# JARVIS — estado y etapas

## Estado actual del repositorio

- **Etapa 1 — PWA visual:** archivos HTML, CSS, manifiesto y caché de Service Worker ya están en el repositorio.
- **Etapa 2 — voz local:** la interfaz incluye reconocimiento de voz del navegador y respuestas habladas con las voces españolas instaladas en Android.
- **Comandos locales:** hora, fecha, operaciones sencillas, notas en el almacenamiento del navegador y botones para intentar abrir algunas aplicaciones.
- **Etapa 3 — conexión segura a IA:** el cliente ya puede llamar a un endpoint de servidor mediante `config.js`; el proxy de Cloudflare está preparado en `worker/`, pero todavía NO está desplegado ni conectado.
- **Etapa 4 — instalación y verificación:** la PWA puede mostrar el aviso de instalación cuando Chrome lo permite; falta comprobar la publicación real de Pages en el teléfono.

## Seguridad

- No pongas una API key en `app.js`, `config.js`, HTML ni en el repositorio.
- La clave de OpenAI debe guardarse como secreto del Worker, fuera del navegador.
- La API puede generar cargos por uso. Una persona adulta debe revisar y gestionar la cuenta, los límites y el gasto antes de activar el servicio.
- El proxy limita el tamaño del historial y las respuestas y aplica un límite aproximado de 10 solicitudes por minuto y dirección IP. El límite de Cloudflare es aproximado y local a cada centro de datos; no es un sistema de facturación.
- CORS restringe los navegadores autorizados, pero no sustituye la autenticación. Para compartir el servicio con más personas se necesitaría añadir autenticación adicional.

## Publicación de la PWA

1. En GitHub abre **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions** y guarda.
3. Abre **Actions** y revisa el flujo **Deploy JARVIS PWA**.
4. La publicación solo está confirmada cuando el trabajo termina con una marca verde y la URL de Pages abre el sitio.
5. La URL esperada es `https://francisco102127.github.io/jarvis-assistant-/`.

Si falla, abre el trabajo rojo y copia el texto de la primera sección **Error**. No hace falta compartir capturas.

## Conectar el proxy de IA (requiere una persona adulta)

1. Una persona adulta debe crear y administrar la cuenta de proveedor de IA y revisar sus precios y límites.
2. Desplegar `worker/src/index.js` como Cloudflare Worker usando `worker/wrangler.toml`.
3. Guardar la clave API como secreto llamado `OPENAI_API_KEY` en la configuración del Worker. Nunca pegarla en GitHub ni en este chat.
4. Confirmar las variables `ALLOWED_ORIGIN` y `OPENAI_MODEL`, y el binding de rate limit `JARVIS_RATE_LIMIT`.
5. Probar la ruta `/health`; debe responder `{"ok":true,...}`.
6. En `config.js`, escribir únicamente la URL pública del Worker terminada en `/chat` en `AI_ENDPOINT`.
7. Volver a publicar Pages y probar una pregunta que no esté en los comandos locales. La respuesta debe aparecer en pantalla y leerse en voz alta.

## Pruebas manuales en Android

- Abrir la URL HTTPS en Chrome.
- Escribir: `¿Qué hora es?` — debe mostrar la hora local.
- Escribir: `calcula 25 x 4` — debe responder 100.
- Pulsar **Probar voz** — debe escucharse una voz española disponible.
- Pulsar **Activar voz** y aceptar el permiso del micrófono — debe reconocer una frase corta.
- Usar **Instalar JARVIS** o el menú de Chrome → **Instalar aplicación / Añadir a pantalla de inicio**, si aparece.
- Cerrar y volver a abrir desde el icono; comprobar que carga la interfaz.

El reconocimiento de voz depende de Chrome, permisos y conexión; no se garantiza que funcione sin internet.
