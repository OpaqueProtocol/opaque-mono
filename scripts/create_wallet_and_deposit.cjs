#!/usr/bin/env node

/**
 * Stellar Wallet Creation, Funding, and Contract Deposit Script
 *
 * This script:
 * 1. Creates a new Stellar wallet (keypair)
 * 2. Funds it using Friendbot (testnet/local)
 * 3. Generates viewing key and signing key
 * 4. Deposits to the opaque privacy pool contract
 *
 * Usage:
 *   node scripts/create_wallet_and_deposit.cjs [--network testnet|local]
 */

const {
  Keypair,
  rpc,
  TransactionBuilder,
  Operation,
  Networks,
  xdr,
  nativeToScVal,
} = require("@stellar/stellar-sdk");
const crypto = require("crypto");
const { execSync } = require("child_process");
const fs = require("fs");

// Configuration based on network
const NETWORKS = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
    networkPassphrase: Networks.TESTNET,
    name: "TESTNET",
  },
  local: {
    rpcUrl: "http://localhost:8000/rpc",
    horizonUrl: "http://localhost:8000",
    friendbotUrl: "http://localhost:8000/friendbot",
    networkPassphrase: "Standalone Network ; February 2017",
    name: "LOCAL",
  },
};

// Fixed deposit amount (1 XLM in stroops)
const FIXED_AMOUNT = 10000000n; // 1 XLM = 10,000,000 stroops

/**
 * Generate a random 32-byte value
 */
function generateRandomBytes32() {
  return crypto.randomBytes(32);
}

/**
 * Generate viewing key and signing key
 * In a privacy pool context:
 * - Viewing key: allows seeing your commitments/balances but not spending
 * - Signing key: the secret that allows withdrawal (spending)
 */
function generatePrivacyKeys() {
  // Generate random secrets for the commitment
  const nullifier = generateRandomBytes32();
  const secret = generateRandomBytes32();

  // The viewing key is typically derived from the secret but doesn't allow spending
  // Here we use a hash of the secret as the viewing key
  const viewingKey = crypto.createHash("sha256").update(secret).digest();

  // The signing key is the full secret that allows withdrawal
  const signingKey = secret;

  return {
    nullifier,
    secret,
    viewingKey,
    signingKey,
    // For the commitment, we'd normally use Poseidon hash, but since we don't have
    // a JS implementation of Poseidon255 (BLS12-381), we'll generate a deterministic
    // commitment that can be used for testing
    // commitment = Poseidon(Poseidon(value, label), Poseidon(nullifier, secret))
    // For demo purposes, we use SHA256 as a placeholder
    commitment: crypto
      .createHash("sha256")
      .update(Buffer.concat([nullifier, secret]))
      .digest(),
  };
}

/**
 * Fund a wallet using Friendbot
 */
async function fundWallet(address, network) {
  const url = `${network.friendbotUrl}?addr=${address}`;
  console.log(`  Requesting funds from: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Friendbot request failed: ${response.status} - ${errorText}`,
    );
  }

  const result = await response.json();
  return result;
}

/**
 * Get account balance
 */
async function getBalance(address, network) {
  const response = await fetch(`${network.horizonUrl}/accounts/${address}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Account not found
    }
    throw new Error(`Failed to fetch account: ${response.status}`);
  }

  const account = await response.json();
  const nativeBalance = account.balances.find((b) => b.asset_type === "native");
  return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
}

/**
 * Get the contract ID from the stellar CLI
 */
async function getContractId(network) {
  // Try to read from stellar CLI alias
  try {
    const networkArg = network.name.toLowerCase();
    const contractId = execSync(
      `stellar contract alias show opaque --network ${networkArg}`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    ).trim();

    if (contractId && contractId.startsWith("C")) {
      return contractId;
    }
  } catch (e) {
    // Contract alias not found, try to get from environment or prompt user
    console.log("  Warning: Could not find 'opaque' contract alias");
  }

  // Check for environment variable
  if (process.env.OPAQUE_CONTRACT_ID) {
    return process.env.OPAQUE_CONTRACT_ID;
  }

  return null;
}

/**
 * Deposit to the opaque contract
 */
async function depositToContract(keypair, commitment, contractId, network) {
  const server = new rpc.Server(network.rpcUrl, { allowHttp: true });

  // Get the account
  const account = await server.getAccount(keypair.publicKey());

  // Build the deposit transaction
  // The deposit function signature is: deposit(from: Address, commitment: BytesN<32>)
  const depositArgs = [
    nativeToScVal(keypair.publicKey(), { type: "address" }),
    xdr.ScVal.scvBytes(commitment),
  ];

  const tx = new TransactionBuilder(account, {
    fee: "100000", // 0.01 XLM
    networkPassphrase: network.networkPassphrase,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contractId,
        function: "deposit",
        args: depositArgs,
      }),
    )
    .setTimeout(300)
    .build();

  // Simulate the transaction first
  console.log("  Simulating transaction...");
  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  // Prepare the transaction with simulation results
  const preparedTx = rpc.assembleTransaction(tx, simResult).build();

  // Sign the transaction
  preparedTx.sign(keypair);

  console.log("  Submitting transaction...");
  const sendResult = await server.sendTransaction(preparedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${sendResult.errorResult}`);
  }

  // Wait for the transaction to complete
  console.log(`  Transaction hash: ${sendResult.hash}`);
  console.log("  Waiting for confirmation...");

  let txResult;
  for (let i = 0; i < 30; i++) {
    txResult = await server.getTransaction(sendResult.hash);

    if (txResult.status === "SUCCESS") {
      return { success: true, hash: sendResult.hash, result: txResult };
    }

    if (txResult.status === "FAILED") {
      throw new Error(`Transaction failed: ${JSON.stringify(txResult)}`);
    }

    // Still pending, wait and retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Transaction timed out");
}

async function main() {
  console.log("=".repeat(60));
  console.log("Stellar Wallet Creation and Contract Deposit");
  console.log("=".repeat(60));
  console.log();

  // Parse command line arguments
  const args = process.argv.slice(2);
  let networkName = "testnet"; // Default to testnet

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--network" && args[i + 1]) {
      networkName = args[i + 1].toLowerCase();
    }
  }

  if (!NETWORKS[networkName]) {
    console.error(`Unknown network: ${networkName}`);
    console.error("Available networks: testnet, local");
    process.exit(1);
  }

  const network = NETWORKS[networkName];
  console.log(`Network: ${network.name}`);
  console.log(`RPC URL: ${network.rpcUrl}`);
  console.log();

  // Step 1: Create a new Stellar wallet
  console.log("[1/5] Creating new Stellar wallet...");
  const keypair = Keypair.random();
  console.log(`  Public Key:  ${keypair.publicKey()}`);
  console.log(`  Secret Key:  ${keypair.secret()}`);
  console.log();

  // Step 2: Fund the wallet using Friendbot
  console.log("[2/5] Funding wallet via Friendbot...");
  try {
    await fundWallet(keypair.publicKey(), network);
    console.log("  Funding successful!");

    // Check balance
    const balance = await getBalance(keypair.publicKey(), network);
    console.log(`  Balance: ${balance} XLM`);
  } catch (error) {
    console.error(`  Error funding wallet: ${error.message}`);
    console.log(
      "  You may need to fund the wallet manually or use a different network.",
    );
  }
  console.log();

  // Step 3: Generate viewing and signing keys
  console.log("[3/5] Generating privacy keys (viewing key and signing key)...");
  const privacyKeys = generatePrivacyKeys();
  console.log(`  Nullifier:    ${privacyKeys.nullifier.toString("hex")}`);
  console.log(`  Secret:       ${privacyKeys.secret.toString("hex")}`);
  console.log(`  Viewing Key:  ${privacyKeys.viewingKey.toString("hex")}`);
  console.log(`  Signing Key:  ${privacyKeys.signingKey.toString("hex")}`);
  console.log(`  Commitment:   ${privacyKeys.commitment.toString("hex")}`);
  console.log();

  // Step 4: Get contract ID
  console.log("[4/5] Looking up opaque contract...");
  const contractId = await getContractId(network);

  if (!contractId) {
    console.log("  Contract not found. To use this script for deposits:");
    console.log("  1. Deploy the contract: ./scripts/deploy.sh");
    console.log("  2. Or set OPAQUE_CONTRACT_ID environment variable");
    console.log();
    console.log("  Skipping deposit step.");
    console.log();
  } else {
    console.log(`  Contract ID: ${contractId}`);
    console.log();

    // Step 5: Deposit to the contract
    console.log("[5/5] Depositing to opaque contract...");
    console.log(`  Amount: 1 XLM (${FIXED_AMOUNT} stroops)`);
    console.log(`  Commitment: ${privacyKeys.commitment.toString("hex")}`);

    try {
      const depositResult = await depositToContract(
        keypair,
        privacyKeys.commitment,
        contractId,
        network,
      );
      console.log("  Deposit successful!");
      console.log(`  Transaction Hash: ${depositResult.hash}`);
    } catch (error) {
      console.error(`  Deposit failed: ${error.message}`);
      console.log(
        "  The contract may not be initialized or you may not have sufficient balance.",
      );
    }
    console.log();
  }

  // Print summary
  console.log("=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log();
  console.log("Wallet Information:");
  console.log(`  Public Key:   ${keypair.publicKey()}`);
  console.log(`  Secret Key:   ${keypair.secret()}`);
  console.log();
  console.log("Privacy Keys (save these securely!):");
  console.log(`  Nullifier:    ${privacyKeys.nullifier.toString("hex")}`);
  console.log(`  Secret:       ${privacyKeys.secret.toString("hex")}`);
  console.log(`  Viewing Key:  ${privacyKeys.viewingKey.toString("hex")}`);
  console.log(`  Signing Key:  ${privacyKeys.signingKey.toString("hex")}`);
  console.log(`  Commitment:   ${privacyKeys.commitment.toString("hex")}`);
  console.log();
  console.log("IMPORTANT:");
  console.log("  - Save your Secret Key to restore your wallet");
  console.log(
    "  - Save your Signing Key (secret) and Nullifier for withdrawals",
  );
  console.log(
    "  - The Viewing Key allows seeing your balance without spending",
  );
  console.log("  - Never share your Secret Key or Signing Key with anyone!");
  console.log();

  // Export wallet data to JSON
  const walletData = {
    network: network.name,
    wallet: {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    },
    privacyKeys: {
      nullifier: privacyKeys.nullifier.toString("hex"),
      secret: privacyKeys.secret.toString("hex"),
      viewingKey: privacyKeys.viewingKey.toString("hex"),
      signingKey: privacyKeys.signingKey.toString("hex"),
      commitment: privacyKeys.commitment.toString("hex"),
    },
    timestamp: new Date().toISOString(),
  };

  const outputPath = `wallet_${Date.now()}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(walletData, null, 2));
  console.log(`Wallet data saved to: ${outputPath}`);
  console.log();
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
