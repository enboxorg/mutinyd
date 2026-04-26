import type { Channel } from '@/hooks/use-wallet';
import { formatAmount, truncateMiddle } from '@/lib/utils';
import { ZapIcon, PlusIcon } from 'lucide-react';

export function ChannelListCard({ channels, onOpenChannel }: {
  channels: Channel[];
  onOpenChannel: () => void;
}) {
  const openChannels = channels.filter(c => c.status === 'open' || c.status === 'opening');

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ZapIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Lightning Channels</h3>
        </div>
        <button
          onClick={onOpenChannel}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary hover:bg-primary/20"
        >
          <PlusIcon className="h-3 w-3" />
          Open
        </button>
      </div>

      {openChannels.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No Lightning channels yet. Open one to start making Lightning payments.</p>
      ) : (
        <div className="space-y-2">
          {openChannels.slice(0, 5).map(ch => (
            <div key={ch.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{ch.peerAlias || truncateMiddle(ch.peerPubkey, 8, 8)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatAmount(ch.localBalanceSat)} / {formatAmount(ch.capacitySat)}
                  {ch.status === 'opening' && (
                    <span className="ml-1 text-[var(--color-warning)]">(opening)</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold amount-display">{formatAmount(ch.localBalanceSat)}</p>
                <p className="text-[10px] text-muted-foreground">outbound</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
