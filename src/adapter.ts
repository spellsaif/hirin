import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { 
  store, 
  startConnecting, 
  connectWallet, 
  startDisconnecting, 
  disconnectWallet, 
  setWalletError 
} from "./store.js";
import { initWalletDiscovery } from "./discovery.js";

const LAST_WALLET_KEY = "hirin:lastWallet";
let eventsCleanup: (() => void) | null = null;

/**
 * Resets in-progress connection/disconnection state without clearing connection.
 * Used by cleanup functions to avoid stale "connecting..." UI.
 */
function resetTransientState() {
  const s = store.get();
  if (s.connecting || s.disconnecting) {
    store.rootCell.set({ ...s, connecting: false, disconnecting: false });
  }
}

/**
 * Registers change listeners on the active wallet (account changes, disconnects).
 */
function setupEventsListener(wallet: Wallet) {
  clearEventsListener();

  const eventsFeature = wallet.features["standard:events"];
  if (eventsFeature) {
    try {
      eventsCleanup = (eventsFeature as any).on("change", (properties: any) => {
        if ("accounts" in properties) {
          const accounts = properties.accounts;
          if (accounts.length > 0) {
            // User switched account inside the extension
            const activeAcc = accounts[0];
            connectWallet({
              wallet,
              publicKey: activeAcc.address,
            });
          } else {
            // Active accounts cleared, perform disconnect
            disconnectWallet();
            clearEventsListener();
          }
        }
      });
    } catch (err) {
      console.error("Failed to setup wallet events listener:", err);
    }
  }
}

/**
 * Clears active wallet change listeners.
 */
function clearEventsListener() {
  if (eventsCleanup) {
    eventsCleanup();
    eventsCleanup = null;
  }
}

/**
 * Forces a full trust revoke so the wallet shows its native popup again.
 * Tries the wallet's own legacy window API first (most effective),
 * then falls back to standard:disconnect.
 */
async function revokeWalletTrust(wallet: Wallet): Promise<void> {
  // 1. Try the wallet's own legacy window API (e.g. window.phantom.solana.disconnect())
  //    This is the only reliable way to remove a site from Phantom's trusted list.
  if (typeof window !== "undefined") {
    const walletNameLower = wallet.name.toLowerCase();

    try {
      if (walletNameLower.includes("phantom")) {
        await (window as any).phantom?.solana?.disconnect();
      } else if (walletNameLower.includes("solflare")) {
        await (window as any).solflare?.disconnect();
      } else if (walletNameLower.includes("backpack")) {
        await (window as any).backpack?.disconnect();
      }
    } catch {
      // Non-fatal — continue to standard fallback
    }
  }

  // 2. Also call standard:disconnect as a secondary cleanup
  const disconnectFeature = wallet.features["standard:disconnect"];
  if (disconnectFeature) {
    try {
      await (disconnectFeature as any).disconnect();
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Connect to a specific Wallet Standard instance.
 * Always revokes trust first to force the wallet's native account-picker popup.
 */
export async function connect(wallet: Wallet) {
  console.log("[Hirin] connect called for wallet:", wallet.name);
  const connectFeature = wallet.features["standard:connect"];
  if (!connectFeature) {
    throw new Error(`Wallet ${wallet.name} does not support standard:connect`);
  }

  startConnecting();
  clearEventsListener();

  try {
    // Revoke trust so the wallet shows its native popup on next connect
    await revokeWalletTrust(wallet);

    console.log("[Hirin] Invoking wallet connect (expecting native popup)...");
    const result = await (connectFeature as any).connect();
    console.log("[Hirin] Connect resolved:", result);

    const { accounts } = result;
    const account = accounts[0];
    if (!account) {
      throw new Error("No accounts found after connecting.");
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_WALLET_KEY, wallet.name);
    }

    connectWallet({ wallet, publicKey: account.address });
    setupEventsListener(wallet);
    console.log("[Hirin] Connected to:", account.address);
  } catch (err: any) {
    console.error("[Hirin] Connect failed:", err);
    setWalletError(err.message || "Failed to connect wallet.");
    throw err;
  }
}


/**
 * Disconnect the active wallet.
 */
export async function disconnect() {
  console.log("[Hirin] disconnect called");
  const activeWallet = store.get().activeWallet;
  if (!activeWallet) {
    console.log("[Hirin] No active wallet to disconnect, resetting local state");
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAST_WALLET_KEY);
    }
    disconnectWallet();
    return;
  }

  startDisconnecting();
  clearEventsListener();

  try {
    const disconnectFeature = activeWallet.features["standard:disconnect"];
    if (disconnectFeature) {
      console.log("[Hirin] Invoking wallet disconnect feature...");
      await (disconnectFeature as any).disconnect();
      console.log("[Hirin] Wallet disconnect feature finished");
    }
  } catch (err) {
    console.warn("[Hirin] Wallet standard disconnect feature threw an error:", err);
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAST_WALLET_KEY);
    }
    disconnectWallet();
    console.log("[Hirin] Disconnection cleanup completed");
  }
}

/**
 * Attempt to silently auto-connect to the last connected wallet.
 * Returns a cancel function to abort state mutations if the caller unmounts.
 */
export function autoConnect(): () => void {
  let cancelled = false;

  if (typeof window === "undefined") return () => { cancelled = true; };

  const lastWalletName = localStorage.getItem(LAST_WALLET_KEY);
  if (!lastWalletName) return () => { cancelled = true; };

  const wallets = store.get().wallets;
  const targetWallet = wallets.find((w: Wallet) => w.name === lastWalletName);
  if (!targetWallet) return () => { cancelled = true; };

  const connectFeature = targetWallet.features["standard:connect"];
  if (!connectFeature) return () => { cancelled = true; };

  console.log("[Hirin] Auto-connecting to:", targetWallet.name);
  startConnecting();

  (async () => {
    try {
      const connectionPromise = (connectFeature as any).connect({ silent: true });
      const result = await Promise.race([
        connectionPromise,
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("Auto-connect timeout")), 3000)
        ),
      ]);

      if (cancelled) return;
      console.log("[Hirin] Auto-connect resolved:", result);
      const { accounts } = result;
      const account = accounts[0];
      if (account) {
        connectWallet({ wallet: targetWallet, publicKey: account.address });
        setupEventsListener(targetWallet);
      } else {
        disconnectWallet();
      }
    } catch (err) {
      if (cancelled) return;
      console.warn("[Hirin] autoConnect failed or timed out:", err);
      disconnectWallet();
    }
  })();

  return () => { cancelled = true; };
}

/**
 * Initializes Hirin discovery and auto-connection.
 * Safe to call in SSR contexts — and React StrictMode safe.
 * Returns a cleanup function.
 */
export function initializeHirin(options?: { autoConnect?: boolean }): () => void {
  const cleanup = initWalletDiscovery();
  let cancelAutoConnect: (() => void) | null = null;

  if (options?.autoConnect && typeof window !== "undefined") {
    const state = store.get();
    if (state.wallets.length > 0) {
      cancelAutoConnect = autoConnect();
    } else {
      // Wait for the first wallet list population to attempt autoConnect
      let cancelled = false;
      const unsubscribe = store.rootCell.subscribe(() => {
        if (cancelled) return;
        if (store.get().wallets.length > 0) {
          unsubscribe();
          cancelAutoConnect = autoConnect();
        }
      });
      cancelAutoConnect = () => {
        cancelled = true;
        unsubscribe();
      };
    }
  }

  return () => {
    cleanup();
    clearEventsListener();
    // Cancel any in-flight auto-connect and reset transient UI state
    if (cancelAutoConnect) cancelAutoConnect();
    resetTransientState();
  };
}

/**
 * Sign a transaction and send it to the network.
 */
export async function signAndSendTransaction(transaction: Uint8Array, options?: any): Promise<Uint8Array> {
  const state = store.get();
  const activeWallet = state.activeWallet;
  if (!activeWallet || !state.publicKey) {
    throw new Error("Wallet is not connected.");
  }

  const feature = activeWallet.features["solana:signAndSendTransaction"];
  if (!feature) {
    throw new Error(`Active wallet does not support solana:signAndSendTransaction`);
  }

  const account = activeWallet.accounts.find((acc: WalletAccount) => acc.address === state.publicKey);
  if (!account) {
    throw new Error("Active account not found in wallet.");
  }

  try {
    const outputs = await (feature as any).signAndSendTransaction({
      account,
      transaction,
      options,
    });
    return outputs[0]?.signature;
  } catch (err: any) {
    throw new Error(err.message || "Failed to sign and send transaction.");
  }
}

/**
 * Sign a transaction without broadcasting it.
 */
export async function signTransaction(transaction: Uint8Array): Promise<Uint8Array> {
  const state = store.get();
  const activeWallet = state.activeWallet;
  if (!activeWallet || !state.publicKey) {
    throw new Error("Wallet is not connected.");
  }

  const feature = activeWallet.features["solana:signTransaction"];
  if (!feature) {
    throw new Error(`Active wallet does not support solana:signTransaction`);
  }

  const account = activeWallet.accounts.find((acc: WalletAccount) => acc.address === state.publicKey);
  if (!account) {
    throw new Error("Active account not found in wallet.");
  }

  try {
    const outputs = await (feature as any).signTransaction({
      account,
      transaction,
    });
    return outputs[0]?.signedTransaction;
  } catch (err: any) {
    throw new Error(err.message || "Failed to sign transaction.");
  }
}

/**
 * Sign arbitrary message bytes.
 */
export async function signMessage(message: Uint8Array): Promise<Uint8Array> {
  const state = store.get();
  const activeWallet = state.activeWallet;
  if (!activeWallet || !state.publicKey) {
    throw new Error("Wallet is not connected.");
  }

  const feature = activeWallet.features["solana:signMessage"];
  if (!feature) {
    throw new Error(`Active wallet does not support solana:signMessage`);
  }

  const account = activeWallet.accounts.find((acc: WalletAccount) => acc.address === state.publicKey);
  if (!account) {
    throw new Error("Active account not found in wallet.");
  }

  try {
    const outputs = await (feature as any).signMessage({
      account,
      message,
    });
    return outputs[0]?.signature;
  } catch (err: any) {
    throw new Error(err.message || "Failed to sign message.");
  }
}
