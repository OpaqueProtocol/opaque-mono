/**
 * Privacy Pool service - high-level deposit and withdraw handlers
 * Orchestrates crypto operations, Merkle tree building, and contract calls
 */

import { Buffer } from 'buffer';
import { Client as OpaqueClient } from 'opaque';
import { rpcUrl, networkPassphrase } from '../contracts/util';
import {
  generateSecrets,
  computeCommitment,
  encodeNote,
  decodeNote,
  bigintToBuffer,
  bufferToBigint,
  generateLabel,
  FIXED_AMOUNT_STROOPS,
  DepositNote,
  poseidonHash,
} from './crypto';
import {
  LeanMerkleTree,
  getMerkleProof,
  TREE_DEPTH,
  initializeZeroValues,
} from './merkle';
import {
  generateWithdrawProof,
  serializeProofForSoroban,
  serializePublicSignalsForSoroban,
  createWithdrawCircuitInput,
} from './zkproof';

// Contract ID from environment
const OPAQUE_CONTRACT_ID = 'CBDIA6QSTORHFMNXTMRC3OC63CMCYSTORHFBGZVB6HGU2X5CR7OLCN4K';

/**
 * Create a new Opaque client instance
 */
function createClient(publicKey?: string): OpaqueClient {
  return new OpaqueClient({
    networkPassphrase,
    contractId: OPAQUE_CONTRACT_ID,
    rpcUrl,
    publicKey,
  });
}

/**
 * Deposit result containing the note to save
 */
export interface DepositResult {
  success: boolean;
  note?: string;
  leafIndex?: number;
  commitment?: string;
  error?: string;
}

/**
 * Handle a deposit to the privacy pool
 * 
 * @param fromAddress - The depositor's wallet address
 * @param signTransaction - Function to sign the transaction (from wallet provider)
 * @returns Deposit result with note to save
 */
export async function handleDeposit(
  fromAddress: string,
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => Promise<{ signedTxXdr: string; signerAddress?: string }>
): Promise<DepositResult> {
  try {
    console.log('[Deposit] Starting deposit for:', fromAddress);

    // 1. Generate secrets
    const { nullifier, secret } = generateSecrets();
    console.log('[Deposit] Generated secrets');

    // 2. Generate label (using default scope and timestamp as nonce)
    const label = await generateLabel('opaque-pool', Date.now());
    console.log('[Deposit] Generated label');

    // 3. Compute commitment
    const value = FIXED_AMOUNT_STROOPS;
    const commitment = await computeCommitment(value, label, nullifier, secret);
    console.log('[Deposit] Computed commitment:', commitment.toString(16));

    // 4. Convert commitment to 32-byte buffer
    const commitmentBuffer = bigintToBuffer(commitment);
    console.log('[Deposit] Commitment buffer:', commitmentBuffer.toString('hex'));

    // 5. Create client and build transaction
    const client = createClient(fromAddress);
    
    console.log('[Deposit] Building transaction...');
    const tx = await client.deposit({
      from: fromAddress,
      commitment: commitmentBuffer,
    });

    // 6. Sign and submit transaction using the wallet's signTransaction directly
    console.log('[Deposit] Signing and submitting transaction...');
    const result = await tx.signAndSend({ signTransaction });

    console.log('[Deposit] Transaction result:', result);

    // 7. Get leaf index from result
    const leafIndex = result.result?.isOk() ? result.result.unwrap() : 0;
    console.log('[Deposit] Leaf index:', leafIndex);

    // 8. Encode note for user to save
    const note: DepositNote = {
      nullifier,
      secret,
      value,
      label,
      leafIndex,
    };
    const encodedNote = encodeNote(note);
    console.log('[Deposit] Generated note');

    return {
      success: true,
      note: encodedNote,
      leafIndex,
      commitment: commitment.toString(16),
    };
  } catch (error) {
    console.error('[Deposit] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Withdraw result
 */
export interface WithdrawResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Fetch all commitments from the contract
 */
export async function fetchCommitmentsFromContract(): Promise<Buffer[]> {
  const client = createClient();
  
  console.log('[Withdraw] Fetching commitments from contract...');
  const tx = await client.get_commitments();
  const result = await tx.simulate();
  
  if (!result.result) {
    throw new Error('Failed to fetch commitments');
  }
  
  console.log('[Withdraw] Found', result.result.length, 'commitments');
  return result.result;
}

/**
 * Fetch the current Merkle root from the contract
 */
export async function fetchMerkleRoot(): Promise<Buffer> {
  const client = createClient();
  
  const tx = await client.get_merkle_root();
  const result = await tx.simulate();
  
  if (!result.result) {
    throw new Error('Failed to fetch merkle root');
  }
  
  return result.result;
}

/**
 * Fetch the association root from the contract
 */
export async function fetchAssociationRoot(): Promise<Buffer> {
  const client = createClient();
  
  const tx = await client.get_association_root();
  const result = await tx.simulate();
  
  if (!result.result) {
    throw new Error('Failed to fetch association root');
  }
  
  return result.result;
}

/**
 * Generate a mock association set proof
 * In production, this would come from an off-chain association set provider
 */
async function getMockAssociationProof(label: bigint): Promise<{
  associationRoot: bigint;
  labelIndex: number;
  labelSiblings: bigint[];
}> {
  // For now, we build a simple association set containing just our label
  // This creates a tree with just one leaf (the label)
  
  // Initialize zero values first
  await initializeZeroValues();
  
  // The association tree has depth 2, so we need the label at index 0
  // and compute the root accordingly
  const zeros = await initializeZeroValues();
  
  // Single leaf tree: root = hash(hash(label, zero[0]), zero[1])
  const level0Hash = await poseidonHash([label, zeros[0]]);
  const associationRoot = await poseidonHash([level0Hash, zeros[1]]);
  
  return {
    associationRoot,
    labelIndex: 0,
    labelSiblings: [zeros[0], zeros[1]],
  };
}

/**
 * Handle a withdrawal from the privacy pool
 * 
 * @param noteString - The deposit note string
 * @param toAddress - The recipient's wallet address
 * @param signTransaction - Function to sign the transaction
 * @returns Withdraw result
 */
export async function handleWithdraw(
  noteString: string,
  toAddress: string,
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => Promise<{ signedTxXdr: string; signerAddress?: string }>
): Promise<WithdrawResult> {
  try {
    console.log('[Withdraw] Starting withdrawal to:', toAddress);

    // 1. Parse the note
    const note = decodeNote(noteString);
    console.log('[Withdraw] Parsed note, leaf index:', note.leafIndex);

    // 2. Fetch commitments and build Merkle tree
    const commitments = await fetchCommitmentsFromContract();
    if (commitments.length === 0) {
      throw new Error('No deposits found in contract');
    }

    // 3. Build local Merkle tree
    const tree = LeanMerkleTree.fromBufferLeaves(commitments, TREE_DEPTH);
    console.log('[Withdraw] Built Merkle tree with', tree.getLeafCount(), 'leaves');

    // 4. Verify our commitment is in the tree
    const commitment = await computeCommitment(
      note.value,
      note.label,
      note.nullifier,
      note.secret
    );
    const commitmentBuffer = bigintToBuffer(commitment);
    
    // Find our commitment in the tree
    let foundIndex = -1;
    for (let i = 0; i < commitments.length; i++) {
      if (commitments[i].equals(commitmentBuffer)) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex === -1) {
      throw new Error('Commitment not found in tree. Invalid note or deposit not confirmed.');
    }
    console.log('[Withdraw] Found commitment at index:', foundIndex);

    // 5. Get Merkle proof
    const merkleProof = await getMerkleProof(tree, foundIndex);
    console.log('[Withdraw] Generated Merkle proof');

    // 6. Fetch association root from contract
    const associationRootBuffer = await fetchAssociationRoot();
    const associationRoot = bufferToBigint(associationRootBuffer);
    console.log('[Withdraw] Association root:', associationRoot.toString(16));

    // 7. Get mock association proof (or use the one from contract)
    // For now, if association root is zero, we use mock data
    let labelIndex = 0;
    let labelSiblings: bigint[] = [];
    
    if (associationRoot === BigInt(0)) {
      // Use mock association proof
      const mockProof = await getMockAssociationProof(note.label);
      labelIndex = mockProof.labelIndex;
      labelSiblings = mockProof.labelSiblings;
      // Use the mock association root
      console.log('[Withdraw] Using mock association proof');
    } else {
      // In production, fetch real association proof from off-chain service
      const mockProof = await getMockAssociationProof(note.label);
      labelIndex = mockProof.labelIndex;
      labelSiblings = mockProof.labelSiblings;
    }

    // 8. Create circuit input
    const circuitInput = createWithdrawCircuitInput({
      withdrawnValue: FIXED_AMOUNT_STROOPS,
      stateRoot: merkleProof.root,
      associationRoot,
      label: note.label,
      value: note.value,
      nullifier: note.nullifier,
      secret: note.secret,
      stateSiblings: merkleProof.siblings,
      stateIndex: foundIndex,
      labelIndex,
      labelSiblings,
    });

    // 9. Generate ZK proof
    console.log('[Withdraw] Generating ZK proof (this may take a moment)...');
    const { proof, publicSignals } = await generateWithdrawProof(circuitInput);
    console.log('[Withdraw] ZK proof generated');

    // 10. Serialize proof for contract
    const proofBytes = serializeProofForSoroban(proof);
    const pubSignalsBytes = serializePublicSignalsForSoroban(publicSignals);
    console.log('[Withdraw] Serialized proof:', proofBytes.length, 'bytes');
    console.log('[Withdraw] Serialized signals:', pubSignalsBytes.length, 'bytes');

    // 11. Create client and build transaction
    const client = createClient(toAddress);
    
    console.log('[Withdraw] Building transaction...');
    const tx = await client.withdraw({
      to: toAddress,
      proof_bytes: proofBytes,
      pub_signals_bytes: pubSignalsBytes,
    });

    // 12. Sign and submit transaction using the wallet's signTransaction directly
    console.log('[Withdraw] Signing and submitting transaction...');
    const result = await tx.signAndSend({ signTransaction });

    console.log('[Withdraw] Transaction result:', result);

    // Check for errors in result
    const messages = result.result || [];
    if (messages.length > 0) {
      // Non-empty result means an error occurred
      const errorMsg = messages.join(', ');
      return {
        success: false,
        error: errorMsg,
      };
    }

    return {
      success: true,
      txHash: result.getTransactionResponse?.txHash,
    };
  } catch (error) {
    console.error('[Withdraw] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Parse and validate a note without performing withdrawal
 */
export async function validateNote(noteString: string): Promise<{
  valid: boolean;
  note?: DepositNote;
  error?: string;
}> {
  try {
    const note = decodeNote(noteString);
    
    // Verify the commitment can be computed
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _commitment = await computeCommitment(
      note.value,
      note.label,
      note.nullifier,
      note.secret
    );
    
    return {
      valid: true,
      note,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if a note has already been spent (nullifier used)
 */
export async function isNoteSpent(noteString: string): Promise<boolean> {
  try {
    const note = decodeNote(noteString);
    const client = createClient();
    
    // Compute nullifier hash
    const nullifierHash = await poseidonHash([note.nullifier]);
    const nullifierBuffer = bigintToBuffer(nullifierHash);
    
    // Fetch used nullifiers
    const tx = await client.get_nullifiers();
    const result = await tx.simulate();
    
    if (!result.result) {
      return false;
    }
    
    // Check if our nullifier is in the list
    for (const usedNullifier of result.result) {
      if (usedNullifier.equals(nullifierBuffer)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[isNoteSpent] Error:', error);
    return false;
  }
}
