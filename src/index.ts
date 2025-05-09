// Export core functionality
export { createStateManager } from './core/state-manager';

// Export hooks
export { useAtom } from './hooks/use-atom';
export { useSelector } from './hooks/use-selector';
export { useTransaction } from './hooks/use-transaction';

// Export providers
export { 
  StateProvider, 
  useStateManager,
  createHooks
} from './providers/state-provider';

// Export adapters
export { 
  createStorageAdapter,
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorageAdapter,
  indexedDBAdapter
} from './adapters/storage-adapters';

export {
  createSyncAdapter,
  broadcastChannelAdapter,
  websocketAdapter,
  sharedWorkerAdapter
} from './adapters/sync-adapters';

// Export utilities
export {
  deepClone,
  createPatches,
  applyPatches,
  createJsonPatch,
  persistState,
  loadState,
  hasCircularReferences,
  createNamespacedState
} from './utils/state-utils';

// Export types
export type {
  StateSchema,
  StateManagerConfig,
  StateValues,
  Atom,
  StateChangeEvent,
  Selector,
  StateManager,
  Transaction,
  StorageAdapter,
  StorageAdapterType,
  SyncAdapter,
  SyncAdapterType,
  AtomResult,
  TransactionHookResult,
  TimelineEntry,
  DebugAPI
} from './types';