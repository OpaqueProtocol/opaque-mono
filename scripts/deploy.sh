#!/bin/bash

# Deployment script for Opaque Privacy Pools on Stellar Testnet
set -e

NETWORK="testnet"
SOURCE="alice"

# VK bytes from test.rs (BLS12-381 compatible)
VK_HEX="110f0ab7ee573cb33bd7f21feca50c65b3a6acdf5398f69544475dd19fdc08c91cfd13f3955afabea9bf530ae8c8e6a60781ad6b07a8307b69dfd570f503af011fb0b66d33dff3074de08d878a45e9a7f7b9cfe94609890efa3becdd165a385f0ac884369152550e98713084dbb37693444a4cef0dd462309164433a0930f64a77a19ee02f208c975b6ee7361db940ea08b20dc2747ae5381ead63214899649148141e6535305d7f1cd156a49d8ee23cbb1b48aac5146b177728838c8e54fc800cd45f27482e81dbeca430298f4b1ab8fef7626c1af01a0ab96dea9ad7090a8541628d0b21983201983da652a09dbe1a1573e915101cd062b04436ba6df2c2f65e2f2c2700ce6f25a94774df105e7e68c2dc5043a20ff97c48e981ce353dc3be024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb813e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e0ce5d527727d6e118cc9cdc6da2e351aadfd9baa8cbdd3a76d429a695160d12c923ac9cc3baca289e193548608b828010606c4a02ea734cc32acd2b02bc28b99cb3e287e85a763af267492ab572e99ab3f370d275cec1da1aaa9075ff05f79be11de4c999b524bfb752a225858566e86c28146c04aedc1c76d599fa9c8d83fd3fd8a3fe5c576aa95032169c8a67d1c360fadd9a8e2cf139b2e25f94ae0415d2f802f18cbef752c6edd6a8bd8a2a910f5b191b0beca0fe7c0495fb00fea0ce8ef06ff484f49c7dd1fca2c26289d262504976b9721ebe737caaa9c2f69275b68e1d8e486a309683fe00cf5a764cfb1d62d051826d64165da9599f594c4a1bfee83fbd99aef7a6a8d7dffa7ddd6a5474195367450e99fa6c7fdf3854e13f867f380000000050c8d0ba1bc0b363f891c5c8b66bc8a34cfc8bd9d0a828995c1d4d98fbdc43e8c0ad6e37281c5ad73affbcb6824fbc8a40e6b8e19c3320c0b073a212f32e65de045616743ce5caae3426dfb7215be31e8fee69aa0c49656bc322c404c977eb4f311b69a56e232d2828be5ce10ecb884139261a3b9a868549b29216bc85fa193b3cef13aede757e72c2b2d729047a2206a117af00319d080ab01fcc5e0fdc8056d1f158c9ea80f515b8e52906f326ec48bde7c132f9f59acc2a88a3230f2c4b1070ecad8816ad5b862005e911a1523ba733d282f429e449aa6790352a92c8698b63031bdd6746eb44707ddca11a761e12d0e66bc7e5b809887195c4cecd30eb3c97b8a913b08a3c3e069dfa7574cf8943153728a0ca8e536ae0e68c020199e51c30d5984369337f4eec15d478afa46104a25d0b7b4c1ecf276220aabd58e75d370d41b364d17b25a03119350e6eb5fd7330c17d5ccd41c27bd003ad4ac1c32429f829215e5611d0df31e91306e1016090ceaf25cfe9816c01573a0d451891ed9b0128e4b7562290db4588a451dc102061c97f49838a93047e6dc0a24e32a38d51aee980dd8afc1c49dd68f3ddb7a11e20a1662097ef430b179a2d7e970968b2cc03f5a97ff0441ab2282961bed5bdcac7b3854a4cc96a0b981db55dcf162858faa"

echo "=== Opaque Privacy Pools Deployment ==="
echo "Network: $NETWORK"
echo "Source: $SOURCE"
echo ""

# Step 1: Deploy groth16_verifier contract
echo "1. Deploying groth16_verifier contract..."
stellar contract deploy \
  --wasm target/wasm32v1-none/release/groth16_verifier.wasm \
  --source-account $SOURCE \
  --network $NETWORK \
  --alias groth16_verifier || true

GROTH16_VERIFIER_ID=$(stellar contract id alias --alias groth16_verifier --network $NETWORK 2>/dev/null || echo "")

if [ -z "$GROTH16_VERIFIER_ID" ]; then
  echo "   Getting contract ID..."
  GROTH16_VERIFIER_ID=$(stellar contract deploy \
    --wasm target/wasm32v1-none/release/groth16_verifier.wasm \
    --source-account $SOURCE \
    --network $NETWORK 2>&1 | grep -E '^C[A-Z0-9]{55}$' | head -1)
fi

echo "   Groth16 Verifier: $GROTH16_VERIFIER_ID"

# Step 2: Get native XLM SAC address
echo ""
echo "2. Getting native XLM SAC address..."
XLM_SAC=$(stellar contract id asset --asset native --network $NETWORK)
echo "   Native XLM SAC: $XLM_SAC"

# Step 3: Get admin address
echo ""
echo "3. Getting admin address..."
ADMIN_ADDRESS=$(stellar keys address $SOURCE)
echo "   Admin: $ADMIN_ADDRESS"

# Step 4: Deploy the opaque contract
echo ""
echo "4. Deploying opaque contract..."
stellar contract deploy \
  --wasm target/wasm32v1-none/release/opaque.wasm \
  --source-account $SOURCE \
  --network $NETWORK \
  --alias opaque \
  -- \
  --vk_bytes $VK_HEX \
  --token_address $XLM_SAC \
  --admin $ADMIN_ADDRESS \
  --groth16_verifier $GROTH16_VERIFIER_ID

OPAQUE_CONTRACT_ID=$(stellar contract alias show opaque --network $NETWORK)

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Contract IDs:"
echo "  Groth16 Verifier: $GROTH16_VERIFIER_ID"
echo "  Opaque Contract:  $OPAQUE_CONTRACT_ID"
echo "  XLM Token (SAC):  $XLM_SAC"
echo ""
echo "Admin: $ADMIN_ADDRESS"
echo ""
echo "Save the Opaque Contract ID for your frontend: $OPAQUE_CONTRACT_ID"
