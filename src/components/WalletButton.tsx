import { useState } from "react";
import { Button, Text, Modal } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { connectWallet, disconnectWallet } from "../util/wallet";

export const WalletButton = () => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const { address, isPending, balances } = useWallet();
  const buttonLabel = isPending ? "Loading..." : "Connect";

  if (!address) {
    return (
      <Button
        variant="primary"
        size="md"
        onClick={() => void connectWallet()}
        className="bg-[#FDDA24] hover:bg-[#e6c520] text-black font-semibold px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
      >
        {buttonLabel}
      </Button>
    );
  }

  return (
    <div
      className={`flex items-center space-x-3 ${isPending ? "opacity-60" : "opacity-100"} transition-opacity`}
    >
      <div className="hidden lg:flex items-center space-x-3 bg-gray-900/60 rounded-full px-4 py-2 border border-gray-800/50 backdrop-blur-sm">
        <div className="w-2 h-2 bg-[#FDDA24] rounded-full shadow-sm shadow-[#FDDA24]/50"></div>
        <Text as="div" size="sm" className="text-white font-medium">
          {balances?.xlm?.balance ? (
            <span>
              {parseFloat(balances.xlm.balance.replace(/,/g, '')).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 7
              })}
              <span className="text-[#FDDA24] ml-1 font-semibold">XLM</span>
            </span>
          ) : (
            <span className="text-gray-400">Loading...</span>
          )}
        </Text>
      </div>

      <div id="modalContainer">
        <Modal
          visible={showDisconnectModal}
          onClose={() => setShowDisconnectModal(false)}
          parentId="modalContainer"
        >
          <Modal.Heading>
            <span className="text-white">
              Connected as{" "}
              <code className="text-[#FDDA24] bg-[#FDDA24]/10 px-1.5 py-0.5 rounded break-all">
                {address}
              </code>
              . Do you want to disconnect?
            </span>
          </Modal.Heading>
          <Modal.Footer itemAlignment="stack">
            <Button
              size="md"
              variant="primary"
              onClick={() => {
                void disconnectWallet().then(() =>
                  setShowDisconnectModal(false),
                );
              }}
            >
              Disconnect
            </Button>
            <Button
              size="md"
              variant="tertiary"
              onClick={() => {
                setShowDisconnectModal(false);
              }}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <div className="bg-gray-900/60 rounded-full px-4 py-2 border border-gray-800/50 backdrop-blur-sm flex items-center space-x-3 hover:border-[#FDDA24]/50 transition-all duration-300">
        <div className="w-8 h-8 bg-gradient-to-r from-[#FDDA24] to-yellow-300 rounded-full flex items-center justify-center shadow-md shadow-[#FDDA24]/30">
          <span className="text-black font-bold text-sm">
            {address.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-mono text-white font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => setShowDisconnectModal(true)}
          className="ml-2 w-6 h-6 bg-gray-800/60 hover:bg-red-500/20 rounded-full flex items-center justify-center transition-all duration-300 text-gray-400 hover:text-red-400 transform hover:scale-110"
          title="Disconnect wallet"
        >
          <span className="text-xs">×</span>
        </button>
      </div>
    </div>
  );
};
