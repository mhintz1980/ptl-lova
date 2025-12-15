/**
 * InMemoryAdapter - In-memory implementation for testing.
 */
import { DataAdapter } from './DataAdapter';

export class InMemoryAdapter implements DataAdapter {
    private storage: Map<string, Map<string, unknown>> = new Map();

    private getCollection<T>(collection: string): Map<string, T> {
        if (!this.storage.has(collection)) {
            this.storage.set(collection, new Map());
        }
        return this.storage.get(collection) as Map<string, T>;
    }

    async get<T>(collection: string, id: string): Promise<T | null> {
        const coll = this.getCollection<T>(collection);
        return coll.get(id) ?? null;
    }

    async getAll<T>(collection: string): Promise<T[]> {
        const coll = this.getCollection<T>(collection);
        return Array.from(coll.values());
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
    }

    async setMany<T>(
        collection: string,
        items: Array<{ id: string; data: T }>
    ): Promise<void> {
        const coll = this.getCollection<T>(collection);
        for (const item of items) {
            coll.set(item.id, item.data);
        }
    }

    async delete(collection: string, id: string): Promise<void> {
        const coll = this.getCollection(collection);
        coll.delete(id);
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
     * Clear a specific collection.
     */
    clear(collection: string): void {
        this.storage.delete(collection);
    }

    /**
     * Clear all storage.
     */
    clearAll(): void {
        this.storage.clear();
    }
}
