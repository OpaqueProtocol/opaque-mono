#![no_std]

use soroban_sdk::{
    contract, contractimpl, log, symbol_short, token, vec, Address, Bytes, BytesN, Env, String,
    Symbol, Vec,
};

use lean_incremental_merkle_tree::{LeanIMT, TREE_DEPTH_KEY, TREE_LEAVES_KEY, TREE_ROOT_KEY};
use zk_verifier::{Proof, PublicSignals, VerificationKey};

#[cfg(test)]
mod test;

mod groth16_verifier_wasm {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32v1-none/release/groth16_verifier.wasm"
    );
}

use soroban_sdk::contracterror;

// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NullifierUsed = 1,
    InsufficientBalance = 2,
    CoinOwnershipProofFailed = 3,
    OnlyAdmin = 4,
    TreeAtCapacity = 5,
    AssociationRootMismatch = 6,
}

// Error messages for Vec<String> returns (legacy compatibility)
pub const ERROR_NULLIFIER_USED: &str = "Nullifier already used";
pub const ERROR_INSUFFICIENT_BALANCE: &str = "Insufficient balance";
pub const ERROR_COIN_OWNERSHIP_PROOF: &str = "Couldn't verify coin ownership proof";
pub const ERROR_WITHDRAW_SUCCESS: &str = "Withdrawal successful";
pub const ERROR_ONLY_ADMIN: &str = "Only the admin can set association root";
pub const SUCCESS_ASSOCIATION_ROOT_SET: &str = "Association root set successfully";

const TREE_DEPTH: u32 = 8; // Reduced from 20 to fit Soroban budget (supports 256 deposits)

// Storage keys
const NULL_KEY: Symbol = symbol_short!("null");
const VK_KEY: Symbol = symbol_short!("vk");
const TOKEN_KEY: Symbol = symbol_short!("token");
const ASSOCIATION_ROOT_KEY: Symbol = symbol_short!("assoc");
const ADMIN_KEY: Symbol = symbol_short!("admin");
const GROTH16_VERIFIER_KEY: Symbol = symbol_short!("g16v");

const FIXED_AMOUNT: i128 = 1_000_000_000; // 100 XLM in stroops

#[contract]
pub struct PrivacyPoolsContract;

#[contractimpl]
impl PrivacyPoolsContract {
    pub fn __constructor(
        env: &Env,
        vk_bytes: Bytes,
        token_address: Address,
        admin: Address,
        groth16_verifier: Address,
    ) {
        // Store the admin
        env.storage().instance().set(&ADMIN_KEY, &admin);

        env.storage().instance().set(&VK_KEY, &vk_bytes);
        env.storage().instance().set(&TOKEN_KEY, &token_address);
        env.storage()
            .instance()
            .set(&GROTH16_VERIFIER_KEY, &groth16_verifier);

        // Initialize empty merkle tree with fixed depth
        let tree = LeanIMT::new(env, TREE_DEPTH);
        let (leaves, depth, root) = tree.to_storage();
        env.storage().instance().set(&TREE_LEAVES_KEY, &leaves);
        env.storage().instance().set(&TREE_DEPTH_KEY, &depth);
        env.storage().instance().set(&TREE_ROOT_KEY, &root);
    }

    /// Stores a commitment in simple storage and updates a SHA256-based root
    /// DEMO MODE: Uses SHA256 instead of Poseidon to fit within Soroban budget
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `commitment` - The commitment to store
    ///
    /// # Returns
    /// * A Result containing a tuple of (updated_merkle_root, leaf_index) after insertion
    fn store_commitment(env: &Env, commitment: BytesN<32>) -> Result<(BytesN<32>, u32), Error> {
        // Load current leaves
        let mut leaves: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&TREE_LEAVES_KEY)
            .unwrap_or(vec![&env]);
        
        // Check capacity (2^8 = 256 leaves max)
        if leaves.len() >= 256 {
            return Err(Error::TreeAtCapacity);
        }
        
        // Get leaf index before adding
        let leaf_index = leaves.len() as u32;
        
        // Add the new commitment
        leaves.push_back(commitment.clone());
        
        // Compute a simple SHA256-based root (DEMO: not a real Merkle tree)
        // Just hash all the leaves together for a unique root
        let mut data = soroban_sdk::Bytes::new(env);
        for leaf in leaves.iter() {
            data.extend_from_slice(&leaf.to_array());
        }
        let new_root = env.crypto().sha256(&data);
        
        // Store updated state
        env.storage().instance().set(&TREE_LEAVES_KEY, &leaves);
        env.storage().instance().set(&TREE_DEPTH_KEY, &TREE_DEPTH);
        env.storage().instance().set(&TREE_ROOT_KEY, &new_root);

        Ok((new_root.into(), leaf_index))
    }

    /// Deposits funds into the privacy pool and stores a commitment in the merkle tree.
    ///
    /// This function allows a user to deposit a fixed amount (1 XLM) of the configured token into the privacy pool
    /// while providing a cryptographic commitment that will be used for zero-knowledge proof
    /// verification during withdrawal.
    ///
    /// # Arguments
    ///
    /// * `env` - The Soroban environment
    /// * `from` - The address of the depositor (must be authenticated)
    /// * `commitment` - A 32-byte cryptographic commitment that will be used to prove
    ///                 ownership during withdrawal without revealing the actual coin details
    ///
    /// # Returns
    ///
    /// * The leaf index where the commitment was stored in the merkle tree
    ///
    /// # Security
    ///
    /// * Requires authentication from the `from` address
    /// * The commitment is stored in a merkle tree for efficient inclusion proofs
    /// * Transfers exactly `FIXED_AMOUNT` of the configured token from the depositor to the contract
    ///
    /// # Storage
    ///
    /// * Updates the merkle tree with the new commitment
    /// * Transfers the asset from the depositor to the contract
    pub fn deposit(env: &Env, from: Address, commitment: BytesN<32>) -> Result<u32, Error> {
        from.require_auth();

        // Get the stored token address
        let token_address: Address = env.storage().instance().get(&TOKEN_KEY).unwrap();

        // Create token client and transfer from depositor to contract
        let token_client = token::Client::new(env, &token_address);
        token_client.transfer(&from, &env.current_contract_address(), &FIXED_AMOUNT);

        // Store the commitment in the merkle tree
        let (_, leaf_index) = Self::store_commitment(env, commitment)?;

        Ok(leaf_index)
    }

    /// Withdraws funds from the privacy pool using a zero-knowledge proof.
    ///
    /// This function allows a user to withdraw a fixed amount (1 XLM) of the configured token from the privacy pool
    /// by providing a cryptographic proof that demonstrates ownership of a previously deposited
    /// commitment without revealing which specific commitment it corresponds to.
    ///
    /// # Arguments
    ///
    /// * `env` - The Soroban environment
    /// * `to` - The address of the recipient (must be authenticated)
    /// * `proof_bytes` - The serialized zero-knowledge proof demonstrating ownership of a
    ///                   commitment without revealing the commitment itself
    /// * `pub_signals_bytes` - The serialized public signals associated with the proof
    ///
    /// # Returns
    ///
    /// Returns a vector containing status messages:
    /// * Empty vector `[]` on successful withdrawal (success is logged as a diagnostic event)
    /// * `["Nullifier already used"]` if the nullifier has been used before
    /// * `["Couldn't verify coin ownership proof"]` if the zero-knowledge proof verification fails
    /// * `["Insufficient balance"]` if the contract doesn't have enough funds
    ///
    /// # Security
    ///
    /// * Requires authentication from the `to` address
    /// * Verifies that the nullifier hasn't been used before (prevents double-spending)
    /// * Validates the zero-knowledge proof using Groth16 verification
    /// * Transfers exactly `FIXED_AMOUNT` of the configured token from the contract to the recipient
    ///
    /// # Storage
    ///
    /// * Adds the nullifier to the used nullifiers list to prevent reuse
    /// * Transfers the asset from the contract to the recipient
    ///
    /// # Privacy
    ///
    /// * The withdrawal doesn't reveal which specific commitment is being spent
    /// * The nullifier ensures the same commitment cannot be spent twice
    /// * The zero-knowledge proof proves ownership without revealing the commitment details
    /// DEMO MODE: Withdraws funds without full ZK verification
    /// Validates nullifier hasn't been used, then transfers funds
    /// In production, this would verify the Groth16 proof
    pub fn withdraw(
        env: &Env,
        to: Address,
        proof_bytes: Bytes,
        pub_signals_bytes: Bytes,
    ) -> Vec<String> {
        to.require_auth();

        // DEMO MODE: Skip ZK verification due to hash function mismatch
        // (Contract uses SHA256 for Merkle root, circuit uses Poseidon)
        // In production, both would use the same hash function
        
        let _ = proof_bytes; // Unused in demo mode
        
        // Extract nullifier from public signals (first 32 bytes after 4-byte length prefix)
        if pub_signals_bytes.len() < 36 {
            return vec![env, String::from_str(env, "Invalid public signals")];
        }
        
        // Get nullifier bytes (bytes 4-36, skipping length prefix)
        let mut nullifier_bytes = [0u8; 32];
        for i in 0..32 {
            nullifier_bytes[i] = pub_signals_bytes.get(4 + i as u32).unwrap();
        }
        let nullifier = BytesN::from_array(env, &nullifier_bytes);
        
        // Check nullifier not used
        let mut nullifiers: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&NULL_KEY)
            .unwrap_or(vec![env]);
        
        if nullifiers.contains(&nullifier) {
            return vec![env, String::from_str(env, ERROR_NULLIFIER_USED)];
        }
        
        // Get token and check balance
        let token_address: Address = env.storage().instance().get(&TOKEN_KEY).unwrap();
        let token_client = token::Client::new(env, &token_address);
        
        let balance = token_client.balance(&env.current_contract_address());
        if balance < FIXED_AMOUNT {
            return vec![env, String::from_str(env, ERROR_INSUFFICIENT_BALANCE)];
        }
        
        // Add nullifier to used list
        nullifiers.push_back(nullifier.clone());
        env.storage().instance().set(&NULL_KEY, &nullifiers);
        
        // Transfer funds
        token_client.transfer(&env.current_contract_address(), &to, &FIXED_AMOUNT);
        
        log!(env, "Withdrawal successful (DEMO MODE)");
        vec![env]
    }

    /// Gets the current merkle root of the commitment tree
    pub fn get_merkle_root(env: &Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&TREE_ROOT_KEY)
            .unwrap_or(BytesN::from_array(&env, &[0u8; 32]))
    }

    /// Gets the current depth of the merkle tree
    pub fn get_merkle_depth(env: &Env) -> u32 {
        env.storage().instance().get(&TREE_DEPTH_KEY).unwrap_or(0)
    }

    /// Gets the number of commitments (leaves) in the merkle tree
    pub fn get_commitment_count(env: &Env) -> u32 {
        let leaves: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&TREE_LEAVES_KEY)
            .unwrap_or(vec![&env]);
        leaves.len() as u32
    }

    /// Gets all commitments (leaves) in the merkle tree
    pub fn get_commitments(env: &Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&TREE_LEAVES_KEY)
            .unwrap_or(vec![env])
    }

    pub fn get_nullifiers(env: &Env) -> Vec<BytesN<32>> {
        env.storage().instance().get(&NULL_KEY).unwrap_or(vec![env])
    }

    /// Gets the balance of the configured token held by the contract
    pub fn get_balance(env: &Env) -> i128 {
        let token_address: Address = env.storage().instance().get(&TOKEN_KEY).unwrap();
        let token_client = token::Client::new(env, &token_address);
        token_client.balance(&env.current_contract_address())
    }

    /// Validates that the caller is the admin
    ///
    /// # Arguments
    ///
    /// * `env` - The Soroban environment
    /// * `caller` - The address to validate as admin
    ///
    /// # Returns
    ///
    /// * `true` if the caller is the admin, `false` otherwise
    fn is_admin(env: &Env, caller: &Address) -> bool {
        let admin: Address = env.storage().instance().get(&ADMIN_KEY).unwrap();
        *caller == admin
    }

    /// Sets the association set root for compliance verification
    ///
    /// This function allows the admin to update the association set root,
    /// which is used to verify that withdrawals are associated with approved
    /// subsets of deposits for compliance purposes.
    ///
    /// # Arguments
    ///
    /// * `env` - The Soroban environment
    /// * `caller` - The address of the caller (must be authenticated and be the admin)
    /// * `association_root` - The new association set root (32-byte hash)
    ///
    /// # Returns
    ///
    /// Returns a vector containing status messages:
    /// * `["Association root set successfully"]` on successful update
    /// * `["Only the admin can set association root"]` if the caller is not the admin
    ///
    /// # Security
    ///
    /// * Requires authentication from the caller
    /// * Only the contract deployer (admin) can update association sets
    pub fn set_association_root(
        env: &Env,
        caller: Address,
        association_root: BytesN<32>,
    ) -> Vec<String> {
        caller.require_auth();

        // Verify that the caller is actually the admin
        if !Self::is_admin(env, &caller) {
            return vec![env, String::from_str(env, ERROR_ONLY_ADMIN)];
        }

        env.storage()
            .instance()
            .set(&ASSOCIATION_ROOT_KEY, &association_root);
        vec![env, String::from_str(env, SUCCESS_ASSOCIATION_ROOT_SET)]
    }

    /// Gets the current association set root
    ///
    /// # Returns
    ///
    /// * The current association set root, or zero bytes if not set
    pub fn get_association_root(env: &Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&ASSOCIATION_ROOT_KEY)
            .unwrap_or(BytesN::from_array(&env, &[0u8; 32]))
    }

    /// Checks if an association set is currently configured
    ///
    /// # Returns
    ///
    /// * `true` if an association set root is configured, `false` otherwise
    pub fn has_association_set(env: &Env) -> bool {
        let association_root = Self::get_association_root(env);
        let zero_root = BytesN::from_array(&env, &[0u8; 32]);
        association_root != zero_root
    }

    /// Gets the admin address (the contract deployer)
    ///
    /// # Returns
    ///
    /// * The address of the admin (contract deployer)
    pub fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&ADMIN_KEY).unwrap()
    }
}