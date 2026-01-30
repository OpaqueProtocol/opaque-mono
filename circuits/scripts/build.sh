#!/bin/bash

# Build script for Opaque Privacy Pool circuits
# This script compiles the circom circuit and generates proving/verification keys

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$CIRCUIT_DIR/build"
PTAU_DIR="$CIRCUIT_DIR/ptau"

# Circuit parameters
CIRCUIT_NAME="main"
PTAU_FILE="powersOfTau28_hez_final_22.ptau"  # Need 2^22 for large circuits

echo "=========================================="
echo "Opaque Privacy Pool Circuit Build"
echo "=========================================="

# Create build directory
mkdir -p "$BUILD_DIR"
mkdir -p "$PTAU_DIR"

# Step 1: Check for circom
echo ""
echo "[1/6] Checking circom installation..."
if ! command -v circom &> /dev/null; then
    echo "ERROR: circom is not installed."
    echo "Install it with: curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh && cargo install circom"
    exit 1
fi
circom --version

# Step 2: Download Powers of Tau (if not exists)
echo ""
echo "[2/6] Checking Powers of Tau file..."
if [ ! -f "$PTAU_DIR/$PTAU_FILE" ]; then
    echo "Downloading $PTAU_FILE (this may take a while)..."
    curl -L -o "$PTAU_DIR/$PTAU_FILE" "https://storage.googleapis.com/zkevm/ptau/$PTAU_FILE"
else
    echo "Powers of Tau file already exists."
fi

# Step 3: Compile circuit
echo ""
echo "[3/6] Compiling circuit..."
cd "$CIRCUIT_DIR"
circom "$CIRCUIT_NAME.circom" \
    --r1cs \
    --wasm \
    --sym \
    --c \
    -o "$BUILD_DIR" \
    -l node_modules

echo "Circuit compiled successfully!"
echo "  - Constraints: $(grep -o 'Constraints: [0-9]*' "$BUILD_DIR/${CIRCUIT_NAME}.sym" 2>/dev/null || echo 'Check build output')"

# Step 4: Generate zkey (Groth16 setup)
echo ""
echo "[4/6] Generating zkey (Groth16 setup)..."
cd "$BUILD_DIR"
npx snarkjs groth16 setup "${CIRCUIT_NAME}.r1cs" "$PTAU_DIR/$PTAU_FILE" "${CIRCUIT_NAME}_0000.zkey"

# Step 5: Contribute to ceremony (for production, use multiple contributors)
echo ""
echo "[5/6] Contributing to trusted setup ceremony..."
npx snarkjs zkey contribute "${CIRCUIT_NAME}_0000.zkey" "${CIRCUIT_NAME}_final.zkey" \
    --name="First contribution" -v -e="random entropy $(date +%s)"

# Step 6: Export verification key
echo ""
echo "[6/6] Exporting verification key..."
npx snarkjs zkey export verificationkey "${CIRCUIT_NAME}_final.zkey" "verification_key.json"

# Also export Solidity verifier (for reference)
npx snarkjs zkey export solidityverifier "${CIRCUIT_NAME}_final.zkey" "Verifier.sol"

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
echo ""
echo "Generated files in $BUILD_DIR:"
echo "  - ${CIRCUIT_NAME}.r1cs          (R1CS constraint system)"
echo "  - ${CIRCUIT_NAME}_js/           (WASM prover)"
echo "  - ${CIRCUIT_NAME}.sym           (Debug symbols)"
echo "  - ${CIRCUIT_NAME}_final.zkey    (Proving key)"
echo "  - verification_key.json         (Verification key)"
echo "  - Verifier.sol                  (Solidity verifier reference)"
echo ""
echo "To test the circuit, run: npm test"
