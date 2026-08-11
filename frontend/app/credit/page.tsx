"use client";

import { useMemo, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toHex, formatEther } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { useC2FlrBalance, useFlrUsdPrice } from "@/lib/hooks";

const explorerTx = (hash: string) => `https://coston2-explorer.flare.network/tx/${hash}`;

export default function CreditPage() {
  const { address, isConnected } = useAccount();
  const [requestedCredit, setRequestedCredit] = useState("500");
  const [privateIncome, setPrivateIncome] = useState("3000");
  const [privateLiabilities, setPrivateLiabilities] = useState("400");

  const balance = useC2FlrBalance(address);
  const flrPrice = useFlrUsdPrice();

  const publicWalletBalanceUsd =
    balance.data && flrPrice.price !== undefined
      ? Number(formatEther(balance.data.value)) * flrPrice.price
      : undefined;

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  const preview = useMemo(() => {
    if (publicWalletBalanceUsd === undefined) return null;
    const income = Number(privateIncome || 0);
    const liabilities = Number(privateLiabilities || 0);
    const requested = Number(requestedCredit || 0);
    if (requested <= 0) return null;

    const totalFundsUsd = publicWalletBalanceUsd + income;
    const compositeReserveUsd = publicWalletBalanceUsd + income * 0.3;
    const requiredReserveUsd = 1.2 * requested;
    const maxLiabilitiesUsd = 0.4 * totalFundsUsd;
    const ratio = requiredReserveUsd > 0 ? compositeReserveUsd / requiredReserveUsd : Infinity;
    const liabilitiesOk = liabilities <= maxLiabilitiesUsd;
    const passes = ratio >= 1.0 && liabilitiesOk;
    const tier = !passes ? "FAIL" : ratio >= 2.0 ? "A" : ratio >= 1.5 ? "B" : "C";
    return { ratio, liabilitiesOk, passes, tier, compositeReserveUsd, requiredReserveUsd, maxLiabilitiesUsd };
  }, [publicWalletBalanceUsd, privateIncome, privateLiabilities, requestedCredit]);

  function handleSubmit() {
    if (!address || publicWalletBalanceUsd === undefined) return;
    const message = {
      subject: address,
      requestedCreditUsd: requestedCredit,
      publicWalletBalanceUsd: publicWalletBalanceUsd.toFixed(6),
      privateIncomeUsd: privateIncome,
      privateLiabilitiesUsd: privateLiabilities,
    };
    const messageHex = toHex(JSON.stringify(message));

    writeContract({
      address: CONTRACTS.solvraInstructionSender.address,
      abi: CONTRACTS.solvraInstructionSender.abi,
      functionName: "sendEvaluateConsumerCredit",
      args: [messageHex],
      value: BigInt(1_000_000),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-blush">Secondary vertical · same engine</p>
      <h1 className="mt-2 text-3xl font-semibold text-neutral-50">Consumer Credit Line Eligibility</h1>
      <p className="mt-3 text-neutral-400">
        The identical policy engine that evaluates FAssets agents, applied to a wallet instead. Proof this is a
        general protocol, not a single-purpose lending app. See{" "}
        <code className="text-neutral-300">evaluateReserveAdequacyPolicy</code> in{" "}
        <code className="text-neutral-300">policyEngine.ts</code>.
      </p>

      {!isConnected ? (
        <p className="mt-10 text-sm text-neutral-500">Connect your wallet above. This page reads your real balance.</p>
      ) : (
        <>
          <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-blush">Public · read live from chain</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stat
                label="Wallet C2FLR balance"
                value={balance.data ? `${Number(formatEther(balance.data.value)).toFixed(4)} C2FLR` : "Loading…"}
              />
              <Stat
                label="Live FLR/USD (FTSOv2)"
                value={flrPrice.price !== undefined ? `$${flrPrice.price.toFixed(6)}` : "Loading…"}
              />
              <Stat
                label="Wallet balance in USD"
                value={publicWalletBalanceUsd !== undefined ? `$${publicWalletBalanceUsd.toFixed(2)}` : "Loading…"}
              />
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Requested credit (USD)</p>
            <input
              value={requestedCredit}
              onChange={(e) => setRequestedCredit(e.target.value)}
              inputMode="decimal"
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-amaranth focus:outline-none"
            />
          </section>

          <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-blush">
              Private · never published, only its hash
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Declared income (USD)</label>
                <input
                  value={privateIncome}
                  onChange={(e) => setPrivateIncome(e.target.value)}
                  inputMode="decimal"
                  className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-amaranth focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Declared liabilities (USD)</label>
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
            <button
              onClick={handleSubmit}
              disabled={isPending || receipt.isLoading || !preview}
              className="rounded-lg bg-amaranth px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Confirm in wallet…" : receipt.isLoading ? "Waiting for confirmation…" : "Request Attestation On-Chain"}
            </button>
            {writeError && <p className="mt-3 text-sm text-red-400">{writeError.message}</p>}
            {txHash && (
              <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
                <p className="text-neutral-300">
                  Instruction sent:{" "}
                  <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className="font-mono text-blush hover:underline">
                    {txHash.slice(0, 10)}…{txHash.slice(-8)}
                  </a>
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{label}</span>
        <span className="rounded bg-amaranth/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blush">
          live
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-100">{value}</p>
    </div>
  );
}
