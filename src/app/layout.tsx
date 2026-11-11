import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "GK Arena | Master History & Science",
  description: "Gamified learning for CDS, AFCAT, and UPSC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-premium-beige text-premium-charcoal antialiased transition-colors duration-300 dark:bg-premium-gray dark:text-zinc-200">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
