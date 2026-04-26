const API_BASE = 'http://nvk.gay:3000';

interface JsonRpcRequest {
  jsonrpc: '1.0' | '2.0';
  id: number;
  method: string;
  params: unknown[];
}

interface JsonRpcResponse {
  result?: unknown;
  error?: { code: number; message: string } | null;
  id: number;
}

async function rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
  const body: JsonRpcRequest = {
    jsonrpc: '1.0',
    id: Date.now(),
    method,
    params,
  };
  const res = await fetch(`${API_BASE}/v1/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`RPC ${method} failed (${res.status}): ${text}`);
  }
  const json: JsonRpcResponse = await res.json();
  if (json.error) {
    throw new Error(`RPC ${method} error: ${json.error.message} (code ${json.error.code})`);
  }
  return json.result;
}

async function rpcBatch(calls: Array<{ method: string; params: unknown[] }>): Promise<unknown[]> {
  const body: JsonRpcRequest[] = calls.map((c, i) => ({
    jsonrpc: '1.0',
    id: Date.now() + i,
    method: c.method,
    params: c.params,
  }));
  const res = await fetch(`${API_BASE}/v1/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Batch RPC failed (${res.status}): ${text}`);
  }
  const results: JsonRpcResponse[] = await res.json();
  return results.map(r => {
    if (r.error) throw new Error(`Batch RPC error: ${r.error.message}`);
    return r.result;
  });
}

async function getRest<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function postRest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface WalletInfo {
  walletname: string;
  walletversion: number;
  balance: number;
  unconfirmed_balance: number;
  immature_balance: number;
  txcount: number;
  keypoololdest: number;
  keypoolsize: number;
  paytxfee: number;
  hdseedid?: string;
  private_keys_enabled: boolean;
  avoid_reuse: boolean;
  scanning: boolean | { duration: number; progress: number };
}

export interface UnspentOutput {
  txid: string;
  vout: number;
  address: string;
  label: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  redeemScript?: string;
  witnessScript?: string;
  spendable: boolean;
  solvable: boolean;
  desc: string;
  safe: boolean;
}

export interface MempoolInfo {
  loaded: boolean;
  size: number;
  bytes: number;
  usage: number;
  maxmempool: number;
  mempoolminfee: number;
  minrelaytxfee: number;
}

export interface FeeEstimate {
  feerate?: number;
  blocks?: number;
}

export interface NetworkInfo {
  version: number;
  subversion: string;
  protocolversion: number;
  localservices: string;
  localservicesnames: string[];
  localrelay: boolean;
  timeoffset: number;
  networkactive: boolean;
  connections: number;
  networks: Array<{
    name: string;
    limited: boolean;
    reachable: boolean;
    proxy: string;
    proxy_randomize_credentials: boolean;
  }>;
  relayfee: number;
  incrementalfee: number;
}

export interface ChainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: boolean;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
}

export interface DecodedTx {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    scriptSig?: { asm: string; hex: string };
    sequence: number;
    txinwitness?: string[];
  }>;
  vout: Array<{
    value: number;
    n: number;
    scriptPubKey: {
      asm: string;
      hex: string;
      reqSigs?: number;
      type: string;
      addresses?: string[];
    };
  }>;
}

export interface BlockInfo {
  hash: string;
  confirmations: number;
  size: number;
  strippedsize: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[] | DecodedTx[];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
}

export const mutinyClient = {
  health: () => getRest<string>('/health'),

  getBlockByHeight: (height: number) =>
    getRest<BlockInfo>(`/v1/block-height/${height}`),

  getBlock: (hash: string, verbosity = 1) =>
    getRest<BlockInfo>(`/v1/block/${hash}?verbosity=${verbosity}`),

  getChainInfo: () =>
    getRest<ChainInfo>('/v1/chain'),

  getFeeEstimates: (blocks = 6) =>
    getRest<FeeEstimate>(`/v1/fee-estimates?blocks=${blocks}`),

  getMempoolInfo: () =>
    getRest<MempoolInfo>('/v1/mempool'),

  getNetworkInfo: () =>
    getRest<NetworkInfo>('/v1/network'),

  broadcastTx: (hex: string, maxFeeRate?: number) =>
    postRest<{ result: string }>('/v1/tx', { hex, max_fee_rate: maxFeeRate }),

  getTransaction: (txid: string, verbose = true) =>
    getRest<DecodedTx | string>(`/v1/tx/${txid}?verbose=${verbose}`),

  getBalance: (minConf = 1, includeWatchOnly = false) =>
    getRest<number>(`/v1/wallet/balance?min_conf=${minConf}&include_watch_only=${includeWatchOnly}`),

  getWalletInfo: () =>
    getRest<WalletInfo>('/v1/wallet/info'),

  listUnspent: (minConf = 1, maxConf = 9999999) =>
    getRest<UnspentOutput[]>(`/v1/wallet/unspent?min_conf=${minConf}&max_conf=${maxConf}`),

  rpc: (method: string, params: unknown[] = []) =>
    rpcCall(method, params),

  rpcBatch: (calls: Array<{ method: string; params: unknown[] }>) =>
    rpcBatch(calls),

  getNewAddress: (label = '', addressType = 'bech32') =>
    rpcCall('getnewaddress', [label, addressType]) as Promise<string>,

  sendToAddress: (address: string, amount: number) =>
    rpcCall('sendtoaddress', [address, amount]) as Promise<string>,

  createRawTransaction: (inputs: Array<{ txid: string; vout: number }>, outputs: Record<string, number>) =>
    rpcCall('createrawtransaction', [inputs, outputs]) as Promise<string>,

  signRawTransactionWithWallet: (hex: string) =>
    rpcCall('signrawtransactionwithwallet', [hex]) as Promise<{ hex: string; complete: boolean }>,

  sendRawTransaction: (hex: string, maxFeeRate?: number) =>
    rpcCall('sendrawtransaction', [hex, maxFeeRate ?? 0]) as Promise<string>,

  getRawTransaction: (txid: string, verbose = true) =>
    rpcCall('getrawtransaction', [txid, verbose]) as Promise<DecodedTx | string>,

  decodeRawTransaction: (hex: string) =>
    rpcCall('decoderawtransaction', [hex]) as Promise<DecodedTx>,

  listTransactions: (count = 50, skip = 0, includeWatchOnly = false) =>
    rpcCall('listtransactions', ['*', count, skip, includeWatchOnly]) as Promise<Array<{
      address?: string;
      category: 'send' | 'receive' | 'generate' | 'immature' | 'orphan';
      amount: number;
      label?: string;
      vout?: number;
      fee?: number;
      confirmations: number;
      blockhash?: string;
      blockindex?: number;
      blocktime?: number;
      txid: string;
      time: number;
      timereceived: number;
      comment?: string;
    }>>,
};
