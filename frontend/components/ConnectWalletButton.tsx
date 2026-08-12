"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
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

/**
 * Lists every wallet extension actually installed in the browser — MetaMask,
 * OKX Wallet, Rabby, etc. — as separate choices, via wagmi's built-in
 * EIP-6963 multi-provider discovery.
 *
 * Deliberately branches on useAccount()'s full `status` ('connecting' |
 * 'reconnecting' | 'connected' | 'disconnected'), not just the derived
 * `isConnected` boolean. wagmi persists sessions to localStorage and
 * silently reconnects them on mount; during that async window `isConnected`
 * reads false even though the underlying connector is already marked
 * connected internally, so a click on a naive "not connected" button can
 * call connect() on a connector that's already connected and throw
 * ConnectorAlreadyConnectedError. Treating 'reconnecting' (and
 * 'connecting') as its own disabled state removes that race entirely.
 */
export function ConnectWalletButton() {
  const { address, status, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [menuOpen, setMenuOpen] = useState(false);

  // Belt-and-suspenders: even with the status-based guard above, a
  // connector can already be connected from another tab/session. In that
  // case wagmi's own account state resolves to "connected" on its own
  // shortly after — nothing to show the user, just don't surface the
  // resulting ConnectorAlreadyConnectedError as a scary red message.
  const displayError = error?.name === "ConnectorAlreadyConnectedError" ? null : error;

  if (status === "connecting" || status === "reconnecting") {
    return (
      <button
        disabled
        className="rounded-lg bg-amaranth px-4 py-2 text-sm font-medium text-neutral-950 opacity-60"
      >
        Connecting…
      </button>
    );
  }

  if (status === "disconnected") {
    if (connectors.length === 0) {
      return <span className="text-xs text-neutral-500">No wallet extension found</span>;
    }

    if (connectors.length === 1) {
      const only = connectors[0];
      return (
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => connect({ connector: only })}
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
        <button
          onClick={() => setMenuOpen((v) => !v)}
          disabled={isPending}
          className="rounded-lg bg-amaranth px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  setMenuOpen(false);
                  connect({ connector });
                }}
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
