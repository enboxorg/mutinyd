import { useState, useCallback } from 'react';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { EnboxProvider } from '@/enbox/EnboxProvider';
import { useEnbox } from '@/enbox/use-enbox';
import { useWallet } from '@/hooks/use-wallet';
import { usePinLock } from '@/hooks/use-pin-lock';
import { Welcome } from '@/components/wallet/welcome';
import { BalanceCard } from '@/components/wallet/balance-card';
import { PrimaryActions } from '@/components/wallet/primary-actions';
import { ChannelListCard } from '@/components/wallet/channel-list-card';
import { TransactionListCard } from '@/components/wallet/transaction-list-card';
import { SendDialog } from '@/components/wallet/send-dialog';
import { ReceiveDialog } from '@/components/wallet/receive-dialog';
import { AddMintDialog } from '@/components/mint/add-mint-dialog';
import { OpenChannelDialog } from '@/components/channels/open-channel-dialog';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { SettingsPage } from '@/components/wallet/settings-page';
import { RecoveryPhraseDialog } from '@/components/connect/recovery-phrase-dialog';
import { PinScreen } from '@/components/connect/pin-screen';
import { OnboardingBanner } from '@/components/wallet/onboarding-banner';
import { Toaster } from 'sonner';
import { brand } from '@/lib/brand';
import { truncateMiddle } from '@/lib/utils';
import type { MintData } from '@/protocol/mutiny-wallet-protocol';
import {
  LogOutIcon,
  LockIcon,
  MoonIcon,
  SunIcon,
  AlertTriangleIcon,
  SettingsIcon,
  RefreshCwIcon,
} from 'lucide-react';

function WalletHome({ isPinEnabled, onSetPin, onRemovePin, onLock }: {
  isPinEnabled: boolean;
  onSetPin: (pin: string) => Promise<void>;
  onRemovePin: () => void;
  onLock: () => void;
}) {
  const { did, disconnect, isDelegateSession } = useEnbox();
  const { theme, setTheme } = useTheme();
  const {
    mints,
    transactions,
    channels,
    totalBalance,
    onChainBalance,
    channelBalance,
    channelCount,
    loading,
    dwnError,
    apiConnected,
    preferences,
    addMint,
    updatePreferences,
    syncFromApi,
  } = useWallet();

  const [showAddMint, setShowAddMint] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showOpenChannel, setShowOpenChannel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasMints = mints.length > 0;

  const handleAddMint = useCallback(async (data: MintData) => {
    await addMint(data);
    setShowAddMint(false);
  }, [addMint]);

  const handleDisconnect = async () => {
    try {
      await disconnect({ clearStorage: true });
    } catch {
      // error already toast'd
    }
  };

  const handleSync = async () => {
    await syncFromApi();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-bold tracking-tighter">
            {brand.baseName}<span className="text-primary">{brand.accentLetter}</span>
          </div>
          <div className="flex items-center gap-2">
            {did && (
              <div className="text-xs text-muted-foreground font-mono hidden sm:block">
                {truncateMiddle(did, 12, 6)}
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleSync}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Sync from API"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            {isPinEnabled && (
              <button
                onClick={onLock}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                title="Lock wallet"
              >
                <LockIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Disconnect"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-12 text-sm">Loading wallet...</div>
        ) : (
          <>
            {dwnError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                {dwnError}
              </div>
            )}

            {!apiConnected && !dwnError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-sm">
                <AlertTriangleIcon className="h-4 w-4 text-[var(--color-warning)] shrink-0" />
                <span className="text-muted-foreground">API unreachable — check your connection</span>
              </div>
            )}

            <BalanceCard
              totalBalance={totalBalance}
              onChainBalance={onChainBalance}
              channelBalance={channelBalance}
              channelCount={channelCount}
            />

            {!hasMints ? (
              <OnboardingBanner onAddMint={() => setShowAddMint(true)} />
            ) : (
              <>
                <PrimaryActions
                  onSend={() => setShowSend(true)}
                  onReceive={() => setShowReceive(true)}
                />

                <ChannelListCard
                  channels={channels}
                  onOpenChannel={() => setShowOpenChannel(true)}
                />

                <TransactionListCard
                  transactions={transactions}
                  onViewAll={() => setShowHistory(true)}
                />
              </>
            )}
          </>
        )}
      </main>

      {showAddMint && (
        <AddMintDialog
          onAdd={handleAddMint}
          onClose={() => setShowAddMint(false)}
        />
      )}

      {showSend && <SendDialog onClose={() => setShowSend(false)} />}

      {showReceive && <ReceiveDialog onClose={() => setShowReceive(false)} />}

      {showOpenChannel && <OpenChannelDialog onClose={() => setShowOpenChannel(false)} />}

      {showHistory && (
        <TransactionHistory
          transactions={transactions}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showSettings && (
        <SettingsPage
          did={did}
          isDelegateSession={isDelegateSession}
          mints={mints}
          preferences={preferences}
          isPinEnabled={isPinEnabled}
          onSetPin={onSetPin}
          onRemovePin={onRemovePin}
          onUpdatePreferences={updatePreferences}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function AppContent() {
  const { isConnected, recoveryPhrase, clearRecoveryPhrase } = useEnbox();
  const { isPinEnabled, isLocked, setPin, removePin, unlock, lock } = usePinLock();

  if (!isConnected) {
    return <Welcome />;
  }

  if (isLocked) {
    return (
      <PinScreen
        mode="unlock"
        onSubmit={async (pin) => unlock(pin)}
      />
    );
  }

  return (
    <>
      <WalletHome
        isPinEnabled={isPinEnabled}
        onSetPin={setPin}
        onRemovePin={removePin}
        onLock={lock}
      />
      {recoveryPhrase && (
        <RecoveryPhraseDialog
          phrase={recoveryPhrase}
          onDone={clearRecoveryPhrase}
        />
      )}
    </>
  );
}

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey={`${brand.storagePrefix}-ui-theme`}>
      <ErrorBoundary>
        <EnboxProvider>
          <AppContent />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: 'bg-card border border-border text-foreground text-sm',
            }}
          />
        </EnboxProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
