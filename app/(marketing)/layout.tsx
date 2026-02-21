import { Inter } from "next/font/google";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen flex flex-col bg-rip-black font-sans antialiased ${inter.className}`}>
      {/* Subtle gradient: near-black top → rip-bg mid/bottom */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: "linear-gradient(180deg, #0B0B0B 0%, #1F2121 40%, #2F3131 100%)",
        }}
      />
      {/* Faint vignette edges */}
      <div
        className="fixed inset-0 pointer-events-none -z-[9]"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 40%, transparent 0%, rgba(11,11,11,0.4) 100%)",
        }}
      />
      {/* Optional grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none -z-[8] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
