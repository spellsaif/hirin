import { createUtsutsu } from "utsutsu";
import type { Wallet } from "@wallet-standard/base";

export interface HirinState {
  wallets: readonly Wallet[];
  activeWallet: Wallet | null;
  publicKey: string | null;
  connecting: boolean;
  disconnecting: boolean;
  error: string | null;
}

export const store = createUtsutsu<HirinState>({
  wallets: [],
  activeWallet: null,
  publicKey: null,
  connecting: false,
  disconnecting: false,
  error: null,
});

// Lenses (precise read-only states)
export const walletsLens = store.lens("wallets", (s) => s.wallets);
export const activeWalletLens = store.lens("activeWallet", (s) => s.activeWallet);
export const publicKeyLens = store.lens("publicKey", (s) => s.publicKey);
export const connectingLens = store.lens("connecting", (s) => s.connecting);
export const disconnectingLens = store.lens("disconnecting", (s) => s.disconnecting);
export const errorLens = store.lens("error", (s) => s.error);
export const connectedLens = store.lens("connected", (s) => !!s.publicKey);

// Intents (transactions)
export const updateWallets = store.intent("updateWallets", (s, wallets: readonly Wallet[]) => ({
  ...s,
  wallets,
}));

export const startConnecting = store.intent("startConnecting", (s) => ({
  ...s,
  connecting: true,
  error: null,
}));

export const connectWallet = store.intent("connectWallet", (s, payload: { wallet: Wallet; publicKey: string }) => ({
  ...s,
  activeWallet: payload.wallet,
  publicKey: payload.publicKey,
  connecting: false,
  error: null,
}));

export const startDisconnecting = store.intent("startDisconnecting", (s) => ({
  ...s,
  disconnecting: true,
  error: null,
}));

export const disconnectWallet = store.intent("disconnectWallet", (s) => ({
  ...s,
  activeWallet: null,
  publicKey: null,
  connecting: false,
  disconnecting: false,
  error: null,
}));

export const setWalletError = store.intent("setError", (s, error: string) => ({
  ...s,
  error,
  connecting: false,
  disconnecting: false,
}));
