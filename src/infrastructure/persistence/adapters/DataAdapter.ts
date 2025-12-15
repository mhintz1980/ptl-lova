/**
 * DataAdapter Interface - Abstract persistence layer.
 *
 * Allows swapping between localStorage, Supabase, etc.
 */
export interface DataAdapter {
    /**
     * Read an item by key.
     */
    get<T>(collection: string, id: string): Promise<T | null>;

    /**
     * Read all items in a collection.
     */
    getAll<T>(collection: string): Promise<T[]>;

    /**
     * Query items by a field value.
     */
    query<T>(collection: string, field: string, value: unknown): Promise<T[]>;

    /**
     * Save an item (upsert).
     */
    set<T>(collection: string, id: string, data: T): Promise<void>;

    /**
     * Save multiple items in batch.
     */
    setMany<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void>;

    /**
     * Delete an item by id.
     */
    delete(collection: string, id: string): Promise<void>;

    /**
     * Check if an item exists.
     */
    exists(collection: string, id: string): Promise<boolean>;

    /**
     * Count items in a collection.
     */
    count(collection: string): Promise<number>;
}
