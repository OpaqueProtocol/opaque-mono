import React, { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Wallet,
  Shield,
  Clock,
  CheckCircle,
  Copy,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { connectWallet } from "../util/wallet";
import { handleDeposit as executeDeposit, DepositResult } from "../util/privacyPool";

const PrivacyDeposit: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null);
  const [noteCopied, setNoteCopied] = useState(false);

  const { address, isPending, balances, signTransaction } = useWallet();

  // Fixed deposit amount (100 XLM) - must match contract's FIXED_AMOUNT
  const depositAmount = 100;
  const depositAmountDisplay = "100 XLM";

  // Helper to parse formatted balance (removes commas from formatted numbers)
  const parseBalance = (balance: string | undefined): number => {
    if (!balance) return 0;
    return parseFloat(balance.replace(/,/g, ''));
  };

  const userBalance = parseBalance(balances?.xlm?.balance);

  // Debug: Log wallet state
  console.log('[PrivacyDeposit] Wallet state:', {
    address,
    rawBalance: balances?.xlm?.balance,
    parsedBalance: userBalance,
    depositAmount,
    hasEnoughBalance: userBalance >= depositAmount,
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setNoteCopied(true);
    setTimeout(() => setNoteCopied(false), 3000);
  };

  const handleDeposit = async () => {
    if (!address) return;

    setIsLoading(true);
    setDepositResult(null);

    try {
      const result = await executeDeposit(address, signTransaction);
      setDepositResult(result);
    } catch (error) {
      setDepositResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetDeposit = () => {
    setDepositResult(null);
    setNoteCopied(false);
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Background gradient overlay */}
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
              Connect your wallet to deposit funds into the OPAQUE privacy pool.
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

  // Success state - show the note
  if (depositResult?.success && depositResult.note) {
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
                <h2 className="text-3xl font-bold mb-2">Deposit Successful!</h2>
                <p className="text-gray-400">
                  Your {depositAmountDisplay} has been deposited into the privacy pool.
                </p>
              </div>

              {/* Important Warning */}
              <div className="bg-yellow-900/40 border border-yellow-600/50 rounded-2xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-yellow-200 font-semibold">Save This Note!</p>
                    <p className="text-yellow-300/80 text-sm">
                      This is your only way to withdraw your funds. If you lose this note, 
                      your funds cannot be recovered. Store it safely!
                    </p>
                  </div>
                </div>
              </div>

              {/* Note Display */}
              <div className="bg-black/40 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Your Secret Note</span>
                  <button
                    onClick={() => void copyToClipboard(depositResult.note!)}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Copy size={14} />
                    <span className="text-sm">{noteCopied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-mono text-sm text-green-400 break-all bg-black/60 rounded-xl p-4">
                  {depositResult.note}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Leaf Index:</span>
                  <span className="font-mono">{depositResult.leafIndex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Commitment:</span>
                  <span className="font-mono text-xs">
                    {depositResult.commitment?.slice(0, 16)}...
                  </span>
                </div>
              </div>

              <button
                onClick={resetDeposit}
                className="w-full bg-[#FDDA24] hover:bg-[#e6c520] text-black font-bold py-4 px-8 rounded-2xl transition-all"
              >
                Make Another Deposit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (depositResult && !depositResult.success) {
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
                <h2 className="text-3xl font-bold mb-2">Deposit Failed</h2>
                <p className="text-gray-400">
                  Something went wrong during the deposit.
                </p>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 mb-6">
                <p className="text-red-400 text-sm font-mono">
                  {depositResult.error}
                </p>
              </div>

              <button
                onClick={resetDeposit}
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

  // Main deposit form
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Privacy Deposit
            </h1>
            <p className="text-gray-400 text-lg">
              Deposit funds into the OPAQUE privacy pool to enable anonymous withdrawals
            </p>
          </div>

          {/* Main Deposit Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl mb-6">
            {/* Amount Display */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FDDA24]/20 rounded-full flex items-center justify-center">
                <ArrowDown size={32} className="text-[#FDDA24]" />
              </div>
              <p className="text-gray-400 text-sm mb-2">Fixed Deposit Amount</p>
              <p className="text-5xl font-bold">{depositAmountDisplay}</p>
              <p className="text-gray-500 text-sm mt-2">
                ≈ ${(depositAmount * 0.09).toFixed(2)} USD
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-2xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-blue-200 font-semibold">How it works</p>
                  <p className="text-blue-300/70 text-sm">
                    When you deposit, you'll receive a secret note. This note is the only 
                    way to withdraw your funds later. No one can link your deposit to 
                    your withdrawal, providing complete privacy.
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="flex justify-between items-center py-3 border-t border-gray-700/50">
              <span className="text-gray-400">Your XLM Balance</span>
              <span className="font-semibold">
                {userBalance.toFixed(4)} XLM
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-t border-gray-700/50">
              <span className="text-gray-400">Network Fee</span>
              <span className="font-semibold">~0.00001 XLM</span>
            </div>

            {/* Deposit Button */}
            <button
              onClick={() => void handleDeposit()}
              disabled={isLoading || userBalance < depositAmount}
              className="w-full mt-6 bg-gradient-to-r from-[#FDDA24] to-yellow-300 hover:from-[#e6c520] hover:to-yellow-400 text-black font-bold py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl shadow-[#FDDA24]/30"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Processing Deposit...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <ArrowRight size={24} />
                  <span className="text-lg">Deposit {depositAmountDisplay}</span>
                </div>
              )}
            </button>

            {userBalance < depositAmount && (
              <p className="text-red-400 text-sm text-center mt-4">
                Insufficient balance. You need at least {depositAmountDisplay} to deposit.
              </p>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800/50">
              <CheckCircle size={20} className="text-green-400 mb-2" />
              <p className="font-semibold">Private</p>
              <p className="text-gray-400 text-sm">Zero-knowledge proofs ensure unlinkable withdrawals</p>
            </div>
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800/50">
              <Shield size={20} className="text-blue-400 mb-2" />
              <p className="font-semibold">Secure</p>
              <p className="text-gray-400 text-sm">Non-custodial, your funds stay in the smart contract</p>
            </div>
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800/50">
              <Clock size={20} className="text-purple-400 mb-2" />
              <p className="font-semibold">Fast</p>
              <p className="text-gray-400 text-sm">Instant deposits with Stellar's fast finality</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyDeposit;
