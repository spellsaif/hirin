import { getWallets } from "@wallet-standard/core";
import type { Wallet } from "@wallet-standard/base";
import { updateWallets } from "./store.js";

let walletsListenerCleanUp: (() => void) | null = null;

/**
 * Returns true if the wallet supports at least one Solana chain.
 */
function isSolanaWallet(wallet: Wallet): boolean {
  return wallet.chains.some((chain) => chain.startsWith("solana:"));
}

/**
 * Initializes the Wallet Standard discovery listener.
 * Only Solana-compatible wallets are stored in state.
 * Safe to call on server (SSR) - does nothing if window is undefined.
 * Returns a cleanup function.
 */
export function initWalletDiscovery(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // If already listening, return the existing cleanup
  if (walletsListenerCleanUp) {
    return walletsListenerCleanUp;
  }

  const { get, on } = getWallets();

  // Trigger initial retrieval - only Solana wallets
  updateWallets(get().filter(isSolanaWallet));

  // Listen for registration/unregistration of wallets
  const unregisterRegister = on("register", () => {
    updateWallets(get().filter(isSolanaWallet));
  });

  const unregisterUnregister = on("unregister", () => {
    updateWallets(get().filter(isSolanaWallet));
  });

  walletsListenerCleanUp = () => {
    unregisterRegister();
    unregisterUnregister();
    walletsListenerCleanUp = null;
  };

  return walletsListenerCleanUp;
}
