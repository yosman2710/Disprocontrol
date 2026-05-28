import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/AuthGuard";
import { ClientWrapper } from "@/components/ClientWrapper";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DisproControl",
  description: "Sistema de Control de Operaciones - Disprocar",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Toaster position="top-right" richColors />
        <ClientWrapper>
          <AuthGuard>
            <div className="main-scale-wrapper">
              {children}
            </div>
          </AuthGuard>
        </ClientWrapper>
      </body>
    </html>
  );
}
