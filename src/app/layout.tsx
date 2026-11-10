import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

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
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}
