"use client";

import { SignalSphereClient } from "./SignalSphereClient";

/**
 * The landing page's hero sphere, present site-wide as a faint ambient
 * presence rather than a second hero — fixed behind every page, fading in
 * and out on a slow loop instead of sitting at a constant opacity. Lives at
 * the layout level (mounted once in app/layout.tsx) so navigating between
 * pages doesn't tear down and recreate the WebGL context on every route
 * change.
 */
export function AmbientSphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 animate-ambient-fade opacity-0"
      aria-hidden="true"
    >
      <SignalSphereClient />
    </div>
  );
}
