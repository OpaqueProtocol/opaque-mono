import React from "react";
import { Icon } from "@stellar/design-system";

interface WalletDashboardProps {
  onAction: (action: "deposit" | "withdraw" | "send") => void;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ onAction }) => {
  // Mock data - replace with real data
  const totalBalance = 85248;
  const totalEarned = 5841.26;
  const totalSpent = 2465.08;
  const dailyChange = 3.9;
  const weeklyValue = 5985.06;

  const transactions = [
    {
      id: 1,
      type: "send",
      coin: "Bitcoin",
      symbol: "BTC",
      amount: 2950.75,
      status: "Send",
    },
    {
      id: 2,
      type: "send",
      coin: "Litecoin",
      symbol: "LTC",
      amount: 1983.02,
      status: "Send",
    },
    {
      id: 3,
      type: "send",
      coin: "Bitcoin",
      symbol: "BTC",
      amount: 3629.41,
      status: "Send",
    },
    {
      id: 4,
      type: "receive",
      coin: "Ethereum",
      symbol: "ETH",
      amount: 5710.2,
      status: "Received",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile-first layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Main Balance */}
        <div className="bg-gray-900 rounded-3xl p-6 text-white relative overflow-hidden">
          {/* Header Icons */}
          <div className="flex justify-between items-center mb-6">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <Icon.Wallet01 size="sm" />
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <Icon.Copy01 size="sm" />
            </div>
          </div>

          {/* Currency Label */}
          <div className="text-gray-400 text-sm mb-2">USD</div>

          {/* Main Balance */}
          <div className="text-4xl font-bold mb-2">
            {totalBalance.toLocaleString()}
          </div>

          {/* Daily Change */}
          <div className="flex items-center text-sm mb-8">
            <span className="text-gray-400 mr-2">
              ${(totalBalance * 0.009).toFixed(2)}
            </span>
            <span className="text-green-400">+{dailyChange}%</span>
          </div>

          {/* Earned/Spent Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white bg-opacity-10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Earned</span>
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                  <Icon.TrendUp01 size="xs" />
                </div>
              </div>
              <div className="text-lg font-semibold">
                ${totalEarned.toLocaleString()}
              </div>
            </div>

            <div className="bg-yellow-500 bg-opacity-20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Spent</span>
                <div className="w-6 h-6 bg-yellow-500 bg-opacity-30 rounded-full flex items-center justify-center">
                  <Icon.TrendDown01 size="xs" />
                </div>
              </div>
              <div className="text-lg font-semibold">
                ${totalSpent.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Chart Area (Simplified) */}
          <div className="mb-6">
            <div className="flex items-end space-x-1 h-16">
              {[40, 65, 30, 80, 45, 70, 55, 85, 60, 75, 50, 90].map(
                (height) => (
                  <div
                    key={`chart-bar-${height}-${Math.random()}`}
                    className="bg-white bg-opacity-30 rounded-sm flex-1"
                    style={{ height: `${height}%` }}
                  />
                ),
              )}
            </div>
            <div className="flex justify-center mt-4">
              <div className="text-lg font-semibold">
                ${weeklyValue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex justify-center space-x-2 mb-6">
            {["24h", "2d", "4d", "1w", "3w", "1m"].map((period, i) => (
              <button
                key={period}
                className={`px-3 py-1 rounded-lg text-sm ${
                  i === 1
                    ? "bg-white text-gray-900"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Convert Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Convert</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl p-4">
                <div className="text-2xl font-bold mb-1">25.87</div>
                <div className="text-gray-400 text-sm">$9,916.21</div>
                <div className="text-yellow-500 font-semibold">BTC</div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4">
                <div className="text-2xl font-bold mb-1">930.59</div>
                <div className="text-gray-400 text-sm">$3,111.83</div>
                <div className="text-purple-400 font-semibold">ETH</div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <Icon.Repeat01 size="sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Balance & Transactions */}
        <div className="bg-gray-900 rounded-3xl p-6 text-white">
          {/* Header Icons */}
          <div className="flex justify-between items-center mb-6">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <Icon.Wallet01 size="sm" />
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <Icon.Copy01 size="sm" />
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl p-6 text-black mb-6">
            <div className="text-sm mb-2">USD</div>
            <div className="text-4xl font-bold mb-2">194,284</div>
            <div className="flex items-center text-sm">
              <span className="mr-2">$2,678</span>
              <span className="text-green-700">+1.6%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => onAction("deposit")}
              className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Icon.ArrowDown size="sm" />
            </button>
            <button
              onClick={() => onAction("send")}
              className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Icon.Plus size="sm" />
            </button>
            <button
              onClick={() => onAction("withdraw")}
              className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Icon.ArrowUp size="sm" />
            </button>
          </div>

          {/* Transactions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transactions</h3>
              <span className="text-gray-400 text-sm">Last 4 days</span>
            </div>

            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.symbol === "BTC"
                          ? "bg-orange-500"
                          : transaction.symbol === "LTC"
                            ? "bg-blue-400"
                            : transaction.symbol === "ETH"
                              ? "bg-purple-500"
                              : "bg-gray-500"
                      }`}
                    >
                      <span className="text-white text-sm font-semibold">
                        {transaction.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{transaction.coin}</div>
                      <div className="text-gray-400 text-sm">
                        {transaction.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">
                      ${transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-sm flex items-center">
                      {transaction.status}
                      <Icon.InfoCircle className="ml-1" size="xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
