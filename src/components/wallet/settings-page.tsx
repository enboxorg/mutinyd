import { useState } from 'react';
import { DialogWrapper } from '@/components/ui/dialog-wrapper';
import type { Preferences } from '@/hooks/use-wallet';
import type { Mint } from '@/hooks/use-wallet';
import { truncateMiddle, toastError } from '@/lib/utils';
import { useEnbox } from '@/enbox/use-enbox';
import { XIcon, ShieldIcon, LogOutIcon } from 'lucide-react';

export function SettingsPage({
  did,
  isDelegateSession,
  mints,
  preferences,
  isPinEnabled,
  onSetPin,
  onRemovePin,
  onUpdatePreferences,
  onClose,
}: {
  did?: string;
  isDelegateSession: boolean;
  mints: Mint[];
  preferences: Preferences;
  isPinEnabled: boolean;
  onSetPin: (pin: string) => Promise<void>;
  onRemovePin: () => void;
  onUpdatePreferences: (prefs: Preferences) => Promise<void>;
  onClose: () => void;
}) {
  const { disconnect } = useEnbox();
  const [pinMode, setPinMode] = useState<'none' | 'set'>('none');
  const [pin, setPin] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState(preferences.apiEndpoint || 'http://nvk.gay:3000');

  const handleSetPin = async () => {
    if (pin.length < 4) { toastError('Invalid PIN', new Error('PIN must be at least 4 digits')); return; }
    await onSetPin(pin);
    setPinMode('none');
    setPin('');
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({ clearStorage: true });
    } catch (err) {
      toastError('Failed to disconnect', err);
    }
  };

  const handleSaveEndpoint = async () => {
    await onUpdatePreferences({ ...preferences, apiEndpoint });
  };

  return (
    <DialogWrapper open={true} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Settings</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Identity */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Identity</h4>
          {did && (
            <p className="text-xs font-mono break-all">{truncateMiddle(did, 20, 10)}</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            {isDelegateSession ? 'Delegate session (Enbox Wallet)' : 'Local identity'}
          </p>
        </div>

        {/* Connected Nodes */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Connected Nodes</h4>
          {mints.length === 0 ? (
            <p className="text-xs text-muted-foreground">No nodes connected</p>
          ) : (
            <div className="space-y-1">
              {mints.map(mint => (
                <div key={mint.id} className="flex items-center justify-between text-xs">
                  <span>{mint.name || mint.url}</span>
                  <span className={`w-2 h-2 rounded-full ${mint.active ? 'bg-[var(--color-success)]' : 'bg-muted-foreground'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Endpoint */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">API Endpoint</h4>
          <input
            type="text"
            value={apiEndpoint}
            onChange={e => setApiEndpoint(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSaveEndpoint}
            className="w-full rounded-full bg-muted py-2 text-xs font-medium hover:bg-muted/80"
          >
            Save
          </button>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Security</h4>

          {pinMode === 'set' ? (
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="New PIN"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSetPin()}
              />
              <div className="flex gap-2">
                <button onClick={() => { setPinMode('none'); setPin(''); }} className="flex-1 rounded-full bg-muted py-2 text-xs font-medium">
                  Cancel
                </button>
                <button onClick={handleSetPin} className="flex-1 rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground">
                  Save PIN
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {isPinEnabled ? (
                <button
                  onClick={onRemovePin}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-xs font-medium hover:bg-muted"
                >
                  <ShieldIcon className="h-3.5 w-3.5" />
                  Disable PIN Lock
                </button>
              ) : (
                <button
                  onClick={() => setPinMode('set')}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-xs font-medium hover:bg-muted"
                >
                  <ShieldIcon className="h-3.5 w-3.5" />
                  Enable PIN Lock
                </button>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-destructive">Danger Zone</h4>
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 rounded-full border border-destructive/30 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            Disconnect & Clear Data
          </button>
        </div>
      </div>
    </DialogWrapper>
  );
}
