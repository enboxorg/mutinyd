import { useState, useEffect } from 'react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';
import { QRCodeDisplay } from '@/components/qr-code';
import { useWallet } from '@/hooks/use-wallet';
import { formatAmount, toastError, toastSuccess } from '@/lib/utils';
import { ZapIcon, BitcoinIcon, CopyIcon, CheckIcon, Loader2Icon } from 'lucide-react';

export function ReceiveDialog({ onClose }: { onClose: () => void }) {
  const { getNewAddress, createInvoice } = useWallet();
  const [tab, setTab] = useState<'onchain' | 'lightning'>('lightning');
  const [address, setAddress] = useState('');
  const [invoice, setInvoice] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tab === 'onchain' && !address) {
      getNewAddress('mutinyd').then(addr => setAddress(addr as string)).catch(() => {});
    }
  }, [tab, address, getNewAddress]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError('Copy failed', new Error('Clipboard access denied'));
    }
  };

  const handleCreateInvoice = async () => {
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) { toastError('Invalid amount', new Error('Enter a positive amount in sats')); return; }

    setBusy(true);
    try {
      const inv = await createInvoice(amt, description || undefined);
      setInvoice(inv.bolt11);
      toastSuccess('Invoice created', `${formatAmount(amt)} Lightning invoice`);
    } catch {
      // error handled in hook
    } finally {
      setBusy(false);
    }
  };

  const handleNewAddress = async () => {
    try {
      const addr = await getNewAddress('mutinyd');
      setAddress(addr as string);
    } catch {
      toastError('Failed to generate address', new Error('Could not get new address'));
    }
  };

  return (
    <DialogWrapper open={true} onClose={onClose} title="Receive">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Receive</h3>

        <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
          <button
            onClick={() => setTab('lightning')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors ${tab === 'lightning' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            <ZapIcon className="h-3.5 w-3.5" /> Lightning
          </button>
          <button
            onClick={() => setTab('onchain')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors ${tab === 'onchain' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            <BitcoinIcon className="h-3.5 w-3.5" /> On-chain
          </button>
        </div>

        {tab === 'lightning' ? (
          <div className="space-y-3">
            {invoice ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-white">
                    <QRCodeDisplay value={invoice} size={200} />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-mono break-all select-all">{invoice}</p>
                </div>
                <button
                  onClick={() => handleCopy(invoice)}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-xs font-medium hover:bg-muted"
                >
                  {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Invoice'}
                </button>
                <button
                  onClick={() => { setInvoice(''); setAmount(''); setDescription(''); }}
                  className="w-full rounded-full bg-muted py-2.5 text-xs font-medium hover:bg-muted/80"
                >
                  Create Another
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">Amount (sats)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm amount-display focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">Description (optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Payment for..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={handleCreateInvoice}
                  disabled={busy || !amount}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
                  {busy ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {address ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-white">
                    <QRCodeDisplay value={address} size={200} />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-mono break-all select-all">{address}</p>
                </div>
                <button
                  onClick={() => handleCopy(address)}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-xs font-medium hover:bg-muted"
                >
                  {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Address'}
                </button>
                <button
                  onClick={handleNewAddress}
                  className="w-full rounded-full bg-muted py-2.5 text-xs font-medium hover:bg-muted/80"
                >
                  Generate New Address
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Generating address...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </DialogWrapper>
  );
}
