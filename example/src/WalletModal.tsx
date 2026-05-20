import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useValue } from "utsutsu";
import { X, ExternalLink, Wallet as WalletIcon } from "lucide-react";
import type { Wallet } from "@wallet-standard/base";
import {
  walletsLens,
  publicKeyLens,
  connectingLens,
  connect,
  disconnect,
  POPULAR_WALLETS,
} from "../../src/index.js";

export function WalletModal() {
  const wallets = useValue(walletsLens);
  const publicKey = useValue(publicKeyLens);
  const isConnecting = useValue(connectingLens);
  const [open, setOpen] = useState(false);

  // Merge discovered wallets with static registry
  const listToRender = POPULAR_WALLETS.map((registryWallet) => {
    const installedInstance = wallets.find(
      (w) => w.name.toLowerCase().includes(registryWallet.name.toLowerCase())
    );
    return {
      name: registryWallet.name,
      icon: installedInstance ? installedInstance.icon : registryWallet.icon,
      url: registryWallet.url,
      isInstalled: !!installedInstance,
      instance: installedInstance,
    };
  });

  const otherInstalledWallets = wallets.filter(
    (w) => !POPULAR_WALLETS.some((rw) => w.name.toLowerCase().includes(rw.name.toLowerCase()))
  );

  const finalWallets = [
    ...listToRender,
    ...otherInstalledWallets.map((w) => ({
      name: w.name,
      icon: w.icon,
      url: "#",
      isInstalled: true,
      instance: w,
    })),
  ];

  // When wallet clicked — connect directly (revokeWalletTrust forces the native popup)
  async function handleWalletClick(wallet: Wallet) {
    await connect(wallet);
    setOpen(false);
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
  }

  // ── Connected chip ──────────────────────────────────────────────────────────
  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm font-mono shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-900/50 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // ── Dialog ──────────────────────────────────────────────────────────────────
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          disabled={isConnecting}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <WalletIcon className="w-4 h-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[380px] p-6 bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl z-50 text-zinc-100 focus:outline-none">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
            <Dialog.Title className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              Connect a Wallet
            </Dialog.Title>
            <Dialog.Close className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-2.5 mt-5">
            {finalWallets.map((wallet) => {
              if (wallet.isInstalled && wallet.instance) {
                return (
                  <button
                    key={wallet.name}
                    onClick={() => handleWalletClick(wallet.instance!)}
                    className="flex items-center justify-between w-full p-3 bg-zinc-900/40 hover:bg-zinc-900/90 border border-zinc-800/50 hover:border-zinc-700/80 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-8 h-8 rounded-lg object-contain bg-zinc-950 p-1 group-hover:scale-105 transition-transform"
                      />
                      <span className="text-sm font-semibold text-zinc-200 group-hover:text-white">
                        {wallet.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-900/30">
                      Detected
                    </span>
                  </button>
                );
              }

              return (
                <a
                  key={wallet.name}
                  href={wallet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-3 bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-3 opacity-60 group-hover:opacity-80">
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-8 h-8 rounded-lg object-contain filter grayscale p-1 bg-zinc-950"
                    />
                    <span className="text-sm font-medium text-zinc-300">
                      {wallet.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800/40">
                    Install
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>
              );
            })}
          </div>
          <div className="mt-5 text-[11px] text-center text-zinc-500">
            Securely connecting via Solana Wallet Standard.
          </div>

          <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800/40 rounded-xl space-y-1.5 text-center text-zinc-400 shadow-inner">
            <p className="text-[11px] font-bold text-indigo-400 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              💡 Extension Auto-Connect Tip
            </p>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Once approved, Phantom whitelists this dApp domain. Subsequent connections will connect instantly without a popup (matching major dApps like Jupiter). To switch accounts, simply select it inside the Phantom extension — Hirin will sync instantly!
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
