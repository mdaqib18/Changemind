import type { Metadata } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/synccode/app-shell";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ChangeMind — Understand the impact of every code change",
  description: "ChangeMind analyzes code changes, maps their impact across repositories and teams, and helps developers safely validate and integrate changes.",
  applicationName: "ChangeMind",
  openGraph: {
    title: "ChangeMind — Understand the impact of every code change",
    description: "ChangeMind analyzes code changes, maps their impact across repositories and teams, and helps developers safely validate and integrate changes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChangeMind — Understand the impact of every code change",
    description: "ChangeMind analyzes code changes, maps their impact across repositories and teams, and helps developers safely validate and integrate changes.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased dark")}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider><AppShell>{children}</AppShell></AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
