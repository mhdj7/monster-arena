import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { NavBar } from "@/components/NavBar";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "مانستر آرنا | Monster Arena",
  description: "بازی کارت‌های هیولا — مبارزه، تمرین، فیوژن و لیگ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TopBar />
        <NavBar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-white/30 py-6">
          مانستر آرنا — نسخه لوکال
        </footer>
      </body>
    </html>
  );
}
