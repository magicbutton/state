import { z } from 'zod';

/**
 * Schema definition for state
 */
export type StateSchema = Record<string, z.ZodTypeAny>;

/**
 * Configuration for the state manager
 */
export interface StateManagerConfig<Schema extends StateSchema> {
  /** Schema definition for state validation */
  schema: Schema;
  
  /** Initial state values (optional) */
  initialState?: Partial<StateValues<Schema>>;
  
  /** Storage adapter for persistence */
  storageAdapter?: StorageAdapterType | StorageAdapter;
  
  /** Sync adapter for cross-client synchronization */
  syncAdapter?: SyncAdapterType | SyncAdapter;
  
  /** Options for optimistic updates */
  optimistic?: {
    /** Whether to enable optimistic updates by default */
    enabled: boolean;
    /** Maximum time to wait for a server response before rolling back */
    timeout: number;
  };
  
  /** Debug options */
  debug?: {
    /** Whether to enable debug mode */
    enabled: boolean;
    /** Whether to log state changes */
    logChanges: boolean;
    /** Whether to enable time-travel debugging */
    timeTravel: boolean;
  };
}

/**
 * Infer state values type from schema
 */
export type StateValues<Schema extends StateSchema> = {
  [K in keyof Schema]: z.infer<Schema[K]>;
};

/**
 * Atom definition
 */
export interface Atom<T> {
  /** Unique identifier for this atom */
  id: string;
  
  /** Default value for this atom */
  default: T;
  
  /** Validator function for this atom */
  validate: (value: unknown) => T;
  
  /** Schema for this atom */
  schema: z.ZodType<T>;
}

/**
 * State change event
 */
export interface StateChangeEvent<T = any> {
  /** Atom ID that changed */
  atomId: string;
  
  /** Previous value */
  prevValue: T;
  
  /** New value */
  newValue: T;
  
  /** Timestamp of the change */
  timestamp: number;
  
  /** Unique ID for this change */
  changeId: string;
  
  /** Source of the change (client ID) */
  source: string;
  
  /** Whether this is an optimistic update */
  optimistic: boolean;
}

/**
 * Selector function
 */
export type Selector<Schema extends StateSchema, Result> = (
  state: StateValues<Schema>
) => Result;

/**
 * Storage adapter types
 */
export type StorageAdapterType = 'localStorage' | 'sessionStorage' | 'memory' | 'indexedDB';

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  /** Get a value from storage */
  get: <T>(key: string) => Promise<T | null> | T | null;
  
  /** Set a value in storage */
  set: <T>(key: string, value: T) => Promise<void> | void;
  
  /** Delete a value from storage */
  delete: (key: string) => Promise<void> | void;
  
  /** Clear all stored values */
  clear: () => Promise<void> | void;
}

/**
 * Sync adapter types
 */
export type SyncAdapterType = 'broadcastChannel' | 'websocket' | 'sharedWorker';

/**
 * Sync adapter interface
 */
export interface SyncAdapter {
  /** Initialize the adapter */
  initialize: () => Promise<void> | void;
  
  /** Send a change to other clients */
  sendChange: (change: StateChangeEvent) => Promise<void> | void;
  
  /** Subscribe to changes from other clients */
  subscribeToChanges: (
    callback: (change: StateChangeEvent) => void
  ) => () => void;
  
  /** Close the adapter */
  close: () => Promise<void> | void;
}

/**
 * Transaction interface
 */
export interface Transaction<Schema extends StateSchema> {
  /** Commit the transaction */
  commit: () => void;
  
  /** Update a value in the transaction */
  update: <K extends keyof StateValues<Schema>>(
    atomId: K,
    value: StateValues<Schema>[K]
  ) => Transaction<Schema>;
  
  /** Rollback the transaction */
  rollback: () => void;
}

/**
 * State manager interface
 */
export interface StateManager<Schema extends StateSchema> {
  /** Atoms for accessing state */
  atoms: {
    [K in keyof Schema]: Atom<z.infer<Schema[K]>>;
  };
  
  /** Get the current state */
  getState: () => StateValues<Schema>;
  
  /** Subscribe to state changes */
  subscribe: <K extends keyof Schema>(
    atomId: K,
    callback: (change: StateChangeEvent<z.infer<Schema[K]>>) => void
  ) => () => void;
  
  /** Start a new transaction */
  transaction: () => Transaction<Schema>;
  
  /** Reset the state to initial values */
  resetState: () => void;
  
  /** Dispose of the state manager */
  dispose: () => void;
  
  /** Selector cache for derived state */
  selectors: {
    create: <Result>(
      selector: Selector<Schema, Result>,
      deps?: (keyof Schema)[]
    ) => Selector<Schema, Result>;
    
    subscribe: <Result>(
      selector: Selector<Schema, Result>,
      callback: (result: Result) => void
    ) => () => void;
  };
  
  /** Storage adapter */
  storage: StorageAdapter | null;
  
  /** Sync adapter */
  sync: SyncAdapter | null;
}

/**
 * Hook result for useAtom
 */
export type AtomResult<T> = [
  /** Current value */
  T,
  /** Update function */
  (newValue: T | ((current: T) => T)) => void,
  /** Additional metadata */
  {
    /** Whether the atom is in loading state */
    loading: boolean;
    /** Reset atom to default value */
    reset: () => void;
  }
];

/**
 * Hook result for useTransaction
 */
export interface TransactionHookResult<Schema extends StateSchema> {
  /** Start a new transaction */
  begin: () => void;
  
  /** Commit the current transaction */
  commit: () => void;
  
  /** Rollback the current transaction */
  rollback: () => void;
  
  /** Update a value in the transaction */
  update: <K extends keyof StateValues<Schema>>(
    atomId: K,
    value: StateValues<Schema>[K]
  ) => void;
  
  /** Whether a transaction is in progress */
  isActive: boolean;
}

/**
 * Time-travel debug entry
 */
export interface TimelineEntry<Schema extends StateSchema> {
  /** Timestamp of the entry */
  timestamp: number;
  
  /** State snapshot */
  snapshot: StateValues<Schema>;
  
  /** Change that led to this state */
  change: StateChangeEvent | null;
  
  /** Entry ID */
  id: string;
}

/**
 * Debug API
 */
export interface DebugAPI<Schema extends StateSchema> {
  /** Get the timeline of state changes */
  getTimeline: () => TimelineEntry<Schema>[];
  
  /** Travel to a specific point in time */
  travelTo: (entryId: string) => void;
  
  /** Clear the timeline */
  clearTimeline: () => void;
  
  /** Toggle pausing state updates */
  togglePause: () => boolean;
  
  /** Whether state updates are paused */
  isPaused: () => boolean;
  
  /** Add a debug middleware for capturing events */
  addMiddleware: (
    middleware: (
      change: StateChangeEvent,
      next: (change: StateChangeEvent) => void
    ) => void
  ) => () => void;
}