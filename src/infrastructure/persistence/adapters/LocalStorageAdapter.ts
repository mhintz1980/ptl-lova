/**
 * LocalStorageAdapter - Persistence adapter using browser localStorage.
 *
 * Stores collections as JSON objects keyed by collection name.
 */
import { DataAdapter } from './DataAdapter';

export class LocalStorageAdapter implements DataAdapter {
    private readonly prefix: string;

    constructor(prefix: string = 'ptl') {
        this.prefix = prefix;
    }

    private getStorageKey(collection: string): string {
        return `${this.prefix}:${collection}`;
    }

    private getCollection<T>(collection: string): Map<string, T> {
        const key = this.getStorageKey(collection);
        const raw = localStorage.getItem(key);
        if (!raw) {
            return new Map();
        }
        try {
            const parsed = JSON.parse(raw);
            return new Map(Object.entries(parsed));
        } catch {
            return new Map();
        }
    }

    private saveCollection<T>(collection: string, data: Map<string, T>): void {
        const key = this.getStorageKey(collection);
        const obj = Object.fromEntries(data.entries());
        localStorage.setItem(key, JSON.stringify(obj));
    }

    async get<T>(collection: string, id: string): Promise<T | null> {
        const data = this.getCollection<T>(collection);
        return data.get(id) ?? null;
    }

    async getAll<T>(collection: string): Promise<T[]> {
        const data = this.getCollection<T>(collection);
        return Array.from(data.values());
    }

    async query<T>(collection: string, field: string, value: unknown): Promise<T[]> {
        const all = await this.getAll<T>(collection);
        return all.filter((item) => {
            const record = item as Record<string, unknown>;
            return record[field] === value;
        });
    }

    async set<T>(collection: string, id: string, data: T): Promise<void> {
        const coll = this.getCollection<T>(collection);
        coll.set(id, data);
        this.saveCollection(collection, coll);
    }

    async setMany<T>(
        collection: string,
        items: Array<{ id: string; data: T }>
    ): Promise<void> {
        const coll = this.getCollection<T>(collection);
        for (const item of items) {
            coll.set(item.id, item.data);
        }
        this.saveCollection(collection, coll);
    }

    async delete(collection: string, id: string): Promise<void> {
        const coll = this.getCollection(collection);
        coll.delete(id);
        this.saveCollection(collection, coll);
    }

    async exists(collection: string, id: string): Promise<boolean> {
        const coll = this.getCollection(collection);
        return coll.has(id);
    }

    async count(collection: string): Promise<number> {
        const coll = this.getCollection(collection);
        return coll.size;
    }

    /**
     * Clear all data for a collection (useful for testing).
     */
    clear(collection: string): void {
        localStorage.removeItem(this.getStorageKey(collection));
    }

    /**
     * Clear ALL data with this prefix.
     */
    clearAll(): void {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`${this.prefix}:`)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
}
