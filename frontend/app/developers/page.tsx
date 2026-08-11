import { CONTRACTS } from "@/lib/contracts";

const explorerAddr = (addr: string) => `https://coston2-explorer.flare.network/address/${addr}`;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-300">
      <code>{children}</code>
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-blush">Ask Without Seeing</p>
      <h1 className="mt-2 text-3xl font-semibold text-neutral-50">Build on Solvra</h1>
      <p className="mt-3 text-neutral-400">
        There&apos;s no hosted REST API yet. That would just be a thin wrapper around the calls below, and it felt
        more honest to show the real, already-deployed integration surface than a mocked endpoint that doesn&apos;t
        exist. Every snippet here is a real call against contracts already live on Coston2.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">1. Request an evaluation</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Call{" "}
          <a href={explorerAddr(CONTRACTS.solvraInstructionSender.address)} target="_blank" rel="noreferrer" className="text-blush hover:underline">
            SolvraInstructionSender
          </a>
          . This is the real function the /credit page calls when you click &quot;Request Attestation.&quot;
        </p>
        <CodeBlock>{`import { writeContract } from "@wagmi/core";
import { toHex } from "viem";

const message = {
  subject: walletAddress,
  requestedCreditUsd: "500",
  publicWalletBalanceUsd: "1200.50",
  privateIncomeUsd: "3000",       // stays off-chain
  privateLiabilitiesUsd: "400",   // stays off-chain
};

await writeContract(config, {
  address: "${CONTRACTS.solvraInstructionSender.address}",
  abi: SolvraInstructionSenderAbi,
  functionName: "sendEvaluateConsumerCredit",
  args: [toHex(JSON.stringify(message))],
  value: 1_000_000n, // instruction fee
});`}</CodeBlock>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          2. Check a subject&apos;s result (the only thing you can read)
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          One view call against{" "}
          <a href={explorerAddr(CONTRACTS.attestationRegistry.address)} target="_blank" rel="noreferrer" className="text-blush hover:underline">
            AttestationRegistry
          </a>
          . No income figures, no liability figures, no reserve breakdown. Just PASS/FAIL and a tier. This is the
          exact call the /relying-party page makes.
        </p>
        <CodeBlock>{`import { readContract } from "@wagmi/core";

const [passed, tier, validUntil] = await readContract(config, {
  address: "${CONTRACTS.attestationRegistry.address}",
  abi: AttestationRegistryAbi,
  functionName: "isValid",
  args: [subjectAddress, policyIdBytes32],
});
// passed: boolean, tier: 0(FAIL)-3(A), validUntil: unix seconds`}</CodeBlock>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">3. Register your own policy</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Anyone can register a new policy on the shared{" "}
          <a href={explorerAddr(CONTRACTS.policyRegistry.address)} target="_blank" rel="noreferrer" className="text-blush hover:underline">
            PolicyRegistry
          </a>
          , which is what makes Solvra a protocol rather than a single app. Evaluating a genuinely new policy still
          needs a matching TEE handler. The registry entry alone is just metadata plus a commitment to the ruleset
          hash.
        </p>
        <CodeBlock>{`await writeContract(config, {
  address: "${CONTRACTS.policyRegistry.address}",
  abi: PolicyRegistryAbi,
  functionName: "registerPolicy",
  args: [
    policyIdBytes32,
    "My Custom Policy",
    "https://example.com/policy-spec",
    rulesetCommitmentHash,
    2, // PolicyType.Generic
  ],
});`}</CodeBlock>
      </section>

      <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
        <p className="text-sm text-neutral-400">
          Full source, ABIs, and the TEE extension&apos;s policy engine:{" "}
          <a
            href="https://github.com/angelraph/Solvra"
            target="_blank"
            rel="noreferrer"
            className="text-blush hover:underline"
          >
            github.com/angelraph/Solvra
          </a>
        </p>
      </section>
    </div>
  );
}
