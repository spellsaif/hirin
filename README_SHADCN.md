# Premium Wallet Dialog with Shadcn UI & Hirin

This recipe provides a complete, beautiful, and fully accessible wallet connection dialog using **Shadcn UI** (Radix Dialog + Tailwind CSS) and **Hirin** (日輪).

---

## 🎨 Preview of the UI
The dialog will display a sleek, dark/light mode compatible grid of installed browser wallets, with clean hover indicators and a responsive, modern container.

---

## 🛠️ Step-by-Step Integration

### 1. Install Shadcn Dialog
If you haven't already, add the Dialog primitive to your project:

```bash
npx shadcn@latest add dialog
```

This will create a `components/ui/dialog.tsx` file using Radix Primitives under the hood.

### 2. Create the Wallet Connection Modal
Create a new file `components/WalletModal.tsx` and paste the following implementation:

```tsx
"use client";

import React from "react";
import { useValue } from "utsutsu";
import { 
  walletsLens, 
  publicKeyLens, 
  connectingLens, 
  connect, 
  disconnect 
} from "hirin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function WalletModal() {
  const wallets = useValue(walletsLens);
  const publicKey = useValue(publicKeyLens);
  const isConnecting = useValue(connectingLens);

  // If connected, show address and disconnect button
  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg border">
          {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-1.5 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/95 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          disabled={isConnecting}
          className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[360px] p-6 rounded-2xl border bg-background text-foreground shadow-2xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold tracking-tight text-center">
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          {wallets.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-6">
              No Solana wallets detected. Install an extension like Phantom or Solflare.
            </p>
          ) : (
            wallets.map((wallet) => (
              <DialogTrigger asChild key={wallet.name}>
                <button
                  onClick={() => connect(wallet)}
                  className="flex items-center justify-between w-full p-3.5 rounded-xl border border-muted hover:border-primary/50 hover:bg-accent text-card-foreground font-medium transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={wallet.icon} 
                      alt={wallet.name} 
                      className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform" 
                    />
                    <span className="text-sm font-semibold">{wallet.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted group-hover:bg-primary group-hover:text-primary-foreground px-2.5 py-1 rounded-full transition-colors">
                    Installed
                  </span>
                </button>
              </DialogTrigger>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Place the Component in your Header
Import and place the `WalletModal` anywhere in your app's layout, such as your header bar:

```tsx
import { WalletModal } from "@/components/WalletModal";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 border-b">
      <span className="font-bold text-lg">My Solana App</span>
      <WalletModal />
    </header>
  );
}
```

---

## ⚡ Benefits of this combination
1. **Perfect CSS Integration**: The modal utilizes your existing theme variables (`bg-background`, `text-foreground`, `bg-primary`, etc.) so it immediately matches your website's exact styling.
2. **Accessiblity Compliant**: Radix UI handles focus locking and key bindings, making your modal accessible to screen readers and keyboard users out of the box.
3. **No Unused Code**: The modal code lives directly in your project. You only bundle the code you actually use.
