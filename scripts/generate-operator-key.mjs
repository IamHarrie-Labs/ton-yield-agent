/**
 * Run once to generate your agent's operator keypair.
 *
 * Usage:
 *   node scripts/generate-operator-key.mjs
 *
 * Then copy the mnemonic into .env.local as AGENT_MNEMONIC
 */

import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";

const mnemonic = await mnemonicNew(24);
const keyPair  = await mnemonicToPrivateKey(mnemonic);

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  TON Yield Agent — Operator Keypair Generated");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("Public Key (share with anyone):");
console.log(" ", Buffer.from(keyPair.publicKey).toString("hex"));
console.log("\nMnemonic (KEEP SECRET — add to .env.local):");
console.log("  AGENT_MNEMONIC=" + mnemonic.join(" "));
console.log("\n⚠️  This is shown ONCE. Save it now.\n");
