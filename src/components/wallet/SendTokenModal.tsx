import React, { useState } from "react";
import { Icon } from "@stellar/design-system";

interface SendTokenModalProps {
  onClose: () => void;
}

const SendTokenModal: React.FC<SendTokenModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [fromCrypto, setFromCrypto] = useState("BTC");
  const [toCrypto, setToCrypto] = useState("ETH");
  const [amount, setAmount] = useState("");

  const cryptos = [
    { symbol: "BTC", name: "Bitcoin", color: "bg-orange-500", rate: 45000 },
    { symbol: "ETH", name: "Ethereum", color: "bg-purple-500", rate: 3000 },
    { symbol: "LTC", name: "Litecoin", color: "bg-blue-400", rate: 120 },
    { symbol: "XLM", name: "Stellar", color: "bg-blue-500", rate: 0.09 },
  ];

  const fromCryptoData = cryptos.find((c) => c.symbol === fromCrypto);
  const toCryptoData = cryptos.find((c) => c.symbol === toCrypto);

  const calculateExchange = () => {
    if (!amount || !fromCryptoData || !toCryptoData) return 0;
    const usdValue = parseFloat(amount) * fromCryptoData.rate;
    return usdValue / toCryptoData.rate;
  };

  const exchangeFee = 0.5; // 0.5%
  const receivedAmount = calculateExchange() * (1 - exchangeFee / 100);

  const swapCurrencies = () => {
    const temp = fromCrypto;
    setFromCrypto(toCrypto);
    setToCrypto(temp);
  };

  const handleNext = () => {
    if (step === "form") {
      setStep("confirm");
    } else if (step === "confirm") {
      setStep("success");
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-3xl p-6 w-full max-w-md text-white border border-gray-700/50 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {step === "form" && "Exchange cryptocurrency"}
            {step === "confirm" && "Confirm Exchange"}
            {step === "success" && "Exchange Complete"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-800/60 rounded-full flex items-center justify-center hover:bg-gray-700/60 transition-all duration-300 transform hover:scale-110"
          >
            <Icon.X size="sm" />
          </button>
        </div>

        {step === "form" && (
          <>
            {/* Subtitle */}
            <p className="text-gray-400 mb-8 text-center">
              in a <span className="text-green-400">few seconds</span>
            </p>
            <p className="text-gray-300 text-sm mb-6 text-center">
              Easy and secure way to quickly exchange your crypto assets.
              <br />
              We support many different destinations and networks.
            </p>

            {/* You Send */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-3">
                You send
              </label>
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-2xl font-bold text-white outline-none flex-1"
                  />

                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 ${fromCryptoData?.color} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-white text-xs font-bold">
                        {fromCrypto.charAt(0)}
                      </span>
                    </div>
                    <select
                      value={fromCrypto}
                      onChange={(e) => setFromCrypto(e.target.value)}
                      className="bg-transparent text-white font-medium outline-none"
                    >
                      {cryptos.map((crypto) => (
                        <option
                          key={crypto.symbol}
                          value={crypto.symbol}
                          className="bg-gray-800"
                        >
                          {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                    <Icon.ChevronDown size="sm" className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={swapCurrencies}
                className="w-10 h-10 bg-gray-800/60 rounded-full flex items-center justify-center hover:bg-gray-700/60 transition-all duration-300 transform hover:scale-110 border border-gray-700/50"
              >
                <Icon.ArrowUp size="sm" />
              </button>
            </div>

            {/* You Receive */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-3">
                You receive
              </label>
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-white">
                    {amount ? receivedAmount.toFixed(6) : "0"}
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={toCrypto}
                      onChange={(e) => setToCrypto(e.target.value)}
                      className="bg-transparent text-green-400 font-medium outline-none"
                    >
                      <option value="" className="bg-gray-800">
                        Select currency
                      </option>
                      {cryptos.map((crypto) => (
                        <option
                          key={crypto.symbol}
                          value={crypto.symbol}
                          className="bg-gray-800"
                        >
                          {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                    <Icon.ChevronDown size="sm" className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Exchange Rate Info */}
            {amount && fromCryptoData && toCryptoData && (
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Exchange Rate</span>
                  <span>
                    1 {fromCrypto} ={" "}
                    {(fromCryptoData.rate / toCryptoData.rate).toFixed(6)}{" "}
                    {toCrypto}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Fee ({exchangeFee}%)</span>
                  <span>
                    {(calculateExchange() - receivedAmount).toFixed(6)}{" "}
                    {toCrypto}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-700 pt-2">
                  <span className="text-gray-400">You receive</span>
                  <span className="font-semibold">
                    {receivedAmount.toFixed(6)} {toCrypto}
                  </span>
                </div>
              </div>
            )}

            {/* Exchange Button */}
            <button
              onClick={handleNext}
              disabled={!amount || !toCrypto}
              className="w-full bg-[#FDDA24] hover:bg-[#e6c520] text-black py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#FDDA24]/30"
            >
              Exchange →
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="text-center mb-6">
                <div className="flex justify-center items-center space-x-4 mb-4">
                  <div
                    className={`w-12 h-12 ${fromCryptoData?.color} rounded-full flex items-center justify-center`}
                  >
                    <span className="text-white font-bold">
                      {fromCrypto.charAt(0)}
                    </span>
                  </div>
                  <Icon.ArrowRight className="text-gray-400" />
                  <div
                    className={`w-12 h-12 ${toCryptoData?.color} rounded-full flex items-center justify-center`}
                  >
                    <span className="text-white font-bold">
                      {toCrypto.charAt(0)}
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold mb-2">
                  {amount} {fromCrypto} → {receivedAmount.toFixed(6)} {toCrypto}
                </div>
                <div className="text-gray-400">
                  ≈ $
                  {(parseFloat(amount) * (fromCryptoData?.rate || 0)).toFixed(
                    2,
                  )}{" "}
                  USD
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Exchange Rate:</span>
                  <span>
                    1 {fromCrypto} ={" "}
                    {fromCryptoData && toCryptoData
                      ? (fromCryptoData.rate / toCryptoData.rate).toFixed(6)
                      : "0"}{" "}
                    {toCrypto}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee:</span>
                  <span>{exchangeFee}%</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-3">
                  <span className="text-gray-400">Processing Time:</span>
                  <span className="text-green-400">~30 seconds</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-900/60 border border-yellow-600/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-start space-x-2">
                <Icon.AlertTriangle
                  className="text-yellow-400 mt-0.5"
                  size="sm"
                />
                <div>
                  <p className="text-yellow-200 text-sm mb-1">
                    Exchange Confirmation
                  </p>
                  <p className="text-yellow-100 text-xs">
                    You are about to exchange {amount} {fromCrypto} for{" "}
                    {receivedAmount.toFixed(6)} {toCrypto}. This action cannot
                    be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep("form")}
                className="flex-1 bg-gray-700/60 text-white py-3 rounded-2xl font-semibold hover:bg-gray-600/60 transition-all duration-300 transform hover:scale-105 border border-gray-600/50"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-[#FDDA24] hover:bg-[#e6c520] text-black py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md shadow-[#FDDA24]/30"
              >
                Confirm Exchange
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#FDDA24] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-[#FDDA24]/30">
                <Icon.Check className="text-black" size="lg" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Exchange Successful!
              </h3>
              <p className="text-gray-400">
                Your cryptocurrency has been exchanged successfully.
              </p>
            </div>

            <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 mb-6">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold">
                  {amount} {fromCrypto} → {receivedAmount.toFixed(6)} {toCrypto}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-xs">0x1a2b3c...def456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Processing Time:</span>
                  <span>28 seconds</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div>
                <div className="text-2xl font-bold">31299</div>
                <div className="text-gray-400 text-xs">Completed Orders</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$216,128.32</div>
                <div className="text-gray-400 text-xs">1M Volume</div>
              </div>
              <div>
                <div className="text-2xl font-bold">1210</div>
                <div className="text-gray-400 text-xs">Exchange Pairs</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#FDDA24] hover:bg-[#e6c520] text-black py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md shadow-[#FDDA24]/30"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SendTokenModal;
