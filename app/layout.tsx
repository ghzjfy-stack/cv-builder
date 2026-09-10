import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Rubik } from "next/font/google";
import { SITE_NAME, SITE_URL } from "./lib/site";
import "./templates/templates.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-seo-sans",
  display: "swap",
});

const frank = Frank_Ruhl_Libre({
  subsets: ["latin", "hebrew"],
  variable: "--font-seo-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — תבניות קורות חיים בעברית`,
    template: `%s`,
  },
  description: "תבניות קורות חיים לפי תחום: מכירות, הייטק, סטודנטים ושירות לקוחות. עברית מלאה, מוכנות ל-ATS.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3ece1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${frank.variable}`}>
      <body className="seo-body">{children}</body>
    </html>
  );
}
