import { defineChain } from "viem";

/**
 * Flare Coston2 testnet — chain ID 114. This is where every Solvra contract
 * is actually deployed (see docs/deployments.md); there is no "local" or
 * "mainnet" mode in this app.
 */
export const coston2 = defineChain({
  id: 114,
  name: "Flare Testnet Coston2",
  nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
  },
  blockExplorers: {
    default: {
      name: "Coston2 Explorer",
      url: "https://coston2-explorer.flare.network",
    },
  },
  testnet: true,
});
