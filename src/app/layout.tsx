import type { Metadata } from "next";
import "./globals.css";
import { Google_Sans_Flex } from "next/font/google";
import { cn } from "@/lib/utils";

const googleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  variable: "--font-sans",
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
