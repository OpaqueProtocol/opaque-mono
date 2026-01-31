import React, { useState } from "react";
import { Icon, Button } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { connectWallet } from "../../util/wallet";

interface WithdrawModalProps {
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ onClose }) => {
  const [selectedCrypto, setSelectedCrypto] = useState("XLM");
  const [amount, setAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const { address, isPending, balances } = useWallet();

  // Use real balance data from the wallet
  const xlmBalance = balances?.xlm ? parseFloat(balances.xlm.balance) : 0;

  const cryptos = [
    {
      symbol: "XLM",
      name: "Stellar Lumens",
      color: "bg-blue-500",
      available: xlmBalance,
      usdValue: xlmBalance * 0.09,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      color: "bg-blue-400",
      available: 0,
      usdValue: 0,
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      color: "bg-orange-500",
      available: 0,
      usdValue: 0,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      color: "bg-purple-500",
      available: 0,
      usdValue: 0,
    },
  ];

  const selectedCryptoData = cryptos.find((c) => c.symbol === selectedCrypto);
  const withdrawFee = 0.0005;

  const handleWithdraw = () => {
    if (step === "form") {
      setStep("confirm");
    } else {
      // Handle withdrawal logic here
      console.log("Processing withdrawal...");
      onClose();
    }
  };

  const setMaxAmount = () => {
    if (selectedCryptoData) {
      setAmount((selectedCryptoData.available - withdrawFee).toString());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-3xl p-6 w-full max-w-md text-white border border-gray-700/50 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {step === "form" ? "Withdraw" : "Confirm Withdrawal"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-800/60 rounded-full flex items-center justify-center hover:bg-gray-700/60 transition-all duration-300 transform hover:scale-110"
          >
            <Icon.X size="sm" />
          </button>
        </div>

        {/* Wallet Connection Check */}
        {!address && (
          <div className="mb-6 p-6 bg-gray-800/60 rounded-2xl text-center border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-3">Connect Your Wallet</h3>
            <p className="text-gray-400 text-sm mb-4">
              You need to connect your Stellar wallet to withdraw funds.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => void connectWallet()}
              disabled={isPending}
              className="bg-[#FDDA24] hover:bg-[#e6c520] text-black font-semibold px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-md shadow-[#FDDA24]/30"
            >
              {isPending ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        )}

        {address && step === "form" ? (
          <>
            {/* Crypto Selection */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3">
                Select Cryptocurrency
              </label>
              <div className="space-y-2">
                {cryptos.map((crypto) => (
                  <button
                    key={crypto.symbol}
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-300 border ${
                      selectedCrypto === crypto.symbol
                        ? "bg-[#FDDA24]/20 border-[#FDDA24] shadow-md shadow-[#FDDA24]/30"
                        : "bg-gray-800/60 border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 ${crypto.color} rounded-full flex items-center justify-center`}
                      >
                        <span className="text-white text-sm font-semibold">
                          {crypto.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-left">
                          {crypto.name}
                        </div>
                        <div className="text-gray-400 text-xs text-left">
                          {crypto.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{crypto.available}</div>
                      <div className="text-gray-400 text-xs">
                        ${crypto.usdValue.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-gray-300 text-sm">
                  Amount to Withdraw
                </label>
                <button
                  onClick={setMaxAmount}
                  className="text-[#FDDA24] text-sm hover:text-[#e6c520] transition-colors duration-300"
                >
                  Max
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 text-white text-lg focus:ring-2 focus:ring-[#FDDA24] focus:border-[#FDDA24] focus:outline-none transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {selectedCrypto}
                </div>
              </div>
              {selectedCryptoData && amount && (
                <div className="text-gray-400 text-sm mt-2">
                  ≈ $
                  {(
                    parseFloat(amount) *
                    (selectedCryptoData.usdValue / selectedCryptoData.available)
                  ).toFixed(2)}{" "}
                  USD
                </div>
              )}
            </div>

            {/* Destination Address */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3">
                Destination Address
              </label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder={`Enter ${selectedCrypto} address`}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[#FDDA24] focus:border-[#FDDA24] focus:outline-none transition-all duration-300"
              />
            </div>

            {/* Fee Information */}
            <div className="mb-6 p-4 bg-gray-800/60 rounded-2xl border border-gray-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Network Fee</span>
                <span className="text-white">
                  {withdrawFee} {selectedCrypto}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">You will receive</span>
                <span className="text-white font-semibold">
                  {amount ? (parseFloat(amount) - withdrawFee).toFixed(6) : "0"}{" "}
                  {selectedCrypto}
                </span>
              </div>
            </div>
          </>
        ) : address && step === "confirm" ? (
          /* Confirmation Step */
          <div className="mb-6">
            <div className="bg-gray-800/60 rounded-2xl p-6 mb-6 border border-gray-700/50">
              <div className="text-center mb-4">
                <div
                  className={`w-16 h-16 ${selectedCryptoData?.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <span className="text-white text-2xl font-bold">
                    {selectedCrypto.charAt(0)}
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {amount} {selectedCrypto}
                </div>
                <div className="text-gray-400">
                  ≈ $
                  {selectedCryptoData && amount
                    ? (
                        parseFloat(amount) *
                        (selectedCryptoData.usdValue /
                          selectedCryptoData.available)
                      ).toFixed(2)
                    : "0"}{" "}
                  USD
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">To Address:</span>
                  <span className="text-right font-mono break-all max-w-48">
                    {withdrawAddress.slice(0, 6)}...{withdrawAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Fee:</span>
                  <span>
                    {withdrawFee} {selectedCrypto}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-3">
                  <span className="text-gray-400">You will receive:</span>
                  <span className="font-semibold">
                    {amount
                      ? (parseFloat(amount) - withdrawFee).toFixed(6)
                      : "0"}{" "}
                    {selectedCrypto}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/60 border border-yellow-600/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Icon.AlertTriangle className="text-yellow-400" size="sm" />
                <span className="text-yellow-200 text-sm">
                  This withdrawal cannot be undone. Please verify the
                  destination address.
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        {address && (
          <div className="flex space-x-3">
            <button
              onClick={step === "confirm" ? () => setStep("form") : onClose}
              className="flex-1 bg-gray-700/60 text-white py-3 rounded-2xl font-semibold hover:bg-gray-600/60 transition-all duration-300 transform hover:scale-105 border border-gray-600/50"
            >
              {step === "confirm" ? "Back" : "Cancel"}
            </button>
            <button
              onClick={handleWithdraw}
              disabled={!amount || !withdrawAddress}
              className="flex-1 bg-red-600/80 hover:bg-red-500/80 text-white py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-600/30 border border-red-500/50"
            >
              {step === "confirm" ? "Confirm Withdrawal" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;
