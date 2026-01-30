//! Circuit Input Generator for Opaque Privacy Pool
//!
//! This Rust script generates valid test inputs for the Circom circuit
//! using the same Poseidon255 implementation as the Soroban contract.
//!
//! Usage:
//!   cargo run --bin generate_inputs
//!
//! The generated inputs can be used with snarkjs to test the circuit.

use std::fs::File;
use std::io::Write;

// This is a standalone script that would use the poseidon library
// For now, we document the expected flow and provide test vectors

fn main() {
    println!("Circuit Input Generator for Opaque Privacy Pool");
    println!("================================================\n");

    // Known-good test vectors from contract tests
    // These are pre-computed values that pass the contract's Groth16 verification

    println!("Test Vector from Contract Tests:");
    println!("---------------------------------");

    // Commitment used in contract test
    let commitment = "0x10cb631d174a98b2440b68d2e57da2ae9a13f7d1cccb1f41a1dd3d69a22faae9";
    println!("Commitment: {}", commitment);

    // Public signals from working proof
    let nullifier_hash = "0x4bb752d59801e586fa43aa952ab3c231f8ca8c9b863b82ca9abd3200a7e5a22d";
    let withdrawn_value = "1000000000"; // 0x3b9aca00
    let state_root = "0x4a4f118a44f7d073e88bae54e6206dd24897a54348b9f2c8eb707d26f44e32bc";
    let association_root = "0x5d5826f9c9187bdb213f01ded6d230e9f1ab653b5bee6036504e82bc0716baa2";

    println!("Nullifier Hash: {}", nullifier_hash);
    println!("Withdrawn Value: {}", withdrawn_value);
    println!("State Root: {}", state_root);
    println!("Association Root: {}", association_root);

    println!("\n================================================");
    println!("Circuit Input Structure (for reference):");
    println!("================================================\n");

    // The circuit expects these inputs:
    println!("Public Inputs:");
    println!("  - withdrawnValue: Field element (amount being withdrawn)");
    println!("  - stateRoot: Field element (merkle root of commitments)");
    println!("  - associationRoot: Field element (merkle root of approved labels)");
    println!();
    println!("Private Inputs:");
    println!("  - label: Field element (hash(scope, nonce) % SNARK_SCALAR_FIELD)");
    println!("  - value: Field element (commitment value)");
    println!("  - nullifier: Field element (random secret for nullifier)");
    println!("  - secret: Field element (random secret for commitment)");
    println!("  - stateSiblings[20]: Array of field elements (merkle proof)");
    println!("  - stateIndex: Field element (leaf position in state tree)");
    println!("  - labelIndex: Field element (leaf position in association tree)");
    println!("  - labelSiblings[2]: Array of field elements (association proof)");
    println!();
    println!("Output:");
    println!("  - nullifierHash: Field element (Poseidon(nullifier))");

    println!("\n================================================");
    println!("Commitment Formula:");
    println!("================================================\n");
    println!("precommitment = Poseidon(nullifier, secret)");
    println!("hashValueLabel = Poseidon(value, label)");
    println!("commitment = Poseidon(hashValueLabel, precommitment)");
    println!("nullifierHash = Poseidon(nullifier)");

    println!("\n================================================");
    println!("To Generate Custom Inputs:");
    println!("================================================\n");
    println!("1. Use the Rust contract's Poseidon255 implementation");
    println!("2. Run cargo test in the contracts directory to verify");
    println!("3. Extract values from the test to use with the circuit");
    println!();
    println!("The contract tests at:");
    println!("  contracts/opaque/src/test.rs");
    println!("contain working proofs that can be used as reference.");
}
