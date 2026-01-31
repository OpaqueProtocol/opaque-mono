#!/usr/bin/env node

/**
 * Set Association Root Script
 * 
 * This script sets the association root for the opaque privacy pool contract.
 * The association root MUST be set before any withdrawal can succeed.
 * 
 * Usage:
 *   node scripts/set_association_root.cjs [--network testnet|local]
 * 
 * The script will:
 * 1. Load the admin identity from stellar CLI
 * 2. Build an association root from existing deposits (or use a mock one)
 * 3. Call set_association_root on the contract
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
const { execSync } = require("child_process");
const crypto = require("crypto");

// Configuration based on network
const NETWORKS = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    name: "testnet",
  },
  local: {
    rpcUrl: "http://localhost:8000/rpc",
    networkPassphrase: "Standalone Network ; February 2017",
    name: "local",
  },
};

/**
 * Get the contract ID from stellar CLI
 */
function getContractId(network) {
  try {
    const contractId = execSync(
      `stellar contract alias show opaque --network ${network.name}`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();
    return contractId;
  } catch (e) {
    console.error("Error getting contract ID:", e.message);
    return null;
  }
}

/**
 * Get the admin identity secret key from stellar CLI
 */
function getAdminSecret(identityName = "singularity") {
  try {
    const secret = execSync(`stellar keys show ${identityName}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return secret;
  } catch (e) {
    console.error("Error getting admin secret:", e.message);
    return null;
  }
}

/**
 * Generate a simple association root
 * 
 * For a working privacy pool, this would be the Merkle root of all approved labels.
 * For simplicity, we generate a deterministic root that can be used with any label
 * when the circuit's association check is in "permissive" mode (root = 0 allows any).
 * 
 * However, the contract checks that association root is non-zero before allowing withdrawals.
 * So we use a deterministic but non-zero value.
 */
function generateAssociationRoot() {
  // Create a deterministic 32-byte value
  // This is a placeholder - in production, this would be a proper Merkle root
  // computed from an approved set of labels
  const hash = crypto.createHash("sha256")
    .update("opaque-association-set-v1")
    .digest();
  
  return hash;
}

/**
 * Set the association root on the contract
 */
async function setAssociationRoot(keypair, contractId, associationRoot, network) {
  const server = new rpc.Server(network.rpcUrl, { allowHttp: true });
  
  // Get the account
  const account = await server.getAccount(keypair.publicKey());
  
  // Build the set_association_root transaction
  // Function signature: set_association_root(caller: Address, association_root: BytesN<32>)
  const args = [
    nativeToScVal(keypair.publicKey(), { type: "address" }),
    xdr.ScVal.scvBytes(associationRoot),
  ];
  
  const tx = new TransactionBuilder(account, {
    fee: "100000", // 0.01 XLM
    networkPassphrase: network.networkPassphrase,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contractId,
        function: "set_association_root",
        args: args,
      })
    )
    .setTimeout(300)
    .build();
  
  // Simulate the transaction
  console.log("  Simulating transaction...");
  const simResult = await server.simulateTransaction(tx);
  
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }
  
  // Prepare and sign the transaction
  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(keypair);
  
  // Submit the transaction
  console.log("  Submitting transaction...");
  const sendResult = await server.sendTransaction(preparedTx);
  
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${sendResult.errorResult}`);
  }
  
  console.log(`  Transaction hash: ${sendResult.hash}`);
  console.log("  Waiting for confirmation...");
  
  // Wait for the transaction to complete
  let txResult;
  for (let i = 0; i < 30; i++) {
    txResult = await server.getTransaction(sendResult.hash);
    
    if (txResult.status === "SUCCESS") {
      return { success: true, hash: sendResult.hash };
    }
    
    if (txResult.status === "FAILED") {
      throw new Error(`Transaction failed: ${JSON.stringify(txResult)}`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  throw new Error("Transaction timed out");
}

/**
 * Check current association root
 */
async function checkAssociationRoot(contractId, network) {
  const server = new rpc.Server(network.rpcUrl, { allowHttp: true });
  
  // Build a simulation-only transaction to call has_association_set
  const account = await server.getAccount("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF");
  
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: network.networkPassphrase,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contractId,
        function: "has_association_set",
        args: [],
      })
    )
    .setTimeout(30)
    .build();
  
  try {
    const simResult = await server.simulateTransaction(tx);
    if (simResult.result) {
      return simResult.result.retval;
    }
  } catch (e) {
    // Ignore errors, will return false
  }
  
  return false;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Set Association Root for Opaque Contract");
  console.log("=".repeat(60));
  console.log();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let networkName = "testnet";
  
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
  
  // Step 1: Get contract ID
  console.log("[1/4] Looking up opaque contract...");
  const contractId = getContractId(network);
  if (!contractId) {
    console.error("Error: Could not find opaque contract alias.");
    console.error("Make sure the contract is deployed: ./scripts/deploy.sh");
    process.exit(1);
  }
  console.log(`  Contract ID: ${contractId}`);
  console.log();
  
  // Step 2: Get admin keypair
  console.log("[2/4] Loading admin identity...");
  const adminSecret = getAdminSecret("singularity");
  if (!adminSecret) {
    console.error("Error: Could not load admin identity.");
    console.error("Make sure 'singularity' identity exists: stellar keys generate singularity --network testnet");
    process.exit(1);
  }
  const keypair = Keypair.fromSecret(adminSecret);
  console.log(`  Admin: ${keypair.publicKey()}`);
  console.log();
  
  // Step 3: Generate association root
  console.log("[3/4] Generating association root...");
  const associationRoot = generateAssociationRoot();
  console.log(`  Association Root: ${associationRoot.toString("hex")}`);
  console.log();
  
  // Step 4: Set the association root
  console.log("[4/4] Setting association root on contract...");
  try {
    const result = await setAssociationRoot(keypair, contractId, associationRoot, network);
    console.log("  Success!");
    console.log(`  Transaction Hash: ${result.hash}`);
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    process.exit(1);
  }
  
  console.log();
  console.log("=".repeat(60));
  console.log("Association root set successfully!");
  console.log("Withdrawals are now enabled for the opaque contract.");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
