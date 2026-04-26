import { useState, useCallback, useEffect } from 'react';

const PIN_HASH_KEY = 'enbox:pin-hash';

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function usePinLock() {
  const [isPinEnabled, setIsPinEnabled] = useState(() => !!localStorage.getItem(PIN_HASH_KEY));
  const [isLocked, setIsLocked] = useState(() => !!localStorage.getItem(PIN_HASH_KEY));

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_HASH_KEY, hash);
    setIsPinEnabled(true);
    setIsLocked(false);
  }, []);

  const removePin = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    setIsPinEnabled(false);
    setIsLocked(false);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) { return true; }
    const hash = await hashPin(pin);
    return hash === storedHash;
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const ok = await verifyPin(pin);
    if (ok) { setIsLocked(false); }
    return ok;
  }, [verifyPin]);

  const lock = useCallback(() => {
    if (isPinEnabled) { setIsLocked(true); }
  }, [isPinEnabled]);

  useEffect(() => {
    if (!isPinEnabled) { return; }

    let hiddenAt: number | null = null;
    const AUTO_LOCK_MS = 5 * 60 * 1000;

    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt && (Date.now() - hiddenAt) > AUTO_LOCK_MS) {
        setIsLocked(true);
        hiddenAt = null;
      } else {
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isPinEnabled]);

  return {
    isPinEnabled,
    isLocked,
    setPin,
    removePin,
    unlock,
    lock,
  };
}
