import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { repository } from '@enbox/browser';
import { useEnbox } from '@/enbox/use-enbox';
import { mutinyClient } from '@/lib/mutiny-client';
import type { MintData, UTXOData, ChannelData, InvoiceData, TransactionData, PreferenceData } from '@/protocol/mutiny-wallet-protocol';
import { MutinyWalletProtocol } from '@/protocol/mutiny-wallet-protocol';
import { MutinyTransferProtocol } from '@/protocol/mutiny-transfer-protocol';
import { toastError, toastSuccess } from '@/lib/utils';

export interface Mint {
  id: string;
  contextId: string;
  url: string;
  name?: string;
  unit: string;
  active: boolean;
}

export interface UTXO {
  id: string;
  contextId: string;
  mintContextId: string;
  txid: string;
  vout: number;
  address: string;
  amount: number;
  confirmations: number;
  scriptPubKey: string;
  spendable: boolean;
  state: 'unspent' | 'pending' | 'spent';
}

export interface Channel {
  id: string;
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
}

export interface Invoice {
  id: string;
  paymentHash: string;
  paymentRequest: string;
  amountMsat: number;
  description?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
  paidAt?: string;
}

export interface Transaction {
  id: string;
  type: TransactionData['type'];
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
}

export interface Preferences {
  defaultUnit?: string;
  displayCurrency?: string;
  apiEndpoint?: string;
}

type Repo = any;

export function useWallet() {
  const { enbox, isConnected, did: connectedDid, isDelegateSession } = useEnbox();

  const [repo, setRepo] = useState<Repo>(null);
  const typedRef = useRef<any>(null);

  const [mints, setMints] = useState<Mint[]>([]);
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({});
  const [loading, setLoading] = useState(false);
  const [dwnError, setDwnError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  const initializeProtocols = useCallback(async (enboxInstance: any, isDelegate: boolean): Promise<Repo> => {
    const typed = enboxInstance.using(MutinyWalletProtocol);
    typedRef.current = typed;
    const r = repository(typed);

    if (!isDelegate) {
      try {
        const res = await r.configure() as any;
        res?.protocol?.send?.(connectedDid)?.catch?.(() => {});
      } catch (err) {
        console.warn('[mutinyd] Protocol configure:', err);
      }
    } else {
      console.log('[mutinyd] Delegate session — skipping wallet protocol configure');
    }

    const transferTyped = enboxInstance.using(MutinyTransferProtocol);
    const transferRepo = repository(transferTyped);

    try {
      const res = await transferRepo.configure() as any;
      res?.protocol?.send?.(connectedDid)?.catch?.(() => {});
    } catch (err) {
      console.warn('[mutinyd] Transfer protocol configure:', err);
    }

    return r;
  }, [connectedDid]);

  const resetState = useCallback(() => {
    typedRef.current = null;
    setRepo(null);
    setMints([]);
    setUtxos([]);
    setChannels([]);
    setInvoices([]);
    setTransactions([]);
    setPreferences({});
    setDwnError(null);
  }, []);

  useEffect(() => {
    if (!enbox || !isConnected) {
      resetState();
      return;
    }

    let cancelled = false;
    initializeProtocols(enbox, isDelegateSession).then((r) => {
      if (!cancelled) { setRepo(r); }
    });
    return () => { cancelled = true; };
  }, [enbox, isConnected, isDelegateSession, initializeProtocols, resetState]);

  const refreshMints = useCallback(async () => {
    if (!repo) return;
    setDwnError(null);
    try {
      const { records } = await repo.mint.query();
      setMints(
        await Promise.all(records.map(async (r: any) => {
          const data: MintData = await r.data.json();
          return {
            id        : r.id,
            contextId : r.contextId ?? r.id,
            url       : data.url,
            name      : data.name,
            unit      : data.unit,
            active    : data.active,
          };
        })),
      );
    } catch (err) {
      console.error('Failed to load mints:', err);
      setDwnError('Failed to load wallet data. Check your connection.');
    }
  }, [repo]);

  const refreshUTXOs = useCallback(async () => {
    if (!repo || mints.length === 0) {
      setUtxos([]);
      return;
    }
    try {
      const allUTXOs: UTXO[] = [];
      for (const mint of mints) {
        const { records } = await repo.mint.utxo.query(mint.contextId);
        for (const r of records) {
          const data: UTXOData = await r.data.json();
          allUTXOs.push({
            id             : r.id,
            contextId      : r.contextId ?? r.id,
            mintContextId  : mint.contextId,
            txid           : data.txid,
            vout           : data.vout,
            address        : data.address,
            amount         : data.amount,
            confirmations  : data.confirmations,
            scriptPubKey   : data.scriptPubKey,
            spendable      : data.spendable,
            state          : data.state,
          });
        }
      }
      setUtxos(allUTXOs);
    } catch (err) {
      console.error('Failed to load UTXOs:', err);
    }
  }, [repo, mints]);

  const refreshChannels = useCallback(async () => {
    if (!repo) return;
    try {
      const { records } = await repo.channel.query();
      setChannels(
        await Promise.all(records.map(async (r: any) => {
          const data: ChannelData = await r.data.json();
          return {
            id                 : r.id,
            channelId          : data.channelId,
            peerPubkey         : data.peerPubkey,
            peerAlias          : data.peerAlias,
            channelType        : data.channelType,
            capacitySat        : data.capacitySat,
            localBalanceSat    : data.localBalanceSat,
            remoteBalanceSat   : data.remoteBalanceSat,
            unsettledBalanceSat: data.unsettledBalanceSat,
            status             : data.status,
            confirmedAt        : data.confirmedAt,
            closedAt           : data.closedAt,
          };
        })),
      );
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  }, [repo]);

  const refreshInvoices = useCallback(async () => {
    if (!repo) return;
    try {
      const { records } = await repo.invoice.query();
      setInvoices(
        await Promise.all(records.map(async (r: any) => {
          const data: InvoiceData = await r.data.json();
          return {
            id             : r.id,
            paymentHash    : data.paymentHash,
            paymentRequest : data.paymentRequest,
            amountMsat     : data.amountMsat,
            description    : data.description,
            status         : data.status,
            createdAt      : data.createdAt,
            expiresAt      : data.expiresAt,
            paidAt         : data.paidAt,
          };
        })),
      );
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  }, [repo]);

  const refreshTransactions = useCallback(async () => {
    if (!repo) return;
    try {
      const { records } = await repo.transaction.query();
      const txList = await Promise.all(records.map(async (r: any) => {
        const data: TransactionData = await r.data.json();
        return {
          id             : r.id,
          type           : data.type,
          amountSat      : data.amountSat,
          feeSat         : data.feeSat,
          txid           : data.txid,
          address        : data.address,
          paymentHash    : data.paymentHash,
          paymentRequest : data.paymentRequest,
          status         : data.status,
          memo           : data.memo,
          createdAt      : data.createdAt,
          confirmedAt    : data.confirmedAt,
        };
      }));
      txList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(txList);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  }, [repo]);

  const refreshPreferences = useCallback(async () => {
    if (!repo) return;
    try {
      const record = await repo.preference.get();
      if (record) {
        const data: PreferenceData = await record.data.json();
        setPreferences(data);
      }
    } catch {
      // expected on first launch
    }
  }, [repo]);

  useEffect(() => {
    if (!repo) return;
    setLoading(true);
    Promise.all([
      refreshMints(),
      refreshTransactions(),
      refreshPreferences(),
      checkApiConnection(),
    ]).finally(() => setLoading(false));
  }, [repo]);

  useEffect(() => {
    if (!repo || mints.length === 0) return;
    refreshUTXOs();
    refreshChannels();
    refreshInvoices();
  }, [repo, mints.length]);

  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    const typed = typedRef.current;
    if (!typed) return;

    let cleanup: (() => void) | undefined;
    let debounceTimer: ReturnType<typeof setTimeout>;

    typed.subscribe().then((liveQuery: any) => {
      if (!liveQuery) return;

      const unsub = liveQuery.on('change', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => refreshRef.current(), 300);
      });

      cleanup = () => {
        unsub();
        liveQuery.close();
      };
    }).catch((err: unknown) => console.error('[mutinyd] Subscription failed:', err));

    return () => {
      clearTimeout(debounceTimer);
      cleanup?.();
    };
  }, [repo]);

  useEffect(() => {
    refreshRef.current = () => {
      refreshMints();
      refreshUTXOs();
      refreshChannels();
      refreshInvoices();
      refreshTransactions();
      refreshPreferences();
    };
  }, [refreshMints, refreshUTXOs, refreshChannels, refreshInvoices, refreshTransactions, refreshPreferences]);

  const checkApiConnection = useCallback(async () => {
    try {
      await mutinyClient.health();
      setApiConnected(true);
    } catch {
      setApiConnected(false);
    }
  }, []);

  const addMint = useCallback(async (data: MintData): Promise<Mint | undefined> => {
    if (!repo) return;
    try {
      const { record } = await repo.mint.create({ data });
      if (record) {
        await record.send().catch(() => {});
      }
      const mint: Mint = {
        id: record?.id ?? '',
        contextId: record?.contextId ?? record?.id ?? '',
        ...data,
      };
      setMints(prev => [...prev, mint]);
      return mint;
    } catch (err) {
      toastError('Failed to add mint', err);
      return undefined;
    }
  }, [repo]);

  const removeMint = useCallback(async (id: string) => {
    if (!repo) return;
    try {
      const mints = await (async () => {
        const { records } = await repo.mint.query();
        return records;
      })();
      const record = mints.find((r: any) => r.id === id || r.contextId === id);
      if (record) {
        await record.delete();
      }
      setMints(prev => prev.filter(m => m.contextId !== id && m.id !== id));
      setUtxos(prev => prev.filter(u => u.mintContextId !== id));
    } catch (err) {
      toastError('Failed to remove mint', err);
    }
  }, [repo]);

  const updateMint = useCallback(async (id: string, data: Partial<MintData>) => {
    if (!repo) return;
    try {
      const { records } = await repo.mint.query();
      const record = records.find((r: any) => r.id === id);
      if (record) {
        const existing: MintData = await record.data.json();
        await record.update({ data: { ...existing, ...data } });
      }
      setMints(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    } catch (err) {
      toastError('Failed to update mint', err);
    }
  }, [repo]);

  const addUTXO = useCallback(async (mintContextId: string, data: UTXOData): Promise<UTXO | undefined> => {
    if (!repo) return;
    try {
      const { record } = await repo.mint.utxo.create(mintContextId, { data });
      const utxo: UTXO = {
        id: record?.id ?? '',
        contextId: record?.contextId ?? record?.id ?? '',
        mintContextId,
        ...data,
      };
      setUtxos(prev => [...prev, utxo]);
      return utxo;
    } catch (err) {
      toastError('Failed to store UTXO', err);
      return undefined;
    }
  }, [repo]);

  const addChannel = useCallback(async (data: ChannelData): Promise<Channel | undefined> => {
    if (!repo) return;
    try {
      const { record } = await repo.channel.create({ data });
      const ch: Channel = {
        id: record?.id ?? '',
        ...data,
      };
      setChannels(prev => [...prev, ch]);
      return ch;
    } catch (err) {
      toastError('Failed to store channel', err);
      return undefined;
    }
  }, [repo]);

  const addInvoice = useCallback(async (data: InvoiceData): Promise<Invoice | undefined> => {
    if (!repo) return;
    try {
      const { record } = await repo.invoice.create({ data });
      const inv: Invoice = {
        id: record?.id ?? '',
        ...data,
      };
      setInvoices(prev => [...prev, inv]);
      return inv;
    } catch (err) {
      toastError('Failed to store invoice', err);
      return undefined;
    }
  }, [repo]);

  const updateInvoice = useCallback(async (id: string, data: Partial<InvoiceData>) => {
    if (!repo) return;
    try {
      const { records } = await repo.invoice.query();
      const record = records.find((r: any) => r.id === id);
      if (record) {
        const existing = await record.data.json();
        await record.update({ data: { ...existing, ...data } });
      }
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    } catch (err) {
      toastError('Failed to update invoice', err);
    }
  }, [repo]);

  const addTransaction = useCallback(async (data: TransactionData): Promise<Transaction | undefined> => {
    if (!repo) return;
    try {
      const { record } = await repo.transaction.create({ data });
      const tx: Transaction = {
        id: record?.id ?? '',
        ...data,
      };
      setTransactions(prev => [tx, ...prev]);
      return tx;
    } catch (err) {
      toastError('Failed to record transaction', err);
      return undefined;
    }
  }, [repo]);

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionData>) => {
    if (!repo) return;
    try {
      const { records } = await repo.transaction.query();
      const record = records.find((r: any) => r.id === id);
      if (record) {
        const existing = await record.data.json();
        await record.update({ data: { ...existing, ...data } });
      }
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    } catch (err) {
      toastError('Failed to update transaction', err);
    }
  }, [repo]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!repo) return;
    try {
      const { records } = await repo.transaction.query();
      const record = records.find((r: any) => r.id === id);
      if (record) {
        await record.delete();
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toastError('Failed to delete transaction', err);
    }
  }, [repo]);

  const updatePreferences = useCallback(async (data: Preferences) => {
    if (!repo) return;
    try {
      await repo.preference.set({ data });
      setPreferences(data);
    } catch (err) {
      toastError('Failed to save preferences', err);
    }
  }, [repo]);

  const syncFromApi = useCallback(async () => {
    try {
      const [info, unspent] = await Promise.all([
        mutinyClient.getWalletInfo().catch(() => null),
        mutinyClient.listUnspent().catch(() => []),
      ]);

      if (unspent && unspent.length > 0) {
        for (const u of unspent) {
          const exists = utxos.find(x => x.txid === u.txid && x.vout === u.vout);
          if (!exists && mints.length > 0) {
            await addUTXO(mints[0].contextId, {
              txid: u.txid,
              vout: u.vout,
              address: u.address,
              amount: u.amount,
              confirmations: u.confirmations,
              scriptPubKey: u.scriptPubKey,
              spendable: u.spendable,
              state: 'unspent',
            });
          }
        }
      }

      if (info) {
        toastSuccess('Synced', `On-chain: ${info.balance} sat`);
      }
    } catch (err) {
      toastError('Sync failed', err);
    }
  }, [utxos, mints, addUTXO]);

  const createInvoice = useCallback(async (amountSat: number, description?: string, expirySec = 3600) => {
    try {
      const result = await mutinyClient.rpc('createinvoice', [amountSat * 1000, description || '', expirySec]) as {
        bolt11: string;
        payment_hash: string;
        amount_msat: number;
      };
      await addInvoice({
        paymentHash: result.payment_hash,
        paymentRequest: result.bolt11,
        amountMsat: result.amount_msat,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expirySec * 1000).toISOString(),
      });
      return result;
    } catch (err) {
      toastError('Failed to create invoice', err);
      throw err;
    }
  }, [addInvoice]);

  const payInvoice = useCallback(async (bolt11: string) => {
    try {
      const result = await mutinyClient.rpc('payinvoice', [bolt11]) as {
        payment_hash: string;
        amount_msat: number;
        fee_msat?: number;
        status: string;
      };
      await addTransaction({
        type: 'lightning-send',
        amountSat: Math.round(result.amount_msat / 1000),
        feeSat: Math.round((result.fee_msat ?? 0) / 1000),
        paymentHash: result.payment_hash,
        status: result.status === 'complete' ? 'completed' : 'pending',
        createdAt: new Date().toISOString(),
      });
      return result;
    } catch (err) {
      toastError('Payment failed', err);
      throw err;
    }
  }, [addTransaction]);

  const openChannel = useCallback(async (peerPubkey: string, amountSat: number, pushMsat = 0) => {
    try {
      const result = await mutinyClient.rpc('openchannel', [peerPubkey, amountSat, pushMsat]) as {
        channel_id: string;
        txid?: string;
      };
      await addChannel({
        channelId: result.channel_id,
        peerPubkey,
        capacitySat: amountSat,
        localBalanceSat: amountSat - Math.round(pushMsat / 1000),
        remoteBalanceSat: Math.round(pushMsat / 1000),
        unsettledBalanceSat: 0,
        status: 'opening',
        confirmedAt: new Date().toISOString(),
      });
      return result;
    } catch (err) {
      toastError('Channel open failed', err);
      throw err;
    }
  }, [addChannel]);

  const getNewAddress = useCallback(async (label = '') => {
    return mutinyClient.getNewAddress(label);
  }, []);

  const sendOnChain = useCallback(async (address: string, amountSat: number) => {
    try {
      const txid = await mutinyClient.sendToAddress(address, amountSat);
      await addTransaction({
        type: 'onchain-send',
        amountSat,
        txid: txid as string,
        address,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      return txid;
    } catch (err) {
      toastError('Send failed', err);
      throw err;
    }
  }, [addTransaction]);

  const computed = useMemo(() => {
    const onChainBalance = utxos
      .filter(u => u.state === 'unspent')
      .reduce((s, u) => s + u.amount, 0);
    const channelBalance = channels
      .filter(c => c.status === 'open')
      .reduce((s, c) => s + c.localBalanceSat, 0);
    const pendingChannelBalance = channels
      .filter(c => c.status === 'opening')
      .reduce((s, c) => s + (c.capacitySat - c.remoteBalanceSat), 0);
    const totalBalance = onChainBalance + channelBalance + pendingChannelBalance;

    return {
      onChainBalance,
      channelBalance,
      pendingChannelBalance,
      totalBalance,
      channelCount: channels.filter(c => c.status === 'open').length,
      pendingChannelCount: channels.filter(c => c.status === 'opening').length,
      invoiceCount: invoices.filter(i => i.status === 'pending').length,
    };
  }, [utxos, channels, invoices]);

  return {
    mints,
    utxos,
    channels,
    invoices,
    transactions,
    preferences,
    loading,
    dwnError,
    apiConnected,
    ...computed,
    addMint,
    removeMint,
    updateMint,
    addUTXO,
    addChannel,
    addInvoice,
    updateInvoice,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updatePreferences,
    syncFromApi,
    createInvoice,
    payInvoice,
    openChannel,
    getNewAddress,
    sendOnChain,
    checkApiConnection,
    refreshFromApi: syncFromApi,
  };
}
