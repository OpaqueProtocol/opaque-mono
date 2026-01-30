#!/usr/bin/env node

/**
 * Script 3: Transfer Funds
 *
 * Transfers XLM from the active wallet to another address.
 *
 * Usage:
 *   node scripts/test/transfer.cjs --to <G...> --amount <XLM>
 *   node scripts/test/transfer.cjs --create-dest --amount <XLM>
 */

const {
  loadState,
  getActiveWallet,
  getNetwork,
  updateWalletBalance,
  getBalance,
} = require("./state.cjs");
const {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Horizon,
} = require("@stellar/stellar-sdk");

async function main() {
  console.log("=".repeat(60));
  console.log("Test Script 3: Transfer Funds");
  console.log("=".repeat(60));
  console.log();

  const state = loadState();
  const network = getNetwork(state);
  const wallet = getActiveWallet(state);

  if (!wallet) {
    console.error(
      "Error: No active wallet found. Run create_wallet.cjs first.",
    );
    process.exit(1);
  }

  // Parse args
  const args = process.argv.slice(2);
  let toAddress = null;
  let amount = 1.0;
  let createDest = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--to" && args[i + 1]) toAddress = args[i + 1];
    if (args[i] === "--amount" && args[i + 1]) amount = parseFloat(args[i + 1]);
    if (args[i] === "--create-dest") createDest = true;
  }

  if (createDest && !toAddress) {
    // Generate random destination
    const destKeypair = Keypair.random();
    toAddress = destKeypair.publicKey();
    console.log(`Generated random destination: ${toAddress}`);
    console.log(`(Secret: ${destKeypair.secret()})`);
  }

  if (!toAddress) {
    console.error("Error: --to <address> or --create-dest required");
    process.exit(1);
  }

  console.log(`Network: ${network.name}`);
  console.log(`From:    ${wallet.name} (${wallet.publicKey})`);
  console.log(`To:      ${toAddress}`);
  console.log(`Amount:  ${amount} XLM`);
  console.log();

  const server = new Horizon.Server(network.horizonUrl, {
    allowHttp: network.name === "LOCAL",
  });
  const sourceKeys = Keypair.fromSecret(wallet.secretKey);

  console.log("[1/2] Loading source account...");
  let sourceAccount;
  try {
    sourceAccount = await server.loadAccount(wallet.publicKey);
  } catch (e) {
    console.error("Error loading source account. Ensure it is funded.");
    process.exit(1);
  }

  console.log("[2/2] Submitting transaction...");
  try {
    // Check if dest exists to decide between payment (if exists) or createAccount (if not)
    let destExists = false;
    try {
      await server.loadAccount(toAddress);
      destExists = true;
    } catch (e) {
      if (e.response && e.response.status === 404) {
        destExists = false;
      } else {
        throw e; // unexpected error
      }
    }

    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase: network.networkPassphrase,
    });

    if (destExists) {
      console.log("  Destination exists, using Payment operation.");
      txBuilder.addOperation(
        Operation.payment({
          destination: toAddress,
          asset: Asset.native(),
          amount: amount.toString(),
        }),
      );
    } else {
      console.log("  Destination empty, using CreateAccount operation.");
      if (amount < 1.0) {
        console.error("  Error: Minimum 1 XLM required to create new account");
        process.exit(1);
      }
      txBuilder.addOperation(
        Operation.createAccount({
          destination: toAddress,
          startingBalance: amount.toString(),
        }),
      );
    }

    const tx = txBuilder.setTimeout(30).build();
    tx.sign(sourceKeys);

    const result = await server.submitTransaction(tx);
    console.log(`  Success! Hash: ${result.hash}`);

    // Update state
    const newBalance = await getBalance(wallet.publicKey, network);
    console.log(`  New Balance: ${newBalance} XLM`);
    updateWalletBalance(state, wallet.name, newBalance);
  } catch (err) {
    console.error("Transfer Failed:");
    if (err.response && err.response.data && err.response.data.extras) {
      console.error(
        JSON.stringify(err.response.data.extras.result_codes, null, 2),
      );
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

main().catch(console.error);
