import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { coston2 } from "./chain";

// Reown (WalletConnect) Cloud project ID — real project, "Solvra", created by
// the user at cloud.reown.com. Used directly via wagmi's own walletConnect
// connector rather than RainbowKit's UI: RainbowKit's default wallet catalog
// bundles Coinbase Wallet's SDK, which statically imports optional Solana
// x402-payment modules (@x402/svm/exact/client) that aren't cleanly
// resolvable and break the Next.js build. Two targeted fixes (a curated
// wallet list, installing the missing peers) both failed to route around it,
// so this drops RainbowKit's UI package rather than keep fighting it —
// wallet connection itself is still fully real, just via wagmi directly.
const REOWN_PROJECT_ID = "4471f6d14e411b041863e99f85958a7b";

export const wagmiConfig = createConfig({
  chains: [coston2],
  connectors: [injected(), walletConnect({ projectId: REOWN_PROJECT_ID, showQrModal: true })],
  transports: {
    [coston2.id]: http(),
  },
  ssr: true,
});
