"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { coston2 } from "@/lib/chain";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Lists every wallet extension actually installed in the browser — MetaMask,
 * OKX Wallet, Rabby, etc. — as separate choices. wagmi's injected() connector
 * combined with its built-in EIP-6963 multi-provider discovery (on by
 * default) surfaces each installed extension as its own connector in
 * `connectors`; the earlier version of this component collapsed that down to
 * connectors[0], which meant it always jumped straight into whichever
 * extension happened to register itself first instead of letting you pick.
 * No WalletConnect connector here — that's the piece that pulled in a
 * separate 300-wallet remote-wallet modal unrelated to what's installed.
 */
export function ConnectWalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isConnected) {
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
            {isPending ? "Connecting…" : `Connect ${only.name}`}
          </button>
          {error && <span className="max-w-64 text-right text-xs text-red-400">{error.message}</span>}
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
                {connector.name}
              </button>
            ))}
          </div>
        )}
        {error && (
          <span className="absolute right-0 mt-1 max-w-64 text-right text-xs text-red-400">{error.message}</span>
        )}
      </div>
    );
  }

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
