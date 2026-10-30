import "./globals.css";

export const metadata = {
  title: "Habla con la Máquina",
  description: "Interfaz de chat con la API de Groq y métricas de uso de tokens",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
