import { useReadContract } from "wagmi";
import { CONTRACTS, XRP_USD_FEED_ID } from "./contracts";

/** Real on-chain read of a FAssets agent's public info via AssetManagerFXRP. */
export function useAgentInfo(agentVault: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.assetManagerFXRP.address,
    abi: CONTRACTS.assetManagerFXRP.abi,
    functionName: "getAgentInfo",
    args: agentVault ? [agentVault] : undefined,
    query: { enabled: Boolean(agentVault) },
  });
}

/** Real on-chain read of the live XRP/USD price from FTSOv2. */
export function useXrpUsdPrice() {
  const result = useReadContract({
    address: CONTRACTS.ftsoV2.address,
    abi: CONTRACTS.ftsoV2.abi,
    functionName: "getFeedById",
    args: [XRP_USD_FEED_ID],
  });

  const data = result.data as readonly [bigint, number, bigint] | undefined;
  const price = data ? Number(data[0]) / 10 ** Number(data[1]) : undefined;
  const timestamp = data ? Number(data[2]) : undefined;

  return { ...result, price, timestamp };
}

/** Reads a PolicyRegistry-registered policy's metadata. */
export function usePolicy(policyId: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.policyRegistry.address,
    abi: CONTRACTS.policyRegistry.abi,
    functionName: "getPolicy",
    args: [policyId],
  });
}

/** Reads whether a subject currently holds a PASS, non-expired attestation. */
export function useAttestationValidity(subject: `0x${string}` | undefined, policyId: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.attestationRegistry.address,
    abi: CONTRACTS.attestationRegistry.abi,
    functionName: "isValid",
    args: subject ? [subject, policyId] : undefined,
    query: { enabled: Boolean(subject) },
  });
}
