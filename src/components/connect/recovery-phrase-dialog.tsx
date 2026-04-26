import { useState } from 'react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';
import { KeyIcon, CopyIcon, CheckIcon } from 'lucide-react';

export function RecoveryPhraseDialog({ phrase, onDone }: {
  phrase: string;
  onDone: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <DialogWrapper open={true} onClose={() => {}} title="Backup Recovery Phrase">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <KeyIcon className="h-6 w-6 text-[var(--color-warning)]" />
          <div>
            <h3 className="text-sm font-semibold">Save Your Recovery Phrase</h3>
            <p className="text-xs text-muted-foreground">This is the only way to recover your wallet</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="font-mono text-sm leading-relaxed break-words select-all">{phrase}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border py-2 text-xs font-medium hover:bg-muted"
          >
            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="mt-0.5 rounded"
          />
          I have saved my recovery phrase and understand that if I lose it, I will not be able to recover my wallet.
        </label>

        <button
          onClick={onDone}
          disabled={!acknowledged}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          I've Saved It
        </button>
      </div>
    </DialogWrapper>
  );
}
