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
      <div className="hidden lg:flex items-center space-x-3 bg-gray-900/60 rounded-full px-4 py-2 border border-gray-700/50">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <Text as="div" size="sm" className="text-gray-300">
          {balances?.xlm?.balance
            ? `${parseFloat(balances.xlm.balance).toFixed(2)} XLM`
            : "Loading..."}
        </Text>
      </div>

      <div id="modalContainer">
        <Modal
          visible={showDisconnectModal}
          onClose={() => setShowDisconnectModal(false)}
          parentId="modalContainer"
        >
          <Modal.Heading>
            Connected as{" "}
            <code style={{ lineBreak: "anywhere" }}>{address}</code>. Do you
            want to disconnect?
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

      <div className="bg-gray-900/60 rounded-full px-4 py-2 border border-gray-700/50 flex items-center space-x-3 cursor-pointer hover:border-[#FDDA24]/50 transition-all duration-300">
        <div className="w-8 h-8 bg-gradient-to-r from-[#FDDA24] to-yellow-300 rounded-full flex items-center justify-center">
          <span className="text-black font-bold text-sm">
            {address.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-mono text-gray-300">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => setShowDisconnectModal(true)}
          className="opacity-0 absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};
