import React from "react";
import { Icon } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { stellarNetwork } from "../contracts/util";

// Format network name with first letter capitalized
const formatNetworkName = (name: string) =>
  // TODO: This is a workaround until @creit-tech/stellar-wallets-kit uses the new name for a local network.
  name === "STANDALONE"
    ? "Local"
    : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

const appNetwork = formatNetworkName(stellarNetwork);

const bgColor = "rgba(17, 17, 17, 0.8)";
const textColor = "#a0a0a0";

const NetworkPill: React.FC = () => {
  const { network, address } = useWallet();

  // Check if there's a network mismatch
  const walletNetwork = formatNetworkName(network ?? "");
  const isNetworkMismatch = walletNetwork !== appNetwork;

  let title = "";
  let color = "#10b981";
  if (!address) {
    title = "Connect your wallet using this network.";
    color = "#6b6b6b";
  } else if (isNetworkMismatch) {
    title = `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`;
    color = "#ef4444";
  }

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: isNetworkMismatch ? "help" : "default",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(16px)",
        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      title={title}
    >
      <Icon.Circle color={color} />
      {appNetwork}
    </div>
  );
};

export default NetworkPill;
