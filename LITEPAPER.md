# OPAQUE: Compliance-Enabled Privacy Pools on Stellar

## Abstract

OPAQUE is a zero-knowledge privacy payment protocol built on Stellar's Soroban smart contract platform. It enables users to deposit and withdraw funds anonymously while maintaining regulatory compliance through cryptographic association proofs. Unlike pure mixers, OPAQUE allows users to prove their funds originate from an approved subset of deposits without revealing their specific transaction history.

---

## 1. Problem Statement

Current blockchain transactions are fully transparent, exposing user balances and transaction histories to public scrutiny. While privacy is a fundamental financial right, existing solutions face two critical challenges:

1. **Pure Privacy Mixers**: Solutions like Tornado Cash provide strong anonymity but face regulatory pushback due to inability to distinguish legitimate from illicit funds.

2. **Transparent Compliance**: Traditional KYC/AML solutions sacrifice privacy entirely, exposing users to surveillance and potential security risks.

OPAQUE bridges this gap by enabling **privacy with provable compliance**.

---

## 2. Solution Architecture

### 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      OPAQUE Protocol                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)     │  Circuits (Circom)  │  Contracts    │
│  - Wallet Integration │  - Commitment Hash  │  (Soroban)    │
│  - Proof Generation   │  - Merkle Proofs    │  - Deposits   │
│  - UI/UX              │  - Association Set  │  - Withdrawals│
│                       │                     │  - Verification│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Cryptographic Primitives

| Component      | Technology | Purpose                      |
| -------------- | ---------- | ---------------------------- |
| Proof System   | Groth16    | Compact, efficient ZK proofs |
| Elliptic Curve | BLS12-381  | Pairing-based verification   |
| Hash Function  | Poseidon   | ZK-circuit optimized hashing |
| Data Structure | Lean IMT   | Efficient Merkle tree        |

---

## 3. Protocol Mechanics

### 3.1 Deposit Flow

1. User generates private values: `nullifier`, `secret`, `label`
2. Commitment is computed: `C = Poseidon(value, label, Poseidon(nullifier, secret))`
3. User submits deposit transaction with commitment
4. Contract inserts commitment into Merkle tree and stores funds

### 3.2 Withdrawal Flow

1. User constructs ZK proof proving:
   - Commitment exists in state Merkle tree (privacy)
   - Label exists in association set (compliance)
   - Withdrawal amount ≤ deposited value
   - Nullifier is correctly derived (double-spend prevention)

2. Contract verifies proof and transfers funds to recipient

### 3.3 Association Roots (Compliance Layer)

The **association root** is a Merkle root of approved deposit labels. This enables:

- **Regulators**: Define compliant deposit subsets
- **Users**: Prove funds originate from approved subset
- **Privacy**: No revelation of specific deposit used

```
Association Set: {label_1, label_2, ..., label_n}
Association Root: MerkleRoot(Association Set)
```

---

## 4. Zero-Knowledge Circuit

### 4.1 Public Inputs

- `withdrawnValue` - Amount being withdrawn
- `stateRoot` - Current Merkle root of all deposits
- `associationRoot` - Root of compliant deposit labels

### 4.2 Private Inputs

- `label`, `value`, `nullifier`, `secret` - Commitment data
- `stateSiblings[20]` - Merkle path for deposit proof
- `labelSiblings[2]` - Merkle path for association proof

### 4.3 Public Outputs

- `nullifierHash` - Prevents double-spending

### 4.4 Circuit Constraints

```
commitment = Poseidon(value, label, Poseidon(nullifier, secret))
nullifierHash = Poseidon(nullifier)
MerkleVerify(commitment, stateRoot, stateSiblings, stateIndex) == 1
MerkleVerify(label, associationRoot, labelSiblings, labelIndex) == 1
withdrawnValue <= value
```

---

## 5. Security Properties

| Property                    | Mechanism                                |
| --------------------------- | ---------------------------------------- |
| **Anonymity**               | Deposits indistinguishable at withdrawal |
| **Soundness**               | Groth16 proof verification               |
| **Double-Spend Prevention** | Nullifier hash tracking                  |
| **Compliance**              | Association root membership proofs       |
| **Fund Safety**             | Soroban smart contract custody           |

---

## 6. Technical Specifications

### 6.1 Smart Contract (Soroban/Rust)

```rust
// Core contract functions
fn deposit(env: Env, from: Address, commitment: BytesN<32>) -> u32
fn withdraw(env: Env, to: Address, proof: Bytes, public_signals: Vec<BytesN<32>>)
fn set_association_root(env: Env, root: BytesN<32>)
fn get_merkle_root(env: Env) -> BytesN<32>
```

### 6.2 Tree Parameters

| Parameter              | Value            |
| ---------------------- | ---------------- |
| State Tree Depth       | 20               |
| Association Tree Depth | 2                |
| Max Deposits           | 2^20 (1,048,576) |
| Hash Function          | Poseidon255      |

### 6.3 Proof Size

- **Groth16 Proof**: ~192 bytes (2 G1 + 1 G2 points)
- **Verification**: Single pairing check

---

## 7. Use Cases

### 7.1 Private Payments

Users transact without exposing their full financial history while proving funds are from legitimate sources.

### 7.2 Compliant DeFi

DeFi protocols integrate OPAQUE for privacy-preserving yet regulatory-compliant transactions.

### 7.3 Institutional Adoption

Enterprises use private transactions with auditable compliance proofs for regulators.

---

## 8. Comparison

| Feature          | Tornado Cash | OPAQUE | Transparent |
| ---------------- | ------------ | ------ | ----------- |
| Privacy          | Full         | Full   | None        |
| Compliance Proof | No           | Yes    | Full        |
| Regulatory Risk  | High         | Low    | None        |
| User Freedom     | High         | High   | Low         |

---

## 9. Roadmap

- **Phase 1**: Testnet deployment on Stellar
- **Phase 2**: Multi-asset support (USDC, BTC, ETH)
- **Phase 3**: Association set governance
- **Phase 4**: Mainnet launch
- **Phase 5**: Cross-chain bridges

---

## 10. Conclusion

OPAQUE represents a new paradigm in blockchain privacy: **compliant anonymity**. By leveraging zero-knowledge proofs on Stellar's efficient Soroban platform, OPAQUE enables users to maintain financial privacy while providing cryptographic guarantees of regulatory compliance. This positions OPAQUE as a sustainable privacy solution for the evolving regulatory landscape.

---

**Built on Stellar Soroban | Powered by Groth16 | Secured by BLS12-381**
