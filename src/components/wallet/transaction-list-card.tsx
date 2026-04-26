import type { Transaction } from '@/hooks/use-wallet';
import { formatAmount, formatDate } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, ZapIcon, BitcoinIcon, ExternalLinkIcon } from 'lucide-react';

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
    'onchain-send': 'Sent on-chain',
    'onchain-receive': 'Received on-chain',
    'lightning-send': 'Sent via LN',
    'lightning-receive': 'Received via LN',
    'channel-open': 'Opened channel',
    'channel-close': 'Closed channel',
    'swap-in': 'Swapped in',
    'swap-out': 'Swapped out',
  };
  const label = labels[type] || type;
  if (status === 'pending') return <>{label} <span className="text-[var(--color-warning)]">· pending</span></>;
  if (status === 'failed') return <>{label} <span className="text-destructive">· failed</span></>;
  return <>{label}</>;
}

export function TransactionListCard({ transactions, onViewAll }: {
  transactions: Transaction[];
  onViewAll: () => void;
}) {
  const recent = transactions.slice(0, 5);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
        {transactions.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-[10px] font-medium text-primary hover:underline"
          >
            View All
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
      ) : (
        <div className="space-y-1">
          {recent.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/30">
              <div className="flex-shrink-0">
                <TxIcon type={tx.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  <TxLabel type={tx.type} status={tx.status} />
                </p>
                <p className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-semibold amount-display ${tx.type.includes('send') || tx.type.includes('channel-open') ? 'text-destructive' : 'text-[var(--color-success)]'}`}>
                  {tx.type.includes('send') || tx.type.includes('channel-open') ? '-' : '+'}{formatAmount(tx.amountSat)}
                </p>
                {tx.feeSat !== undefined && tx.feeSat > 0 && (
                  <p className="text-[10px] text-muted-foreground">fee: {formatAmount(tx.feeSat)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
