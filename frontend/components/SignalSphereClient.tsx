"use client";

import dynamic from "next/dynamic";

// next/dynamic's ssr:false option can only be used from within a Client
// Component (Next.js 16 enforces this at build time) — this file exists
// solely to be that boundary, so app/page.tsx can stay a Server Component.
const SignalSphere = dynamic(() => import("./SignalSphere").then((m) => m.SignalSphere), {
  ssr: false,
});

export { SignalSphere as SignalSphereClient };
