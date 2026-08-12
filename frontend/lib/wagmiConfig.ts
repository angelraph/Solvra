import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { coston2 } from "./chain";

// Reown (WalletConnect) Cloud project ID — real project, "Solvra", created by
// the user at cloud.reown.com.
const REOWN_PROJECT_ID = "4471f6d14e411b041863e99f85958a7b";

/**
 * Injected wallets (MetaMask, Rabby, Brave Wallet, etc. — via EIP-6963, see
 * ConnectWalletButton) as the fast path, plus WalletConnect as a fallback for
 * anyone without a browser extension (mobile, or a desktop wallet that only
 * does WalletConnect). WalletConnect was dropped once before because its
 * default QR modal lists every wallet on the protocol regardless of chain
 * (Injective, Solana wallets, etc.) — noise, but not a reason to leave
 * extension-less users with no way to connect at all. Deliberately still not
 * using RainbowKit: its bundled Coinbase Wallet connector statically imports
 * Solana x402 modules that don't resolve and break the Next.js build (see
 * git history) — wagmi's own connectors avoid that entirely.
 */
export const wagmiConfig = createConfig({
  chains: [coston2],
  connectors: [injected(), walletConnect({ projectId: REOWN_PROJECT_ID, showQrModal: true })],
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
