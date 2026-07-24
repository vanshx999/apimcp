import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "apimcp — Any API → MCP server. No terminal.",
  description: "Paste any OpenAPI spec. Get a live MCP server on your Cloudflare in one click. No CLI, no Docker, no DevOps.",
  openGraph: {
    title: "apimcp — Any API → MCP server. No terminal.",
    description: "Paste any OpenAPI spec. Get a live MCP server on your Cloudflare in one click. No CLI, no Docker, no DevOps.",
    url: "https://apimcp-landing.vercel.app",
    siteName: "apimcp",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "apimcp — Any API → MCP server. No terminal.",
    description: "Paste any OpenAPI spec. Get a live MCP server on your Cloudflare in one click. No CLI, no Docker, no DevOps.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexMono.variable} ${plexSans.variable}`}>
      <body className="bg-surface text-text font-sans antialiased noise-overlay">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
