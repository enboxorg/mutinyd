import { useState } from 'react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';
import { useWallet } from '@/hooks/use-wallet';
import { formatAmount, toastError, toastSuccess } from '@/lib/utils';
import { ArrowUpIcon, ZapIcon, BitcoinIcon, Loader2Icon } from 'lucide-react';

export function SendDialog({ onClose }: { onClose: () => void }) {
  const { sendOnChain, payInvoice, onChainBalance, channelBalance } = useWallet();
  const [tab, setTab] = useState<'onchain' | 'lightning'>('lightning');
  const [address, setAddress] = useState('');
  const [invoice, setInvoice] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSendOnchain = async () => {
    if (!address.trim()) return;
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) { toastError('Invalid amount', new Error('Enter a positive amount in sats')); return; }
    if (amt > onChainBalance) { toastError('Insufficient balance', new Error('Not enough on-chain funds')); return; }

    setBusy(true);
    try {
      const txid = await sendOnChain(address.trim(), amt);
      setResult(txid as string);
      toastSuccess('Sent!', `Transaction: ${(txid as string).slice(0, 20)}...`);
    } catch {
      // error handled in hook
    } finally {
      setBusy(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice.trim()) return;

    setBusy(true);
    try {
      const res = await payInvoice(invoice.trim());
      setResult(res.payment_hash);
      toastSuccess('Paid!', `Payment hash: ${res.payment_hash.slice(0, 20)}...`);
    } catch {
      // error handled in hook
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <DialogWrapper open={true} onClose={onClose} title="Sent">
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ArrowUpIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Transaction Sent</p>
            <p className="text-[10px] text-muted-foreground font-mono break-all mt-1">{result.slice(0, 40)}...</p>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Done
          </button>
        </div>
      </DialogWrapper>
    );
  }

  return (
    <DialogWrapper open={true} onClose={onClose} title="Send">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Send</h3>

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

        {tab === 'onchain' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Recipient Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="bc1q..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Amount (sats)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm amount-display focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Available: {formatAmount(onChainBalance)}</p>
            </div>
            <button
              onClick={handleSendOnchain}
              disabled={busy || !address.trim() || !amount}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Sending...' : 'Send On-chain'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase">BOLT 11 Invoice</label>
              <textarea
                value={invoice}
                onChange={e => setInvoice(e.target.value)}
                placeholder="lnbc..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Available (LN): {formatAmount(channelBalance)}</p>
            <button
              onClick={handlePayInvoice}
              disabled={busy || !invoice.trim()}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Paying...' : 'Pay Invoice'}
            </button>
          </div>
        )}
      </div>
    </DialogWrapper>
  );
}
