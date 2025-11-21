import { DataAdapter, Pump } from "../types";

export const SandboxAdapter: DataAdapter = {
    load: async () => {
        // Sandbox should not load data, but if called, return empty or throw
        return [];
    },
    replaceAll: async (_rows: Pump[]) => {
        // No-op
    },
    upsertMany: async (_rows: Pump[]) => {
        // No-op
    },
    update: async (_id: string, _patch: Partial<Pump>) => {
        // No-op
    },
};
