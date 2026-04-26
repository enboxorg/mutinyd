import { PlusIcon, ZapIcon } from 'lucide-react';

export function OnboardingBanner({ onAddMint }: { onAddMint: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center">
      <ZapIcon className="h-8 w-8 text-primary mx-auto" />
      <div>
        <h3 className="text-sm font-semibold">Connect to Mutinynet</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Link your wallet to the Mutinynet signet to start managing Bitcoin and Lightning.
        </p>
      </div>
      <button
        onClick={onAddMint}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        <PlusIcon className="h-4 w-4" />
        Connect Node
      </button>
    </div>
  );
}
