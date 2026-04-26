const MUTEX_TIMEOUT = 30000;

let currentLock: string | null = null;
let pendingQueue: Array<{ id: string; resolve: (r: () => void) => void }> = [];

export function acquireWalletLock(opName: string): Promise<() => void> {
  if (!currentLock) {
    currentLock = opName;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      currentLock = null;
      const next = pendingQueue.shift();
      if (next) {
        currentLock = next.id;
        const r: () => void = () => { currentLock = null; };
        next.resolve(r);
      }
    };
    const timeout = setTimeout(() => {
      console.warn(`[mutinyd] Wallet mutex timeout for '${opName}'`);
      release();
    }, MUTEX_TIMEOUT);
    const wrapped = () => { clearTimeout(timeout); release(); };
    return Promise.resolve(wrapped);
  }

  return new Promise((resolve) => {
    pendingQueue.push({ id: opName, resolve });
  });
}
