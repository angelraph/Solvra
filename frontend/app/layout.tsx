import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { AmbientSphere } from "@/components/AmbientSphere";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solvra: Prove solvency. Reveal nothing.",
  description:
    "Confidential attestations on Flare: prove a financial policy is satisfied without revealing the data behind it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <head>
        {/*
          Satoshi (headings) + General Sans (body) via Fontshare — both
          freely licensed for commercial use. Matches the spirit of Flare's
          own brand typography (Satoshi headings + ABC Monument Grotesk
          body), substituting General Sans for ABC Monument Grotesk since
          the latter is a commercial font from ABC Dinamo with no free
          license to embed here.
        */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&f[]=general-sans@400,500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative flex min-h-full flex-col bg-shark text-neutral-100">
        <Providers>
          {/* Mounted once here, not per-page — a single WebGL context that
              persists across navigation instead of tearing down and
              recreating on every route change. */}
          <AmbientSphere />
          <div className="relative z-10 flex min-h-full flex-1 flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
