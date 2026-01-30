/**
 * Shared state management for test scripts
 *
 * This module handles reading/writing wallet state, keys, and notes
 * to a JSON file for persistence across script runs.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Keypair, Networks } = require("@stellar/stellar-sdk");

// State file path
const STATE_FILE = path.join(__dirname, "state.json");

// Default state structure
const DEFAULT_STATE = {
  network: "testnet",
  wallets: {},
  activeWallet: null,
  notes: [],
  createdAt: null,
  updatedAt: null,
};

// Network configurations
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

/**
 * Load state from file
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, "utf8");
      return { ...DEFAULT_STATE, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Warning: Could not load state file:", error.message);
  }
  return { ...DEFAULT_STATE, createdAt: new Date().toISOString() };
}

/**
 * Save state to file
 */
function saveState(state) {
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Get the current network configuration
 */
function getNetwork(state) {
  return NETWORKS[state.network] || NETWORKS.testnet;
}

/**
 * Get the active wallet
 */
function getActiveWallet(state) {
  if (!state.activeWallet) {
    return null;
  }
  return state.wallets[state.activeWallet] || null;
}

/**
 * Create a new wallet and save to state
 */
function createWallet(state, name) {
  const keypair = Keypair.random();

  // Generate privacy keys
  const nullifier = crypto.randomBytes(32);
  const secret = crypto.randomBytes(32);
  const viewingKey = crypto.createHash("sha256").update(secret).digest();
  const signingKey = secret;
  const commitment = crypto
    .createHash("sha256")
    .update(Buffer.concat([nullifier, secret]))
    .digest();

  const wallet = {
    name,
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
    privacyKeys: {
      nullifier: nullifier.toString("hex"),
      secret: secret.toString("hex"),
      viewingKey: viewingKey.toString("hex"),
      signingKey: signingKey.toString("hex"),
      commitment: commitment.toString("hex"),
    },
    funded: false,
    balance: 0,
    createdAt: new Date().toISOString(),
  };

  state.wallets[name] = wallet;
  state.activeWallet = name;
  saveState(state);

  return wallet;
}

/**
 * Fund a wallet using Friendbot
 */
async function fundWallet(address, network) {
  const url = `${network.friendbotUrl}?addr=${address}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Friendbot request failed: ${response.status} - ${errorText}`,
    );
  }

  return await response.json();
}

/**
 * Get account balance from Horizon
 */
async function getBalance(address, network) {
  const response = await fetch(`${network.horizonUrl}/accounts/${address}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch account: ${response.status}`);
  }

  const account = await response.json();
  const nativeBalance = account.balances.find((b) => b.asset_type === "native");
  return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
}

/**
 * Add a note to state
 */
function addNote(state, note) {
  state.notes.push({
    message: note,
    timestamp: new Date().toISOString(),
  });
  saveState(state);
}

/**
 * List all wallets
 */
function listWallets(state) {
  return Object.values(state.wallets);
}

/**
 * Set the active wallet
 */
function setActiveWallet(state, name) {
  if (!state.wallets[name]) {
    throw new Error(`Wallet '${name}' not found`);
  }
  state.activeWallet = name;
  saveState(state);
}

/**
 * Update wallet balance in state
 */
function updateWalletBalance(state, name, balance, funded = true) {
  if (state.wallets[name]) {
    state.wallets[name].balance = balance;
    state.wallets[name].funded = funded;
    saveState(state);
  }
}

/**
 * Export state as environment variables string
 */
function exportAsEnv(state) {
  const wallet = getActiveWallet(state);
  if (!wallet) {
    return "";
  }

  const lines = [
    `export STELLAR_NETWORK="${state.network}"`,
    `export STELLAR_PUBLIC_KEY="${wallet.publicKey}"`,
    `export STELLAR_SECRET_KEY="${wallet.secretKey}"`,
    `export PRIVACY_NULLIFIER="${wallet.privacyKeys.nullifier}"`,
    `export PRIVACY_SECRET="${wallet.privacyKeys.secret}"`,
    `export PRIVACY_VIEWING_KEY="${wallet.privacyKeys.viewingKey}"`,
    `export PRIVACY_SIGNING_KEY="${wallet.privacyKeys.signingKey}"`,
    `export PRIVACY_COMMITMENT="${wallet.privacyKeys.commitment}"`,
  ];

  return lines.join("\n");
}

module.exports = {
  STATE_FILE,
  NETWORKS,
  loadState,
  saveState,
  getNetwork,
  getActiveWallet,
  createWallet,
  fundWallet,
  getBalance,
  addNote,
  listWallets,
  setActiveWallet,
  updateWalletBalance,
  exportAsEnv,
};
