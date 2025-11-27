export interface LongTermMemoryStore {
  store: (category: string, key: string, value: unknown) => Promise<void> | void;
  retrieve: (category: string, key: string) => Promise<unknown> | unknown;
  list: (category: string) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

const memory = new Map<string, Map<string, unknown>>();

const ensureCategory = (category: string): Map<string, unknown> => {
  if (!memory.has(category)) {
    memory.set(category, new Map());
  }
  return memory.get(category)!;
};

export const ltm: LongTermMemoryStore = {
  store: (category, key, value) => {
    const bucket = ensureCategory(category);
    bucket.set(key, value);
  },
  retrieve: (category, key) => {
    const bucket = ensureCategory(category);
    return bucket.get(key);
  },
  list: (category) => {
    const bucket = ensureCategory(category);
    return Object.fromEntries(bucket.entries());
  },
};
