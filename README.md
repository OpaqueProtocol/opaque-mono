# OPAQUE

**Compliance-Enabled Privacy Pools on Stellar**

OPAQUE is a zero-knowledge privacy payment protocol built on Stellar Soroban. Deposit and withdraw funds anonymously while proving compliance through cryptographic association proofs.

## Features

- **Full Privacy**: Anonymity between deposits and withdrawals using ZK proofs
- **Compliance Layer**: Association roots prove funds originate from approved subsets
- **Double-Spend Prevention**: Nullifier-based tracking
- **Efficient Proofs**: Groth16 with BLS12-381 (~192 bytes per proof)

## Architecture

```
circuits/          # Circom ZK circuits (Groth16)
contracts/opaque/  # Soroban smart contract (Rust)
  └── libs/        # Groth16 verifier, Merkle tree, Poseidon hash
src/               # React frontend
packages/          # Auto-generated TypeScript clients
```

## Prerequisites

- Node.js 18+
- Rust & Cargo
- [Stellar CLI](https://developers.stellar.org/docs/smart-contracts/getting-started/setup)
- [Circom](https://docs.circom.io/getting-started/installation/) (for circuit compilation)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Contracts

```bash
stellar contract build
```

### 3. Deploy to Testnet

```bash
# Fund deployer account
stellar keys generate deployer --network testnet

# Deploy contract
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/opaque.wasm \
  --source deployer --network testnet
```

### 4. Run Frontend

```bash
pnpm dev
```

## Circuit Compilation

```bash
cd circuits

# Compile circuit
circom main.circom --r1cs --wasm --sym

# Generate proving key (requires powers of tau)
snarkjs groth16 setup main.r1cs pot22_final.ptau circuit_0000.zkey

# Export verification key
snarkjs zkey export verificationkey circuit_0000.zkey verification_key.json
```

## Contract Functions

| Function                       | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `deposit(from, commitment)`    | Deposit funds with cryptographic commitment |
| `withdraw(to, proof, signals)` | Withdraw using ZK proof                     |
| `set_association_root(root)`   | Set compliance association root (admin)     |
| `get_merkle_root()`            | Query current deposit tree root             |

## How It Works

1. **Deposit**: User generates commitment `C = hash(value, label, hash(nullifier, secret))` and deposits funds
2. **Withdraw**: User generates ZK proof showing:
   - Commitment exists in deposit tree
   - Label is in association set (compliance)
   - Correct nullifier derivation
3. **Verify**: Contract verifies Groth16 proof and transfers funds

## Environment

Copy `.env.example` to `.env` and configure:

```bash
VITE_CONTRACT_ID=<deployed_contract_id>
VITE_NETWORK=testnet
```

## Tech Stack

| Layer      | Technology                |
| ---------- | ------------------------- |
| Blockchain | Stellar Soroban           |
| Proofs     | Groth16 / BLS12-381       |
| Circuits   | Circom 2.2.0              |
| Hash       | Poseidon                  |
| Frontend   | React + Vite + TypeScript |
| Styling    | TailwindCSS               |

## Documentation

See [LITEPAPER.md](./LITEPAPER.md) for technical details and protocol specification.

## License

MIT
