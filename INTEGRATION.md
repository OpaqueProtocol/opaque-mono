# Opaque Privacy Pool - Integration Guide

## Overview

This document provides technical specifications for integrating the Opaque Privacy Pool with wallet applications, backend services, and relayer infrastructure on Stellar/Soroban.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Key Generation](#2-key-generation)
3. [Wallet Integration](#3-wallet-integration)
4. [Relayer Service](#4-relayer-service)
5. [Backend Service](#5-backend-service)
6. [Transaction Flows](#6-transaction-flows)
7. [Data Structures](#7-data-structures)
8. [API Specifications](#8-api-specifications)
9. [Cryptographic Details](#9-cryptographic-details)
10. [Security Considerations](#10-security-considerations)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OPAQUE SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐         ┌──────────────┐         ┌────────────────────┐      │
│   │  WALLET  │ ──────► │   RELAYER    │ ──────► │  SOROBAN CONTRACT  │      │
│   │  (User)  │         │   SERVICE    │         │  (Privacy Pool)    │      │
│   └──────────┘         └──────────────┘         └────────────────────┘      │
│        │                      │                          │                   │
│        │                      │                          │                   │
│        ▼                      ▼                          ▼                   │
│   ┌──────────┐         ┌──────────────┐         ┌────────────────────┐      │
│   │  LOCAL   │         │   BACKEND    │         │  GROTH16 VERIFIER  │      │
│   │  STORAGE │         │   SERVICE    │         │    CONTRACT        │      │
│   └──────────┘         └──────────────┘         └────────────────────┘      │
│                               │                                              │
│                               ▼                                              │
│                        ┌──────────────┐                                      │
│                        │   DATABASE   │                                      │
│                        │  (Indexed    │                                      │
│                        │   Events)    │                                      │
│                        └──────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Wallet** | Key generation, note management, proof generation, UI |
| **Relayer** | Transaction submission, gas fee handling, privacy preservation |
| **Backend** | Event indexing, merkle tree sync, API endpoints |
| **Contract** | Deposit/withdraw logic, proof verification, state management |

---

## 2. Key Generation

### 2.1 Overview of Keys

The wallet needs to generate two key pairs:

| Key Type | Purpose | Cryptographic Scheme |
|----------|---------|---------------------|
| **Viewing Key** | Scan blockchain for owned notes, decrypt note data | Custom derivation from master seed |
| **Signing Key** | Sign transactions, prove ownership in ZK proofs | BabyJubJub (EdDSA compatible) |

### 2.2 Key Derivation Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     MASTER SEED (BIP39)                         │
│                    (24-word mnemonic)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              MASTER SECRET (32 bytes)                           │
│         derived via: HKDF-SHA256(seed, "opaque-master")         │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│      VIEWING KEY         │    │      SIGNING KEY         │
│  HKDF(master, "viewing") │    │  HKDF(master, "signing") │
└──────────────────────────┘    └──────────────────────────┘
              │                               │
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  viewing_private: 32B    │    │  signing_private: 32B    │
│  viewing_public: 32B     │    │  signing_public: 32B     │
│  (Poseidon hash of priv) │    │  (BabyJubJub point)      │
└──────────────────────────┘    └──────────────────────────┘
```

### 2.3 Viewing Key Generation

```typescript
// Wallet Implementation

interface ViewingKeyPair {
  privateKey: Uint8Array;  // 32 bytes - kept secret
  publicKey: Uint8Array;   // 32 bytes - can be shared for scanning
}

function generateViewingKey(masterSecret: Uint8Array): ViewingKeyPair {
  // Derive viewing private key using HKDF
  const viewingPrivate = hkdfSha256(
    masterSecret,
    "opaque-viewing-key",
    32
  );

  // Derive viewing public key using Poseidon hash
  // This allows efficient scanning without revealing private key
  const viewingPublic = poseidonHash([viewingPrivate]);

  return {
    privateKey: viewingPrivate,
    publicKey: viewingPublic
  };
}
```

**Purpose of Viewing Keys:**
- `viewing_private`: Used to decrypt note data, derive nullifiers
- `viewing_public`: Shared with backend for note scanning (optional privacy mode)

### 2.4 Signing Key Generation

```typescript
// Wallet Implementation

interface SigningKeyPair {
  privateKey: Uint8Array;  // 32 bytes - BabyJubJub scalar
  publicKey: {             // BabyJubJub point (compressed)
    x: Uint8Array;         // 32 bytes
    y: Uint8Array;         // 32 bytes
  };
}

function generateSigningKey(masterSecret: Uint8Array): SigningKeyPair {
  // Derive signing private key using HKDF
  const signingPrivate = hkdfSha256(
    masterSecret,
    "opaque-signing-key",
    32
  );

  // Reduce to valid BabyJubJub scalar
  const scalar = reduceToScalar(signingPrivate, BABYJUBJUB_ORDER);

  // Compute public key: P = scalar * G (BabyJubJub generator)
  const publicPoint = babyJubJubMultiply(BABYJUBJUB_GENERATOR, scalar);

  return {
    privateKey: scalar,
    publicKey: {
      x: publicPoint.x,
      y: publicPoint.y
    }
  };
}
```

**Purpose of Signing Keys:**
- `signing_private`: Used in ZK proofs to prove note ownership
- `signing_public`: Part of note commitment, identifies owner

### 2.5 Complete Key Generation Flow

```typescript
// Complete wallet key generation

interface WalletKeys {
  mnemonic: string;           // BIP39 24-word phrase
  masterSecret: Uint8Array;   // 32 bytes
  viewingKey: ViewingKeyPair;
  signingKey: SigningKeyPair;
  stellarKeypair: Keypair;    // For gas payments (if direct deposit)
}

async function createWallet(): Promise<WalletKeys> {
  // 1. Generate BIP39 mnemonic
  const mnemonic = bip39.generateMnemonic(256); // 24 words

  // 2. Derive master seed
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // 3. Derive Opaque master secret
  const masterSecret = hkdfSha256(seed, "opaque-master-v1", 32);

  // 4. Generate viewing keys
  const viewingKey = generateViewingKey(masterSecret);

  // 5. Generate signing keys
  const signingKey = generateSigningKey(masterSecret);

  // 6. Optionally derive Stellar keypair for direct deposits
  // Using path m/44'/148'/0' (Stellar BIP44)
  const stellarSeed = derivePath("m/44'/148'/0'", seed);
  const stellarKeypair = Keypair.fromRawEd25519Seed(stellarSeed);

  return {
    mnemonic,
    masterSecret,
    viewingKey,
    signingKey,
    stellarKeypair
  };
}
```

---

## 3. Wallet Integration

### 3.1 Note Structure

A "note" represents ownership of funds in the privacy pool.

```typescript
interface Note {
  // Core values (used in commitment)
  amount: bigint;           // Fixed: 1_000_000_000n (1 XLM in stroops)
  secret: Uint8Array;       // 32 bytes - random secret
  nullifier: Uint8Array;    // 32 bytes - derived from secret

  // Computed values
  commitment: Uint8Array;   // 32 bytes - Poseidon(nullifier, secret)
  nullifierHash: Uint8Array;// 32 bytes - Poseidon(nullifier)

  // Metadata (stored locally, not on-chain)
  leafIndex: number;        // Position in merkle tree
  createdAt: number;        // Timestamp
  spent: boolean;           // Whether note has been withdrawn
}
```

### 3.2 Creating a Note (for Deposit)

```typescript
async function createNote(walletKeys: WalletKeys): Promise<Note> {
  // 1. Generate random secret (32 bytes)
  const secret = crypto.getRandomValues(new Uint8Array(32));

  // 2. Derive nullifier from secret and viewing key
  // nullifier = Poseidon(viewing_private, secret, nonce)
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const nullifier = poseidonHash([
    walletKeys.viewingKey.privateKey,
    secret,
    nonce
  ]);

  // 3. Compute commitment
  // commitment = Poseidon(nullifier, secret)
  const commitment = poseidonHash([nullifier, secret]);

  // 4. Compute nullifier hash (used during withdrawal)
  const nullifierHash = poseidonHash([nullifier]);

  return {
    amount: 1_000_000_000n,  // Fixed 1 XLM
    secret,
    nullifier,
    commitment,
    nullifierHash,
    leafIndex: -1,          // Set after deposit confirms
    createdAt: Date.now(),
    spent: false
  };
}
```

### 3.3 Wallet Local Storage Schema

```typescript
interface WalletStorage {
  // Encrypted with user password
  encryptedKeys: {
    mnemonic: string;       // Encrypted BIP39 mnemonic
    masterSecret: string;   // Encrypted master secret
  };

  // Note database
  notes: {
    [commitment: string]: {
      encryptedNote: string;  // Encrypted Note object
      leafIndex: number;
      createdAt: number;
      spentAt?: number;
      txHash?: string;
    };
  };

  // Sync state
  syncState: {
    lastSyncedBlock: number;
    merkleRoot: string;
    commitmentCount: number;
  };
}
```

### 3.4 Scanning for Notes (View Key Usage)

```typescript
// Option 1: Local scanning (more private)
async function scanNotesLocally(
  walletKeys: WalletKeys,
  allCommitments: Uint8Array[]
): Promise<Note[]> {
  const ownedNotes: Note[] = [];

  for (const storedNote of walletKeys.localNotes) {
    // Check if commitment exists in on-chain commitments
    const index = allCommitments.findIndex(
      c => arraysEqual(c, storedNote.commitment)
    );

    if (index !== -1) {
      storedNote.leafIndex = index;
      ownedNotes.push(storedNote);
    }
  }

  return ownedNotes;
}

// Option 2: Backend-assisted scanning (less private, faster)
// Share viewing_public with backend, backend filters commitments
async function scanNotesWithBackend(
  viewingPublic: Uint8Array,
  backendUrl: string
): Promise<Note[]> {
  // Backend returns potential matches based on viewing public key
  // Wallet then decrypts and validates locally
  const response = await fetch(`${backendUrl}/scan`, {
    method: 'POST',
    body: JSON.stringify({ viewingPublic: toHex(viewingPublic) })
  });

  return response.json();
}
```

---

## 4. Relayer Service

### 4.1 Purpose

The relayer service:
1. Receives withdrawal requests from wallets
2. Submits transactions to the Soroban contract
3. Pays gas fees (can charge a fee from withdrawal amount)
4. Preserves user privacy by being the on-chain transaction submitter

### 4.2 Relayer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RELAYER SERVICE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   API       │    │   Queue     │    │   Submitter │         │
│  │   Server    │───►│   Manager   │───►│   Worker    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│        │                                      │                 │
│        │                                      │                 │
│        ▼                                      ▼                 │
│  ┌─────────────┐                       ┌─────────────┐         │
│  │   Proof     │                       │   Stellar   │         │
│  │   Validator │                       │   Node      │         │
│  └─────────────┘                       └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Relayer Implementation

```typescript
// relayer/src/server.ts

import { Horizon, Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { Contract } from '@stellar/stellar-sdk/contract';

interface RelayerConfig {
  stellarRpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  relayerKeypair: Keypair;       // Relayer's Stellar account (pays fees)
  relayerFee: bigint;            // Fee taken from withdrawal (in stroops)
}

interface WithdrawRequest {
  recipientAddress: string;      // Stellar address to receive funds
  proofBytes: Uint8Array;        // Groth16 proof (serialized)
  pubSignalsBytes: Uint8Array;   // Public signals (serialized)
  signature?: Uint8Array;        // Optional: request signature
}

class RelayerService {
  private config: RelayerConfig;
  private horizon: Horizon.Server;

  constructor(config: RelayerConfig) {
    this.config = config;
    this.horizon = new Horizon.Server(config.stellarRpcUrl);
  }

  async submitWithdrawal(request: WithdrawRequest): Promise<string> {
    // 1. Validate proof format (basic checks before submission)
    this.validateProofFormat(request);

    // 2. Check if nullifier already used (prevent wasted gas)
    const nullifierUsed = await this.checkNullifier(request.pubSignalsBytes);
    if (nullifierUsed) {
      throw new Error('NULLIFIER_ALREADY_USED');
    }

    // 3. Build and submit transaction
    const txHash = await this.buildAndSubmitTx(request);

    return txHash;
  }

  private async buildAndSubmitTx(request: WithdrawRequest): Promise<string> {
    // Load relayer account
    const account = await this.horizon.loadAccount(
      this.config.relayerKeypair.publicKey()
    );

    // Build contract call
    const contract = new Contract(this.config.contractId);

    const tx = new TransactionBuilder(account, {
      fee: '100000',  // 0.01 XLM fee
      networkPassphrase: this.config.networkPassphrase,
    })
    .addOperation(
      contract.call(
        'withdraw',
        // to: Address
        nativeToScVal(request.recipientAddress, { type: 'address' }),
        // proof_bytes: Bytes
        nativeToScVal(request.proofBytes, { type: 'bytes' }),
        // pub_signals_bytes: Bytes
        nativeToScVal(request.pubSignalsBytes, { type: 'bytes' })
      )
    )
    .setTimeout(30)
    .build();

    // Simulate first
    const simulated = await this.horizon.simulateTransaction(tx);
    if (simulated.error) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // Assemble with resource fees
    const assembled = assembleTransaction(tx, simulated);
    assembled.sign(this.config.relayerKeypair);

    // Submit
    const result = await this.horizon.submitTransaction(assembled);

    return result.hash;
  }

  private validateProofFormat(request: WithdrawRequest): void {
    // Proof should be: A (48 bytes) + B (96 bytes) + C (48 bytes) = 192 bytes
    if (request.proofBytes.length !== 192) {
      throw new Error('INVALID_PROOF_LENGTH');
    }

    // Public signals: 4 field elements * 32 bytes = 128 bytes
    if (request.pubSignalsBytes.length !== 128) {
      throw new Error('INVALID_PUB_SIGNALS_LENGTH');
    }
  }

  private async checkNullifier(pubSignalsBytes: Uint8Array): Promise<boolean> {
    // Extract nullifier hash (first 32 bytes of public signals)
    const nullifierHash = pubSignalsBytes.slice(0, 32);

    // Query contract for nullifier status
    // Implementation depends on your contract query setup
    return false; // Placeholder
  }
}
```

### 4.4 Relayer API Endpoints

```typescript
// relayer/src/routes.ts

import express from 'express';

const router = express.Router();

// POST /relay/withdraw
// Submit a withdrawal request
router.post('/relay/withdraw', async (req, res) => {
  try {
    const { recipientAddress, proofHex, pubSignalsHex } = req.body;

    // Validate inputs
    if (!recipientAddress || !proofHex || !pubSignalsHex) {
      return res.status(400).json({ error: 'MISSING_PARAMETERS' });
    }

    // Convert hex to bytes
    const proofBytes = hexToBytes(proofHex);
    const pubSignalsBytes = hexToBytes(pubSignalsHex);

    // Submit to relayer service
    const txHash = await relayerService.submitWithdrawal({
      recipientAddress,
      proofBytes,
      pubSignalsBytes
    });

    res.json({
      success: true,
      txHash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /relay/status/:txHash
// Check withdrawal transaction status
router.get('/relay/status/:txHash', async (req, res) => {
  const { txHash } = req.params;

  try {
    const tx = await horizon.getTransaction(txHash);
    res.json({
      status: tx.successful ? 'SUCCESS' : 'FAILED',
      ledger: tx.ledger,
      timestamp: tx.created_at
    });
  } catch (error) {
    res.json({ status: 'PENDING' });
  }
});

// GET /relay/fee
// Get current relayer fee
router.get('/relay/fee', (req, res) => {
  res.json({
    fee: relayerConfig.relayerFee.toString(),
    feeToken: 'XLM',
    feeInXLM: (Number(relayerConfig.relayerFee) / 10_000_000).toFixed(7)
  });
});
```

---

## 5. Backend Service

### 5.1 Purpose

The backend service:
1. Indexes all deposit events from the contract
2. Maintains synchronized merkle tree state
3. Provides API for wallet queries
4. Generates merkle proofs for withdrawals

### 5.2 Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Event     │    │   Merkle    │    │   API       │         │
│  │   Indexer   │───►│   Tree      │◄───│   Server    │         │
│  └─────────────┘    │   Service   │    └─────────────┘         │
│        │            └─────────────┘           │                 │
│        │                  │                   │                 │
│        ▼                  ▼                   ▼                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │                   DATABASE                       │           │
│  │  - deposits (commitment, leaf_index, tx_hash)   │           │
│  │  - nullifiers (hash, tx_hash, spent_at)         │           │
│  │  - merkle_nodes (level, index, hash)            │           │
│  │  - sync_state (block, root, count)              │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Database Schema

```sql
-- PostgreSQL schema for backend

-- Deposits table
CREATE TABLE deposits (
    id SERIAL PRIMARY KEY,
    commitment BYTEA NOT NULL UNIQUE,     -- 32 bytes
    leaf_index INTEGER NOT NULL UNIQUE,
    depositor_address VARCHAR(56),         -- G... Stellar address
    tx_hash VARCHAR(64) NOT NULL,
    block_number BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deposits_commitment ON deposits(commitment);
CREATE INDEX idx_deposits_leaf_index ON deposits(leaf_index);

-- Nullifiers table (spent notes)
CREATE TABLE nullifiers (
    id SERIAL PRIMARY KEY,
    nullifier_hash BYTEA NOT NULL UNIQUE,  -- 32 bytes
    tx_hash VARCHAR(64) NOT NULL,
    recipient_address VARCHAR(56),
    spent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nullifiers_hash ON nullifiers(nullifier_hash);

-- Merkle tree nodes (optional, for fast proof generation)
CREATE TABLE merkle_nodes (
    level INTEGER NOT NULL,
    index INTEGER NOT NULL,
    hash BYTEA NOT NULL,                   -- 32 bytes
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (level, index)
);

-- Sync state
CREATE TABLE sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_block BIGINT NOT NULL,
    merkle_root BYTEA NOT NULL,            -- 32 bytes
    commitment_count INTEGER NOT NULL,
    association_root BYTEA,                -- 32 bytes
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.4 Event Indexer

```typescript
// backend/src/indexer.ts

import { Horizon } from '@stellar/stellar-sdk';

interface DepositEvent {
  commitment: Uint8Array;
  leafIndex: number;
  depositor: string;
  txHash: string;
  blockNumber: number;
}

class EventIndexer {
  private horizon: Horizon.Server;
  private contractId: string;
  private db: Database;

  constructor(config: IndexerConfig) {
    this.horizon = new Horizon.Server(config.rpcUrl);
    this.contractId = config.contractId;
    this.db = new Database(config.dbUrl);
  }

  async startIndexing(): Promise<void> {
    // Get last synced position
    const syncState = await this.db.getSyncState();
    let cursor = syncState?.lastCursor || 'now';

    // Stream contract events
    this.horizon.effects()
      .forAccount(this.contractId)
      .cursor(cursor)
      .stream({
        onmessage: async (effect) => {
          await this.processEffect(effect);
        }
      });
  }

  private async processEffect(effect: any): Promise<void> {
    // Parse contract invocation effects
    if (effect.type === 'contract_invoked') {
      const { function_name, args } = effect;

      if (function_name === 'deposit') {
        await this.handleDeposit(effect);
      } else if (function_name === 'withdraw') {
        await this.handleWithdrawal(effect);
      }
    }
  }

  private async handleDeposit(effect: any): Promise<void> {
    const commitment = effect.args.commitment;  // BytesN<32>
    const leafIndex = await this.getCommitmentCount();

    // Store in database
    await this.db.insertDeposit({
      commitment,
      leafIndex,
      depositor: effect.source_account,
      txHash: effect.transaction_hash,
      blockNumber: effect.ledger
    });

    // Update merkle tree
    await this.merkleTree.insert(commitment);

    // Update sync state
    await this.db.updateSyncState({
      lastBlock: effect.ledger,
      merkleRoot: this.merkleTree.root,
      commitmentCount: leafIndex + 1
    });
  }

  private async handleWithdrawal(effect: any): Promise<void> {
    const nullifierHash = effect.args.pub_signals.slice(0, 32);

    await this.db.insertNullifier({
      nullifierHash,
      txHash: effect.transaction_hash,
      recipient: effect.args.to
    });
  }
}
```

### 5.5 Merkle Tree Service

```typescript
// backend/src/merkle.ts

import { poseidonHash } from './crypto/poseidon';

const TREE_DEPTH = 20;
const EMPTY_VALUE = new Uint8Array(32);  // All zeros

class MerkleTreeService {
  private leaves: Uint8Array[] = [];
  private nodes: Map<string, Uint8Array> = new Map();
  private emptyHashes: Uint8Array[] = [];

  constructor() {
    // Precompute empty tree hashes
    this.emptyHashes = this.computeEmptyHashes();
  }

  private computeEmptyHashes(): Uint8Array[] {
    const hashes: Uint8Array[] = [EMPTY_VALUE];
    for (let i = 1; i <= TREE_DEPTH; i++) {
      const prev = hashes[i - 1];
      hashes.push(poseidonHash([prev, prev]));
    }
    return hashes;
  }

  insert(leaf: Uint8Array): number {
    const index = this.leaves.length;
    this.leaves.push(leaf);
    this.updatePath(index);
    return index;
  }

  private updatePath(leafIndex: number): void {
    let currentIndex = leafIndex;
    let currentHash = this.leaves[leafIndex];

    for (let level = 0; level < TREE_DEPTH; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      const sibling = this.getNode(level, siblingIndex);

      const [left, right] = isRight
        ? [sibling, currentHash]
        : [currentHash, sibling];

      currentHash = poseidonHash([left, right]);
      currentIndex = Math.floor(currentIndex / 2);

      this.setNode(level + 1, currentIndex, currentHash);
    }
  }

  private getNode(level: number, index: number): Uint8Array {
    const key = `${level}-${index}`;
    if (this.nodes.has(key)) {
      return this.nodes.get(key)!;
    }

    // Return empty hash for non-existent nodes
    if (level === 0) {
      return EMPTY_VALUE;
    }
    return this.emptyHashes[level];
  }

  private setNode(level: number, index: number, hash: Uint8Array): void {
    this.nodes.set(`${level}-${index}`, hash);
  }

  get root(): Uint8Array {
    if (this.leaves.length === 0) {
      return this.emptyHashes[TREE_DEPTH];
    }
    return this.getNode(TREE_DEPTH, 0);
  }

  generateProof(leafIndex: number): MerkleProof {
    if (leafIndex >= this.leaves.length) {
      throw new Error('LEAF_NOT_FOUND');
    }

    const siblings: Uint8Array[] = [];
    const pathIndices: number[] = [];

    let currentIndex = leafIndex;

    for (let level = 0; level < TREE_DEPTH; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      siblings.push(this.getNode(level, siblingIndex));
      pathIndices.push(isRight ? 1 : 0);

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      siblings,
      pathIndices,
      root: this.root,
      leaf: this.leaves[leafIndex],
      leafIndex
    };
  }
}

interface MerkleProof {
  siblings: Uint8Array[];      // 20 sibling hashes
  pathIndices: number[];       // 20 path directions (0=left, 1=right)
  root: Uint8Array;            // Current merkle root
  leaf: Uint8Array;            // The commitment being proven
  leafIndex: number;           // Position in tree
}
```

### 5.6 Backend API Endpoints

```typescript
// backend/src/routes.ts

import express from 'express';

const router = express.Router();

// GET /pool/state
// Get current pool state
router.get('/pool/state', async (req, res) => {
  const state = await db.getSyncState();
  const balance = await contractClient.getBalance();

  res.json({
    merkleRoot: toHex(state.merkleRoot),
    commitmentCount: state.commitmentCount,
    associationRoot: state.associationRoot ? toHex(state.associationRoot) : null,
    poolBalance: balance.toString(),
    poolBalanceXLM: (Number(balance) / 10_000_000).toFixed(7),
    lastSyncedBlock: state.lastBlock
  });
});

// GET /pool/commitments
// Get all commitments (for wallet sync)
router.get('/pool/commitments', async (req, res) => {
  const { offset = 0, limit = 1000 } = req.query;

  const commitments = await db.getCommitments(
    Number(offset),
    Number(limit)
  );

  res.json({
    commitments: commitments.map(c => ({
      commitment: toHex(c.commitment),
      leafIndex: c.leafIndex,
      txHash: c.txHash
    })),
    total: await db.getCommitmentCount()
  });
});

// POST /pool/merkle-proof
// Generate merkle proof for a commitment
router.post('/pool/merkle-proof', async (req, res) => {
  const { leafIndex } = req.body;

  if (leafIndex === undefined) {
    return res.status(400).json({ error: 'MISSING_LEAF_INDEX' });
  }

  try {
    const proof = merkleTree.generateProof(leafIndex);

    res.json({
      siblings: proof.siblings.map(s => toHex(s)),
      pathIndices: proof.pathIndices,
      root: toHex(proof.root),
      leaf: toHex(proof.leaf),
      leafIndex: proof.leafIndex
    });
  } catch (error) {
    res.status(404).json({ error: 'LEAF_NOT_FOUND' });
  }
});

// GET /pool/nullifier/:hash
// Check if nullifier has been spent
router.get('/pool/nullifier/:hash', async (req, res) => {
  const nullifier = await db.getNullifier(hexToBytes(req.params.hash));

  res.json({
    spent: nullifier !== null,
    txHash: nullifier?.txHash,
    spentAt: nullifier?.spentAt
  });
});

// POST /pool/check-commitment
// Check if commitment exists in pool
router.post('/pool/check-commitment', async (req, res) => {
  const { commitment } = req.body;

  const deposit = await db.getDeposit(hexToBytes(commitment));

  res.json({
    exists: deposit !== null,
    leafIndex: deposit?.leafIndex,
    txHash: deposit?.txHash
  });
});
```

---

## 6. Transaction Flows

### 6.1 Deposit Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DEPOSIT FLOW                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  WALLET                    STELLAR NETWORK              CONTRACT              │
│    │                             │                          │                 │
│    │  1. Create Note             │                          │                 │
│    │     - secret = random()     │                          │                 │
│    │     - nullifier = derive()  │                          │                 │
│    │     - commitment = hash()   │                          │                 │
│    │                             │                          │                 │
│    │  2. Build Transaction       │                          │                 │
│    │     - deposit(from, commitment)                        │                 │
│    │                             │                          │                 │
│    │  3. Sign & Submit ─────────►│                          │                 │
│    │                             │                          │                 │
│    │                             │  4. Execute ────────────►│                 │
│    │                             │                          │                 │
│    │                             │                          │  5. Verify auth │
│    │                             │                          │  6. Transfer XLM│
│    │                             │                          │  7. Store commit│
│    │                             │                          │  8. Update tree │
│    │                             │                          │  9. Return index│
│    │                             │                          │                 │
│    │                             │  10. Confirm ◄───────────│                 │
│    │                             │                          │                 │
│    │  11. Confirmation ◄─────────│                          │                 │
│    │                             │                          │                 │
│    │  12. Store note locally     │                          │                 │
│    │      with leaf index        │                          │                 │
│    │                             │                          │                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Deposit Implementation (Wallet)

```typescript
// wallet/src/deposit.ts

async function deposit(
  wallet: WalletKeys,
  stellarSdk: StellarSdk
): Promise<DepositResult> {
  // 1. Create note
  const note = await createNote(wallet);

  // 2. Store note locally (before submitting - in case of crash)
  await localStore.saveNote(note, 'pending');

  // 3. Build transaction
  const contract = new Contract(PRIVACY_POOL_CONTRACT_ID);

  const tx = new TransactionBuilder(await loadAccount(wallet.stellarKeypair))
    .addOperation(
      contract.call(
        'deposit',
        nativeToScVal(wallet.stellarKeypair.publicKey(), { type: 'address' }),
        nativeToScVal(note.commitment, { type: 'bytes' })
      )
    )
    .setTimeout(30)
    .build();

  // 4. Simulate and get resource fees
  const simulated = await horizon.simulateTransaction(tx);
  const assembled = assembleTransaction(tx, simulated);

  // 5. Sign with Stellar keypair (for token transfer authorization)
  assembled.sign(wallet.stellarKeypair);

  // 6. Submit
  const result = await horizon.submitTransaction(assembled);

  // 7. Parse result for leaf index
  const leafIndex = parseDepositResult(result);

  // 8. Update note with leaf index
  note.leafIndex = leafIndex;
  await localStore.saveNote(note, 'confirmed');

  return {
    txHash: result.hash,
    leafIndex,
    commitment: toHex(note.commitment)
  };
}
```

### 6.2 Withdrawal Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          WITHDRAWAL FLOW                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  WALLET           BACKEND          RELAYER          CONTRACT                  │
│    │                 │                │                 │                     │
│    │  1. Select note to spend        │                 │                     │
│    │                 │                │                 │                     │
│    │  2. Request merkle proof        │                 │                     │
│    │  ─────────────►│                │                 │                     │
│    │                 │                │                 │                     │
│    │  3. Proof ◄─────│                │                 │                     │
│    │     (siblings,  │                │                 │                     │
│    │      root)      │                │                 │                     │
│    │                 │                │                 │                     │
│    │  4. Generate ZK proof           │                 │                     │
│    │     (snarkjs/native)            │                 │                     │
│    │     Inputs:                     │                 │                     │
│    │     - note (secret, nullifier)  │                 │                     │
│    │     - merkle proof              │                 │                     │
│    │     - recipient address         │                 │                     │
│    │                 │                │                 │                     │
│    │  5. Submit withdrawal request   │                 │                     │
│    │  ───────────────────────────────►                 │                     │
│    │                 │                │                 │                     │
│    │                 │                │  6. Validate    │                     │
│    │                 │                │     format      │                     │
│    │                 │                │                 │                     │
│    │                 │                │  7. Check nullifier (optional)        │
│    │                 │                │  ─────────────────►                   │
│    │                 │                │                 │                     │
│    │                 │                │  8. Build & submit tx                 │
│    │                 │                │  ─────────────────►                   │
│    │                 │                │                 │                     │
│    │                 │                │                 │  9. Verify proof    │
│    │                 │                │                 │  10. Check nullifier│
│    │                 │                │                 │  11. Check roots    │
│    │                 │                │                 │  12. Store nullifier│
│    │                 │                │                 │  13. Transfer XLM   │
│    │                 │                │                 │                     │
│    │                 │                │  14. Confirm ◄──│                     │
│    │                 │                │                 │                     │
│    │  15. Tx hash ◄──────────────────│                 │                     │
│    │                 │                │                 │                     │
│    │  16. Mark note as spent         │                 │                     │
│    │                 │                │                 │                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Withdrawal Implementation (Wallet)

```typescript
// wallet/src/withdraw.ts

interface WithdrawInput {
  note: Note;                    // Note to spend
  recipientAddress: string;      // Where to send funds
  relayerUrl: string;           // Relayer endpoint
}

async function withdraw(input: WithdrawInput): Promise<WithdrawResult> {
  const { note, recipientAddress, relayerUrl } = input;

  // 1. Get merkle proof from backend
  const merkleProof = await backend.getMerkleProof(note.leafIndex);

  // 2. Get current state from backend
  const poolState = await backend.getPoolState();

  // 3. Prepare ZK proof inputs
  const zkInputs = {
    // Private inputs (known only to prover)
    secret: note.secret,
    nullifier: note.nullifier,
    pathElements: merkleProof.siblings,
    pathIndices: merkleProof.pathIndices,

    // Public inputs (verified on-chain)
    nullifierHash: note.nullifierHash,
    withdrawnValue: note.amount,
    stateRoot: merkleProof.root,
    associationRoot: poolState.associationRoot
  };

  // 4. Generate ZK proof
  const { proof, publicSignals } = await generateGroth16Proof(zkInputs);

  // 5. Serialize proof for contract
  const proofBytes = serializeProof(proof);
  const pubSignalsBytes = serializePublicSignals(publicSignals);

  // 6. Submit to relayer
  const response = await fetch(`${relayerUrl}/relay/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipientAddress,
      proofHex: toHex(proofBytes),
      pubSignalsHex: toHex(pubSignalsBytes)
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  // 7. Mark note as spent
  note.spent = true;
  await localStore.saveNote(note, 'spent');

  return {
    txHash: result.txHash,
    recipientAddress,
    amount: note.amount
  };
}
```

#### ZK Proof Generation

```typescript
// wallet/src/zkproof.ts

import * as snarkjs from 'snarkjs';

interface ZKProofInputs {
  // Private
  secret: Uint8Array;
  nullifier: Uint8Array;
  pathElements: Uint8Array[];
  pathIndices: number[];

  // Public
  nullifierHash: Uint8Array;
  withdrawnValue: bigint;
  stateRoot: Uint8Array;
  associationRoot: Uint8Array;
}

async function generateGroth16Proof(inputs: ZKProofInputs): Promise<{
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}> {
  // Convert inputs to circuit format (field elements)
  const circuitInputs = {
    // Private inputs
    secret: bytesToFieldElement(inputs.secret),
    nullifier: bytesToFieldElement(inputs.nullifier),
    pathElements: inputs.pathElements.map(bytesToFieldElement),
    pathIndices: inputs.pathIndices,

    // Public inputs (these will be verified on-chain)
    nullifierHash: bytesToFieldElement(inputs.nullifierHash),
    withdrawnValue: inputs.withdrawnValue.toString(),
    root: bytesToFieldElement(inputs.stateRoot),
    associationRoot: bytesToFieldElement(inputs.associationRoot)
  };

  // Load circuit artifacts (WASM and zkey files)
  const wasmPath = 'circuits/withdraw.wasm';
  const zkeyPath = 'circuits/withdraw_final.zkey';

  // Generate proof using snarkjs
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmPath,
    zkeyPath
  );

  return {
    proof: {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [[proof.pi_b[0][0], proof.pi_b[0][1]], [proof.pi_b[1][0], proof.pi_b[1][1]]],
      c: [proof.pi_c[0], proof.pi_c[1]]
    },
    publicSignals: publicSignals.map(s => BigInt(s))
  };
}

function serializeProof(proof: Groth16Proof): Uint8Array {
  // Serialize to BLS12-381 format expected by contract
  // A: G1 point (48 bytes compressed)
  // B: G2 point (96 bytes compressed)
  // C: G1 point (48 bytes compressed)
  // Total: 192 bytes

  const buffer = new Uint8Array(192);

  // Serialize A (G1)
  buffer.set(g1ToBytes(proof.a), 0);

  // Serialize B (G2)
  buffer.set(g2ToBytes(proof.b), 48);

  // Serialize C (G1)
  buffer.set(g1ToBytes(proof.c), 144);

  return buffer;
}

function serializePublicSignals(signals: bigint[]): Uint8Array {
  // 4 signals * 32 bytes each = 128 bytes
  // Order: [nullifierHash, withdrawnValue, stateRoot, associationRoot]

  const buffer = new Uint8Array(128);

  signals.forEach((signal, i) => {
    buffer.set(bigintToBytes32(signal), i * 32);
  });

  return buffer;
}
```

### 6.3 Direct Deposit Flow (Without Relayer)

For deposits, users interact directly with the contract:

```typescript
// Direct deposit (user pays gas)
async function directDeposit(
  wallet: WalletKeys,
  commitment: Uint8Array
): Promise<string> {
  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(wallet.stellarKeypair.publicKey());

  const contract = new Contract(PRIVACY_POOL_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(
    contract.call(
      'deposit',
      nativeToScVal(wallet.stellarKeypair.publicKey(), { type: 'address' }),
      nativeToScVal(commitment, { type: 'bytes' })
    )
  )
  .setTimeout(30)
  .build();

  // Simulate to get resource requirements
  const simResponse = await server.simulateTransaction(tx);
  const preparedTx = assembleTransaction(tx, simResponse);

  // Sign
  preparedTx.sign(wallet.stellarKeypair);

  // Submit
  const result = await server.submitTransaction(preparedTx);

  return result.hash;
}
```

---

## 7. Data Structures

### 7.1 Wire Formats

#### Proof Bytes (192 bytes)

```
┌────────────────────────────────────────────────────────────────┐
│                      PROOF BYTES (192 bytes)                   │
├────────────────────────────────────────────────────────────────┤
│  Bytes 0-47:    A point (G1 compressed)                        │
│  Bytes 48-143:  B point (G2 compressed)                        │
│  Bytes 144-191: C point (G1 compressed)                        │
└────────────────────────────────────────────────────────────────┘
```

#### Public Signals Bytes (128 bytes)

```
┌────────────────────────────────────────────────────────────────┐
│                 PUBLIC SIGNALS BYTES (128 bytes)               │
├────────────────────────────────────────────────────────────────┤
│  Bytes 0-31:    nullifierHash (Fr element, big-endian)         │
│  Bytes 32-63:   withdrawnValue (Fr element, big-endian)        │
│  Bytes 64-95:   stateRoot (Fr element, big-endian)             │
│  Bytes 96-127:  associationRoot (Fr element, big-endian)       │
└────────────────────────────────────────────────────────────────┘
```

#### Commitment (32 bytes)

```
┌────────────────────────────────────────────────────────────────┐
│                    COMMITMENT (32 bytes)                       │
├────────────────────────────────────────────────────────────────┤
│  commitment = Poseidon(nullifier, secret)                      │
│  Stored as big-endian Fr element                               │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 API Request/Response Formats

#### Deposit Request (Direct)

```typescript
interface DepositRequest {
  from: string;           // Stellar address (G...)
  commitment: string;     // Hex string (64 chars)
}
```

#### Withdrawal Request (via Relayer)

```typescript
interface WithdrawRequest {
  recipientAddress: string;  // Stellar address (G...)
  proofHex: string;          // 384 hex chars (192 bytes)
  pubSignalsHex: string;     // 256 hex chars (128 bytes)
}
```

#### Merkle Proof Response

```typescript
interface MerkleProofResponse {
  siblings: string[];      // 20 hex strings (64 chars each)
  pathIndices: number[];   // 20 numbers (0 or 1)
  root: string;            // Hex string (64 chars)
  leaf: string;            // Hex string (64 chars)
  leafIndex: number;
}
```

---

## 8. API Specifications

### 8.1 Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/pool/state` | GET | Get current pool state |
| `/pool/commitments` | GET | List all commitments (paginated) |
| `/pool/merkle-proof` | POST | Generate merkle proof for leaf |
| `/pool/nullifier/:hash` | GET | Check if nullifier is spent |
| `/pool/check-commitment` | POST | Check if commitment exists |

### 8.2 Relayer API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/relay/withdraw` | POST | Submit withdrawal request |
| `/relay/status/:txHash` | GET | Check transaction status |
| `/relay/fee` | GET | Get current relayer fee |

### 8.3 Full API Documentation

```yaml
# OpenAPI 3.0 specification

openapi: 3.0.0
info:
  title: Opaque Privacy Pool API
  version: 1.0.0

paths:
  /pool/state:
    get:
      summary: Get pool state
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  merkleRoot:
                    type: string
                    example: "0x1234..."
                  commitmentCount:
                    type: integer
                  associationRoot:
                    type: string
                    nullable: true
                  poolBalance:
                    type: string
                  lastSyncedBlock:
                    type: integer

  /pool/merkle-proof:
    post:
      summary: Get merkle proof
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                leafIndex:
                  type: integer
              required: [leafIndex]
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  siblings:
                    type: array
                    items:
                      type: string
                  pathIndices:
                    type: array
                    items:
                      type: integer
                  root:
                    type: string
                  leaf:
                    type: string
                  leafIndex:
                    type: integer

  /relay/withdraw:
    post:
      summary: Submit withdrawal via relayer
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                recipientAddress:
                  type: string
                  description: Stellar G address
                proofHex:
                  type: string
                  description: 384 hex chars
                pubSignalsHex:
                  type: string
                  description: 256 hex chars
              required: [recipientAddress, proofHex, pubSignalsHex]
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  txHash:
                    type: string
                  explorerUrl:
                    type: string
```

---

## 9. Cryptographic Details

### 9.1 Poseidon Hash Parameters

Used for merkle tree and commitment creation:

| Parameter | Value |
|-----------|-------|
| Field | BLS12-381 scalar field |
| t (width) | 3 (for binary tree hashing) |
| Full rounds | 8 (4 + 4) |
| Partial rounds | 56 |
| S-box | x^5 |
| Security level | 128 bits |

### 9.2 BabyJubJub Curve (for signing keys)

| Parameter | Value |
|-----------|-------|
| Curve | Twisted Edwards |
| Base field | BLS12-381 scalar field |
| a | 168700 |
| d | 168696 |
| Order | 21888242871839275222246405745257275088548364400416034343698204186575808495617 |
| Generator | (995203441582195749578291179787384436505546430278305826713579947235728471134, 5472060717959818805561601436314318772137091100104008585924551046643952123905) |

### 9.3 Groth16 Verification

The contract verifies proofs using BLS12-381 pairings:

```
e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
```

Where:
- `vk_x = ic[0] + sum(pub_signals[i] * ic[i+1])`
- All operations in BLS12-381 G1/G2/Gt groups

### 9.4 Note Commitment Scheme

```
commitment = Poseidon(nullifier, secret)
nullifierHash = Poseidon(nullifier)
```

The ZK circuit proves:
1. Knowledge of `secret` and `nullifier` that produce `commitment`
2. `commitment` exists in merkle tree with given `root`
3. `nullifierHash` is derived correctly
4. `associationRoot` matches compliance set

---

## 10. Security Considerations

### 10.1 Wallet Security

- **Key Storage**: Encrypt mnemonic and keys with user password (PBKDF2 + AES-256-GCM)
- **Note Storage**: Encrypt note data locally
- **Memory**: Clear sensitive data from memory after use
- **Backups**: Warn users to backup mnemonic securely

### 10.2 Relayer Security

- **Rate Limiting**: Prevent DoS attacks
- **Input Validation**: Validate all inputs before processing
- **Key Management**: Use HSM for relayer signing keys
- **Monitoring**: Log all transactions for audit

### 10.3 Backend Security

- **Database**: Encrypt sensitive data at rest
- **API**: Use HTTPS, rate limiting, input validation
- **Access Control**: Restrict admin endpoints

### 10.4 Privacy Considerations

- **IP Privacy**: Users should use Tor/VPN when interacting with relayer
- **Timing Analysis**: Add random delays to relayer submissions
- **Amount Privacy**: Fixed deposit amount (1 XLM) prevents amount correlation
- **Recipient Privacy**: Withdrawal recipient is public; use fresh addresses

---

## Appendix A: Constants

```typescript
// Contract constants
const FIXED_AMOUNT = 1_000_000_000n;      // 1 XLM in stroops
const TREE_DEPTH = 20;                     // 2^20 = 1,048,576 max deposits
const PROOF_SIZE = 192;                    // bytes
const PUB_SIGNALS_SIZE = 128;              // bytes
const COMMITMENT_SIZE = 32;                // bytes

// Crypto constants (BLS12-381)
const FIELD_MODULUS = BigInt('52435875175126190479447740508185965837690552500527637822603658699938581184513');

// API endpoints (example)
const BACKEND_URL = 'https://api.opaque.example.com';
const RELAYER_URL = 'https://relayer.opaque.example.com';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
```

---

## Appendix B: Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | NULLIFIER_USED | Note already spent |
| 2 | INSUFFICIENT_BALANCE | Pool has insufficient funds |
| 3 | PROOF_FAILED | ZK proof verification failed |
| 4 | ONLY_ADMIN | Caller not authorized |
| 5 | TREE_FULL | Merkle tree at capacity |
| 6 | ASSOCIATION_MISMATCH | Wrong association root |

---

## Appendix C: Development Checklist

### Wallet Development
- [ ] BIP39 mnemonic generation
- [ ] Key derivation (viewing + signing)
- [ ] Poseidon hash implementation
- [ ] Note creation and management
- [ ] Local encrypted storage
- [ ] Merkle proof verification
- [ ] snarkjs integration for proof generation
- [ ] Relayer API integration
- [ ] Transaction status tracking

### Backend Development
- [ ] Event indexer for Soroban
- [ ] PostgreSQL schema setup
- [ ] Merkle tree sync service
- [ ] API server (Express/Fastify)
- [ ] Merkle proof generation
- [ ] WebSocket for real-time updates (optional)
- [ ] Health checks and monitoring

### Relayer Development
- [ ] API server
- [ ] Stellar SDK integration
- [ ] Transaction submission queue
- [ ] Fee management
- [ ] Error handling and retries
- [ ] Logging and monitoring

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
