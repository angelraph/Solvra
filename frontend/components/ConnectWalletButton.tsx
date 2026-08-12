"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import type { Connector } from "wagmi";
import { coston2 } from "@/lib/chain";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// wagmi's injected() connector falls back to the literal name "Injected"
// whenever the browser's provider doesn't announce itself via EIP-6963 —
// common in mobile in-app browsers and some older wallet injections. Users
// don't know what "Injected" means, so show the generic "Wallet" label
// instead; a real wallet name (MetaMask, Rabby, OKX Wallet, ...) still shows
// as-is since that's actually useful information.
function connectorLabel(name: string): string {
  return name.toLowerCase() === "injected" ? "Wallet" : name;
}

// How long a silent reconnect (or a user-initiated connect) is allowed to sit
// before we treat it as stuck. wagmi's auto-reconnect on mount has no
// built-in timeout of its own — if the previously-connected extension is
// locked, removed, or just slow to respond, the account status sits at
// 'reconnecting' forever with nothing else rendered, so the button reads
// "Connecting…" indefinitely with no way out. Paired with the explicit RPC
// transport timeout in lib/wagmiConfig.ts (8s, 2 retries — the actual fix
// for *why* a request hangs) this is the backstop for the cases that isn't
// enough for: a locked/unresponsive extension itself never replies to
// wagmi's silent eth_accounts call in the first place, which no RPC timeout
// touches. When this fires we don't just show a picker over the stuck
// attempt — see the disconnect() call below — we actively clear it, so the
// next connect() is a genuinely clean attempt instead of racing a zombie one
// that might still resolve later and stomp on it.
const STUCK_TIMEOUT_MS = 4000;

export function ConnectWalletButton() {
  const { address, status, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  // Reset 'stuck' the moment status leaves connecting/reconnecting. Adjusting
  // state during render (React's documented pattern for "reset state when a
  // prop changes") rather than in the effect below avoids an extra
  // cascading-render pass; the effect is left to do only what effects are
  // for — arming a timer and calling setState from its callback once it
  // actually fires, not synchronously in the effect body.
  const [lastStatus, setLastStatus] = useState(status);
  if (status !== lastStatus) {
    setLastStatus(status);
    if (status !== "connecting" && status !== "reconnecting") setStuck(false);
  }

  useEffect(() => {
    if (status !== "connecting" && status !== "reconnecting") return;
    const timer = setTimeout(() => {
      setStuck(true);
      // Actively tear down the stalled attempt rather than leaving it
      // running in the background — a plain UI escape hatch without this
      // just hides the problem until the zombie reconnect eventually
      // resolves (or never does) and clobbers whatever the user did next.
      disconnect();
    }, STUCK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, disconnect]);

  // Belt-and-suspenders: even with the status-based guard above, a
  // connector can already be connected from another tab/session. In that
  // case wagmi's own account state resolves to "connected" on its own
  // shortly after — nothing to show the user, just don't surface the
  // resulting ConnectorAlreadyConnectedError as a scary red message.
  const displayError = error?.name === "ConnectorAlreadyConnectedError" ? null : error;

  if ((status === "connecting" || status === "reconnecting") && !stuck) {
    return (
      <button
        disabled
        className="rounded-lg bg-amaranth px-4 py-2 text-sm font-medium text-neutral-950 opacity-60"
      >
        Connecting…
      </button>
    );
  }

  if (status === "disconnected" || stuck) {
    if (connectors.length === 0) {
      return <span className="text-xs text-neutral-500">No wallet extension found</span>;
    }

    const pick = (connector: Connector) => {
      setMenuOpen(false);
      connect({ connector });
    };

    if (connectors.length === 1) {
      const only = connectors[0];
      return (
        <div className="flex flex-col items-end gap-1">
          {stuck && <span className="text-xs text-neutral-500">Connection timed out. Try again</span>}
          <button
            onClick={() => pick(only)}
            disabled={isPending}
            className="rounded-lg bg-amaranth px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Connecting…" : `Connect ${connectorLabel(only.name)}`}
          </button>
          {displayError && <span className="max-w-64 text-right text-xs text-red-400">{displayError.message}</span>}
        </div>
      );
    }

    return (
      <div className="relative">
        {stuck && <div className="mb-1 text-right text-xs text-neutral-500">Connection timed out. Pick a wallet:</div>}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          disabled={isPending}
          className="rounded-lg bg-amaranth px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
        {(menuOpen || stuck) && (
          <div className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => pick(connector)}
                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-neutral-100 transition hover:bg-neutral-800"
              >
                {connectorLabel(connector.name)}
              </button>
            ))}
          </div>
        )}
        {displayError && (
          <span className="absolute right-0 mt-1 max-w-64 text-right text-xs text-red-400">{displayError.message}</span>
        )}
      </div>
    );
  }

  // status === "connected"
  if (chainId !== coston2.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: coston2.id })}
        disabled={isSwitching}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-amber-400 disabled:opacity-50"
      >
        {isSwitching ? "Switching…" : "Switch to Coston2"}
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-neutral-500"
      title="Disconnect"
    >
      {address ? shortenAddress(address) : "Connected"}
    </button>
  );
}
