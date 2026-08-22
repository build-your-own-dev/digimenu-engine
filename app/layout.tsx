import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const favicon = `${basePath}/favicon.svg?v=menuva`;

export const metadata: Metadata = {
  title: "Menuva — Deine Speisekarte. Einfach digital.",
  description: "Kostenlose Open-Source-Plattform für digitale Restaurant-Menükarten.",
  other: { "codex-preview": "development" },
  icons: { icon: favicon, shortcut: favicon },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
