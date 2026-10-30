const fmt = (n) => n.toLocaleString("es-ES");

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export default function StatsPanel({ stats, messageCount }) {
  const { last } = stats;

  return (
    <aside className="stats">
      <h2>Uso de la sesión</h2>
      <Stat label="Tokens de prompt enviados" value={fmt(stats.promptTokens)} />
      <Stat label="Tokens de completado recibidos" value={fmt(stats.completionTokens)} />
      <Stat label="Total de tokens" value={fmt(stats.totalTokens)} />
      <Stat label="Peticiones" value={fmt(stats.requests)} />
      <Stat label="Mensajes" value={fmt(messageCount)} />

      <h2>Última respuesta</h2>
      {last ? (
        <>
          <Stat label="Modelo" value={last.model} />
          <Stat label="Tiempo de respuesta" value={`${(last.elapsedMs / 1000).toFixed(2)} s`} />
          {last.groqTotalTime != null && (
            <Stat label="Tiempo en Groq" value={`${last.groqTotalTime.toFixed(3)} s`} />
          )}
          {last.tokensPerSecond != null && (
            <Stat label="Tokens por segundo" value={last.tokensPerSecond.toFixed(1)} />
          )}
          <Stat
            label="Tokens (prompt / completado)"
            value={`${fmt(last.promptTokens)} / ${fmt(last.completionTokens)}`}
          />
        </>
      ) : (
        <p className="muted">Aún no hay respuestas.</p>
      )}
    </aside>
  );
}
