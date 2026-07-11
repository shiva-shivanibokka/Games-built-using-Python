import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Playbox — games built with Python",
  description:
    "Colorful browser games powered by live Python algorithms — Tic-Tac-Toe, Sudoku, Tango, Zip. Every board generated fresh on the server.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="aurora" aria-hidden />
        <NavBar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10">{children}</main>
        <footer className="py-8 text-center text-sm text-muted">
          Built with Python + Next.js · every board generated live by a Python API
        </footer>
      </body>
    </html>
  );
}
