import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import { NotificationListener } from "@/components/notifications/NotificationListener";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EIU TestLab - Hệ thống thi trực tuyến",
  description: "Hệ thống thi trực tuyến của Đại học Quốc tế Miền Đông",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} antialiased flex flex-col min-h-screen`}>
        <NotificationListener />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
