import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const googleSansFlex = localFont({
  src: "./fonts/GoogleSansFlex-Variable.woff2",
  variable: "--font-sans",
  weight: "1 1000",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Race Raffle",
  description: "Race Raffle application",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", googleSansFlex.variable)}>
      <body>{children}</body>
    </html>
  );
}
