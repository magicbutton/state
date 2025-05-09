import { produce, enablePatches, Patch } from 'immer';
import { StateManager, StateSchema } from '../types';

// Enable Immer patches for change tracking
enablePatches();

/**
 * Creates a deep clone of a state object
 * 
 * @param state The state object to clone
 * @returns A deep clone of the state
 */
export function deepClone<T>(state: T): T {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Creates a patch that represents the difference between two state objects
 * 
 * @param before The state before changes
 * @param after The state after changes
 * @returns Array of patches that represent the changes
 */
export function createPatches<T>(before: T, after: T): Patch[] {
  let patches: Patch[] = [];
  
  produce(
    before,
    (draft) => {
      // Apply the changes needed to transform before into after
      Object.assign(draft, after);
    },
    (generatedPatches) => {
      patches = generatedPatches;
    }
  );
  
  return patches;
}

/**
 * Applies patches to a state object
 * 
 * @param state The state to patch
 * @param patches The patches to apply
 * @returns The patched state
 */
export function applyPatches<T>(state: T, patches: Patch[]): T {
  return produce(state, (draft) => {
    // Apply each patch
    for (const patch of patches) {
      const { path, op, value } = patch;
      
      // Build the path to the property
      let current: any = draft;
      const lastIndex = path.length - 1;
      
      for (let i = 0; i < lastIndex; i++) {
        current = current[path[i]];
      }
      
      // Apply the operation
      if (op === 'replace' || op === 'add') {
        current[path[lastIndex]] = value;
      } else if (op === 'remove') {
        if (Array.isArray(current)) {
          current.splice(parseInt(path[lastIndex] as string), 1);
        } else {
          delete current[path[lastIndex]];
        }
      }
    }
  });
}

/**
 * Creates a JSON patch that can be used with JSON Patch libraries (RFC 6902)
 * 
 * @param before The state before changes
 * @param after The state after changes
 * @returns JSON Patch operations
 */
export function createJsonPatch<T>(before: T, after: T): any[] {
  const immerPatches = createPatches(before, after);
  
  // Convert Immer patches to JSON Patch format
  return immerPatches.map(patch => {
    const { path, op, value } = patch;
    const jsonPath = '/' + path.join('/');
    
    if (op === 'replace' || op === 'add') {
      return { op, path: jsonPath, value };
    } else if (op === 'remove') {
      return { op, path: jsonPath };
    }
    
    return null;
  }).filter(Boolean);
}

/**
 * Persists the entire state to the storage adapter
 * 
 * @param stateManager The state manager
 */
export async function persistState<Schema extends StateSchema>(
  stateManager: StateManager<Schema>
): Promise<void> {
  if (!stateManager.storage) {
    return;
  }
  
  const state = stateManager.getState();
  
  for (const [key, value] of Object.entries(state)) {
    await stateManager.storage.set(`state:${key}`, value);
  }
}

/**
 * Loads the entire state from the storage adapter
 * 
 * @param stateManager The state manager
 */
export async function loadState<Schema extends StateSchema>(
  stateManager: StateManager<Schema>
): Promise<void> {
  if (!stateManager.storage) {
    return;
  }
  
  const state = stateManager.getState();
  const transaction = stateManager.transaction();
  let hasChanges = false;
  
  for (const key of Object.keys(state)) {
    const value = await stateManager.storage.get(`state:${key}`);
    
    if (value !== null) {
      // Validate the value against the schema
      try {
        const atomKey = key as keyof typeof state;
        const atom = stateManager.atoms[atomKey];
        const validValue = atom.validate(value);
        
        transaction.update(atomKey, validValue);
        hasChanges = true;
      } catch (error) {
        console.error(`Invalid stored value for ${key}:`, error);
      }
    }
  }
  
  if (hasChanges) {
    transaction.commit();
  } else {
    transaction.rollback();
  }
}

/**
 * Detects circular references in an object
 * 
 * @param obj The object to check
 * @returns Whether the object contains circular references
 */
export function hasCircularReferences(obj: any): boolean {
  const seen = new WeakSet();
  
  const detect = (obj: any): boolean => {
    if (obj && typeof obj === 'object') {
      if (seen.has(obj)) {
        return true;
      }
      
      seen.add(obj);
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (detect(obj[key])) {
            return true;
          }
        }
      }
    }
    
    return false;
  };
  
  return detect(obj);
}

/**
 * Creates a namespaced state manager with isolated state
 * 
 * @param stateManager The parent state manager
 * @param namespace The namespace to use
 * @returns A namespaced state manager
 */
export function createNamespacedState<Schema extends StateSchema, SubSchema extends StateSchema>(
  stateManager: StateManager<Schema>,
  namespace: string,
  subSchema: SubSchema
): StateManager<SubSchema> {
  // Create a new state manager with the sub-schema
  const subStateManager = require('../core/state-manager').createStateManager({
    schema: subSchema,
    storageAdapter: stateManager.storage
      ? {
          get: async <T>(key: string): Promise<T | null> => {
            return stateManager.storage!.get<T>(`${namespace}:${key}`);
          },
          set: async <T>(key: string, value: T): Promise<void> => {
            return stateManager.storage!.set<T>(`${namespace}:${key}`, value);
          },
          delete: async (key: string): Promise<void> => {
            return stateManager.storage!.delete(`${namespace}:${key}`);
          },
          clear: async (): Promise<void> => {
            // No-op as we don't want to clear the entire storage
          }
        }
      : null,
    syncAdapter: stateManager.sync
      ? {
          initialize: (): void => {
            // Already initialized in parent
          },
          sendChange: (change): void => {
            // Namespace the change
            const namespacedChange = {
              ...change,
              atomId: `${namespace}:${change.atomId}`
            };
            
            return stateManager.sync!.sendChange(namespacedChange);
          },
          subscribeToChanges: (callback): (() => void) => {
            // Filter for changes in our namespace
            return stateManager.sync!.subscribeToChanges((change) => {
              if (change.atomId.startsWith(`${namespace}:`)) {
                // Remove the namespace prefix
                const localChange = {
                  ...change,
                  atomId: change.atomId.substring(namespace.length + 1)
                };
                
                callback(localChange);
              }
            });
          },
          close: (): void => {
            // No-op as parent will handle this
          }
        }
      : null
  });
  
  return subStateManager;
}