import type { Metadata } from "next";
import { Cairo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-geist-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mohamed AI - مساعد Kali Linux للأمن السيبراني",
  description:
    "Mohamed AI - مساعد ذكاء اصطناعي متخصص في الأمن السيبراني ونظام Kali Linux. تعلم كل شيء عن أدوات اختبار الاختراق والشبكات.",
  keywords: [
    "Mohamed AI",
    "Kali Linux",
    "الأمن السيبراني",
    "اختبار الاختراق",
    "pentesting",
    "cybersecurity",
    "hacking",
    "mohamedai.com",
  ],
  authors: [{ name: "Mohamed" }],
  metadataBase: new URL("https://mohamedai.com"),
  alternates: {
    canonical: "https://mohamedai.com",
  },
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Mohamed AI - مساعد Kali Linux",
    description: "مساعد ذكاء اصطناعي متخصص في الأمن السيبراني و Kali Linux",
    url: "https://mohamedai.com",
    siteName: "Mohamed AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohamed AI - مساعد Kali Linux",
    description: "مساعد ذكاء اصطناعي متخصص في الأمن السيبراني و Kali Linux",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <body
        className={`${cairo.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
