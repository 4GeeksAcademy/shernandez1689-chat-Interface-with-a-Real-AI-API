"use client";

import { useEffect, useRef, useState } from "react";
import { sendChat, MODEL } from "@/lib/groq";
import StatsPanel from "./StatsPanel";

const STORAGE_KEY = "groq-chat-session";

const EMPTY_STATS = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  requests: 0,
  last: null, // métricas de la última respuesta
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef(null);

  // Cargar la sesión desde localStorage al montar el componente
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        setMessages(saved.messages ?? []);
        setStats({ ...EMPTY_STATS, ...saved.stats });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  // Guardar la sesión después de cada cambio (solo tras haberla cargado,
  // para no sobrescribirla con el estado vacío inicial)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, stats }));
  }, [messages, stats, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { role: "user", content: text };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const { content, usage, model, elapsedMs } = await sendChat(history);
      const prompt = usage.prompt_tokens ?? 0;
      const completion = usage.completion_tokens ?? 0;
      const total = usage.total_tokens ?? prompt + completion;
      const tokensPerSecond = usage.completion_time ? completion / usage.completion_time : null;

      setMessages((prev) => [...prev, { role: "assistant", content }]);
      setStats((prev) => ({
        promptTokens: prev.promptTokens + prompt,
        completionTokens: prev.completionTokens + completion,
        totalTokens: prev.totalTokens + total,
        requests: prev.requests + 1,
        last: {
          model,
          promptTokens: prompt,
          completionTokens: completion,
          totalTokens: total,
          elapsedMs,
          groqTotalTime: usage.total_time ?? null,
          tokensPerSecond,
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setMessages([]);
    setStats(EMPTY_STATS);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="layout">
      <main className="chat">
        <header className="chat-header">
          <h1>Habla con la Máquina</h1>
          <button className="clear-btn" onClick={handleClear} disabled={isLoading}>
            Borrar conversación
          </button>
        </header>

        <section className="messages">
          {messages.length === 0 && !isLoading && (
            <p className="empty">Escribe un mensaje para empezar a chatear con {MODEL}.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <span className="role">{m.role === "user" ? "Tú" : "IA"}</span>
              <p>{m.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant thinking">
              <span className="role">IA</span>
              <p>Pensando…</p>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje…"
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? "Enviando…" : "Enviar"}
          </button>
        </form>
      </main>

      <StatsPanel stats={stats} messageCount={messages.length} />
    </div>
  );
}
