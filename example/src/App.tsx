import { useEffect, useState } from "react";
import { useValue } from "utsutsu";
import { 
  initializeHirin, 
  signMessage,
  publicKeyLens, 
  activeWalletLens,
  walletsLens,
  errorLens
} from "../../src/index.js";
import { WalletModal } from "./WalletModal.js";
import { DocsSection } from "./DocsSection.js";
import { ProgramDemo } from "./ProgramDemo.js";
import { ShieldCheck, Cpu, Code2, Globe, FileSignature, CheckCircle, AlertTriangle } from "lucide-react";

function App() {
  const publicKey = useValue(publicKeyLens);
  const activeWallet = useValue(activeWalletLens);
  const wallets = useValue(walletsLens);
  const globalError = useValue(errorLens);

  const [signature, setSignature] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  // Initialize Hirin with auto-connect on mount
  useEffect(() => {
    const cleanup = initializeHirin({ autoConnect: true });
    
    // Debug logging
    console.log("--- Hirin Debug Info ---");
    console.log("window.phantom:", (window as any).phantom);
    console.log("window.solana:", (window as any).solana);
    console.log("navigator.wallets:", (navigator as any).wallets);
    
    return () => cleanup();
  }, []);

  const handleSignMessage = async () => {
    setSignature(null);
    setSignError(null);
    setSigning(true);
    
    try {
      const msgText = `Hirin Auth: Authenticating with Solana at timestamp ${Date.now()}`;
      const msgBytes = new TextEncoder().encode(msgText);
      const sigBytes = await signMessage(msgBytes);
      
      // Convert signature to hex/base58 for display
      // We can do standard hex conversion
      const sigHex = Array.from(sigBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      
      setSignature(sigHex);
    } catch (err: any) {
      setSignError(err.message || "Failed to sign message.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090b]">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Header */}
      <header className="border-b border-zinc-900/80 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              日
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight">Hirin</span>
              <span className="text-zinc-600 text-xs ml-1.5 font-medium">日輪</span>
            </div>
          </div>
          <WalletModal />
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-20 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 text-xs font-semibold rounded-full">
            <ShieldCheck className="w-3..5 h-3.5" />
            Wallet Standard Native
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Solar-Fast Solana Connections
          </h1>
          
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl">
            A headless, ultra-lightweight adapter library. No context re-render lags, zero hydration crashes, powered by <span className="text-indigo-400 font-semibold">Utsutsu</span> reactive state cells.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex gap-3">
              <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Utsutsu Powered</h3>
                <p className="text-xs text-zinc-500 mt-1">Uses atomic cells and lenses for surgical rendering updates.</p>
              </div>
            </div>
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex gap-3">
              <Globe className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">SSR & RSC Safe</h3>
                <p className="text-xs text-zinc-500 mt-1">Guarded against server-side rendering execution out-of-the-box.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Control Panel */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative">
            <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 text-[10px] text-zinc-400 font-mono">
              <Code2 className="w-3 h-3 text-indigo-400" />
              v0.1.0
            </div>

            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              Hirin State Monitor
            </h2>

            <div className="space-y-4">
              {/* Wallet list status */}
              <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
                <span className="text-sm text-zinc-400 font-medium">Discovered Wallets</span>
                <span className="text-sm font-bold text-zinc-200">{wallets.length}</span>
              </div>

              {/* Connection status */}
              <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
                <span className="text-sm text-zinc-400 font-medium">Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${publicKey ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" : "bg-zinc-950 text-zinc-500 border border-zinc-900"}`}>
                  {publicKey ? "Connected" : "Disconnected"}
                </span>
              </div>

              {publicKey && activeWallet && (
                <>
                  <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
                    <span className="text-sm text-zinc-400 font-medium">Provider</span>
                    <span className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <img src={activeWallet.icon} alt={activeWallet.name} className="w-4 h-4 rounded-md object-contain bg-zinc-950" />
                      {activeWallet.name}
                    </span>
                  </div>

                  <div className="py-2.5 border-b border-zinc-900 space-y-1.5">
                    <span className="text-sm text-zinc-400 font-medium block">Address</span>
                    <span className="text-xs font-mono text-zinc-500 break-all select-all block bg-zinc-950 p-2 rounded-lg border border-zinc-900">
                      {publicKey}
                    </span>
                  </div>

                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-[11px] text-indigo-300 leading-relaxed shadow-sm">
                    💡 <strong>Reactive Account Syncing:</strong> Hirin automatically listens to your extension. Try opening your Phantom wallet and switching accounts—the address above will update instantly without a page refresh!
                  </div>

                  {/* Actions Section */}
                  <div className="pt-4 space-y-3">
                    <button
                      onClick={handleSignMessage}
                      disabled={signing}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <FileSignature className="w-4 h-4" />
                      {signing ? "Signing Message..." : "Sign Test Message"}
                    </button>

                    {signature && (
                      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5 animate-fadeIn">
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Signature Generated
                        </div>
                        <code className="block text-[10px] font-mono text-zinc-400 break-all bg-zinc-900/60 p-2 rounded border border-zinc-900 max-h-16 overflow-y-auto">
                          {signature}
                        </code>
                      </div>
                    )}

                    {(signError || globalError) && (
                      <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs rounded-xl flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Error:</span> {signError || globalError}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Divider */}
      <div className="relative mx-6 max-w-6xl mx-auto my-12">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
      </div>

      {/* Program Interaction Live Demo */}
      <ProgramDemo />

      {/* Divider */}
      <div className="relative mx-6 max-w-6xl mx-auto my-12">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
      </div>

      {/* Documentation */}
      <DocsSection />

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600">
        <span className="font-semibold text-zinc-500">Hirin</span> (日輪) · Solar-fast Solana wallet adapter · MIT License
      </footer>
    </div>
  );
}

export default App;
