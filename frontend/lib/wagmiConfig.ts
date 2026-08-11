import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { coston2 } from "./chain";

/**
 * A single injected-wallet connector (MetaMask, Rabby, Brave Wallet, etc.) —
 * what anyone testing this on Coston2 actually has installed. Deliberately
 * not using RainbowKit (its bundled Coinbase Wallet connector breaks the
 * Next.js build, see git history) or wagmi's walletConnect() connector
 * (its default QR modal lists hundreds of unrelated wallets — Injective,
 * Solana wallets, etc. — which is noise for a single-chain EVM testnet demo,
 * not a real integration need here).
 */
export const wagmiConfig = createConfig({
  chains: [coston2],
  connectors: [injected()],
  transports: {
    [coston2.id]: http(),
  },
  ssr: true,
});
