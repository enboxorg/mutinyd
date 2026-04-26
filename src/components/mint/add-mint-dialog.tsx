import { useState } from 'react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';
import type { MintData } from '@/protocol/mutiny-wallet-protocol';
import { Loader2Icon } from 'lucide-react';
import { toastError } from '@/lib/utils';

const PRESET_NODES = [
  { name: 'Mutinynet (nvk.gay)', url: 'http://nvk.gay:3000', unit: 'sat' },
];

export function AddMintDialog({ onAdd, onClose }: {
  onAdd: (data: MintData) => Promise<void>;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) { toastError('Invalid URL', new Error('Enter a node URL')); return; }
    setBusy(true);
    try {
      await onAdd({
        url: url.trim().replace(/\/+$/, ''),
        name: name.trim() || undefined,
        unit: 'sat',
        active: true,
      });
      onClose();
    } catch {
      // handled by hook
    } finally {
      setBusy(false);
    }
  };

  const handlePreset = (preset: typeof PRESET_NODES[number]) => {
    setUrl(preset.url);
    setName(preset.name);
  };

  return (
    <DialogWrapper open={true} onClose={onClose} title="Connect Node">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Connect to Mutinynet</h3>
        <p className="text-xs text-muted-foreground">Add a Mutinynet API endpoint to interact with Bitcoin and Lightning.</p>

        <div className="space-y-2">
          {PRESET_NODES.map(preset => (
            <button
              key={preset.url}
              onClick={() => handlePreset(preset)}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">M</div>
              <div>
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{preset.url}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Or enter manually</p>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Node URL</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="http://nvk.gay:3000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Node"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={busy || !url.trim()}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </DialogWrapper>
  );
}
