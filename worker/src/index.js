const MAX_BODY_BYTES = 16000;
const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 2500;
const SYSTEM_INSTRUCTIONS = [
  "Eres JARVIS, un asistente personal claro, amable y prudente.",
  "Responde siempre en español, salvo que el usuario pida otro idioma.",
  "Da respuestas breves y útiles para una persona adolescente.",
  "No afirmes que abriste aplicaciones, cambiaste ajustes ni realizaste acciones fuera del chat.",
  "Si una petición requiere una acción en el teléfono, explica qué puede hacer el usuario de forma segura.",
  "No solicites contraseñas, códigos de acceso ni claves API."
].join(" ");

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

function corsFor(origin, allowedOrigin) {
  if (!origin || !allowedOrigin || origin !== allowedOrigin) return {};
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text.trim();
  const chunks = [];
  for (const item of payload.output || []) {
    for (const part of item.content || []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    const cors = corsFor(origin, allowedOrigin);

    if (request.method === "OPTIONS") {
      if (!origin || origin !== allowedOrigin) {
        return json({ error: "Origen no autorizado." }, 403);
      }
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "JARVIS AI proxy" }, 200, cors);
    }

    if (url.pathname !== "/chat") {
      return json({ error: "Ruta no encontrada." }, 404, cors);
    }
    if (request.method !== "POST") {
      return json({ error: "Método no permitido." }, 405, cors);
    }
    if (!allowedOrigin || origin !== allowedOrigin) {
      return json({ error: "Origen no autorizado." }, 403);
    }
    if (!env.OPENAI_API_KEY) {
      return json({ error: "El servicio de IA no está configurado." }, 503, cors);
    }
    if (!env.JARVIS_RATE_LIMIT) {
      return json({ error: "Falta configurar el límite de solicitudes del servicio." }, 503, cors);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    try {
      const { success } = await env.JARVIS_RATE_LIMIT.limit({ key: ip });
      if (!success) {
        return json({ error: "Se alcanzó el límite temporal. Espera un minuto e inténtalo de nuevo." }, 429, cors);
      }
    } catch (error) {
      console.error("Rate limit check failed");
      return json({ error: "No se pudo verificar el límite de uso." }, 503, cors);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ error: "La solicitud es demasiado grande." }, 413, cors);
    }

    let body;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return json({ error: "La solicitud es demasiado grande." }, 413, cors);
      }
      body = JSON.parse(raw);
    } catch {
      return json({ error: "El contenido enviado no es JSON válido." }, 400, cors);
    }

    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) {
      return json({ error: "El historial debe contener entre 1 y 8 mensajes." }, 400, cors);
    }

    const messages = [];
    for (const message of body.messages) {
      if (!message || !["user", "assistant"].includes(message.role) ||
          typeof message.content !== "string" || !message.content.trim() ||
          message.content.length > MAX_MESSAGE_CHARS) {
        return json({ error: "Uno de los mensajes no es válido." }, 400, cors);
      }
      messages.push({ role: message.role, content: message.content.trim() });
    }
    if (!messages.some(message => message.role === "user")) {
      return json({ error: "Falta una pregunta del usuario." }, 400, cors);
    }

    try {
      const upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-6-luna",
          instructions: SYSTEM_INSTRUCTIONS,
          input: messages,
          max_output_tokens: 350,
          store: false
        }),
        signal: AbortSignal.timeout(25000)
      });

      const payload = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        console.warn("OpenAI request failed with status", upstream.status);
        return json({ error: "El proveedor de IA no pudo completar la respuesta." }, 502, cors);
      }

      const reply = extractOutputText(payload);
      if (!reply) {
        return json({ error: "La IA devolvió una respuesta vacía." }, 502, cors);
      }
      return json({ reply: reply.slice(0, 4000) }, 200, cors);
    } catch (error) {
      console.warn("JARVIS upstream request failed");
      return json({ error: "No se pudo conectar con el proveedor de IA." }, 502, cors);
    }
  }
};
