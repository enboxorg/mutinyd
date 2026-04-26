import type { Transaction } from '@/hooks/use-wallet';
import { formatAmount, formatDate } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, ZapIcon, BitcoinIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';

function TxIcon({ type }: { type: Transaction['type'] }) {
  if (type === 'lightning-send' || type === 'onchain-send')
    return <ArrowUpIcon className="h-4 w-4 text-destructive" />;
  if (type === 'lightning-receive' || type === 'onchain-receive')
    return <ArrowDownIcon className="h-4 w-4 text-[var(--color-success)]" />;
  if (type.startsWith('lightning'))
    return <ZapIcon className="h-4 w-4 text-primary" />;
  if (type.startsWith('onchain'))
    return <BitcoinIcon className="h-4 w-4 text-primary" />;
  return <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />;
}

function TxLabel({ type, status }: { type: Transaction['type']; status: Transaction['status'] }) {
  const labels: Record<string, string> = {
    'onchain-send': 'On-chain Send',
    'onchain-receive': 'On-chain Receive',
    'lightning-send': 'Lightning Payment',
    'lightning-receive': 'Lightning Invoice',
    'channel-open': 'Channel Open',
    'channel-close': 'Channel Close',
    'swap-in': 'Swap In',
    'swap-out': 'Swap Out',
  };
  return (
    <>
      {labels[type] || type}
      {status === 'pending' && <span className="text-[var(--color-warning)]"> · Pending</span>}
      {status === 'failed' && <span className="text-destructive"> · Failed</span>}
    </>
  );
}

export function TransactionHistory({ transactions, onClose }: {
  transactions: Transaction[];
  onClose: () => void;
}) {
  const sorted = [...transactions].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <DialogWrapper open={true} onClose={onClose} title="Transaction History">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Activity</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {sorted.map(tx => (
              <div key={tx.id} className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/30">
                <div className="flex-shrink-0 mt-0.5">
                  <TxIcon type={tx.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">
                    <TxLabel type={tx.type} status={tx.status} />
                  </p>
                  {tx.memo && <p className="text-[10px] text-muted-foreground truncate">{tx.memo}</p>}
                  {tx.txid && (
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      TX: {tx.txid.slice(0, 16)}...
                    </p>
                  )}
                  {tx.address && (
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {tx.address.slice(0, 16)}...
                    </p>
                  )}
                  {tx.paymentHash && (
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      Hash: {tx.paymentHash.slice(0, 16)}...
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-semibold amount-display ${tx.type.includes('send') || tx.type.includes('channel-open') ? 'text-destructive' : 'text-[var(--color-success)]'}`}>
                    {tx.type.includes('send') || tx.type.includes('channel-open') ? '-' : '+'}{formatAmount(tx.amountSat)}
                  </p>
                  {tx.feeSat !== undefined && tx.feeSat > 0 && (
                    <p className="text-[10px] text-muted-foreground">Fee: {formatAmount(tx.feeSat)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogWrapper>
  );
}
