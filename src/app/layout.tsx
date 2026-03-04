import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://billy-match.vercel.app"),
  title: "Billy-Match: Scommesse Clandestine sul Ferro",
  description:
    "Il sistema più clandestino per tracciare scommesse sul calcetto. Nessun animale maltrattato, solo portafogli.",
  openGraph: {
    title: "Billy-Match: Scommesse Clandestine sul Ferro",
    description:
      "Il sistema più clandestino per tracciare scommesse sul calcetto.",
    images: [
      {
        url: "/brand/billy-match-logo.png",
        width: 2048,
        height: 1117,
        alt: "Billy-Match Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Billy-Match: Scommesse Clandestine sul Ferro",
    images: ["/brand/billy-match-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className={inter.className}>
        <Navbar />
        <main className="container py-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          <p>
            Billy-Match © {new Date().getFullYear()} — Sistema di tracciamento
            goliardico. Nessun valore legale.
          </p>
        </footer>
      </body>
    </html>
  );
}
