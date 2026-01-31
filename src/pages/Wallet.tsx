import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import DepositModal from "../components/wallet/DepositModal";
import WithdrawModal from "../components/wallet/WithdrawModal";
import SendTokenModal from "../components/wallet/SendTokenModal";

const Wallet: React.FC = () => {
  const [activeModal, setActiveModal] = useState<
    "deposit" | "withdraw" | "send" | null
  >(null);
  // const [activeTab, setActiveTab] = useState('portfolio'); // TODO: Implement tab functionality
  const { address, balances } = useWallet();

  const closeModal = () => setActiveModal(null);

  // Mock data enhanced with real wallet data
  const totalBalance = balances?.xlm
    ? parseFloat(balances.xlm.balance) * 0.09
    : 0; // XLM * price
  const xlmBalance = balances?.xlm ? parseFloat(balances.xlm.balance) : 0;

  const transactions = [
    {
      id: 1,
      type: "receive",
      asset: "XLM",
      amount: "+1,250",
      value: "$112.50",
      time: "2m ago",
      status: "completed",
    },
    {
      id: 2,
      type: "send",
      asset: "XLM",
      amount: "-500",
      value: "$45.00",
      time: "1h ago",
      status: "completed",
    },
    {
      id: 3,
      type: "swap",
      asset: "XLM→USDC",
      amount: "1,000",
      value: "$90",
      time: "3h ago",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-800/20 pointer-events-none" />

      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Main Portfolio Section */}
            <div className="xl:col-span-8 space-y-8">
              {/* Portfolio Overview Card */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Portfolio Value</h2>
                    <div className="flex items-center space-x-4">
                      <span className="text-5xl font-bold">
                        ${totalBalance.toFixed(2)}
                      </span>
                      <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                        <span className="text-sm">↗</span>
                        <span className="text-sm font-medium">+5.2%</span>
                      </div>
                    </div>
                    <p className="text-gray-400 mt-2">
                      +${(totalBalance * 0.05).toFixed(2)} (24h)
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal("deposit")}
                    className="bg-[#FDDA24] hover:bg-[#e6c520] text-black font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
                  >
                    Add Funds
                  </button>
                </div>

                {/* Chart Area */}
                <div className="h-64 bg-black/40 rounded-2xl p-6 border border-gray-700/30">
                  <div className="flex items-end justify-between h-full space-x-2">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-[#FDDA24]/60 to-[#FDDA24]/20 rounded-t-sm flex-1"
                        style={{ height: `${Math.random() * 80 + 20}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex space-x-2 mt-6">
                  {["1H", "1D", "1W", "1M", "1Y", "ALL"].map((period) => (
                    <button
                      key={period}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        period === "1D"
                          ? "bg-[#FDDA24] text-black"
                          : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl p-6 border border-gray-700/50 hover:border-[#FDDA24]/30 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold">
                        ✦
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">XLM</h3>
                        <p className="text-gray-400 text-sm">Stellar Lumens</p>
                      </div>
                    </div>
                    <div className="text-green-400 font-medium text-sm">
                      +5.2%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Holdings</span>
                      <span className="font-medium">
                        {xlmBalance.toFixed(4)} XLM
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Value</span>
                      <span className="font-bold text-lg">
                        ${totalBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="h-12 mt-4 flex items-end space-x-1">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-[#FDDA24]/40 to-[#FDDA24]/20 flex-1 rounded-t-sm"
                        style={{ height: `${Math.random() * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Placeholder for other assets */}
                <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl p-6 border border-gray-700/50 opacity-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl font-bold">
                        $
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">USDC</h3>
                        <p className="text-gray-400 text-sm">USD Coin</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-gray-500 py-8">
                    <p>Connect wallet to view other assets</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/60 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveModal("send")}
                    className="bg-gray-800/60 hover:bg-gray-700/60 rounded-xl p-6 text-center transition-all duration-300 border border-gray-700/30 hover:border-[#FDDA24]/30 group"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                      ↗
                    </div>
                    <div className="font-medium">Send</div>
                  </button>

                  <button
                    onClick={() => setActiveModal("deposit")}
                    className="bg-gray-800/60 hover:bg-gray-700/60 rounded-xl p-6 text-center transition-all duration-300 border border-gray-700/30 hover:border-[#FDDA24]/30 group"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                      ↙
                    </div>
                    <div className="font-medium">Receive</div>
                  </button>

                  <button
                    onClick={() => setActiveModal("withdraw")}
                    className="bg-gray-800/60 hover:bg-gray-700/60 rounded-xl p-6 text-center transition-all duration-300 border border-gray-700/30 hover:border-[#FDDA24]/30 group"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                      ⇄
                    </div>
                    <div className="font-medium">Withdraw</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-6">
              {/* Wallet Status */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4">Wallet Status</h3>
                {address ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 font-medium">
                          Connected
                        </span>
                      </div>
                      <div className="text-green-400">✓</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-xl">
                      <div className="text-xs text-gray-400 mb-1">Address</div>
                      <div className="font-mono text-sm">
                        {address.slice(0, 8)}...{address.slice(-8)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No wallet connected</p>
                    <button className="bg-[#FDDA24] hover:bg-[#e6c520] text-black font-semibold px-6 py-2 rounded-full transition-all duration-300">
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            tx.type === "receive"
                              ? "bg-green-500/20 text-green-400"
                              : tx.type === "send"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {tx.type === "receive"
                            ? "↗"
                            : tx.type === "send"
                              ? "↙"
                              : "⇄"}
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {tx.type} {tx.asset}
                          </div>
                          <div className="text-gray-400 text-sm">{tx.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{tx.amount}</div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            tx.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Info */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4">Network</h3>
                <div className="flex items-center space-x-3 p-3 bg-[#FDDA24]/10 rounded-xl border border-[#FDDA24]/20">
                  <div className="w-2 h-2 bg-[#FDDA24] rounded-full animate-pulse"></div>
                  <span className="text-[#FDDA24] font-medium">
                    Stellar Testnet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {activeModal === "deposit" && <DepositModal onClose={closeModal} />}

        {activeModal === "withdraw" && <WithdrawModal onClose={closeModal} />}

        {activeModal === "send" && <SendTokenModal onClose={closeModal} />}
      </div>
    </div>
  );
};

export default Wallet;
