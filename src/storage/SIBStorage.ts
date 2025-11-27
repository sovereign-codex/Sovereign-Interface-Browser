export class SIBStorage {
  private memoryStore = new Map<string, string>();
  private readonly namespace: string;

  constructor(namespace = 'sib-core') {
    this.namespace = namespace;
  }

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const key = '__sib_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('LocalStorage unavailable, falling back to memory store', error);
      return false;
    }
  }

  private formatKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  setItem(key: string, value: unknown): void {
    const serialized = JSON.stringify(value);
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(this.formatKey(key), serialized);
    } else {
      this.memoryStore.set(this.formatKey(key), serialized);
    }
  }

  getItem<T>(key: string): T | null {
    const storageKey = this.formatKey(key);
    const raw = this.isLocalStorageAvailable()
      ? localStorage.getItem(storageKey)
      : this.memoryStore.get(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error('Unable to parse stored value', error);
      return null;
    }
  }

  removeItem(key: string): void {
    const storageKey = this.formatKey(key);
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(storageKey);
    } else {
      this.memoryStore.delete(storageKey);
    }
  }

  clear(): void {
    if (this.isLocalStorageAvailable()) {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(`${this.namespace}:`))
        .forEach((key) => localStorage.removeItem(key));
    }
    this.memoryStore.clear();
  }
}
