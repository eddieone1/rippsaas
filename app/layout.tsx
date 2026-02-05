import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rip - Retention Intelligence Platform",
  description: "Retention intelligence platform helping UK gyms keep members longer through data-driven interventions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
