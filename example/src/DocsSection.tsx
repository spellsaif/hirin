import { useState } from "react";
import { CodeBlock } from "./CodeBlock.js";
import {
  Zap, Layers, Globe, RefreshCw, Shield, ChevronRight, BookOpen,
  Terminal, Cpu, Radio, Unplug, FileSignature, Key
} from "lucide-react";

// ─── Snippet bank ────────────────────────────────────────────────────────────

const SNIPPETS = {
  install: `npm install hirin`,

  initBasic: `// main.tsx (or _app.tsx in Next.js)
import { initializeHirin } from "hirin";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Starts Wallet Standard discovery.
    // Pass { autoConnect: true } to silently restore last session.
    const cleanup = initializeHirin({ autoConnect: true });
    return () => cleanup();
  }, []);

  return <YourApp />;
}`,

  readState: `import { useValue } from "utsutsu";
import {
  walletsLens,       // readonly Wallet[]
  publicKeyLens,     // string | null
  activeWalletLens,  // Wallet | null
  connectingLens,    // boolean
  connectedLens,     // boolean (derived)
  errorLens,         // string | null
} from "hirin";

function WalletStatus() {
  const publicKey  = useValue(publicKeyLens);
  const connecting = useValue(connectingLens);
  const wallets    = useValue(walletsLens);

  if (connecting) return <p>Connecting…</p>;
  if (publicKey)  return <p>Connected: {publicKey}</p>;
  return <p>{wallets.length} wallet(s) detected</p>;
}`,

  connect: `import { connect } from "hirin";
import { useValue } from "utsutsu";
import { walletsLens } from "hirin";

function ConnectButton() {
  const wallets = useValue(walletsLens);

  return (
    <>
      {wallets.map((wallet) => (
        <button key={wallet.name} onClick={() => connect(wallet)}>
          Connect {wallet.name}
        </button>
      ))}
    </>
  );
}`,

  disconnect: `import { disconnect } from "hirin";

function DisconnectButton() {
  return (
    <button onClick={() => disconnect()}>
      Disconnect
    </button>
  );
}`,

  signMessage: `import { signMessage } from "hirin";

async function handleAuth() {
  const message = new TextEncoder().encode(
    \`Sign in to MyApp at \${Date.now()}\`
  );

  const signature = await signMessage(message);
  // signature is a Uint8Array
  const hex = Array.from(signature)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  console.log("Signature:", hex);
}`,

  signTx: `import { signAndSendTransaction } from "hirin";
import { getBase64EncodedWireTransaction } from "@solana/kit";

async function sendTransfer(transaction: Uint8Array) {
  // transaction is a serialised VersionedTransaction byte array
  const signature = await signAndSendTransaction(transaction, {
    commitment: "confirmed",
  });

  console.log("Tx signature bytes:", signature);
}`,

  accountChange: `// Account changes are handled automatically.
// When a user switches accounts inside Phantom/Solflare,
// Hirin's publicKeyLens updates instantly — no extra code needed.
//
// The \`standard:events\` listener registered by initializeHirin() does this:

//   wallet.features["standard:events"].on("change", ({ accounts }) => {
//     if (accounts.length > 0) {
//       // update publicKey in store
//     } else {
//       // wallet disconnected itself — reset state
//     }
//   });`,

  ssrSafe: `// All Hirin APIs guard against SSR execution automatically.
// initializeHirin() is a no-op on the server.
//
// In Next.js App Router:
"use client";
import { useEffect } from "react";
import { initializeHirin } from "hirin";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = initializeHirin({ autoConnect: true });
    return () => cleanup();
  }, []);

  return <>{children}</>;
}`,

  headlessModal: `import * as Dialog from "@radix-ui/react-dialog";
import { useValue } from "utsutsu";
import { walletsLens, connect, POPULAR_WALLETS } from "hirin";

export function WalletModal() {
  const wallets = useValue(walletsLens);

  const list = POPULAR_WALLETS.map((rw) => ({
    ...rw,
    instance: wallets.find(w =>
      w.name.toLowerCase().includes(rw.name.toLowerCase())
    ),
  }));

  return (
    <Dialog.Root>
      <Dialog.Trigger>Connect Wallet</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>Select a Wallet</Dialog.Title>
          {list.map(({ name, icon, url, instance }) =>
            instance ? (
              <button key={name} onClick={() => connect(instance)}>
                <img src={instance.icon} alt={name} />
                {name}
              </button>
            ) : (
              <a key={name} href={url} target="_blank">
                <img src={icon} alt={name} />
                Install {name}
              </a>
            )
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}`,
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { id: "installation",    label: "Installation",      icon: Terminal },
  { id: "initialization",  label: "Initialization",    icon: Zap },
  { id: "reading-state",   label: "Reading State",     icon: Layers },
  { id: "connect",         label: "Connect",           icon: Radio },
  { id: "disconnect",      label: "Disconnect",        icon: Unplug },
  { id: "sign-message",    label: "Sign Message",      icon: Key },
  { id: "sign-tx",         label: "Sign Transaction",  icon: FileSignature },
  { id: "account-changes", label: "Account Changes",   icon: RefreshCw },
  { id: "ssr",             label: "SSR / Next.js",     icon: Globe },
  { id: "headless-ui",     label: "Headless UI",       icon: Cpu },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeading({
  id, icon: Icon, label, description,
}: {
  id: string; icon: any; label: string; description: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 pt-12 first:pt-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-900/40 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{label}</h2>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed ml-11 mb-5">{description}</p>
    </div>
  );
}

function Param({ name, type, desc }: { name: string; type: string; desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2.5 border-b border-zinc-900 last:border-0">
      <code className="text-xs font-bold text-indigo-300 shrink-0 w-36">{name}</code>
      <code className="text-xs text-violet-400 shrink-0 w-40">{type}</code>
      <span className="text-xs text-zinc-500">{desc}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocsSection() {
  const [activeSection, setActiveSection] = useState("installation");

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2 pt-20">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Documentation</h2>
      </div>
      <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
        Everything you need to know
      </h2>
      <p className="text-zinc-400 text-sm mb-10 max-w-xl">
        A complete reference to integrate Hirin into any React or Next.js application.
      </p>

      <div className="flex gap-8 items-start">
        {/* Sidebar nav */}
        <aside className="w-52 shrink-0 sticky top-24 hidden lg:block">
          <div className="space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-all cursor-pointer ${
                  activeSection === id
                    ? "bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-900/30"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2 border border-zinc-800/60 rounded-2xl p-8 bg-zinc-950/30 backdrop-blur">

          {/* ── Installation ── */}
          <SectionHeading id="installation" icon={Terminal} label="Installation"
            description="Install Hirin and its required peer dependencies from npm." />
          <CodeBlock language="bash" code={SNIPPETS.install} />
          <div className="mt-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Peer dependencies</p>
            <Param name="react" type="^18 | ^19" desc="React must be installed in your project." />
            <Param name="utsutsu" type="^0.1.0" desc="Reactive state engine. Powers all lenses and hooks." />
            <Param name="@solana/kit" type="^2.0.0" desc="Modern Solana SDK for transaction serialization." />
          </div>

          {/* ── Initialization ── */}
          <SectionHeading id="initialization" icon={Zap} label="Initialization"
            description="Call initializeHirin() once at the root of your app inside a useEffect to start Wallet Standard discovery." />
          <CodeBlock filename="app.tsx" language="tsx" code={SNIPPETS.initBasic} />
          <div className="mt-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Options</p>
            <Param name="autoConnect" type="boolean" desc="If true, silently reconnects to the wallet from the last session using localStorage." />
          </div>
          <div className="flex gap-2 mt-4 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-300">
              <strong>React StrictMode safe.</strong> The returned cleanup function cancels any in-flight auto-connect and resets transient state, preventing the double-invoke side-effect.
            </p>
          </div>

          {/* ── Reading State ── */}
          <SectionHeading id="reading-state" icon={Layers} label="Reading State"
            description="All state is exposed as Utsutsu Lenses. Subscribe to only the slice you need — components re-render only when that exact value changes." />
          <CodeBlock filename="WalletStatus.tsx" language="tsx" code={SNIPPETS.readState} />
          <div className="mt-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Available lenses</p>
            <Param name="walletsLens"       type="Lens<Wallet[]>"    desc="All discovered Solana-compatible wallets in the browser." />
            <Param name="publicKeyLens"     type="Lens<string|null>" desc="Base58 address of the connected account, or null." />
            <Param name="activeWalletLens"  type="Lens<Wallet|null>" desc="The full Wallet Standard object of the active wallet." />
            <Param name="connectingLens"    type="Lens<boolean>"     desc="True while a connection handshake is in progress." />
            <Param name="connectedLens"     type="Lens<boolean>"     desc="Derived convenience lens: true when publicKey is non-null." />
            <Param name="errorLens"         type="Lens<string|null>" desc="Last error message from any wallet operation." />
          </div>

          {/* ── Connect ── */}
          <SectionHeading id="connect" icon={Radio} label="connect(wallet)"
            description="Connects to a specific Wallet Standard instance. The wallet must be discovered first via the walletsLens." />
          <CodeBlock filename="ConnectButton.tsx" language="tsx" code={SNIPPETS.connect} />
          <div className="mt-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Behaviour</p>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex gap-2"><ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" /><span>Sets <code className="text-indigo-300">connecting: true</code> immediately (optimistic UI).</span></div>
              <div className="flex gap-2"><ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" /><span>Calls the wallet's <code className="text-indigo-300">standard:connect</code> feature and awaits approval.</span></div>
              <div className="flex gap-2"><ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" /><span>On success: populates <code className="text-indigo-300">publicKey</code>, <code className="text-indigo-300">activeWallet</code>, stores wallet name in localStorage.</span></div>
              <div className="flex gap-2"><ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" /><span>Registers <code className="text-indigo-300">standard:events</code> change listener for account switches.</span></div>
              <div className="flex gap-2"><ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" /><span>On failure: populates <code className="text-indigo-300">errorLens</code> and re-throws.</span></div>
            </div>
          </div>

          {/* ── Disconnect ── */}
          <SectionHeading id="disconnect" icon={Unplug} label="disconnect()"
            description="Disconnects the active wallet. Guaranteed to reset UI state even if the wallet extension throws an error." />
          <CodeBlock filename="DisconnectButton.tsx" language="tsx" code={SNIPPETS.disconnect} />
          <div className="flex gap-2 mt-4 p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Uses <strong>try/catch/finally</strong> internally — the store always resets to disconnected state and localStorage is always cleared, regardless of extension errors.
            </p>
          </div>

          {/* ── Sign Message ── */}
          <SectionHeading id="sign-message" icon={Key} label="signMessage(message)"
            description="Signs arbitrary bytes with the connected wallet's private key. Ideal for off-chain authentication flows (Sign-In With Solana)." />
          <CodeBlock filename="auth.ts" language="typescript" code={SNIPPETS.signMessage} />
          <div className="mt-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Signature</p>
            <Param name="message" type="Uint8Array" desc="Raw bytes to sign. Encode strings using new TextEncoder().encode(str)." />
            <Param name="→ returns" type="Promise<Uint8Array>" desc="The wallet's signature bytes. Convert to hex or base58 for display." />
          </div>

          {/* ── Sign Tx ── */}
          <SectionHeading id="sign-tx" icon={FileSignature} label="signAndSendTransaction()"
            description="Signs and broadcasts a transaction using the solana:signAndSendTransaction Wallet Standard feature." />
          <CodeBlock filename="transfer.ts" language="typescript" code={SNIPPETS.signTx} />
          <div className="mt-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Signature</p>
            <Param name="transaction" type="Uint8Array" desc="A serialised VersionedTransaction from @solana/kit." />
            <Param name="options" type="object?" desc="Optional: { commitment: 'confirmed' | 'finalized' | 'processed' }." />
            <Param name="→ returns" type="Promise<Uint8Array>" desc="Transaction signature bytes from the network." />
          </div>

          {/* ── Account changes ── */}
          <SectionHeading id="account-changes" icon={RefreshCw} label="Account Changes"
            description="Hirin automatically listens to wallet-initiated events. No polling, no manual wiring." />
          <CodeBlock language="typescript" code={SNIPPETS.accountChange} />
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {[
              { title: "User switches account", desc: "publicKeyLens updates to the new address immediately." },
              { title: "User locks wallet", desc: "Hirin detects empty accounts array and calls disconnectWallet()." },
              { title: "User disconnects in extension", desc: "Same as above — store resets to null state." },
              { title: "No polling", desc: "Powered by push-based Wallet Standard events, zero CPU overhead." },
            ].map(({ title, desc }) => (
              <div key={title} className="p-3 bg-zinc-900/30 border border-zinc-800/40 rounded-xl">
                <p className="text-xs font-bold text-zinc-300 mb-1">{title}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>

          {/* ── SSR ── */}
          <SectionHeading id="ssr" icon={Globe} label="SSR / Next.js"
            description='All browser APIs are guarded with typeof window !== "undefined". Hirin is safe to import in server components as long as initializeHirin() is called only on the client.' />
          <CodeBlock filename="WalletProvider.tsx" language="tsx" code={SNIPPETS.ssrSafe} />

          {/* ── Headless UI ── */}
          <SectionHeading id="headless-ui" icon={Cpu} label="Headless UI"
            description="Hirin ships zero UI. Use any component library you prefer. Below is a complete Radix UI Dialog example using the POPULAR_WALLETS registry." />
          <CodeBlock filename="WalletModal.tsx" language="tsx" code={SNIPPETS.headlessModal} />
          <div className="flex gap-2 mt-4 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-300">
              <strong>POPULAR_WALLETS</strong> is a static registry of Phantom, Solflare, and Backpack with inline base64 icons and download links. Wallets not installed show an "Install" link; installed wallets show a connect button.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
