import React, { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Wallet,
  Shield,
  Clock,
  CheckCircle,
  Copy,
  QrCode,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { connectWallet } from "../util/wallet";

const Deposit: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState("XLM");
  const [depositAmount, setDepositAmount] = useState("");
  const [recipientType, setRecipientType] = useState<"contract" | "wallet">(
    "contract",
  );
  const [recipientAddress, setRecipientAddress] = useState("");
  const [showQR, setShowQR] = useState(false);

  const { address, isPending, balances } = useWallet();

  const assets = [
    {
      symbol: "XLM",
      name: "Stellar Lumens",
      icon: "✦",
      color: "bg-blue-500",
      balance: balances?.xlm?.balance || "0",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: "$",
      color: "bg-green-500",
      balance: "0",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      icon: "₿",
      color: "bg-orange-500",
      balance: "0",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      icon: "Ξ",
      color: "bg-purple-500",
      balance: "0",
    },
  ];

  const contractOptions = [
    {
      name: "OPAQUE Privacy Contract",
      address: "GDXXX...XXXX",
      description: "Main privacy payment contract",
    },
    {
      name: "Liquidity Pool Contract",
      address: "GDYYY...YYYY",
      description: "Automated market maker",
    },
    {
      name: "Staking Contract",
      address: "GDZZZ...ZZZZ",
      description: "Earn rewards by staking",
    },
  ];

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const handleDeposit = () => {
    // TODO: Implement deposit logic
    console.log("Deposit:", {
      asset: selectedAsset,
      amount: depositAmount,
      recipientType,
      recipientAddress,
    });
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
              Connect your wallet to start depositing funds securely to smart
              contracts and other wallets.
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Deposit Funds
            </h1>
            <p className="text-gray-400 text-lg">
              Securely deposit your assets to smart contracts or send to other
              wallets
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Deposit Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Asset Selection */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <div className="w-8 h-8 bg-[#FDDA24] rounded-xl flex items-center justify-center mr-3">
                    <ArrowDown size={18} className="text-black" />
                  </div>
                  Select Asset
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.symbol}
                      onClick={() => setSelectedAsset(asset.symbol)}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        selectedAsset === asset.symbol
                          ? "border-[#FDDA24] bg-[#FDDA24]/10"
                          : "border-gray-700/50 hover:border-gray-600 bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 ${asset.color}/20 rounded-xl flex items-center justify-center text-xl`}
                          >
                            {asset.icon}
                          </div>
                          <div>
                            <div className="font-semibold">{asset.symbol}</div>
                            <div className="text-sm text-gray-400">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Balance</div>
                          <div className="font-semibold">
                            {parseFloat(asset.balance).toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl">
                <h2 className="text-2xl font-bold mb-6">Amount to Deposit</h2>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-gray-700 rounded-2xl px-6 py-4 text-2xl font-semibold text-white placeholder-gray-500 focus:border-[#FDDA24] focus:outline-none transition-colors"
                    />
                    <div className="absolute right-4 top-4 text-gray-400 text-lg">
                      {selectedAsset}
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex space-x-3">
                    {["25%", "50%", "75%", "MAX"].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => {
                          const selectedAssetData = assets.find(
                            (a) => a.symbol === selectedAsset,
                          );
                          if (selectedAssetData) {
                            const balance = parseFloat(
                              selectedAssetData.balance,
                            );
                            let amount = 0;
                            if (percentage === "MAX") amount = balance;
                            else if (percentage === "75%")
                              amount = balance * 0.75;
                            else if (percentage === "50%")
                              amount = balance * 0.5;
                            else if (percentage === "25%")
                              amount = balance * 0.25;
                            setDepositAmount(amount.toString());
                          }
                        }}
                        className="flex-1 py-2 px-4 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl text-sm font-medium transition-colors"
                      >
                        {percentage}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recipient Selection */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl">
                <h2 className="text-2xl font-bold mb-6">Deposit Destination</h2>

                {/* Recipient Type Toggle */}
                <div className="flex bg-gray-800/30 rounded-2xl p-2 mb-6">
                  <button
                    onClick={() => setRecipientType("contract")}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                      recipientType === "contract"
                        ? "bg-[#FDDA24] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Shield size={18} className="inline mr-2" />
                    Smart Contract
                  </button>
                  <button
                    onClick={() => setRecipientType("wallet")}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                      recipientType === "wallet"
                        ? "bg-[#FDDA24] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Wallet size={18} className="inline mr-2" />
                    Wallet Address
                  </button>
                </div>

                {recipientType === "contract" ? (
                  <div className="space-y-4">
                    {contractOptions.map((contract, index) => (
                      <div
                        key={index}
                        onClick={() => setRecipientAddress(contract.address)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          recipientAddress === contract.address
                            ? "border-[#FDDA24] bg-[#FDDA24]/10"
                            : "border-gray-700/50 hover:border-gray-600 bg-gray-800/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">
                              {contract.name}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              {contract.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 font-mono">
                              {contract.address}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(contract.address);
                            }}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Copy size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="Enter wallet address (e.g., GDXXX...XXXX)"
                      className="w-full bg-black/40 border border-gray-700 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:border-[#FDDA24] focus:outline-none transition-colors font-mono"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowQR(!showQR)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl transition-colors"
                      >
                        <QrCode size={16} />
                        <span className="text-sm">Scan QR</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Deposit Button */}
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || !recipientAddress}
                className="w-full bg-gradient-to-r from-[#FDDA24] to-yellow-300 hover:from-[#e6c520] hover:to-yellow-400 text-black font-bold py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl shadow-[#FDDA24]/30"
              >
                <div className="flex items-center justify-center space-x-3">
                  <ArrowRight size={24} />
                  <span className="text-lg">Deposit {selectedAsset}</span>
                </div>
              </button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Transaction Summary */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-4">Transaction Summary</h3>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Asset</span>
                    <span className="font-semibold">{selectedAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount</span>
                    <span className="font-semibold">
                      {depositAmount || "0"} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Destination</span>
                    <span className="font-semibold capitalize">
                      {recipientType}
                    </span>
                  </div>
                  {recipientAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">To</span>
                      <span className="font-mono text-sm">
                        {recipientAddress.slice(0, 8)}...
                        {recipientAddress.slice(-4)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-700/50 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network Fee</span>
                      <span className="font-semibold">~0.00001 XLM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-4">Security Features</h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-sm text-gray-300">
                      End-to-end encryption
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-sm text-gray-300">
                      Multi-signature validation
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-sm text-gray-300">
                      Privacy-preserving transactions
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock size={20} className="text-blue-400" />
                    <span className="text-sm text-gray-300">
                      Real-time confirmation
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-4">Recent Deposits</h3>

                <div className="space-y-3">
                  <div className="text-center py-8 text-gray-500">
                    <Shield size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent deposits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
