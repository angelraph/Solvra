import SolvraInstructionSenderAbi from "./abis/SolvraInstructionSender.json";
import PolicyRegistryAbi from "./abis/PolicyRegistry.json";
import AttestationRegistryAbi from "./abis/AttestationRegistry.json";
import FlareContractRegistryAbi from "./abis/FlareContractRegistry.json";
import IFtsoFeedIdConverterAbi from "./abis/IFtsoFeedIdConverter.json";
import FtsoV2InterfaceAbi from "./abis/FtsoV2Interface.json";
import IAssetManagerMinimalAbi from "./abis/IAssetManagerMinimal.json";

/**
 * Every address here is a real Coston2 deployment — see docs/deployments.md
 * at the repo root for tx hashes and independent verification notes. Nothing
 * in this file is a placeholder.
 */
export const CONTRACTS = {
  solvraInstructionSender: {
    address: "0x4F9450A35778feabC5efb652b516d6243b24Bc6A" as const,
    abi: SolvraInstructionSenderAbi,
  },
  policyRegistry: {
    address: "0xba4D15A738c09464A38aBa91B77A562B11Cca7E2" as const,
    abi: PolicyRegistryAbi,
  },
  attestationRegistry: {
    address: "0x243Ae9874F790f4ffE5D2c18a0fF40c5a10040fb" as const,
    abi: AttestationRegistryAbi,
  },
  /** Flare's own system contract — the entry point for resolving every other
   * Flare-managed contract's current address by name (FTSO, FAssets, FDC).
   * Fixed address, same across all Flare networks. */
  flareContractRegistry: {
    address: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019" as const,
    abi: FlareContractRegistryAbi,
  },
  /** Resolved live via flareContractRegistry.getContractAddressByName("AssetManagerFXRP"). */
  assetManagerFXRP: {
    address: "0xc1Ca88b937d0b528842F95d5731ffB586f4fbDFA" as const,
    abi: IAssetManagerMinimalAbi,
  },
  /** Resolved live via flareContractRegistry.getContractAddressByName("FtsoV2"). */
  ftsoV2: {
    address: "0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d" as const,
    abi: FtsoV2InterfaceAbi,
  },
} as const;

/**
 * bytes21 feed id for "XRP/USD", category 1 (crypto) — computed live via
 * IFtsoFeedIdConverter.getFeedId(1, "XRP/USD") and confirmed stable (it's a
 * pure function of the category+name, not a lookup that can change).
 */
export const XRP_USD_FEED_ID = "0x015852502f55534400000000000000000000000000" as const;

/** A real, live, publicly-available FAssets agent on Coston2 (one of 4 found
 * via assetManagerFXRP.getAllAgents), used as the default example on the
 * /fassets page. Its public collateral data is real; see that page for how
 * the private-input disclosure is handled. */
export const EXAMPLE_AGENT_VAULT = "0x55c815260cBE6c45Fe5bFe5FF32E3C7D746f14dC" as const;

export const ABIS = {
  ftsoFeedIdConverter: IFtsoFeedIdConverterAbi,
  ftsoV2: FtsoV2InterfaceAbi,
  assetManager: IAssetManagerMinimalAbi,
} as const;

export const POLICY_IDS = {
  fassetsAgentSolvency: "fassets-agent-solvency-v1",
  consumerCreditLine: "consumer-credit-line-v1",
} as const;
