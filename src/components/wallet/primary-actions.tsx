import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

export function PrimaryActions({ onSend, onReceive }: {
  onSend: () => void;
  onReceive: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={onSend}
        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <ArrowUpIcon className="h-4 w-4 text-primary" />
        Send
      </button>
      <button
        onClick={onReceive}
        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <ArrowDownIcon className="h-4 w-4 text-primary" />
        Receive
      </button>
    </div>
  );
}
