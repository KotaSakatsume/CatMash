import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catmash | Which cat is cuter?",
  description: "The ultimate cat rating platform inspired by Facemash. Built with zero-cost architecture.",
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
