import { create } from 'zustand';
import { usePumpsStore } from './modules/pumps';
import { useUIStore } from './modules/ui';
import { useCapacityStore } from './modules/capacity';
import { useSandboxStore } from './modules/sandbox';
import { useProgressStore } from './modules/progress';

// Barrel exports for individual stores
export { usePumpsStore };
export { useUIStore };
export { useCapacityStore };
export { useSandboxStore };
export { useProgressStore };

// Backward-compatible combined store
export const useApp = create((...args) => ({
  ...usePumpsStore(...args),
  ...useUIStore(...args),
  ...useCapacityStore(...args),
  ...useSandboxStore(...args),
  ...useProgressStore(...args),
}));
