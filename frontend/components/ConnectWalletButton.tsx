"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { coston2 } from "@/lib/chain";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Real wagmi wallet connection: injected (MetaMask, Rabby, etc.) or WalletConnect. */
export function ConnectWalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending}
              className="rounded-lg bg-amaranth px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Connecting…" : connector.name}
            </button>
          ))}
        </div>
        {error && <span className="max-w-64 text-right text-xs text-red-400">{error.message}</span>}
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
