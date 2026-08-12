"use client";

import { useMemo, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toHex } from "viem";
import { CONTRACTS, EXAMPLE_AGENT_VAULT } from "@/lib/contracts";
import { useAgentInfo, useXrpUsdPrice } from "@/lib/hooks";

const explorerTx = (hash: string) => `https://coston2-explorer.flare.network/tx/${hash}`;
const explorerAddr = (addr: string) => `https://coston2-explorer.flare.network/address/${addr}`;

// AgentInfo.Info — viem decodes named tuple components as an object keyed by
// field name (see extension/contracts/interfaces/fassets/AgentInfo.sol for
// the full struct), not as a positionally-indexed array.
interface AgentInfoStruct {
  status: number;
  underlyingAddressString: string;
  vaultCollateralRatioBIPS: bigint;
  mintedUBA: bigint;
}

// FXRP's underlying-amount decimals. Not yet independently confirmed against
// AssetManagerSettings on-chain — assumed to match XRP's own 6 decimals
// (consistent with the real minted amounts observed on Coston2 agents).
// Flagged here rather than silently assumed correct.
const FXRP_DECIMALS = 6;

function formatUnits(value: bigint, decimals: number): number {
  return Number(value) / 10 ** decimals;
}

export default function FassetsPage() {
  const { address, isConnected } = useAccount();
  const [agentVault, setAgentVault] = useState<string>(EXAMPLE_AGENT_VAULT);
  const [fdcXrpReserve, setFdcXrpReserve] = useState("500");
  const [privateReserve, setPrivateReserve] = useState("1000");
  const [privateLiabilities, setPrivateLiabilities] = useState("50");

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(agentVault);
  const agentInfo = useAgentInfo(isValidAddress ? (agentVault as `0x${string}`) : undefined);
  const xrpPrice = useXrpUsdPrice();

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  const agentData = agentInfo.data as AgentInfoStruct | undefined;
  const collateralRatioBips = agentData ? Number(agentData.vaultCollateralRatioBIPS) : undefined;
  const mintedUBA = agentData ? agentData.mintedUBA : undefined;
  const underlyingXrplAddress = agentData ? agentData.underlyingAddressString : undefined;
  const statusCode = agentData ? Number(agentData.status) : undefined;

  const mintedFAssetAmount = mintedUBA !== undefined ? formatUnits(mintedUBA, FXRP_DECIMALS) : undefined;
  const mintedFAssetValueUsd =
    mintedFAssetAmount !== undefined && xrpPrice.price !== undefined
      ? mintedFAssetAmount * xrpPrice.price
      : undefined;

  const preview = useMemo(() => {
    if (collateralRatioBips === undefined || mintedFAssetValueUsd === undefined || xrpPrice.price === undefined) {
      return null;
    }
    const onChainCollateralUsd = (collateralRatioBips / 10000) * mintedFAssetValueUsd;
    const fdcReserveUsd = Number(fdcXrpReserve || 0) * xrpPrice.price;
    const compositeReserveUsd = onChainCollateralUsd + fdcReserveUsd + Number(privateReserve || 0);
    const requiredReserveUsd = 1.5 * mintedFAssetValueUsd;
    const maxLiabilitiesUsd = 0.1 * compositeReserveUsd;
    const liabilitiesUsd = Number(privateLiabilities || 0);
    const ratio = requiredReserveUsd > 0 ? compositeReserveUsd / requiredReserveUsd : Infinity;
    const liabilitiesOk = liabilitiesUsd <= maxLiabilitiesUsd;
    const passes = ratio >= 1.0 && liabilitiesOk;
    const tier = !passes ? "FAIL" : ratio >= 2.0 ? "A" : ratio >= 1.5 ? "B" : "C";
    return { onChainCollateralUsd, fdcReserveUsd, compositeReserveUsd, requiredReserveUsd, maxLiabilitiesUsd, ratio, liabilitiesOk, passes, tier };
  }, [collateralRatioBips, mintedFAssetValueUsd, xrpPrice.price, fdcXrpReserve, privateReserve, privateLiabilities]);

  function handleSubmit() {
    if (!isValidAddress || collateralRatioBips === undefined || mintedFAssetValueUsd === undefined || xrpPrice.price === undefined) {
      return;
    }
    const message = {
      agentVault,
      onChainCollateralRatioBips: collateralRatioBips,
      mintedFAssetValueUsd: mintedFAssetValueUsd.toFixed(6),
      fdcAttestedXrplReserveXrp: fdcXrpReserve,
      ftsoXrpUsdPrice: xrpPrice.price.toFixed(6),
      privateSupplementaryReserveUsd: privateReserve,
      privateUndisclosedLiabilitiesUsd: privateLiabilities,
    };
    const messageHex = toHex(JSON.stringify(message));

    writeContract({
      address: CONTRACTS.solvraInstructionSender.address,
      abi: CONTRACTS.solvraInstructionSender.abi,
      functionName: "sendEvaluateFassetsAgentSolvency",
      args: [messageHex],
      value: BigInt(1_000_000), // instruction fee in wei, matching the scaffold's convention
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-blush">Flagship · Bounty 1 + 2</p>
      <h1 className="mt-3 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl">
        FAssets Agent Solvency Attestation
      </h1>
      <p className="mt-4 text-lg text-neutral-400">
        Prove a FAssets agent meets a collateral-adequacy policy without publishing its full treasury.
      </p>

      <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Agent vault address</label>
        <input
          value={agentVault}
          onChange={(e) => setAgentVault(e.target.value.trim())}
          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-amaranth focus:outline-none"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Pre-filled with a real, live, publicly-available agent on Coston2 (
          <a href={explorerAddr(EXAMPLE_AGENT_VAULT)} target="_blank" rel="noreferrer" className="text-blush hover:underline">
            view on explorer
          </a>
          ), found via <code className="text-neutral-400">AssetManagerFXRP.getAllAgents()</code>. Paste any other real
          agent vault address to query it instead.
        </p>

        {agentInfo.isLoading && <p className="mt-4 text-sm text-neutral-500">Reading live agent data from Coston2…</p>}
        {agentInfo.isError && (
          <p className="mt-4 text-sm text-red-400">Could not read agent info. Is this a valid agent vault address?</p>
        )}

        {agentData && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Stat label="Status" value={statusCode === 0 ? "NORMAL" : `code ${statusCode}`} live />
            <Stat
              label="On-chain collateral ratio"
              value={collateralRatioBips !== undefined ? `${(collateralRatioBips / 100).toFixed(2)}%` : "Loading…"}
              live
            />
            <Stat
              label="Minted FXRP"
              value={mintedFAssetAmount !== undefined ? `${mintedFAssetAmount.toFixed(2)} FXRP` : "Loading…"}
              live
            />
            <Stat label="XRPL underlying address" value={underlyingXrplAddress ?? "Loading…"} live mono />
            <Stat
              label="Live XRP/USD (FTSOv2)"
              value={xrpPrice.price !== undefined ? `$${xrpPrice.price.toFixed(4)}` : xrpPrice.isError ? "Price unavailable" : "Loading price…"}
              live
            />
            <Stat
              label="Minted FXRP value"
              value={mintedFAssetValueUsd !== undefined ? `$${mintedFAssetValueUsd.toFixed(2)}` : "Loading…"}
              live
            />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-amber-900/50 bg-amber-950/10 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
          FDC-verified · manual input for now
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          This is meant to be the agent&apos;s real XRPL reserve balance, verified on-chain via FDC&apos;s Web2Json
          attestation. That live request/poll flow (roughly 90 to 180 seconds) isn&apos;t wired into this page yet,
          so it&apos;s entered by hand for now. Saying that plainly instead of hiding it.
        </p>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-500">
          XRPL reserve (XRP)
        </label>
        <input
          value={fdcXrpReserve}
          onChange={(e) => setFdcXrpReserve(e.target.value)}
          inputMode="decimal"
          className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
        />
      </section>

      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-blush">
          Private · never published, only its hash
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Supplementary reserves (USD)
            </label>
            <input
              value={privateReserve}
              onChange={(e) => setPrivateReserve(e.target.value)}
              inputMode="decimal"
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-amaranth focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Undisclosed liabilities (USD)
            </label>
            <input
              value={privateLiabilities}
              onChange={(e) => setPrivateLiabilities(e.target.value)}
              inputMode="decimal"
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-amaranth focus:outline-none"
            />
          </div>
        </div>
      </section>

      {preview && (
        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Local preview of the policy result</p>
          <p className="mt-1 text-xs text-neutral-600">
            Computed here in the browser as a live preview. The real verdict comes from Solvra&apos;s TEE, not this
            page, once the instruction below is processed.
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className={`text-2xl font-semibold ${preview.passes ? "text-blush" : "text-red-400"}`}>
              {preview.passes ? "PASS" : "FAIL"}
            </span>
            {preview.passes && <span className="text-lg text-neutral-400">tier {preview.tier}</span>}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Reserve ratio {preview.ratio === Infinity ? "∞" : `${preview.ratio.toFixed(2)}x`} of required · liabilities{" "}
            {preview.liabilitiesOk ? "within" : "over"} cap
          </p>
        </section>
      )}

      <section className="mt-8">
        {!isConnected ? (
          <p className="text-sm text-neutral-500">Connect your wallet above to request a real on-chain attestation.</p>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending || receipt.isLoading || !preview}
            className="rounded-lg bg-amaranth px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Confirm in wallet…" : receipt.isLoading ? "Waiting for confirmation…" : "Request Attestation On-Chain"}
          </button>
        )}
        {writeError && <p className="mt-3 text-sm text-red-400">{writeError.message}</p>}
        {txHash && (
          <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
            <p className="text-neutral-300">
              Instruction sent:{" "}
              <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className="font-mono text-blush hover:underline">
                {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </a>
            </p>
            {receipt.isSuccess && (
              <p className="mt-2 text-neutral-400">
                Confirmed on-chain. The signed TEE result is picked up by Solvra&apos;s extension proxy, and that
                infrastructure is still being connected (see{" "}
                <a
                  href="https://github.com/angelraph/Solvra/blob/main/docs/deployments.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blush hover:underline"
                >
                  docs/deployments.md
                </a>{" "}
                for current status), so no signed verdict is shown here yet. The transaction itself is real.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, live, mono }: { label: string; value: string; live?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{label}</span>
        {live && (
          <span className="rounded bg-amaranth/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blush">
            live
          </span>
        )}
      </div>
      <p className={`mt-1 text-sm text-neutral-100 ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</p>
    </div>
  );
}
