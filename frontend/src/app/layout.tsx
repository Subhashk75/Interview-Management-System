import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Interview Management System (IMS)",
  description: "Enterprise Interview Management System built with Spring Boot and Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
