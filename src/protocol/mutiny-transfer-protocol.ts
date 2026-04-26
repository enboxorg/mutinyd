import type { ProtocolDefinition } from '@enbox/dwn-sdk-js';
import { defineProtocol } from '@enbox/browser';

export type TransferData = {
  type: 'lightning-invoice' | 'onchain-psbt' | 'address-share';
  payload: string;
  amountSat: number;
  memo?: string;
  senderDid: string;
  createdAt: string;
};

export type PublicKeyData = {
  pubkey: string;
  address?: string;
  createdAt: string;
};

export type MutinyTransferSchemaMap = {
  transfer: TransferData;
  publicKey: PublicKeyData;
};

export const MutinyTransferDefinition = {
  protocol  : 'https://enbox.id/protocols/mutiny-transfer',
  published : true,
  types     : {
    transfer: {
      schema              : 'https://enbox.id/schemas/mutiny-transfer/transfer',
      dataFormats         : ['application/json'],
      encryptionRequired  : true,
    },
    publicKey: {
      schema      : 'https://enbox.id/schemas/mutiny-transfer/public-key',
      dataFormats : ['application/json'],
    },
  },
  structure: {
    transfer: {},
    publicKey: {},
  },
} as const satisfies ProtocolDefinition;

export const MutinyTransferProtocol = defineProtocol(
  MutinyTransferDefinition,
  {} as MutinyTransferSchemaMap,
);
