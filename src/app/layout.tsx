import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "KLM Guindastes — Controle de Operações",
  description: "Sistema de gestão e agendamento para KLM Guindastes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "KLM",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/logo-klm.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
