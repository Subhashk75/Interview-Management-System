import { logger } from './logger.js';

type ReleaseFn = () => void;

class AsyncLockManager {
  private activeLocks = new Map<string, Promise<void>>();

  /**
   * Acquires a lock on a single key. If already locked, waits in queue.
   */
  async acquire(key: string): Promise<ReleaseFn> {
    while (this.activeLocks.has(key)) {
      await this.activeLocks.get(key);
    }

    let release: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      release = () => {
        this.activeLocks.delete(key);
        resolve();
      };
    });

    this.activeLocks.set(key, lockPromise);
    return release;
  }

  /**
   * Acquires locks on multiple keys in a deterministic order (lexicographically)
   * to guarantee prevention of deadlocks.
   */
  async acquireMany(keys: string[]): Promise<ReleaseFn> {
    const uniqueSortedKeys = Array.from(new Set(keys)).sort();
    const releases: ReleaseFn[] = [];

    for (const key of uniqueSortedKeys) {
      const release = await this.acquire(key);
      releases.push(release);
    }

    return () => {
      // Release in reverse order of acquisition
      while (releases.length > 0) {
        const release = releases.pop();
        if (release) release();
      }
    };
  }

  /**
   * Runs an asynchronous callback with exclusive lock on the provided keys.
   */
  async withLock<T>(keys: string[], fn: () => Promise<T>): Promise<T> {
    const release = await this.acquireMany(keys);
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export const lockManager = new AsyncLockManager();
