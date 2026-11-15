import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Logeeca Foresight — Know Tomorrow's Orders Tonight | Restaurant Kitchen Intelligence",
  description:
    "Logeeca Foresight predicts what every dish will sell, aligns kitchen prep, cuts food waste by 35%+, and protects restaurant operating margins.",
  keywords: [
    "restaurant demand forecasting",
    "food prediction",
    "kitchen prep intelligence",
    "reduce food waste",
    "LightGBM forecasting",
    "Hyderabad restaurants",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased selection:bg-mint selection:text-ink scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-paper text-text font-sans overflow-x-hidden selection:bg-mint selection:text-ink">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
