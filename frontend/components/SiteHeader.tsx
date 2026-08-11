import Link from "next/link";
import { ConnectWalletButton } from "./ConnectWalletButton";

const NAV = [
  { href: "/fassets", label: "FAssets Agent Solvency" },
  { href: "/credit", label: "Consumer Credit" },
  { href: "/relying-party", label: "Relying Party" },
  { href: "/trust", label: "Trust Center" },
  { href: "/developers", label: "Developers" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-neutral-50">Solvra</span>
          <span className="hidden text-xs text-neutral-500 sm:inline">
            Prove solvency. Reveal nothing.
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ConnectWalletButton />
      </div>
    </header>
  );
}
