import { useState } from 'react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';
import { useEnbox } from '@/enbox/use-enbox';
import { brand } from '@/lib/brand';
import { UserPlusIcon, WalletIcon, Loader2Icon } from 'lucide-react';
import { toastError } from '@/lib/utils';

export function ConnectModal({ onClose }: { onClose: () => void }) {
  const { connectLocal, connectWallet, isConnecting } = useEnbox();
  const [mode, setMode] = useState<'select' | 'connecting'>('select');

  const handleLocal = async () => {
    setMode('connecting');
    try {
      await connectLocal();
      onClose();
    } catch (err) {
      toastError('Connection failed', err);
      setMode('select');
    }
  };

  const handleWallet = async () => {
    setMode('connecting');
    try {
      await connectWallet();
      onClose();
    } catch (err) {
      toastError('Connection failed', err);
      setMode('select');
    }
  };

  if (mode === 'connecting' || isConnecting) {
    return (
      <DialogWrapper open={true} onClose={onClose} title="Connecting">
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Establishing secure connection...</p>
        </div>
      </DialogWrapper>
    );
  }

  return (
    <DialogWrapper open={true} onClose={onClose} title={`Connect ${brand.name}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Create or Connect Wallet</h3>
        <p className="text-xs text-muted-foreground">Choose how you want to set up {brand.name}</p>

        <div className="space-y-3">
          <button
            onClick={handleLocal}
            className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlusIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Quick Start</h4>
              <p className="text-[10px] text-muted-foreground">Create a new local identity with Enbox DWN</p>
            </div>
          </button>

          <button
            onClick={handleWallet}
            className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <WalletIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Connect Enbox Wallet</h4>
              <p className="text-[10px] text-muted-foreground">Use your existing Enbox Wallet for delegated access</p>
            </div>
          </button>
        </div>
      </div>
    </DialogWrapper>
  );
}
