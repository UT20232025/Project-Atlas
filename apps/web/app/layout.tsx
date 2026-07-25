import type { Metadata } from "next";
import "./globals.css";

import { MarketProvider } from "@/components/providers/MarketProvider";

export const metadata: Metadata = {
  title: "Genwelth AI",
  description: "AI-powered crypto market intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MarketProvider>{children}</MarketProvider>
      </body>
    </html>
  );
}