import type { Metadata } from "next";
import { Exo_2, Geist_Mono } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vòng Quay May Mắn | Tora Tech",
  description: "Ứng dụng vòng quay may mắn thời gian thực - Tora Tech",
  keywords: ["lucky wheel", "vòng quay", "may mắn", "quay thưởng", "tora tech"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${exo2.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-exo2), "Exo 2", sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
