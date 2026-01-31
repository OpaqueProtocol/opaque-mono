/**
 * Lean Incremental Merkle Tree implementation for JavaScript
 * Matches the Rust lean-incremental-merkle-tree contract implementation
 */

import { poseidonHash, bufferToBigint } from './crypto';

// Tree depth matching the contract (supports 1024 deposits)
export const TREE_DEPTH = 8; // Reduced from 20 to fit Soroban budget

// Pre-computed zero values for empty tree nodes
// These must match the contract's zero values exactly
// Zero[0] = 0, Zero[i] = Poseidon(Zero[i-1], Zero[i-1])
let ZERO_VALUES: bigint[] | null = null;

/**
 * Initialize zero values for the Merkle tree
 * Must be called before using the tree
 */
export async function initializeZeroValues(): Promise<bigint[]> {
  if (ZERO_VALUES) {
    return ZERO_VALUES;
  }

  ZERO_VALUES = [BigInt(0)];
  for (let i = 1; i <= TREE_DEPTH; i++) {
    const prevZero = ZERO_VALUES[i - 1];
    ZERO_VALUES[i] = await poseidonHash([prevZero, prevZero]);
  }
  
  return ZERO_VALUES;
}

/**
 * Get zero value at a specific level
 */
export async function getZeroValue(level: number): Promise<bigint> {
  const zeros = await initializeZeroValues();
  if (level < 0 || level > TREE_DEPTH) {
    throw new Error(`Invalid level: ${level}`);
  }
  return zeros[level];
}

/**
 * Lean Incremental Merkle Tree
 * Optimized for append-only operations
 */
export class LeanMerkleTree {
  private leaves: bigint[] = [];
  private depth: number;

  constructor(depth: number = TREE_DEPTH) {
    this.depth = depth;
  }

  /**
   * Add a leaf to the tree
   */
  addLeaf(leaf: bigint): number {
    const index = this.leaves.length;
    const maxLeaves = 2 ** this.depth;
    
    if (index >= maxLeaves) {
      throw new Error('Tree at capacity');
    }
    
    this.leaves.push(leaf);
    return index;
  }

  /**
   * Get all leaves in the tree
   */
  getLeaves(): bigint[] {
    return [...this.leaves];
  }

  /**
   * Get the number of leaves in the tree
   */
  getLeafCount(): number {
    return this.leaves.length;
  }

  /**
   * Compute the Merkle root
   */
  async computeRoot(): Promise<bigint> {
    const zeros = await initializeZeroValues();
    
    if (this.leaves.length === 0) {
      return zeros[this.depth];
    }

    // Build tree layer by layer
    let currentLayer = [...this.leaves];
    let level = 0;

    while (currentLayer.length > 1 || level < this.depth) {
      const nextLayer: bigint[] = [];
      const zeroAtLevel = zeros[level];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : zeroAtLevel;
        const parent = await poseidonHash([left, right]);
        nextLayer.push(parent);
      }

      // If we have an odd number and need to pad
      if (nextLayer.length === 0) {
        nextLayer.push(zeroAtLevel);
      }

      currentLayer = nextLayer;
      level++;

      if (level >= this.depth && currentLayer.length === 1) {
        break;
      }
    }

    return currentLayer[0];
  }

  /**
   * Get the Merkle path (siblings) for a leaf at given index
   * Returns siblings from leaf level up to root
   */
  async getMerklePath(leafIndex: number): Promise<bigint[]> {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Invalid leaf index: ${leafIndex}`);
    }

    const zeros = await initializeZeroValues();
    const siblings: bigint[] = [];

    // Build tree and collect siblings
    let currentLayer = [...this.leaves];
    let currentIndex = leafIndex;

    for (let level = 0; level < this.depth; level++) {
      const zeroAtLevel = zeros[level];
      
      // Get sibling
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      
      if (siblingIndex < currentLayer.length) {
        siblings.push(currentLayer[siblingIndex]);
      } else {
        siblings.push(zeroAtLevel);
      }

      // Build next layer
      const nextLayer: bigint[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : zeroAtLevel;
        const parent = await poseidonHash([left, right]);
        nextLayer.push(parent);
      }

      // Pad if needed
      if (nextLayer.length === 0) {
        nextLayer.push(zeros[level + 1]);
      }

      currentLayer = nextLayer;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return siblings;
  }

  /**
   * Verify a Merkle proof
   */
  async verifyProof(
    leaf: bigint,
    leafIndex: number,
    siblings: bigint[],
    root: bigint
  ): Promise<boolean> {
    if (siblings.length !== this.depth) {
      return false;
    }

    let currentHash = leaf;
    let currentIndex = leafIndex;

    for (let i = 0; i < this.depth; i++) {
      const sibling = siblings[i];
      const isLeft = currentIndex % 2 === 0;
      
      if (isLeft) {
        currentHash = await poseidonHash([currentHash, sibling]);
      } else {
        currentHash = await poseidonHash([sibling, currentHash]);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }

    return currentHash === root;
  }

  /**
   * Create tree from existing leaves (e.g., fetched from contract)
   */
  static fromLeaves(leaves: bigint[], depth: number = TREE_DEPTH): LeanMerkleTree {
    const tree = new LeanMerkleTree(depth);
    tree.leaves = [...leaves];
    return tree;
  }

  /**
   * Create tree from Buffer leaves (as returned by contract)
   */
  static fromBufferLeaves(buffers: Buffer[], depth: number = TREE_DEPTH): LeanMerkleTree {
    const leaves = buffers.map(buf => bufferToBigint(buf));
    return LeanMerkleTree.fromLeaves(leaves, depth);
  }
}

/**
 * Build Merkle tree from commitments fetched from contract
 */
export async function buildMerkleTreeFromCommitments(
  commitments: Buffer[]
): Promise<LeanMerkleTree> {
  const tree = LeanMerkleTree.fromBufferLeaves(commitments, TREE_DEPTH);
  return tree;
}

/**
 * Get Merkle proof for a specific commitment
 */
export async function getMerkleProof(
  tree: LeanMerkleTree,
  leafIndex: number
): Promise<{
  siblings: bigint[];
  root: bigint;
  index: number;
}> {
  const siblings = await tree.getMerklePath(leafIndex);
  const root = await tree.computeRoot();
  
  return {
    siblings,
    root,
    index: leafIndex,
  };
}

/**
 * Convert Merkle proof siblings to string array for circuit input
 */
export function siblingsToCircuitInput(siblings: bigint[]): string[] {
  return siblings.map(s => s.toString());
}
