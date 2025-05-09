import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
  StateManagerConfig,
  StateSchema,
  StateValues,
  StateManager,
  StateChangeEvent,
  Atom,
  Transaction,
  Selector,
  TimelineEntry,
} from '../types';
import { createStorageAdapter } from '../adapters/storage-adapters';
import { createSyncAdapter } from '../adapters/sync-adapters';

/**
 * Create a new state manager
 */
export function createStateManager<Schema extends StateSchema>(
  config: StateManagerConfig<Schema>
): StateManager<Schema> {
  // Generate a unique client ID
  const clientId = nanoid();
  
  // Initialize state values from schema defaults and provided initial state
  const initialState = {} as StateValues<Schema>;
  
  // Create atoms for each schema entry
  const atoms = {} as StateManager<Schema>['atoms'];
  const atomSubscriptions = new Map<string, Set<(change: StateChangeEvent) => void>>();
  const selectorSubscriptions = new Map<string, Set<(newValue: any) => void>>();
  const selectorCache = new Map<string, { deps: Set<string>; compute: () => any }>();
  
  // Initialize state and atoms
  for (const [key, schema] of Object.entries(config.schema)) {
    const defaultValue = schema.parse(undefined);
    initialState[key as keyof Schema] = defaultValue;
    
    atoms[key as keyof Schema] = {
      id: key,
      default: defaultValue,
      validate: (value: unknown) => schema.parse(value),
      schema,
    } as Atom<any>;
    
    atomSubscriptions.set(key, new Set());
  }
  
  // Apply initial state overrides
  if (config.initialState) {
    for (const [key, value] of Object.entries(config.initialState)) {
      if (key in initialState) {
        const atomKey = key as keyof Schema;
        try {
          initialState[atomKey] = atoms[atomKey].validate(value);
        } catch (error) {
          console.error(`Invalid initial value for atom ${String(key)}:`, error);
        }
      }
    }
  }
  
  // Current state
  let state = { ...initialState };
  
  // Debug timeline
  const timeline: TimelineEntry<Schema>[] = [];
  let isPaused = false;
  
  // Set up storage adapter
  const storage = config.storageAdapter 
    ? (typeof config.storageAdapter === 'string' 
        ? createStorageAdapter(config.storageAdapter)
        : config.storageAdapter)
    : null;
    
  // Set up sync adapter
  const sync = config.syncAdapter
    ? (typeof config.syncAdapter === 'string'
        ? createSyncAdapter(config.syncAdapter)
        : config.syncAdapter)
    : null;
  
  // Middleware for processing state changes
  const middlewares: ((change: StateChangeEvent, next: (change: StateChangeEvent) => void) => void)[] = [];
  
  // Initialize storage
  if (storage) {
    // Load initial state from storage
    const loadFromStorage = async () => {
      for (const key of Object.keys(state)) {
        try {
          const storedValue = await storage.get(`state:${key}`);
          if (storedValue !== null) {
            const atomKey = key as keyof Schema;
            state[atomKey] = atoms[atomKey].validate(storedValue);
          }
        } catch (error) {
          console.error(`Failed to load state for ${key} from storage:`, error);
        }
      }
    };
    
    loadFromStorage();
  }
  
  // Initialize sync
  if (sync) {
    sync.initialize();
    
    // Listen for changes from other clients
    sync.subscribeToChanges((change) => {
      // Skip changes from this client
      if (change.source === clientId) {
        return;
      }
      
      applyChange(change);
    });
  }
  
  // Process and apply a state change
  function applyChange(change: StateChangeEvent): void {
    // Skip if paused
    if (isPaused) {
      return;
    }
    
    // Apply middleware
    const applyMiddlewares = (index: number, currentChange: StateChangeEvent): void => {
      if (index >= middlewares.length) {
        // All middlewares applied, proceed with the change
        
        const atomKey = change.atomId as keyof Schema;
        
        // Skip if atom doesn't exist
        if (!(atomKey in state)) {
          return;
        }
        
        // Update state
        const prevValue = state[atomKey];
        state = {
          ...state,
          [atomKey]: currentChange.newValue,
        };
        
        // Persist to storage if available
        if (storage) {
          storage.set(`state:${String(atomKey)}`, currentChange.newValue).catch(error => {
            console.error(`Failed to persist state for ${String(atomKey)}:`, error);
          });
        }
        
        // Sync to other clients if available
        if (sync && !change.optimistic) {
          sync.sendChange(currentChange).catch(error => {
            console.error('Failed to sync state change:', error);
          });
        }
        
        // Add to timeline
        if (config.debug?.timeTravel) {
          timeline.push({
            timestamp: Date.now(),
            snapshot: { ...state },
            change: currentChange,
            id: nanoid(),
          });
        }
        
        // Notify atom subscribers
        const subscribers = atomSubscriptions.get(String(atomKey));
        if (subscribers) {
          for (const subscriber of subscribers) {
            subscriber({
              ...currentChange,
              prevValue,
              newValue: state[atomKey],
            });
          }
        }
        
        // Update and notify selector subscribers
        updateSelectors(atomKey);
        
        // Debug logging
        if (config.debug?.logChanges) {
          console.group('State change');
          console.log('Atom:', atomKey);
          console.log('Previous:', prevValue);
          console.log('New:', state[atomKey]);
          console.log('Change:', currentChange);
          console.groupEnd();
        }
        
        return;
      }
      
      // Apply next middleware
      middlewares[index](currentChange, (nextChange) => {
        applyMiddlewares(index + 1, nextChange);
      });
    };
    
    applyMiddlewares(0, change);
  }
  
  // Create a state change event
  function createChangeEvent<K extends keyof StateValues<Schema>>(
    atomId: K,
    newValue: StateValues<Schema>[K],
    optimistic: boolean = false
  ): StateChangeEvent<StateValues<Schema>[K]> {
    return {
      atomId: String(atomId),
      prevValue: state[atomId],
      newValue,
      timestamp: Date.now(),
      changeId: nanoid(),
      source: clientId,
      optimistic,
    };
  }
  
  // Update a state atom
  function updateAtom<K extends keyof StateValues<Schema>>(
    atomId: K,
    value: StateValues<Schema>[K] | ((current: StateValues<Schema>[K]) => StateValues<Schema>[K]),
    optimistic: boolean = false
  ): void {
    const currentValue = state[atomId];
    const newValue = typeof value === 'function'
      ? (value as Function)(currentValue)
      : value;
      
    try {
      // Validate new value
      const validatedValue = atoms[atomId].validate(newValue);
      
      // Create and apply change
      const change = createChangeEvent(atomId, validatedValue, optimistic);
      applyChange(change);
    } catch (error) {
      console.error(`Invalid value for atom ${String(atomId)}:`, error);
      throw error;
    }
  }
  
  // Transaction implementation
  function createTransaction(): Transaction<Schema> {
    const changes = new Map<keyof StateValues<Schema>, StateValues<Schema>[keyof StateValues<Schema>]>();
    const previousValues = new Map<keyof StateValues<Schema>, StateValues<Schema>[keyof StateValues<Schema>]>();
    
    return {
      update<K extends keyof StateValues<Schema>>(
        atomId: K,
        value: StateValues<Schema>[K]
      ): Transaction<Schema> {
        if (!previousValues.has(atomId)) {
          previousValues.set(atomId, state[atomId]);
        }
        
        changes.set(atomId, atoms[atomId].validate(value));
        return this;
      },
      
      commit(): void {
        for (const [atomId, value] of changes.entries()) {
          updateAtom(atomId, value);
        }
        changes.clear();
        previousValues.clear();
      },
      
      rollback(): void {
        changes.clear();
        previousValues.clear();
      }
    };
  }
  
  // Update affected selectors when an atom changes
  function updateSelectors(atomId: keyof Schema): void {
    // Find selectors that depend on this atom
    const affectedSelectors = new Set<string>();
    
    for (const [selectorId, { deps }] of selectorCache.entries()) {
      if (deps.has(String(atomId))) {
        affectedSelectors.add(selectorId);
      }
    }
    
    // Update affected selectors
    for (const selectorId of affectedSelectors) {
      const cachedSelector = selectorCache.get(selectorId);
      if (!cachedSelector) continue;
      
      const newValue = cachedSelector.compute();
      
      // Notify selector subscribers
      const subscribers = selectorSubscriptions.get(selectorId);
      if (subscribers) {
        for (const subscriber of subscribers) {
          subscriber(newValue);
        }
      }
    }
  }
  
  // Create a new selector
  function createSelector<Result>(
    selector: Selector<Schema, Result>,
    explicitDeps?: (keyof Schema)[]
  ): Selector<Schema, Result> {
    const selectorId = nanoid();
    
    // Determine dependencies
    const deps = new Set<string>(explicitDeps?.map(String) || []);
    
    // If no explicit deps, we'll track them at runtime
    if (!explicitDeps || explicitDeps.length === 0) {
      // Execute selector once to detect deps
      let trackedState: StateValues<Schema> = { ...state };
      
      // Create proxy to track property access
      const stateProxy = new Proxy(trackedState, {
        get(target, prop) {
          // Record dependency
          deps.add(String(prop));
          return target[prop as keyof typeof target];
        }
      });
      
      // Run selector with proxied state
      selector(stateProxy as StateValues<Schema>);
    }
    
    // Store in cache
    selectorCache.set(selectorId, {
      deps,
      compute: () => selector(state),
    });
    
    // Return wrapped selector
    const wrappedSelector: Selector<Schema, Result> = (stateArg) => {
      return selector(stateArg);
    };
    
    // Attach metadata to the selector
    Object.defineProperties(wrappedSelector, {
      id: { value: selectorId },
      dependencies: { get: () => Array.from(deps) },
    });
    
    return wrappedSelector;
  }
  
  // Subscribe to a selector
  function subscribeToSelector<Result>(
    selector: Selector<Schema, Result>,
    callback: (result: Result) => void
  ): () => void {
    // If this is a created selector, it has an ID
    const selectorId = (selector as any).id;
    
    if (!selectorId) {
      // Create a new selector
      const newSelector = createSelector(selector);
      return subscribeToSelector(newSelector, callback);
    }
    
    // Get or create subscription set
    let subscribers = selectorSubscriptions.get(selectorId);
    if (!subscribers) {
      subscribers = new Set();
      selectorSubscriptions.set(selectorId, subscribers);
    }
    
    // Add subscriber
    subscribers.add(callback);
    
    // Initial callback
    const cachedSelector = selectorCache.get(selectorId);
    if (cachedSelector) {
      callback(cachedSelector.compute());
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = selectorSubscriptions.get(selectorId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          selectorSubscriptions.delete(selectorId);
        }
      }
    };
  }
  
  // Public API
  const stateManager: StateManager<Schema> = {
    atoms,
    
    getState(): StateValues<Schema> {
      return { ...state };
    },
    
    subscribe<K extends keyof Schema>(
      atomId: K,
      callback: (change: StateChangeEvent<z.infer<Schema[K]>>) => void
    ): () => void {
      let subscribers = atomSubscriptions.get(String(atomId));
      if (!subscribers) {
        subscribers = new Set();
        atomSubscriptions.set(String(atomId), subscribers);
      }
      
      subscribers.add(callback as any);
      
      return () => {
        const subscribers = atomSubscriptions.get(String(atomId));
        if (subscribers) {
          subscribers.delete(callback as any);
        }
      };
    },
    
    transaction(): Transaction<Schema> {
      return createTransaction();
    },
    
    resetState(): void {
      // Reset all atoms to their default values
      for (const [key, atom] of Object.entries(atoms)) {
        updateAtom(key as keyof Schema, atom.default);
      }
    },
    
    dispose(): void {
      // Clean up subscriptions
      atomSubscriptions.clear();
      selectorSubscriptions.clear();
      
      // Close sync adapter
      if (sync) {
        sync.close();
      }
      
      // Clear storage (optionally)
      // if (storage) {
      //   storage.clear();
      // }
    },
    
    selectors: {
      create: createSelector,
      subscribe: subscribeToSelector,
    },
    
    storage,
    sync,
  };
  
  // Expose debug API if enabled
  if (config.debug?.enabled) {
    (stateManager as any).debug = {
      getTimeline: () => [...timeline],
      
      travelTo: (entryId: string) => {
        const entry = timeline.find(e => e.id === entryId);
        if (entry) {
          state = { ...entry.snapshot };
          
          // Notify all atom subscribers
          for (const [atomId, subscribers] of atomSubscriptions.entries()) {
            for (const subscriber of subscribers) {
              subscriber({
                atomId,
                prevValue: undefined,
                newValue: state[atomId as keyof Schema],
                timestamp: Date.now(),
                changeId: nanoid(),
                source: clientId,
                optimistic: false,
              });
            }
          }
          
          // Update all selectors
          updateSelectors('*' as any); // Special value to update all selectors
        }
      },
      
      clearTimeline: () => {
        timeline.splice(0, timeline.length);
      },
      
      togglePause: () => {
        isPaused = !isPaused;
        return isPaused;
      },
      
      isPaused: () => isPaused,
      
      addMiddleware: (middleware) => {
        middlewares.push(middleware);
        return () => {
          const index = middlewares.indexOf(middleware);
          if (index >= 0) {
            middlewares.splice(index, 1);
          }
        };
      },
    };
  }
  
  return stateManager;
}