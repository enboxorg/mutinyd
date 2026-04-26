import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuthManager, BrowserConnectHandler, Enbox } from '@enbox/browser';
import type { AuthSession } from '@enbox/browser';
import { MutinyWalletDefinition } from '@/protocol/mutiny-wallet-protocol';
import { MutinyTransferDefinition } from '@/protocol/mutiny-transfer-protocol';
import { brand } from '@/lib/brand';

const DAPP_PROTOCOLS = [MutinyWalletDefinition, MutinyTransferDefinition];

const DWN_ENDPOINTS = [
  'https://dev.aws.dwn.enbox.id',
  'https://enbox-dwn.fly.dev',
];

function getOrCreateVaultPassword(): string {
  const STORAGE_KEY = 'enbox:vault-password';
  let password = localStorage.getItem(STORAGE_KEY);
  if (!password) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    password = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(STORAGE_KEY, password);
  }
  return password;
}

interface EnboxContextProps {
  enbox?: Enbox;
  did?: string;
  isConnecting: boolean;
  isConnected: boolean;
  isDelegateSession: boolean;
  auth: AuthManager | null;
  connectLocal: () => Promise<void>;
  connectWallet: () => Promise<void>;
  applySession: (session: AuthSession) => void;
  disconnect: (options?: { clearStorage?: boolean }) => Promise<void>;
  recoveryPhrase?: string;
  clearRecoveryPhrase: () => void;
}

export const EnboxContext = createContext<EnboxContextProps>({
  isConnecting        : false,
  isConnected         : false,
  isDelegateSession   : false,
  auth                : null,
  connectLocal        : () => Promise.reject(new Error('EnboxProvider not mounted')),
  connectWallet       : () => Promise.reject(new Error('EnboxProvider not mounted')),
  applySession        : () => {},
  disconnect          : () => Promise.reject(new Error('EnboxProvider not mounted')),
  clearRecoveryPhrase : () => {},
});

export const EnboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authRef = useRef<AuthManager | null>(null);
  const [enbox, setEnbox] = useState<Enbox | undefined>();
  const [did, setDid] = useState<string | undefined>();
  const [isDelegateSession, setIsDelegateSession] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | undefined>();

  const walletOptions = useMemo(
    () => [
      { name: 'Enbox Wallet', url: 'https://enbox-wallet.pages.dev', description: 'Your digital identity wallet' },
      { name: 'Blue Enbox Wallet', url: 'https://blue-enbox-wallet.pages.dev', description: 'Your digital identity wallet' },
    ],
    [],
  );

  const applySession = useCallback((session: AuthSession) => {
    const api = Enbox.connect({ session });
    setEnbox(api);
    setDid(session.did);
    setIsDelegateSession(!!session.delegateDid);
    if (session.recoveryPhrase) {
      setRecoveryPhrase(session.recoveryPhrase);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsConnecting(true);
      try {
        authRef.current = await AuthManager.create({
          password       : getOrCreateVaultPassword(),
          dwnEndpoints   : DWN_ENDPOINTS,
          registration   : {
            onSuccess      : () => console.log('[mutinyd] DWN registration complete'),
            onFailure      : (err) => console.warn('[mutinyd] DWN registration failed:', err),
            persistTokens  : true,
            onProviderAuthRequired: async (params) => {
              const res = await fetch(params.authorizeUrl);
              const data = await res.json();
              return { code: data.code, state: data.state };
            },
          },
          connectHandler : BrowserConnectHandler({
            wallets : walletOptions,
            appName : brand.name,
            appIcon : `${window.location.origin}/favicon.ico`,
          }),
        });
        if (cancelled) { return; }

        const session = await authRef.current.restoreSession();
        if (cancelled) { return; }

        if (session) {
          applySession(session);
        }
      } catch (err) {
        console.error('[mutinyd] Auth init failed:', err);
      } finally {
        if (!cancelled) { setIsConnecting(false); }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [applySession, walletOptions]);

  const connectLocal = useCallback(async () => {
    const auth = authRef.current;
    if (!auth) { throw new Error('AuthManager not ready'); }

    setIsConnecting(true);
    try {
      const session = await auth.connectLocal({
        createIdentity: true,
      });
      applySession(session);
    } finally {
      setIsConnecting(false);
    }
  }, [applySession]);

  const connectWallet = useCallback(async () => {
    const auth = authRef.current;
    if (!auth) { throw new Error('AuthManager not ready'); }

    setIsConnecting(true);
    try {
      const session = await auth.connect({
        protocols: DAPP_PROTOCOLS,
      });
      applySession(session);
    } finally {
      setIsConnecting(false);
    }
  }, [applySession]);

  const disconnect = useCallback(async (options?: { clearStorage?: boolean }) => {
    const auth = authRef.current;
    if (!auth) { return; }

    await auth.disconnect({ clearStorage: options?.clearStorage });
    setEnbox(undefined);
    setDid(undefined);
    setRecoveryPhrase(undefined);

    if (options?.clearStorage) {
      window.location.reload();
    }
  }, []);

  const clearRecoveryPhrase = useCallback(() => {
    setRecoveryPhrase(undefined);
  }, []);

  const isConnected = enbox !== undefined;

  return (
    <EnboxContext.Provider
      value={{
        enbox,
        did,
        isConnecting,
        isConnected,
        isDelegateSession,
        auth                : authRef.current,
        connectLocal,
        connectWallet,
        applySession,
        disconnect,
        recoveryPhrase,
        clearRecoveryPhrase,
      }}
    >
      {children}
    </EnboxContext.Provider>
  );
};
