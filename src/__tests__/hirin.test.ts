import { vi, describe, it, expect, beforeEach } from "vitest";
import { store, connectedLens } from "../store.js";
import { initializeHirin, connect, disconnect } from "../adapter.js";
import type { Wallet } from "@wallet-standard/base";

// Mock the Wallet Standard core module
const mockListeners = new Set<(wallet: Wallet) => void>();
let mockWalletsList: Wallet[] = [];

vi.mock("@wallet-standard/core", () => {
  return {
    getWallets: () => ({
      get: () => mockWalletsList,
      on: (event: string, listener: any) => {
        if (event === "register") {
          mockListeners.add(listener);
          return () => mockListeners.delete(listener);
        }
        return () => {};
      },
    }),
  };
});

// A helper to create a mock standard-compliant wallet
function createMockWallet(name: string, address: string): Wallet {
  const account = {
    address,
    publicKey: new Uint8Array(32),
    chains: ["solana:mainnet" as const],
    features: [],
  };

  return {
    version: "1.0.0",
    name,
    icon: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" as any,
    chains: ["solana:mainnet" as const],
    features: {
      "standard:connect": {
        connect: async () => ({
          accounts: [account],
        }),
      },
      "standard:disconnect": {
        disconnect: async () => {},
      },
    },
    accounts: [account],
  };
}

describe("Hirin Wallet Adapter", () => {
  beforeEach(() => {
    // Reset global state mocks
    mockWalletsList = [];
    mockListeners.clear();

    // Reset store state
    store.rootCell.set({
      wallets: [],
      activeWallet: null,
      publicKey: null,
      connecting: false,
      disconnecting: false,
      error: null,
    });

    // Mock window global
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it("should initialize discovery and populate wallets list", () => {
    const mockWallet = createMockWallet("Phantom", "7xKX....");
    mockWalletsList.push(mockWallet);

    const cleanup = initializeHirin();
    
    // Initial wallets should be loaded
    expect(store.get().wallets).toHaveLength(1);
    expect(store.get().wallets[0].name).toBe("Phantom");

    cleanup();
  });

  it("should update wallets dynamically when a new wallet registers", () => {
    const cleanup = initializeHirin();
    expect(store.get().wallets).toHaveLength(0);

    const mockWallet = createMockWallet("Solflare", "9xAB....");
    mockWalletsList.push(mockWallet);

    // Simulate registration event
    mockListeners.forEach((listener) => listener(mockWallet));

    expect(store.get().wallets).toHaveLength(1);
    expect(store.get().wallets[0].name).toBe("Solflare");

    cleanup();
  });

  it("should connect to a wallet standard instance successfully", async () => {
    const mockWallet = createMockWallet("Phantom", "5xyz....");

    expect(connectedLens.get()).toBe(false);

    // connect directly
    await connect(mockWallet);

    // Connected state should be populated
    expect(store.get().connecting).toBe(false);
    expect(connectedLens.get()).toBe(true);
    expect(store.get().publicKey).toBe("5xyz....");
    expect(store.get().activeWallet?.name).toBe("Phantom");
  });

  it("should disconnect successfully", async () => {
    const mockWallet = createMockWallet("Phantom", "5xyz....");

    // Connect first
    await connect(mockWallet);
    expect(connectedLens.get()).toBe(true);

    // Disconnect
    await disconnect();

    expect(connectedLens.get()).toBe(false);
    expect(store.get().publicKey).toBeNull();
    expect(store.get().activeWallet).toBeNull();
  });
});
