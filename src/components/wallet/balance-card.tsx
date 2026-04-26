import { formatAmount } from '@/lib/utils';
import { ZapIcon, BitcoinIcon } from 'lucide-react';

export function BalanceCard({
  totalBalance,
  onChainBalance,
  channelBalance,
  channelCount,
}: {
  totalBalance: number;
  onChainBalance: number;
  channelBalance: number;
  channelCount: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Balance</p>
        <p className="text-3xl font-bold amount-display mt-1">{formatAmount(totalBalance, 'sat')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <BitcoinIcon className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase">On-chain</span>
          </div>
          <p className="text-sm font-semibold amount-display">{formatAmount(onChainBalance, 'sat')}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <ZapIcon className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Lightning</span>
          </div>
          <p className="text-sm font-semibold amount-display">{formatAmount(channelBalance, 'sat')}</p>
          <p className="text-[10px] text-muted-foreground">{channelCount} channel{channelCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}
