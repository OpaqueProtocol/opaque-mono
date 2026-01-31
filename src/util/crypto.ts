/**
 * Cryptographic utilities for privacy pool operations
 * Uses Poseidon hash matching the circom circuit implementation
 */

// @ts-expect-error circomlibjs has no official types
import { buildPoseidon } from "circomlibjs";

// BN254 curve scalar field (same as used in the circuit)
const SNARK_SCALAR_FIELD = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617",
);

// Poseidon hash instance (lazy initialized)
let poseidonInstance: Awaited<ReturnType<typeof buildPoseidon>> | null = null;

/**
 * Get or initialize the Poseidon hash function
 */
async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Compute Poseidon hash of inputs
 * Matches the circuit's Poseidon255 implementation
 */
export async function poseidonHash(inputs: bigint[]): Promise<bigint> {
  const poseidon = await getPoseidon();

  // For more than 2 inputs, hash sequentially with Poseidon(2)
  // This matches the Rust implementation in the contract
  if (inputs.length > 2) {
    let result = await poseidonHash([inputs[0], inputs[1]]);
    for (let i = 2; i < inputs.length; i++) {
      result = await poseidonHash([result, inputs[i]]);
    }
    return result;
  }

  const hash = poseidon(inputs);
  return poseidon.F.toObject(hash);
}

/**
 * Generate cryptographically secure random 256-bit value
 */
export function generateRandom256Bit(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  // Convert to bigint and ensure it's within the field
  let value = BigInt(0);
  for (let i = 0; i < 32; i++) {
    value = (value << BigInt(8)) | BigInt(bytes[i]);
  }

  return value % SNARK_SCALAR_FIELD;
}

/**
 * Generate nullifier and secret for a new deposit
 */
export function generateSecrets(): { nullifier: bigint; secret: bigint } {
  return {
    nullifier: generateRandom256Bit(),
    secret: generateRandom256Bit(),
  };
}

/**
 * Compute the commitment hash
 * commitment = Poseidon(Poseidon(value, label), Poseidon(nullifier, secret))
 *
 * This matches the circuit's CommitmentHasher template
 */
export async function computeCommitment(
  value: bigint,
  label: bigint,
  nullifier: bigint,
  secret: bigint,
): Promise<bigint> {
  // precommitment = Poseidon(nullifier, secret)
  const precommitment = await poseidonHash([nullifier, secret]);

  // hashValueLabel = Poseidon(value, label)
  const hashValueLabel = await poseidonHash([value, label]);

  // commitment = Poseidon(hashValueLabel, precommitment)
  const commitment = await poseidonHash([hashValueLabel, precommitment]);

  return commitment;
}

/**
 * Compute the nullifier hash (used for double-spend prevention)
 * nullifierHash = Poseidon(nullifier)
 */
export async function computeNullifierHash(nullifier: bigint): Promise<bigint> {
  return poseidonHash([nullifier]);
}

/**
 * Convert bigint to 32-byte Buffer (big-endian)
 */
export function bigintToBuffer(value: bigint): Buffer {
  const hex = value.toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
}

/**
 * Convert Buffer to bigint (big-endian)
 */
export function bufferToBigint(buffer: Buffer): bigint {
  return BigInt("0x" + buffer.toString("hex"));
}

/**
 * Deposit note structure
 */
export interface DepositNote {
  nullifier: bigint;
  secret: bigint;
  value: bigint;
  label: bigint;
  leafIndex: number;
}

/**
 * Encode deposit secrets into a shareable note string
 * Format: opaque-<version>-<nullifier>-<secret>-<value>-<label>-<leafIndex>
 * All bigints encoded as hex strings
 */
export function encodeNote(note: DepositNote): string {
  const parts = [
    "opaque",
    "1", // version
    note.nullifier.toString(16),
    note.secret.toString(16),
    note.value.toString(16),
    note.label.toString(16),
    note.leafIndex.toString(16),
  ];
  return parts.join("-");
}

/**
 * Decode a note string back to deposit secrets
 */
export function decodeNote(noteString: string): DepositNote {
  const parts = noteString.split("-");

  if (parts.length !== 7 || parts[0] !== "opaque") {
    throw new Error("Invalid note format");
  }

  const version = parseInt(parts[1], 10);
  if (version !== 1) {
    throw new Error(`Unsupported note version: ${version}`);
  }

  return {
    nullifier: BigInt("0x" + parts[2]),
    secret: BigInt("0x" + parts[3]),
    value: BigInt("0x" + parts[4]),
    label: BigInt("0x" + parts[5]),
    leafIndex: parseInt(parts[6], 16),
  };
}

/**
 * Generate a default label (hash of scope and nonce)
 * For now, we use a simple incrementing nonce
 */
export async function generateLabel(
  scope: string = "default",
  nonce: number = 0,
): Promise<bigint> {
  // Simple hash: convert scope to bigint and hash with nonce
  const scopeBytes = new TextEncoder().encode(scope);
  let scopeValue = BigInt(0);
  for (let i = 0; i < Math.min(scopeBytes.length, 31); i++) {
    scopeValue = (scopeValue << BigInt(8)) | BigInt(scopeBytes[i]);
  }

  const labelHash = await poseidonHash([scopeValue, BigInt(nonce)]);
  return labelHash % SNARK_SCALAR_FIELD;
}

// Fixed deposit amount in stroops (1 XLM = 10^7 stroops)
export const FIXED_AMOUNT_STROOPS = BigInt(1_000_000_000); // 100 XLM as defined in contract
