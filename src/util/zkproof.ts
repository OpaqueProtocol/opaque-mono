/**
 * ZK Proof generation utilities using snarkjs
 * Generates Groth16 proofs for the privacy pool withdraw circuit
 */

// @ts-expect-error snarkjs has no official types
import * as snarkjs from 'snarkjs';

// Circuit artifacts paths (relative to public folder)
const CIRCUIT_WASM_PATH = '/circuits/main.wasm';
const CIRCUIT_ZKEY_PATH = '/circuits/main_final.zkey';

/**
 * Circuit input structure matching main.circom
 */
export interface WithdrawCircuitInput {
  // Public signals
  withdrawnValue: string;
  stateRoot: string;
  associationRoot: string;
  
  // Private signals
  label: string;
  value: string;
  nullifier: string;
  secret: string;
  
  // Merkle proof for state tree (depth 20)
  stateSiblings: string[];
  stateIndex: string;
  
  // Association set proof (depth 2)
  labelIndex: string;
  labelSiblings: string[];
}

/**
 * Groth16 proof structure from snarkjs
 */
export interface Groth16Proof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: string;
  curve: string;
}

/**
 * Generate a Groth16 ZK proof for withdrawal
 */
export async function generateWithdrawProof(
  input: WithdrawCircuitInput
): Promise<{
  proof: Groth16Proof;
  publicSignals: string[];
}> {
  console.log('[ZK] Starting proof generation...');
  console.log('[ZK] Input:', JSON.stringify(input, null, 2));

  try {
    // Generate the proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      CIRCUIT_WASM_PATH,
      CIRCUIT_ZKEY_PATH
    );

    console.log('[ZK] Proof generated successfully');
    console.log('[ZK] Public signals:', publicSignals);
    
    return { proof, publicSignals };
  } catch (error) {
    console.error('[ZK] Proof generation failed:', error);
    throw new Error(`Failed to generate ZK proof: ${error}`);
  }
}

/**
 * Convert a bigint string to BN254 field element bytes (32 bytes, big-endian)
 */
function fieldElementToBytes(value: string): Uint8Array {
  const bi = BigInt(value);
  const hex = bi.toString(16).padStart(64, '0');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert G1 point [x, y, z] to compressed bytes for Soroban
 * Format: 64 bytes (x: 32 bytes, y: 32 bytes)
 */
function g1PointToBytes(point: [string, string, string]): Uint8Array {
  const xBytes = fieldElementToBytes(point[0]);
  const yBytes = fieldElementToBytes(point[1]);
  
  const result = new Uint8Array(64);
  result.set(xBytes, 0);
  result.set(yBytes, 32);
  return result;
}

/**
 * Convert G2 point [[x0, x1], [y0, y1], [z0, z1]] to compressed bytes for Soroban
 * Format: 128 bytes (x: 64 bytes, y: 64 bytes)
 */
function g2PointToBytes(
  point: [[string, string], [string, string], [string, string]]
): Uint8Array {
  const x0Bytes = fieldElementToBytes(point[0][0]);
  const x1Bytes = fieldElementToBytes(point[0][1]);
  const y0Bytes = fieldElementToBytes(point[1][0]);
  const y1Bytes = fieldElementToBytes(point[1][1]);
  
  const result = new Uint8Array(128);
  result.set(x0Bytes, 0);
  result.set(x1Bytes, 32);
  result.set(y0Bytes, 64);
  result.set(y1Bytes, 96);
  return result;
}

/**
 * Serialize Groth16 proof for Soroban contract
 * Format matches the zk-verifier contract's Proof structure:
 * - a: G1Affine (64 bytes)
 * - b: G2Affine (128 bytes)  
 * - c: G1Affine (64 bytes)
 * Total: 256 bytes
 */
export function serializeProofForSoroban(proof: Groth16Proof): Buffer {
  const aBytes = g1PointToBytes(proof.pi_a);
  const bBytes = g2PointToBytes(proof.pi_b);
  const cBytes = g1PointToBytes(proof.pi_c);
  
  const result = new Uint8Array(256);
  result.set(aBytes, 0);      // 0-63
  result.set(bBytes, 64);     // 64-191
  result.set(cBytes, 192);    // 192-255
  
  return Buffer.from(result);
}

/**
 * Serialize public signals for Soroban contract
 * Format: u32 length prefix (big-endian) + Array of Fr field elements (32 bytes each)
 * Order: [nullifierHash, withdrawnValue, stateRoot, associationRoot]
 * 
 * Contract expects from PublicSignals::from_bytes:
 * - First 4 bytes: u32 length (big-endian)
 * - Then: 32-byte Fr elements for each signal
 */
export function serializePublicSignalsForSoroban(publicSignals: string[]): Buffer {
  // Expected order from circuit:
  // publicSignals[0] = nullifierHash (output)
  // The circuit public inputs are: withdrawnValue, stateRoot, associationRoot
  // So the full order is: nullifierHash, withdrawnValue, stateRoot, associationRoot
  
  // 4 bytes for length prefix + 32 bytes per signal
  const bytes = new Uint8Array(4 + publicSignals.length * 32);
  
  // Write length as u32 big-endian
  const view = new DataView(bytes.buffer);
  view.setUint32(0, publicSignals.length, false); // false = big-endian
  
  for (let i = 0; i < publicSignals.length; i++) {
    const fieldBytes = fieldElementToBytes(publicSignals[i]);
    bytes.set(fieldBytes, 4 + i * 32);
  }
  
  return Buffer.from(bytes);
}

/**
 * Verify proof locally (useful for debugging)
 */
export async function verifyProofLocally(
  proof: Groth16Proof,
  publicSignals: string[]
): Promise<boolean> {
  try {
    // Load verification key
    const vkResponse = await fetch('/circuits/verification_key.json');
    const vk = await vkResponse.json();
    
    const isValid = await snarkjs.groth16.verify(vk, publicSignals, proof);
    console.log('[ZK] Local verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('[ZK] Local verification failed:', error);
    return false;
  }
}

/**
 * Create circuit input for withdrawal
 */
export function createWithdrawCircuitInput(params: {
  withdrawnValue: bigint;
  stateRoot: bigint;
  associationRoot: bigint;
  label: bigint;
  value: bigint;
  nullifier: bigint;
  secret: bigint;
  stateSiblings: bigint[];
  stateIndex: number;
  labelIndex: number;
  labelSiblings: bigint[];
}): WithdrawCircuitInput {
  // Ensure we have exactly 8 siblings for state tree (TREE_DEPTH = 8)
  const stateSiblings = [...params.stateSiblings];
  while (stateSiblings.length < 8) {
    stateSiblings.push(BigInt(0));
  }
  // Truncate if too many (e.g., if old note with 20 siblings)
  stateSiblings.length = 8;
  
  // Ensure we have exactly 2 siblings for association tree
  const labelSiblings = [...params.labelSiblings];
  while (labelSiblings.length < 2) {
    labelSiblings.push(BigInt(0));
  }
  
  return {
    withdrawnValue: params.withdrawnValue.toString(),
    stateRoot: params.stateRoot.toString(),
    associationRoot: params.associationRoot.toString(),
    label: params.label.toString(),
    value: params.value.toString(),
    nullifier: params.nullifier.toString(),
    secret: params.secret.toString(),
    stateSiblings: stateSiblings.map(s => s.toString()),
    stateIndex: params.stateIndex.toString(),
    labelIndex: params.labelIndex.toString(),
    labelSiblings: labelSiblings.map(s => s.toString()),
  };
}
