export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const MODEL = "qwen/qwen3.8-27b";

const SYSTEM_PROMPT = {
  role: "system",
  content: "Eres un asistente útil. Responde de forma clara y concisa en el idioma del usuario.",
};

// Traduce los códigos HTTP a mensajes comprensibles para el usuario
function friendlyError(status, apiMessage) {
  switch (status) {
    case 400:
      return "La petición no es válida. Intenta reformular tu mensaje.";
    case 401:
      return "API Key inválida o ausente. Revisa NEXT_PUBLIC_GROQ_API_KEY en tu archivo .env.";
    case 404:
      return `El modelo "${MODEL}" no está disponible en tu cuenta de Groq.`;
    case 413:
      return "La conversación es demasiado larga. Borra la conversación y empieza de nuevo.";
    case 429:
      return "Has alcanzado el límite de peticiones del plan gratuito. Espera unos segundos y vuelve a intentarlo.";
    default:
      if (status >= 500) return "El servidor de Groq tiene problemas en este momento. Inténtalo más tarde.";
      return apiMessage || `Error inesperado (código ${status}).`;
  }
}

// Algunos modelos de razonamiento (Qwen3) devuelven su "pensamiento" entre etiquetas <think>
function stripThinking(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

/**
 * Envía el historial completo de la conversación a Groq.
 * @param {{role: string, content: string}[]} history
 * @returns {Promise<{content: string, usage: object, model: string, elapsedMs: number}>}
 */
export async function sendChat(history) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la API Key. Crea un archivo .env con NEXT_PUBLIC_GROQ_API_KEY y reinicia el servidor.");
  }

  const start = performance.now();
  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [SYSTEM_PROMPT, ...history.map(({ role, content }) => ({ role, content }))],
      }),
    });
  } catch {
    throw new Error("No se pudo conectar con Groq. Comprueba tu conexión a internet.");
  }
  const elapsedMs = performance.now() - start;

  if (!response.ok) {
    let apiMessage;
    try {
      const errorBody = await response.json();
      apiMessage = errorBody?.error?.message;
    } catch {
      // el cuerpo del error no es JSON; usamos el mensaje genérico
    }
    throw new Error(friendlyError(response.status, apiMessage));
  }

  const data = await response.json();
  const content = stripThinking(data.choices?.[0]?.message?.content ?? "");

  return {
    content: content || "(La IA no devolvió contenido)",
    usage: data.usage ?? {},
    model: data.model ?? MODEL,
    elapsedMs,
  };
}
