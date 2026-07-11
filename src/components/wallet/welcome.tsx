import { ZapIcon, ShieldIcon, LayersIcon, GlobeIcon, Loader2Icon } from 'lucide-react';
import { useEnbox } from '@/enbox/use-enbox';
import { brand } from '@/lib/brand';
import { toastError } from '@/lib/utils';

export function Welcome() {
  const { connectWallet, isConnecting } = useEnbox();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (!message.includes('denied') && !message.includes('cancelled') && !message.includes('canceled')) {
        toastError('Failed to connect wallet', error);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-in">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
            <ZapIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">
            {brand.baseName}<span className="text-primary">{brand.accentLetter}</span>
          </h1>
          <p className="text-sm text-muted-foreground">{brand.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <ZapIcon className="h-5 w-5 text-primary" />
            <h4 className="text-xs font-semibold">Lightning Fast</h4>
            <p className="text-[10px] text-muted-foreground">Instant Bitcoin payments via the Lightning Network</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <ShieldIcon className="h-5 w-5 text-primary" />
            <h4 className="text-xs font-semibold">Self-Custodial</h4>
            <p className="text-[10px] text-muted-foreground">You control your keys, stored encrypted in your DWN</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <LayersIcon className="h-5 w-5 text-primary" />
            <h4 className="text-xs font-semibold">On-chain + LN</h4>
            <p className="text-[10px] text-muted-foreground">Manage UTXOs and Lightning channels in one place</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <GlobeIcon className="h-5 w-5 text-primary" />
            <h4 className="text-xs font-semibold">Mutinynet</h4>
            <p className="text-[10px] text-muted-foreground">Built on Mutinynet signet for testing and development</p>
          </div>
        </div>

        <button
          onClick={() => void handleConnect()}
          disabled={isConnecting}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isConnecting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2Icon className="h-4 w-4 animate-spin" /> Connecting...
            </span>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </div>
  );
}
