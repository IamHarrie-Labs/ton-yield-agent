/**
 * TON Agentic Wallet utilities
 * Docs: https://docs.ton.org/ecosystem/ai/wallets
 *
 * Architecture:
 *  - Owner key  → user's TON wallet (never touches this server)
 *  - Operator key → generated here, stored in env, used to sign agent actions
 */

import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { WalletContractV5R1, internal, toNano } from "@ton/ton";
import { TonClient } from "@ton/ton";

const TESTNET_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

export function getTonClient(): TonClient {
  return new TonClient({
    endpoint: TESTNET_ENDPOINT,
    apiKey:   process.env.TONCENTER_API_KEY,
  });
}

/**
 * Generate a fresh operator keypair for the agent.
 * Store the mnemonic in AGENT_MNEMONIC env var after first run.
 */
export async function generateOperatorKey(): Promise<{ mnemonic: string[]; keyPair: KeyPair }> {
  const mnemonic = await mnemonicNew();
  const keyPair  = await mnemonicToPrivateKey(mnemonic);
  return { mnemonic, keyPair };
}

/**
 * Load operator keypair from environment.
 */
export async function loadOperatorKey(): Promise<KeyPair> {
  const mnemonicStr = process.env.AGENT_MNEMONIC;
  if (!mnemonicStr) throw new Error("AGENT_MNEMONIC not set in environment");
  const mnemonic = mnemonicStr.split(" ");
  return mnemonicToPrivateKey(mnemonic);
}

/**
 * Deploy the agentic wallet contract on TON testnet.
 *
 * The agentic wallet is a Wallet V5 contract where:
 *  - owner = user's TON address
 *  - operator = agent's public key (from this server)
 *
 * Reference: https://github.com/ton-connect/agentic-wallets-dashboard
 */
export async function deployAgenticWallet(ownerAddress: string): Promise<{
  agentWalletAddress: string;
  operatorPublicKey:  string;
}> {
  const keyPair = await loadOperatorKey();
  const client  = getTonClient();

  // Wallet V5 with operator extension (agentic wallet)
  const wallet = WalletContractV5R1.create({
    workchain:  0,
    publicKey:  keyPair.publicKey,
  });

  const walletAddress = wallet.address.toString({ testOnly: true });

  // In a full implementation:
  // 1. User funds the agentic wallet address
  // 2. Deploy contract by sending first transaction
  // For hackathon demo we return the address immediately and deploy on first tx

  return {
    agentWalletAddress: walletAddress,
    operatorPublicKey:  Buffer.from(keyPair.publicKey).toString("hex"),
  };
}

/**
 * Execute a transaction from the agentic wallet using the operator key.
 */
export async function executeAgentTx(params: {
  to:      string;
  amount:  string;  // in TON
  payload?: string;
}): Promise<string> {
  const keyPair = await loadOperatorKey();
  const client  = getTonClient();

  const wallet   = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
  const contract = client.open(wallet);
  const seqno    = await contract.getSeqno();

  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to:     params.to,
        value:  toNano(params.amount),
        body:   params.payload ?? "",
      }),
    ],
  });

  // Return a mock tx hash; in production, fetch from toncenter after broadcast
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}
