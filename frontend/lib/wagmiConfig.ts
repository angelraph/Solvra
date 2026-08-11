import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { coston2 } from "./chain";

// Reown (WalletConnect) Cloud project ID — real project, "Solvra", created by
// the user at cloud.reown.com. Enables the full RainbowKit connect modal
// (injected wallets, WalletConnect/mobile, etc.), not just MetaMask.
const REOWN_PROJECT_ID = "4471f6d14e411b041863e99f85958a7b";

export const wagmiConfig = getDefaultConfig({
  appName: "Solvra",
  projectId: REOWN_PROJECT_ID,
  chains: [coston2],
  ssr: true,
});
