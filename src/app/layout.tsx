import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
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
      <body className="flex min-h-screen flex-col bg-premium-beige text-premium-charcoal antialiased transition-colors duration-300 dark:bg-premium-gray dark:text-zinc-200">
        <ThemeProvider>
          <Header />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
