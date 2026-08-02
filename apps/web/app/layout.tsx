import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Genwelth AI",
  description: "AI-powered crypto market intelligence",
};

const THEME_INIT_SCRIPT = `
try {
  var theme = localStorage.getItem('genwelth-theme');
  if (theme !== 'light' && theme !== 'dark') theme = 'dark';
  document.documentElement.setAttribute('data-theme', theme);
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}