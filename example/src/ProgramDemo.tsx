import { useState } from "react";
import { useValue } from "utsutsu";
import {
  createSolanaRpc,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  lamports,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { publicKeyLens, connectedLens, signAndSendTransaction } from "../../src/index.js";
import { CodeBlock } from "./CodeBlock.js";
import {
  Wallet2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Code2,
  SendHorizontal,
} from "lucide-react";

// ── RPC ──────────────────────────────────────────────────────────────────────
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const rpc = createSolanaRpc(RPC_ENDPOINT);

const DEVNET_EXPLORER = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

// ── helpers ──────────────────────────────────────────────────────────────────
function formatSol(lamportsBig: bigint) {
  return (Number(lamportsBig) / 1_000_000_000).toFixed(4) + " SOL";
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Decode base64 to Uint8Array for the wallet standard
function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Code snippet shown in UI ─────────────────────────────────────────────────
const SNIPPET_BALANCE = `import { createSolanaRpc, address } from "@solana/kit";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const { value: balanceLamports } = await rpc
  .getBalance(address(publicKey))
  .send();

const sol = Number(balanceLamports) / 1_000_000_000;`;

const SNIPPET_TRANSFER = `import {
  createSolanaRpc, address, lamports, pipe,
  createTransactionMessage, setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  compileTransactionMessage, compileTransaction,
  getBase64EncodedWireTransaction,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { signAndSendTransaction } from "hirin";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

// 1. Fetch latest blockhash for transaction lifetime
const { value: latestBlockhash } = await rpc
  .getLatestBlockhash()
  .send();

// 2. Build the transaction message
const message = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayer(address(senderPublicKey), tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstruction(
    getTransferSolInstruction({
      source: address(senderPublicKey) as any, // Cast as TransactionSigner
      destination: address(recipientAddress),
      amount: lamports(100_000n), // 0.0001 SOL
    }),
    tx
  )
);

// 3. Compile → wire bytes → sign & send via Hirin
const compiledMessage = compileTransactionMessage(message);
const transaction     = compileTransaction(compiledMessage);
const wireB64         = getBase64EncodedWireTransaction(transaction);
const wireBytes       = Uint8Array.from(atob(wireB64), c => c.charCodeAt(0));

const sigBytes = await signAndSendTransaction(wireBytes);`;

// ── Component ─────────────────────────────────────────────────────────────────
export function ProgramDemo() {
  const publicKey = useValue(publicKeyLens);
  const connected = useValue(connectedLens);

  // Balance state
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Transfer state
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Active tab for code snippets
  const [tab, setTab] = useState<"balance" | "transfer">("balance");

  // ── handlers ──────────────────────────────────────────────────────────────
  async function handleFetchBalance() {
    if (!publicKey) return;
    setLoadingBalance(true);
    setBalanceError(null);
    setBalance(null);
    try {
      const { value: bal } = await rpc.getBalance(address(publicKey)).send();
      setBalance(formatSol(bal));
    } catch (err: any) {
      setBalanceError(err.message || "Failed to fetch balance.");
    } finally {
      setLoadingBalance(false);
    }
  }

  async function handleSendSol() {
    if (!publicKey || !recipient) return;
    setSending(true);
    setTxSig(null);
    setSendError(null);
    try {
      // 1. Latest blockhash
      const { value: latestBlockhash } = await rpc
        .getLatestBlockhash()
        .send();

      // 2. Build transaction message
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(publicKey), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) =>
          appendTransactionMessageInstruction(
            getTransferSolInstruction({
              source: address(publicKey) as any,
              destination: address(recipient),
              amount: lamports(100_000n), // 0.0001 SOL
            }),
            tx
          )
      );

      // 3. Compile → wire bytes
      const transaction = compileTransaction(message as any);
      const wireB64 = getBase64EncodedWireTransaction(transaction);
      const wireBytes = base64ToUint8Array(wireB64);

      // 4. Sign and send via Hirin
      const sigBytes = await signAndSendTransaction(wireBytes, {
        commitment: "confirmed",
      });

      const sigHex = bytesToHex(sigBytes);
      setTxSig(sigHex);
    } catch (err: any) {
      setSendError(err.message || "Transaction failed.");
    } finally {
      setSending(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <section className="max-w-6xl mx-auto px-6 pb-20 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Code2 className="w-5 h-5 text-violet-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
          Live Demo
        </span>
      </div>
      <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
        Solana Program Interaction
      </h2>
      <p className="text-zinc-400 text-sm mb-10 max-w-xl">
        A real on-chain demo running on{" "}
        <span className="text-violet-300 font-semibold">Devnet</span>. Connect
        your wallet, fetch your balance, and send a SOL transfer — all using{" "}
        <code className="text-indigo-300 bg-zinc-900 px-1 py-0.5 rounded text-xs">
          @solana/kit
        </code>{" "}
        and Hirin.
      </p>

      {!connected && (
        <div className="flex items-center gap-3 p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl text-zinc-400 text-sm">
          <Wallet2 className="w-5 h-5 shrink-0" />
          Connect your wallet above to try the live demo.
        </div>
      )}

      {connected && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Left: Balance card ── */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                Read Balance
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Calls <code className="text-indigo-300">rpc.getBalance()</code>{" "}
                with your address on Devnet.
              </p>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
              <p className="text-[10px] text-zinc-600 font-mono mb-1">
                Connected address
              </p>
              <p className="text-xs font-mono text-zinc-300 break-all">
                {publicKey}
              </p>
            </div>

            <button
              onClick={handleFetchBalance}
              disabled={loadingBalance}
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              {loadingBalance ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loadingBalance ? "Fetching…" : "Fetch Devnet Balance"}
            </button>

            {balance && (
              <div className="flex items-center gap-3 p-4 bg-emerald-950/30 border border-emerald-900/30 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    Balance
                  </p>
                  <p className="text-xl font-bold text-emerald-300 font-mono">
                    {balance}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    If balance is 0, request a devnet airdrop at{" "}
                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      className="text-indigo-400 underline"
                    >
                      faucet.solana.com
                    </a>
                  </p>
                </div>
              </div>
            )}

            {balanceError && (
              <div className="flex items-start gap-2 p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {balanceError}
              </div>
            )}
          </div>

          {/* ── Right: Transfer card ── */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <SendHorizontal className="w-4 h-4 text-violet-400" />
                Send SOL Transfer
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Builds a{" "}
                <code className="text-violet-300">VersionedTransaction</code>,
                signs via Hirin, and broadcasts on Devnet.
              </p>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>From</span>
                <span>Amount</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-zinc-400 truncate">
                  {publicKey?.slice(0, 12)}…
                </span>
                <span className="flex items-center gap-1 text-xs font-mono text-violet-300 shrink-0">
                  <ArrowRight className="w-3 h-3" />
                  0.0001 SOL
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Paste a devnet address…"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-600 outline-none rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-700 transition-colors"
              />
            </div>

            <button
              onClick={handleSendSol}
              disabled={sending || !recipient.trim()}
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizontal className="w-4 h-4" />
              )}
              {sending ? "Signing & Sending…" : "Send 0.0001 SOL on Devnet"}
            </button>

            {txSig && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Transaction Confirmed
                </div>
                <code className="block text-[10px] font-mono text-zinc-400 break-all bg-zinc-950 p-2 rounded border border-zinc-900">
                  {txSig}
                </code>
                <a
                  href={DEVNET_EXPLORER(txSig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Solana Explorer
                </a>
              </div>
            )}

            {sendError && (
              <div className="flex items-start gap-2 p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {sendError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code section */}
      <div className="mt-10 border border-zinc-800/60 rounded-2xl overflow-hidden">
        <div className="flex items-center border-b border-zinc-800/60 bg-zinc-900/40">
          <button
            onClick={() => setTab("balance")}
            className={`px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "balance"
                ? "text-white border-b-2 border-indigo-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Balance Read
          </button>
          <button
            onClick={() => setTab("transfer")}
            className={`px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "transfer"
                ? "text-white border-b-2 border-violet-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            SOL Transfer
          </button>
          <span className="ml-auto mr-4 text-[10px] text-zinc-600 font-mono">
            Devnet · @solana/kit v6
          </span>
        </div>
        <div className="p-4 bg-zinc-950/60">
          <CodeBlock
            language="typescript"
            code={tab === "balance" ? SNIPPET_BALANCE : SNIPPET_TRANSFER}
          />
        </div>
      </div>
    </section>
  );
}
