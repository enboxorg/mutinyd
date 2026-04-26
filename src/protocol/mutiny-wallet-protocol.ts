import type { ProtocolDefinition } from '@enbox/dwn-sdk-js';
import { defineProtocol } from '@enbox/browser';

export type MintData = {
  url: string;
  name?: string;
  unit: string;
  active: boolean;
};

export type UTXOData = {
  txid: string;
  vout: number;
  address: string;
  amount: number;
  confirmations: number;
  scriptPubKey: string;
  spendable: boolean;
  state: 'unspent' | 'pending' | 'spent';
};

export type ChannelData = {
  channelId: string;
  peerPubkey: string;
  peerAlias?: string;
  channelType?: string;
  capacitySat: number;
  localBalanceSat: number;
  remoteBalanceSat: number;
  unsettledBalanceSat: number;
  status: 'opening' | 'open' | 'closing' | 'closed' | 'force-closed';
  confirmedAt?: string;
  closedAt?: string;
};

export type InvoiceData = {
  paymentHash: string;
  paymentRequest: string;
  amountMsat: number;
  description?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
  paidAt?: string;
};

export type TransactionData = {
  type: 'onchain-send' | 'onchain-receive' | 'lightning-send' | 'lightning-receive' |
        'channel-open' | 'channel-close' | 'swap-in' | 'swap-out';
  amountSat: number;
  feeSat?: number;
  txid?: string;
  address?: string;
  paymentHash?: string;
  paymentRequest?: string;
  status: 'pending' | 'completed' | 'failed';
  memo?: string;
  createdAt: string;
  confirmedAt?: string;
};

export type WalletKeyData = {
  mnemonic: string;
  hdSeedId?: string;
  createdAt: string;
};

export type PreferenceData = {
  defaultUnit?: string;
  displayCurrency?: string;
  apiEndpoint?: string;
};

export type MutinyWalletSchemaMap = {
  mint: MintData;
  utxo: UTXOData;
  channel: ChannelData;
  invoice: InvoiceData;
  transaction: TransactionData;
  walletKey: WalletKeyData;
  preference: PreferenceData;
};

export const MutinyWalletDefinition = {
  protocol  : 'https://enbox.id/protocols/mutiny-wallet',
  published : false,
  types     : {
    mint: {
      schema      : 'https://enbox.id/schemas/mutiny-wallet/mint',
      dataFormats : ['application/json'],
    },
    utxo: {
      schema              : 'https://enbox.id/schemas/mutiny-wallet/utxo',
      dataFormats         : ['application/json'],
      encryptionRequired  : true,
    },
    channel: {
      schema              : 'https://enbox.id/schemas/mutiny-wallet/channel',
      dataFormats         : ['application/json'],
      encryptionRequired  : true,
    },
    invoice: {
      schema              : 'https://enbox.id/schemas/mutiny-wallet/invoice',
      dataFormats         : ['application/json'],
      encryptionRequired  : true,
    },
    transaction: {
      schema              : 'https://enbox.id/schemas/mutiny-wallet/transaction',
      dataFormats         : ['application/json'],
      encryptionRequired  : true,
    },
    walletKey: {
      schema              : 'https://enbox.id/schemas/mutiny-wallet/wallet-key',
      dataFormats         : ['application/json'],
      encryptionRequired  : true,
    },
    preference: {
      schema      : 'https://enbox.id/schemas/mutiny-wallet/preference',
      dataFormats : ['application/json'],
    },
  },
  structure: {
    mint: {
      $tags: {
        $allowUndefinedTags : true,
        url                 : { type: 'string' },
        unit                : { type: 'string' },
      },
      utxo: {},
    },
    channel: {},
    invoice: {},
    transaction: {},
    walletKey: {
      $recordLimit: { max: 1, strategy: 'reject' },
    },
    preference: {
      $recordLimit: { max: 1, strategy: 'reject' },
    },
  },
} as const satisfies ProtocolDefinition;

export const MutinyWalletProtocol = defineProtocol(
  MutinyWalletDefinition,
  {} as MutinyWalletSchemaMap,
);
