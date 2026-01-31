import React from "react";
import { WalletButton } from "./WalletButton";
import NetworkPill from "./NetworkPill";

const ConnectAccount: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 p-2 rounded-xl bg-gray-900/40 border border-gray-800/50 backdrop-blur-sm">
      <WalletButton />
      <NetworkPill />
    </div>
  );
};

export default ConnectAccount;
