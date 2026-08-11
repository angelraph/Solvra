"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

/** Real RainbowKit connect flow — injected wallets, WalletConnect/mobile, chain switching. */
export function ConnectWalletButton() {
  return <ConnectButton showBalance={false} />;
}
