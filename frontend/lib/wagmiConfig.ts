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
    // Explicit timeout: viem's http() transport otherwise has no bound of
    // its own on a single request, so a slow or unresponsive RPC node
    // leaves any call — including the ones wagmi's own silent reconnect
    // makes on mount — hanging indefinitely instead of failing and letting
    // wagmi's state machine settle. 8s per attempt, 2 retries, so a stalled
    // request surfaces as a real error within ~24s worst case rather than
    // never.
    [coston2.id]: http(undefined, { timeout: 8_000, retryCount: 2 }),
  },
  ssr: true,
});
