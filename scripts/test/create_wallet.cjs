#!/usr/bin/env node

/**
 * Script 1: Create Wallet
 *
 * Creates a new Stellar wallet, funds it via Friendbot, and saves state.
 *
 * Usage:
 *   node scripts/test/create_wallet.cjs [--name mywallet] [--network testnet|local]
 */

const {
  loadState,
  saveState,
  createWallet,
  fundWallet,
  getBalance,
  getNetwork,
  updateWalletBalance,
  exportAsEnv,
} = require("./state.cjs");

async function main() {
  console.log("=".repeat(60));
  console.log("Test Script 1: Create & Fund Wallet");
  console.log("=".repeat(60));
  console.log();

  // Load state or initialize defaults
  const state = loadState();

  // Parse args
  const args = process.argv.slice(2);
  let walletName = "wallet_" + Date.now();
  let networkName = state.network || "testnet";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) walletName = args[i + 1];
    if (args[i] === "--network" && args[i + 1])
      networkName = args[i + 1].toLowerCase();
  }

  // Update state with network choice
  state.network = networkName;
  const network = getNetwork(state);

  console.log(`Network: ${network.name}`);
  console.log(`Wallet Name: ${walletName}`);
  console.log();

  // Create Wallet
  console.log("[1/3] Creating new Stellar wallet...");
  const wallet = createWallet(state, walletName);
  console.log(`  Public Key:  ${wallet.publicKey}`);
  console.log(`  Secret Key:  ${wallet.secretKey}`);
  console.log();

  // Fund Wallet
  console.log("[2/3] Funding wallet via Friendbot...");
  try {
    await fundWallet(wallet.publicKey, network);
    console.log("  Funding successful!");

    // Check balance
    const balance = await getBalance(wallet.publicKey, network);
    console.log(`  Balance: ${balance} XLM`);

    // Update state
    updateWalletBalance(state, walletName, balance, true);
  } catch (error) {
    console.error(`  Error funding wallet: ${error.message}`);
    updateWalletBalance(state, walletName, 0, false);
  }
  console.log();

  // Privacy Keys
  console.log("[3/3] Privacy Keys Generated...");
  console.log(`  Nullifier:    ${wallet.privacyKeys.nullifier}`);
  console.log(`  Commitment:   ${wallet.privacyKeys.commitment}`);
  console.log();

  // Export Env
  console.log("To use this wallet in other terminals:");
  console.log(exportAsEnv(state));

  console.log();
  console.log(`State saved to: scripts/test/state.json`);
}

main().catch(console.error);
