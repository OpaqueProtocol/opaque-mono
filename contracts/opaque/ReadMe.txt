Privacy Pools Contract Overview
================================

This is a Soroban smart contract implementing a zero-knowledge privacy pool with compliance features, similar to Privacy Pools (inspired by Tornado Cash but with regulatory compliance).


Core Mechanics
--------------

Deposit Flow:
1. User deposits a fixed amount (1 XLM) along with a cryptographic commitment
2. Commitment is added to a Merkle tree
3. Returns the leaf index for future proof generation

Withdraw Flow:
1. User submits a Groth16 ZK proof along with public signals
2. Contract verifies:
   - Nullifier hasn't been used (prevents double-spend)
   - State root matches current Merkle root
   - Association root matches admin-set value (compliance)
   - ZK proof is valid
3. On success: transfers funds to recipient and records nullifier as used


Key Methods
-----------

deposit(from, commitment)
  Deposit 1 XLM with a cryptographic commitment. Requires authentication from the depositor.

withdraw(to, proof, pub_signals)
  Withdraw funds using a zero-knowledge proof. Verifies ownership without revealing which commitment is being spent.

set_association_root(caller, root)
  Admin-only function to set the compliance association root.

get_merkle_root()
  Query the current Merkle tree root.

get_commitment_count()
  Get the number of deposits in the pool.

get_nullifiers()
  Get list of used nullifiers.


Sequence Diagram
----------------

Deposit:
  User --> deposit(commitment) --> [Transfer 1 XLM to contract] --> [Add commitment to Merkle Tree] --> returns leaf_index

Withdraw:
  User --> withdraw(proof) --> [Check nullifier unused] --> [Verify state root matches]
       --> [Verify association root matches] --> [Groth16 ZK verify] --> [Transfer 1 XLM to user] --> success


Compliance Feature
------------------

The association set feature enables compliant withdrawals by proving funds originate from an approved subset of deposits. An admin can set the association root, and withdrawals must include a proof that references this root. This distinguishes the contract from pure mixers by allowing users to demonstrate their funds come from legitimate sources while maintaining privacy.
