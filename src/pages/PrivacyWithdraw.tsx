import React, { useState, useEffect } from "react";
import {
  ArrowUp,
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { connectWallet } from "../util/wallet";
import {
  handleWithdraw as executeWithdraw,
  validateNote,
  isNoteSpent,
  WithdrawResult,
} from "../util/privacyPool";

const PrivacyWithdraw: React.FC = () => {
  const [noteInput, setNoteInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [noteValid, setNoteValid] = useState<boolean | null>(null);
  const [noteSpent, setNoteSpent] = useState<boolean | null>(null);
  const [withdrawResult, setWithdrawResult] = useState<WithdrawResult | null>(
    null
  );
  const [loadingStatus, setLoadingStatus] = useState("");

  const { address, isPending, signTransaction } = useWallet();

  // Validate note when input changes
  useEffect(() => {
    if (!noteInput.trim()) {
      setNoteValid(null);
      setNoteSpent(null);
      return;
    }

    const validate = async () => {
      setIsValidating(true);
      try {
        const result = await validateNote(noteInput.trim());
        setNoteValid(result.valid);

        if (result.valid) {
          // Check if note is already spent
          const spent = await isNoteSpent(noteInput.trim());
          setNoteSpent(spent);
        }
      } catch {
        setNoteValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    const timeout = setTimeout(() => void validate(), 500);
    return () => clearTimeout(timeout);
  }, [noteInput]);

  const handleWithdraw = async () => {
    if (!address || !noteValid || noteSpent) return;

    setIsLoading(true);
    setWithdrawResult(null);

    try {
      setLoadingStatus("Parsing note and fetching commitments...");
      await new Promise((r) => setTimeout(r, 500));

      setLoadingStatus("Building Merkle tree...");
      await new Promise((r) => setTimeout(r, 500));

      setLoadingStatus("Generating ZK proof (this may take 10-30 seconds)...");

      const result = await executeWithdraw(
        noteInput.trim(),
        address,
        signTransaction
      );
      setWithdrawResult(result);
    } catch (error) {
      setWithdrawResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const resetWithdraw = () => {
    setNoteInput("");
    setWithdrawResult(null);
    setNoteValid(null);
    setNoteSpent(null);
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-[#FDDA24] to-yellow-300 rounded-3xl flex items-center justify-center shadow-2xl shadow-[#FDDA24]/20">
              <Wallet size={48} className="text-black" />
            </div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Connect Your Wallet
            </h1>
            <p className="text-gray-400 mb-8 text-lg">
              Connect your wallet to withdraw funds from the OPAQUE privacy
              pool.
            </p>

            <button
              onClick={() => void connectWallet()}
              disabled={isPending}
              className="bg-[#FDDA24] hover:bg-[#e6c520] text-black font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg shadow-[#FDDA24]/30"
            >
              {isPending ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (withdrawResult?.success) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 rounded-3xl p-8 border border-green-700/50 backdrop-blur-xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={48} className="text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  Withdrawal Successful!
                </h2>
                <p className="text-gray-400">
                  100 XLM has been withdrawn to your wallet with complete
                  privacy.
                </p>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield
                    className="text-green-400 flex-shrink-0 mt-1"
                    size={20}
                  />
                  <div>
                    <p className="text-green-200 font-semibold">
                      Privacy Protected
                    </p>
                    <p className="text-green-300/70 text-sm">
                      Your withdrawal cannot be linked to your original deposit.
                      The zero-knowledge proof verified your ownership without
                      revealing any connection.
                    </p>
                  </div>
                </div>
              </div>

              {withdrawResult.txHash && (
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction Hash:</span>
                    <span className="font-mono text-xs">
                      {withdrawResult.txHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={resetWithdraw}
                className="w-full bg-[#FDDA24] hover:bg-[#e6c520] text-black font-bold py-4 px-8 rounded-2xl transition-all"
              >
                Make Another Withdrawal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (withdrawResult && !withdrawResult.success) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 rounded-3xl p-8 border border-red-700/50 backdrop-blur-xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle size={48} className="text-red-400" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Withdrawal Failed</h2>
                <p className="text-gray-400">
                  Something went wrong during the withdrawal.
                </p>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 mb-6">
                <p className="text-red-400 text-sm font-mono break-all">
                  {withdrawResult.error}
                </p>
              </div>

              <button
                onClick={resetWithdraw}
                className="w-full bg-[#FDDA24] hover:bg-[#e6c520] text-black font-bold py-4 px-8 rounded-2xl transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-[#FDDA24]/20 rounded-full flex items-center justify-center">
                  <Loader2 size={48} className="text-[#FDDA24] animate-spin" />
                </div>
                <h2 className="text-2xl font-bold mb-4">
                  Processing Withdrawal
                </h2>
                <p className="text-gray-400 mb-6">{loadingStatus}</p>

                <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                  <div
                    className="bg-[#FDDA24] h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  />
                </div>

                <p className="text-gray-500 text-sm">
                  Please don't close this page. ZK proof generation may take up
                  to 30 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main withdraw form
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Privacy Withdraw
            </h1>
            <p className="text-gray-400 text-lg">
              Withdraw your funds anonymously using your secret note
            </p>
          </div>

          {/* Main Withdraw Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl mb-6">
            {/* Amount Display */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FDDA24]/20 rounded-full flex items-center justify-center">
                <ArrowUp size={32} className="text-[#FDDA24]" />
              </div>
              <p className="text-gray-400 text-sm mb-2">Withdrawal Amount</p>
              <p className="text-5xl font-bold">100 XLM</p>
            </div>

            {/* Note Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3">
                <FileText size={16} className="inline mr-2" />
                Enter Your Secret Note
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="opaque-1-abc123..."
                rows={4}
                className={`w-full bg-black/40 border rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none transition-colors font-mono text-sm ${
                  noteInput.trim()
                    ? noteValid === true && !noteSpent
                      ? "border-green-500 focus:border-green-400"
                      : noteValid === false || noteSpent
                        ? "border-red-500 focus:border-red-400"
                        : "border-gray-700 focus:border-[#FDDA24]"
                    : "border-gray-700 focus:border-[#FDDA24]"
                }`}
              />

              {/* Validation Status */}
              {noteInput.trim() && (
                <div className="mt-2">
                  {isValidating ? (
                    <div className="flex items-center text-gray-400 text-sm">
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Validating note...
                    </div>
                  ) : noteValid === false ? (
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle size={14} className="mr-2" />
                      Invalid note format
                    </div>
                  ) : noteSpent ? (
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle size={14} className="mr-2" />
                      This note has already been spent
                    </div>
                  ) : noteValid ? (
                    <div className="flex items-center text-green-400 text-sm">
                      <CheckCircle size={14} className="mr-2" />
                      Valid note - ready to withdraw
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Recipient Info */}
            <div className="bg-black/40 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Recipient</span>
                <span className="font-mono text-sm text-white">
                  {address.slice(0, 8)}...{address.slice(-8)}
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-purple-900/20 border border-purple-700/30 rounded-2xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Clock
                  className="text-purple-400 flex-shrink-0 mt-1"
                  size={20}
                />
                <div>
                  <p className="text-purple-200 font-semibold">
                    ZK Proof Generation
                  </p>
                  <p className="text-purple-300/70 text-sm">
                    Generating a zero-knowledge proof takes 10-30 seconds. This
                    proof verifies your ownership without revealing which
                    deposit is yours.
                  </p>
                </div>
              </div>
            </div>

            {/* Withdraw Button */}
            <button
              onClick={() => void handleWithdraw()}
              disabled={!noteValid || noteSpent || isValidating}
              className="w-full bg-gradient-to-r from-[#FDDA24] to-yellow-300 hover:from-[#e6c520] hover:to-yellow-400 text-black font-bold py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl shadow-[#FDDA24]/30"
            >
              <div className="flex items-center justify-center space-x-3">
                <Shield size={24} />
                <span className="text-lg">Withdraw Privately</span>
              </div>
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800/50">
              <Shield size={20} className="text-green-400 mb-2" />
              <p className="font-semibold">Unlinkable</p>
              <p className="text-gray-400 text-sm">
                No one can connect your withdrawal to the original deposit
              </p>
            </div>
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800/50">
              <CheckCircle size={20} className="text-blue-400 mb-2" />
              <p className="font-semibold">Verifiable</p>
              <p className="text-gray-400 text-sm">
                Cryptographic proof ensures you own the funds
              </p>
            </div>
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800/50">
              <Clock size={20} className="text-purple-400 mb-2" />
              <p className="font-semibold">Client-side</p>
              <p className="text-gray-400 text-sm">
                Proof generation happens in your browser
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyWithdraw;
