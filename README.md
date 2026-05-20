# Hirin (日輪) ── Solar-Fast, Precision Solana Wallet Standard Connector

<div align="center">
  <img src="https://raw.githubusercontent.com/spellsaif/hirin/main/assets/hirin_banner.png" alt="Hirin Banner" width="100%" style="border-radius: 16px; margin-bottom: 20px;" onerror="this.style.display='none'" />
  
  <p><em>"A zero-dependency, atomic, and surgical Solana wallet connection library powered by Utsutsu and the native Browser Wallet Standard."</em></p>

  <p align="center">
    <img src="https://img.shields.io/badge/Size-%3C%203KB%20gzipped-emerald?style=flat-square" alt="Size Badge" />
    <img src="https://img.shields.io/badge/Dependencies-Zero-indigo?style=flat-square" alt="Dependency Badge" />
    <img src="https://img.shields.io/badge/SSR--Safe-Guaranteed-violet?style=flat-square" alt="SSR Safe Badge" />
    <img src="https://img.shields.io/badge/State--Management-Utsutsu-rose?style=flat-square" alt="State Management Badge" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License Badge" />
  </p>
</div>

---

## ☀️ The Philosophy of Hirin

In Japanese, **Hirin** (日輪) represents the **Solar Disc** or the radiant **Sun Halo**. In the Solana ecosystem, connecting a user's wallet is the fundamental gateway to on-chain experiences. Yet, traditional wallet adapters have historically cast long, heavy shadows over our codebases:

* **Context Re-Render Cascades:** Legacy adapters bind the wallet state to a monolithic React Context. When the user's connection status, active wallet, or public key changes, the *entire* virtual DOM tree down from the provider undergoes complete re-evaluation, introducing latency and UI micro-stutters.
* **Hydration Crashes:** Server-Side Rendered (SSR) setups (like Next.js App Router) frequently crash during builds or hydration due to eager checks on browser-only `window` variables.
* **Obsolete Wallet Bloat:** Importing outdated adapters forces bundle sizes to balloon, packaging giant SVG icon strings and legacy API wrappers for wallets your users may never use.

**Hirin** was built to eliminate these problems. 

### 1. Surgical Precision (Zero-Context Rendering)
Hirin rejects the traditional React Context approach. Powered by the reactive state cell engine **Utsutsu**, Hirin exposes all wallet states as atomic **Lenses**. When the wallet connects or disconnects, only the specific DOM nodes subscribed to those exact lenses are updated. The rest of your React component tree remains perfectly static.

### 2. Zero-Dependency Core
Hirin contains **zero dependency packages** in its final bundle. It relies entirely on the browser-native **Wallet Standard** (specifically `@wallet-standard/base` and `@wallet-standard/core` under the hood) which are standard interfaces injected directly by modern browser extensions. 

### 3. Server-First Security
Hirin is 100% server-safe. All client discovery mechanisms are lazily evaluated and guarded. You can import Hirin in Next.js React Server Components (RSC) and render custom headless shells without triggering hydration errors.

---

## 🎯 Core Purpose

The primary purpose of **Hirin** is to act as a **lightweight, headless bridge** between your dApp UI and the native browser-injected wallets. 

By offloading discovery, event listening, and session management to the browser's native capabilities, Hirin accomplishes three things:
1. **Future-Proof Discovery:** As new wallets are created and adopted, they automatically register themselves on the user's browser via the Wallet Standard. Hirin detects them instantly—**no library updates or new adapter installations required**.
2. **Event-Driven Reactiveness:** Utilizing push-based `standard:events`, Hirin synchronizes account switches or locks inside the wallet extension instantly, without any background polling or interval queries.
3. **Decoupled Headless Design:** Hirin provides only the underlying state and interactions. You retain absolute control over your UI styling, transitions, and accessibility.

---

## 📦 Installation

Install `hirin` along with its lightweight peer dependencies:

```bash
npm install hirin utsutsu @solana/kit react
```

* **`utsutsu`**: Atomic, lens-based state manager.
* **`@solana/kit`**: Modern, unified Solana Web3 SDK (v2 / v6+ compliant).
* **`react`**: Supporting React 18 & React 19 natively.

---

## 🚀 Professional Implementation Recipes

Here are production-grade recipes showing how to harness Hirin for different standard dApp workflows.

### 1. Application Initialization (SSR & React Safe)
To begin discovering browser-injected wallets and restore the user's last authorized connection, initialize Hirin once at the root entry point:

```tsx
// main.tsx or layout.tsx (Client Component)
import { useEffect } from "react";
import { initializeHirin } from "hirin";

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Begins dynamic wallet standard discovery.
    // Setting autoConnect to true attempts to silently re-establish 
    // connection with the last used wallet from localStorage.
    const cleanup = initializeHirin({ autoConnect: true });
    
    return () => cleanup(); // React StrictMode safe: cleans up listeners on unmount
  }, []);

  return <>{children}</>;
}
```

---

### 2. Sleek Custom Headless Dialog (Radix UI)
Combine Hirin with Radix UI Dialog (or Shadcn UI) to build a beautiful, modern glassmorphic wallet-selection modal:

```tsx
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useValue } from "utsutsu";
import { 
  walletsLens, 
  publicKeyLens, 
  connectingLens, 
  connect, 
  disconnect,
  POPULAR_WALLETS 
} from "hirin";

export function WalletConnector() {
  const wallets = useValue(walletsLens);
  const publicKey = useValue(publicKeyLens);
  const isConnecting = useValue(connectingLens);
  const [open, setOpen] = useState(false);

  // Merge discovered wallets with a static registry to show install links
  const walletList = POPULAR_WALLETS.map((registry) => {
    const installed = wallets.find((w) => 
      w.name.toLowerCase().includes(registry.name.toLowerCase())
    );
    return {
      name: registry.name,
      icon: installed ? installed.icon : registry.icon,
      url: registry.url,
      isInstalled: !!installed,
      instance: installed,
    };
  });

  const handleConnect = async (walletInstance: any) => {
    try {
      await connect(walletInstance);
      setOpen(false);
    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  if (publicKey) {
    return (
      <div className="connected-badge">
        <span>{publicKey.slice(0, 4)}...{publicKey.slice(-4)}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="connect-btn">
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          <Dialog.Title>Connect a Wallet</Dialog.Title>
          
          <div className="wallet-grid">
            {walletList.map((wallet) => (
              wallet.isInstalled && wallet.instance ? (
                <button key={wallet.name} onClick={() => handleConnect(wallet.instance)}>
                  <img src={wallet.icon} alt={wallet.name} />
                  <span>{wallet.name}</span>
                  <span className="badge">Detected</span>
                </button>
              ) : (
                <a key={wallet.name} href={wallet.url} target="_blank" rel="noopener">
                  <img src={wallet.icon} alt={wallet.name} className="grayscale" />
                  <span>{wallet.name}</span>
                  <span className="badge install">Install</span>
                </a>
              )
            ))}
          </div>
          
          {/* Extension Auto-Connect Tip */}
          <div className="tip-box">
            <p className="tip-title">💡 Whitelisting & Reconnections</p>
            <p className="tip-text">
              Once trusted, Phantom connects silently on subsequent clicks. To switch accounts, 
              simply select it directly inside your Phantom Extension—Hirin will sync your dApp instantly!
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

### 3. Native Event-Driven Account Switching
Hirin integrates directly with `standard:events` to register reactive callback listeners. This means you do **not** need to prompt the user or disconnect/reconnect when they switch accounts. 

When a user switches their active address directly in the **Phantom** or **Solflare** extension UI:
1. The extension emits a native `change` event.
2. Hirin's internal listener catches the updated accounts array.
3. Hirin updates `publicKeyLens` instantly.
4. Only the components rendering the address re-render; no page reloads, no session losses.

---

### 4. Interactive Solana Program Interaction (SOL Transfer with `@solana/kit`)
Build, serialize, sign, and broadcast transactions using the modern `@solana/kit` (v2 / v6+) transaction model:

```typescript
import { signAndSendTransaction, publicKeyLens } from "hirin";
import { store } from "hirin/store"; // or read via utsutsu
import { 
  address, 
  pipe, 
  createTransaction, 
  setTransactionFeePayer, 
  setTransactionLifetimeUsingBlockhash, 
  appendTransactionInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

async function transferSol(recipientAddress: string, lamports: bigint, rpc: any) {
  const senderPubKey = store.get().publicKey;
  if (!senderPubKey) throw new Error("Wallet not connected!");

  // 1. Fetch blockhash
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // 2. Build the Versioned Transaction using pipes
  const transaction = pipe(
    createTransaction({ version: 0 }),
    tx => setTransactionFeePayer(address(senderPubKey), tx),
    tx => setTransactionLifetimeUsingBlockhash(latestBlockhash, tx),
    tx => appendTransactionInstruction(
      getTransferSolInstruction({
        source: address(senderPubKey),
        destination: address(recipientAddress),
        amount: lamports,
      }),
      tx
    )
  );

  // 3. Compile and serialize transaction bytes
  const compiled = compileTransaction(transaction);
  const wireBytes = getBase64EncodedWireTransaction(compiled);
  const transactionBytes = new Uint8Array(Buffer.from(wireBytes, "base64"));

  // 4. Sign and send to the cluster using Hirin
  try {
    const signatureBytes = await signAndSendTransaction(transactionBytes, {
      commitment: "confirmed"
    });
    
    // Convert signature bytes to hex/base58 for Solana Explorer
    const signature = Array.from(signatureBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
      
    console.log("Transaction Broadcasted! Signature:", signature);
  } catch (err) {
    console.error("Transaction failed or was rejected:", err);
  }
}
```

---

### 5. Secure Off-Chain Authentication (Sign-In With Solana)
Request cryptographically secure signatures for message verification or SIWS auth flows:

```typescript
import { signMessage } from "hirin";

async function authenticateUser() {
  const messageText = `dApp Auth Request:\nChallenge: ${crypto.randomUUID()}\nTimestamp: ${Date.now()}`;
  const messageBytes = new TextEncoder().encode(messageText);

  try {
    // Prompt the extension native signMessage dialog
    const signatureBytes = await signMessage(messageBytes);
    
    // Convert signature bytes to hex for your backend auth API
    const signatureHex = Array.from(signatureBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
      
    console.log("Secure verification signature:", signatureHex);
    
    // Send to server verify logic (e.g. nacl.sign.detached.verify)
  } catch (error) {
    console.warn("User rejected message signature", error);
  }
}
```

---

## 🛡️ API Reference

### Store Lenses (Read State)
All lenses are reactive read-only inputs for Utsutsu's `useValue()` hook.

* **`walletsLens`**: Discovered browser standard wallets (`readonly Wallet[]`).
* **`activeWalletLens`**: The currently connected active standard wallet (`Wallet | null`).
* **`publicKeyLens`**: The Base58-encoded active address of the user (`string | null`).
* **`connectingLens`**: Handshake loading status (`boolean`).
* **`disconnectingLens`**: Disconnection loading status (`boolean`).
* **`connectedLens`**: Derived helper state (`boolean`).
* **`errorLens`**: The last recorded connection or transaction error (`string | null`).

---

### Actions (Mutate State & Handshakes)

* **`initializeHirin(options?: { autoConnect?: boolean })`**: Bootstraps the standard registry scanner and loads the active cached session. Returns a cleanup function.
* **`connect(wallet: Wallet)`**: Establishes connection with a discovered standard wallet. Tries to clear stale caches to ensure native dialogs trigger correctly.
* **`disconnect()`**: Standard-compliant graceful disconnection. Guaranteed to reset all internal store states and clean local storage safely.
* **`signMessage(message: Uint8Array)`**: Prompts active wallet to sign arbitrary byte arrays.
* **`signTransaction(transaction: Uint8Array)`**: Prompts wallet to sign serialised transaction wire bytes without broadcasting.
* **`signAndSendTransaction(transaction: Uint8Array, options?: any)`**: Prompts wallet to sign and broadcast transaction wire bytes to the network.

---

## ⚖️ License

Hirin (日輪) is open-source software licensed under the **MIT License**.

---

<div align="center">
  <p>Crafted with ☀️ and precision for high-performance Solana applications.</p>
</div>
