import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['thai', 'latin'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ระบบสั่งจองเสื้อชมรมดิจิทัล สสจ.ลำปาง (รอบที่ 2)",
  description: "ระบบสั่งจองเสื้อชมรมสุขภาพดิจิทัล สำนักงานสาธารณสุขจังหวัดลำปาง รอบที่ 2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} font-sans h-full antialiased`}>
      <body className={`${prompt.className} min-h-full flex flex-col bg-slate-900 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
