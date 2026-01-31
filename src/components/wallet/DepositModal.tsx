import React, { useState } from "react";
import { Icon, Button } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { connectWallet } from "../../util/wallet";

interface DepositModalProps {
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const [selectedCrypto, setSelectedCrypto] = useState("XLM");
  const [amount, setAmount] = useState("");
  const { address, isPending, balances } = useWallet();

  const cryptos = [
    { symbol: "XLM", name: "Stellar Lumens", color: "bg-blue-500" },
    { symbol: "USDC", name: "USD Coin", color: "bg-blue-400" },
    { symbol: "BTC", name: "Bitcoin", color: "bg-orange-500" },
    { symbol: "ETH", name: "Ethereum", color: "bg-purple-500" },
  ];

  // Use the actual wallet address from the connected wallet
  const walletAddress = address || "";

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(walletAddress);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-md text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Deposit</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
          >
            <Icon.X size="sm" />
          </button>
        </div>

        {/* Wallet Connection Check */}
        {!address && (
          <div className="mb-6 p-6 bg-gray-800 rounded-2xl text-center">
            <h3 className="text-lg font-semibold mb-3">Connect Your Wallet</h3>
            <p className="text-gray-400 text-sm mb-4">
              You need to connect your Stellar wallet to deposit funds.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => void connectWallet()}
              disabled={isPending}
            >
              {isPending ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        )}

        {/* Deposit functionality - only show when wallet is connected */}
        {address && (
          <>
            {/* Current Balance Display */}
            <div className="mb-6 p-4 bg-gray-800 rounded-2xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Balance:</span>
                <span className="font-semibold">
                  {balances?.xlm?.balance
                    ? `${parseFloat(balances.xlm.balance).toFixed(4)} XLM`
                    : "Loading..."}
                </span>
              </div>
              <div className="text-gray-400 text-sm mt-1">
                Address: {address.slice(0, 8)}...{address.slice(-8)}
              </div>
            </div>

            {/* Crypto Selection */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3">
                Select Cryptocurrency
              </label>
              <div className="grid grid-cols-2 gap-3">
                {cryptos.map((crypto) => (
                  <button
                    key={crypto.symbol}
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                    className={`p-4 rounded-2xl flex items-center space-x-3 transition-colors ${
                      selectedCrypto === crypto.symbol
                        ? "bg-blue-600 border-2 border-blue-500"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 ${crypto.color} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-white text-sm font-semibold">
                        {crypto.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-left">
                        {crypto.symbol}
                      </div>
                      <div className="text-gray-400 text-xs text-left">
                        {crypto.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3">
                Amount to Deposit
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-800 rounded-2xl p-4 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {selectedCrypto}
                </div>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3">
                Deposit Address
              </label>
              <div className="bg-gray-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-sm font-mono text-gray-300 flex-1 mr-3 break-all">
                  {walletAddress || "No wallet connected"}
                </div>
                <button
                  onClick={copyToClipboard}
                  disabled={!walletAddress}
                  className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-50"
                >
                  <Icon.Copy01 size="sm" />
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                Send only {selectedCrypto} to this address. Other tokens will be
                lost permanently.
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl p-8 flex items-center justify-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Icon.QrCode01 className="text-gray-400" size="lg" />
                </div>
              </div>
              <p className="text-center text-gray-400 text-sm mt-2">
                Scan QR code to deposit {selectedCrypto}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 text-white py-3 rounded-2xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle deposit confirmation
                  onClose();
                }}
                disabled={!walletAddress || !amount}
                className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate QR Code
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
