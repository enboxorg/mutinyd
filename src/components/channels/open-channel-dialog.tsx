import { useState } from 'react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';
import { useWallet } from '@/hooks/use-wallet';
import { formatAmount, toastError, toastSuccess } from '@/lib/utils';
import { ZapIcon, Loader2Icon } from 'lucide-react';

export function OpenChannelDialog({ onClose }: { onClose: () => void }) {
  const { openChannel, onChainBalance } = useWallet();
  const [peerPubkey, setPeerPubkey] = useState('');
  const [amount, setAmount] = useState('');
  const [pushAmt, setPushAmt] = useState('0');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ channel_id?: string; txid?: string } | null>(null);

  const handleOpen = async () => {
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) { toastError('Invalid amount', new Error('Enter a positive amount in sats')); return; }
    if (amt > onChainBalance) { toastError('Insufficient balance', new Error('Not enough on-chain funds')); return; }
    if (!peerPubkey.trim()) { toastError('Missing peer', new Error('Enter a peer public key')); return; }

    setBusy(true);
    try {
      const res = await openChannel(peerPubkey.trim(), amt, parseInt(pushAmt, 10) * 1000 || 0);
      setResult(res as { channel_id: string; txid?: string });
      toastSuccess('Channel Opening', `Funding transaction sent`);
    } catch {
      // handled in hook
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <DialogWrapper open={true} onClose={onClose} title="Channel Opening">
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ZapIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Channel Opening</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Channel ID: {result.channel_id?.slice(0, 20)}...
            </p>
            {result.txid && (
              <p className="text-[10px] text-muted-foreground font-mono break-all mt-1">
                Funding TX: {result.txid.slice(0, 20)}...
              </p>
            )}
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
    <DialogWrapper open={true} onClose={onClose} title="Open Channel">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Open Lightning Channel</h3>
        <p className="text-xs text-muted-foreground">
          Open a new payment channel with a Lightning Network peer.
        </p>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Peer Public Key</label>
          <input
            type="text"
            value={peerPubkey}
            onChange={e => setPeerPubkey(e.target.value)}
            placeholder="02..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Channel Capacity (sats)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="100000"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm amount-display focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Available: {formatAmount(onChainBalance)}</p>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Push Amount (sats, optional)</label>
          <input
            type="number"
            value={pushAmt}
            onChange={e => setPushAmt(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm amount-display focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          onClick={handleOpen}
          disabled={busy || !peerPubkey.trim() || !amount}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Opening...' : 'Open Channel'}
        </button>
      </div>
    </DialogWrapper>
  );
}
