import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menuva — Deine Speisekarte. Einfach digital.",
  description: "Kostenlose Open-Source-Plattform für digitale Restaurant-Menükarten.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
