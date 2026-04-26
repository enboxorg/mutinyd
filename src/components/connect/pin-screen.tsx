import { useState } from 'react';
import { brand } from '@/lib/brand';
import { ShieldIcon } from 'lucide-react';

export function PinScreen({ mode, onSubmit }: {
  mode: 'unlock' | 'set';
  onSubmit: (pin: string) => Promise<boolean>;
}) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleSubmit = async () => {
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
    if (mode === 'set' && step === 'enter') {
      setStep('confirm');
      setConfirmPin('');
      setError('');
      return;
    }
    if (mode === 'set' && pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setBusy(true);
    try {
      const ok = await onSubmit(pin);
      if (!ok) setError('Invalid PIN');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xs space-y-6 text-center">
        <div className="text-lg font-bold tracking-tighter">
          {brand.baseName}<span className="text-primary">{brand.accentLetter}</span>
        </div>
        <ShieldIcon className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-semibold">
          {mode === 'unlock' ? 'Unlock Wallet' : step === 'enter' ? 'Set PIN' : 'Confirm PIN'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'unlock'
            ? 'Enter your PIN to access your wallet'
            : step === 'enter'
            ? 'Choose a 4+ digit PIN to protect your wallet'
            : 'Re-enter your PIN to confirm'}
        </p>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={step === 'confirm' ? confirmPin : pin}
          onChange={e => step === 'confirm' ? setConfirmPin(e.target.value) : setPin(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-2xl tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="****"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? 'Please wait...' : step === 'confirm' ? 'Confirm' : mode === 'unlock' ? 'Unlock' : 'Continue'}
        </button>
        {mode === 'set' && step === 'confirm' && (
          <button onClick={() => { setStep('enter'); setPin(''); setError(''); }} className="text-xs text-muted-foreground hover:text-foreground">
            Go back
          </button>
        )}
      </div>
    </div>
  );
}
