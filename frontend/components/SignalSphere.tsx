"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import type { Points as ThreePoints } from "three";

/**
 * Not decoration — this is meant to read as the product: many private
 * financial signals (scattered points) held apart, occasionally pulling
 * toward the center and organizing into a single verified answer. Built
 * with Three.js via React Three Fiber, client-only (see the dynamic import
 * in app/page.tsx — WebGL has no server-side representation).
 */
function SignalCloud() {
  const pointsRef = useRef<ThreePoints>(null);

  // A sphere of points, generated once. Two populations: most sit at the
  // "private signal" radius, a smaller "converged" set sits close to the
  // center — the resting state of "many inputs, one proof."
  const { positions, colors } = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Amaranth, Blush, white, soft gray — same palette as the rest of the app.
    const palette = [
      [0.902, 0.125, 0.345], // amaranth
      [0.894, 0.388, 0.537], // blush
      [0.85, 0.85, 0.87], // soft gray
      [1, 1, 1], // white
    ];

    for (let i = 0; i < count; i++) {
      const isConverged = i < count * 0.08;
      const radius = isConverged ? 0.4 + Math.random() * 0.6 : 2.6 + Math.random() * 1.2;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.08;
    pointsRef.current.rotation.x += delta * 0.02;
  });

  return (
    <Points ref={pointsRef} positions={positions} colors={colors} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.055}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
      />
    </Points>
  );
}

export function SignalSphere() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <SignalCloud />
      </Canvas>
    </div>
  );
}
