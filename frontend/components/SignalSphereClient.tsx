"use client";

import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

const SignalSphere3D = dynamic(() => import("./SignalSphere").then((m) => m.SignalSphere), {
  ssr: false,
  loading: () => null,
});

/** A CSS-only stand-in: a soft radial glow plus a scattering of static dots
 * in the same palette. Used whenever WebGL genuinely isn't available or the
 * 3D scene throws — this way a judge on a machine without GPU acceleration
 * (or any other WebGL failure) still sees something intentional, not a
 * broken hero. */
function SignalGlowFallback() {
  const dots = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * Math.PI * 2 + i;
    const radius = 15 + ((i * 37) % 38);
    return {
      left: `${50 + radius * Math.cos(angle)}%`,
      top: `${50 + radius * Math.sin(angle) * 0.6}%`,
      size: 2 + (i % 3),
      opacity: 0.3 + (i % 5) * 0.12,
      color: i % 4 === 0 ? "#e62058" : i % 4 === 1 ? "#e46389" : i % 4 === 2 ? "#ffffff" : "#8b8f96",
    };
  });

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #e62058 0%, transparent 70%)" }}
      />
      {dots.map((dot, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
            opacity: dot.opacity,
          }}
        />
      ))}
    </div>
  );
}

class SphereErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn("SignalSphere failed to render, falling back to CSS visual:", error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Real Three.js sphere when WebGL is available and renders cleanly; a
 * static CSS visual in the same palette otherwise. Never a blank gap,
 * never a frozen/broken page. */
export function SignalSphereClient() {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  if (webglOk === false) {
    return <SignalGlowFallback />;
  }

  if (webglOk === null) {
    return null;
  }

  return (
    <SphereErrorBoundary fallback={<SignalGlowFallback />}>
      <Suspense fallback={null}>
        <SignalSphere3D />
      </Suspense>
    </SphereErrorBoundary>
  );
}
