# Habla con la Máquina — Interfaz de chat con la API de Groq

Prototipo de chat en Next.js que habla con un modelo de lenguaje real a través de la API de [Groq](https://groq.com/) y muestra en tiempo real el consumo de tokens y otras métricas de cada respuesta.

## Funcionalidades

- Chat con el modelo `qwen/qwen3.8-27b` de Groq usando `fetch` (sin SDK), con las cabeceras `Authorization: Bearer` y `Content-Type: application/json`.
- Se envía el **historial completo** de la conversación en cada petición.
- Estado "Pensando…" mientras se espera la respuesta (`async/await` + `useState`).
- Errores de la API traducidos a mensajes comprensibles (401, 429, 5xx, sin conexión…).
- Panel de métricas:
  - Tokens de prompt, de completado y total acumulados en la sesión.
  - Modelo, tiempo de respuesta, tiempo en Groq y tokens por segundo de la última respuesta.
- Persistencia en `localStorage` (cargada con `useEffect` al montar) y botón **Borrar conversación**.

## Puesta en marcha

1. Crea una API Key en [console.groq.com/keys](https://console.groq.com/keys).
2. Copia el archivo de ejemplo y pega tu clave:

   ```bash
   cp .env.example .env
   ```

3. Instala dependencias y arranca el servidor:

   ```bash
   npm install
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000).

### Probar la API Key con `fetch`

```js
const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "qwen/qwen3.8-27b",
    messages: [{ role: "user", content: "Hola" }],
  }),
});
console.log(res.status, await res.json());
```

## Estructura

```
app/
  layout.jsx        Layout raíz
  page.jsx          Página principal
  globals.css       Estilos
components/
  Chat.jsx          Estado del chat, persistencia y envío de mensajes
  StatsPanel.jsx    Panel de tokens y métricas
lib/
  groq.js           Llamada a la API de Groq con fetch y manejo de errores
```

> ⚠️ Al usar `NEXT_PUBLIC_`, la clave queda expuesta en el navegador. Es aceptable para este prototipo, pero en producción la llamada debería hacerse desde una ruta de servidor.
