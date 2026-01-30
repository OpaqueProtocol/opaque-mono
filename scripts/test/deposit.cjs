#!/usr/bin/env node

/**
 * Script 2: Deposit to Contract
 *
 * Deposits 1 XLM to the opaque privacy pool using the active wallet from state.
 *
 * Usage:
 *   node scripts/test/deposit.cjs
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
  rpc,
  TransactionBuilder,
  Operation,
  xdr,
  nativeToScVal,
} = require("@stellar/stellar-sdk");
const { execSync } = require("child_process");

// Fixed deposit amount (1 XLM in stroops)
const FIXED_AMOUNT = 10000000n;

/**
 * Get the contract ID
 */
function getContractId(network) {
  // Check env first
  if (process.env.OPAQUE_CONTRACT_ID) {
    return process.env.OPAQUE_CONTRACT_ID;
  }

  // Try CLI
  try {
    const networkArg = network.name.toLowerCase();
    const cmd = `stellar contract alias show opaque --network ${networkArg}`;
    const contractId = execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (contractId && contractId.startsWith("C")) {
      return contractId;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Test Script 2: Deposit to Privacy Pool");
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

  console.log(`Network: ${network.name}`);
  console.log(`Wallet:  ${wallet.name} (${wallet.publicKey})`);

  // Refresh balance
  const currentBalance = await getBalance(wallet.publicKey, network);
  console.log(`Balance: ${currentBalance} XLM`);
  updateWalletBalance(state, wallet.name, currentBalance);

  if (currentBalance < 1.1) {
    console.error("Error: Insufficient balance for deposit + fees.");
    process.exit(1);
  }
  console.log();

  // Get Contract ID
  console.log("[1/2] Looking up contract...");
  const contractId = getContractId(network);
  if (!contractId) {
    console.error("Error: 'opaque' contract alias not found.");
    console.error("Run `scripts/deploy.sh` or set OPAQUE_CONTRACT_ID env var.");
    process.exit(1);
  }
  console.log(`  Contract ID: ${contractId}`);
  console.log();

  // Perform Deposit
  console.log("[2/2] Depositing 1 XLM...");
  console.log(`  Commitment: ${wallet.privacyKeys.commitment}`);

  try {
    const keypair = Keypair.fromSecret(wallet.secretKey);
    const server = new rpc.Server(network.rpcUrl, { allowHttp: true });

    // Get account
    const account = await server.getAccount(wallet.publicKey);

    // Build args: deposit(from: Address, commitment: BytesN<32>)
    // Commitment is hex string in state, need bytes
    const commitmentBuffer = Buffer.from(wallet.privacyKeys.commitment, "hex");

    // Note: nativeToScVal for address, scvBytes for commitment
    const args = [
      nativeToScVal(wallet.publicKey, { type: "address" }),
      xdr.ScVal.scvBytes(commitmentBuffer),
    ];

    const tx = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: network.networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: "deposit",
          args: args,
        }),
      )
      .setTimeout(300)
      .build();

    // Simulate
    console.log("  Simulating...");
    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    // Sign & Send
    console.log("  Submitting...");
    const preparedTx = rpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(keypair);

    const sendResult = await server.sendTransaction(preparedTx);
    if (sendResult.status === "ERROR") {
      throw new Error(`Submission failed: ${sendResult.errorResult}`);
    }

    console.log(`  Tx Hash: ${sendResult.hash}`);
    console.log("  Waiting for confirmation...");

    // Wait loop
    let txResult;
    for (let i = 0; i < 30; i++) {
      txResult = await server.getTransaction(sendResult.hash);
      if (txResult.status === "SUCCESS") {
        console.log("  Deposit Successful!");
        break;
      }
      if (txResult.status === "FAILED") {
        throw new Error("Transaction reported FAILED status");
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (txResult?.status !== "SUCCESS") {
      throw new Error("Transaction timed out or failed");
    }

    // Final balance check
    const newBalance = await getBalance(wallet.publicKey, network);
    console.log(`  New Balance: ${newBalance} XLM`);
    updateWalletBalance(state, wallet.name, newBalance);
  } catch (err) {
    console.error(`Deposit Failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
