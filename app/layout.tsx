import type { Metadata } from "next";
import "@/styles/globals.css";
import { DM_Sans, DM_Serif_Display } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "TradeRFQ — B2B Quote Platform",
  description: "Request quotes from verified suppliers and close deals faster.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerif.variable} font-sans bg-stone-50 text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}