import React, { createContext, useContext, ReactNode } from 'react';
import { StateManager, StateSchema, StateManagerConfig } from '../types';
import { createStateManager } from '../core/state-manager';

// Context for state manager
const StateManagerContext = createContext<StateManager<any> | null>(null);

// Props for StateProvider
interface StateProviderProps<Schema extends StateSchema> {
  /** State manager configuration */
  config: StateManagerConfig<Schema>;
  
  /** Optional pre-created state manager */
  stateManager?: StateManager<Schema>;
  
  /** Children components */
  children: ReactNode;
}

/**
 * Provider component for making a state manager available throughout
 * a React component tree.
 * 
 * @template Schema State schema type
 * @param props Component props
 * @returns Provider component
 * 
 * @example
 * ```tsx
 * const schema = {
 *   counter: z.number().default(0),
 *   user: z.object({
 *     name: z.string().optional(),
 *     theme: z.enum(['light', 'dark']).default('light'),
 *   }).default({}),
 * };
 * 
 * function App() {
 *   return (
 *     <StateProvider config={{ schema }}>
 *       <YourComponents />
 *     </StateProvider>
 *   );
 * }
 * ```
 */
export function StateProvider<Schema extends StateSchema>({
  config,
  stateManager: externalStateManager,
  children
}: StateProviderProps<Schema>) {
  // Create or use provided state manager
  const stateManager = React.useMemo(() => {
    return externalStateManager || createStateManager(config);
  }, [config, externalStateManager]);
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (!externalStateManager) {
        stateManager.dispose();
      }
    };
  }, [stateManager, externalStateManager]);
  
  return (
    <StateManagerContext.Provider value={stateManager}>
      {children}
    </StateManagerContext.Provider>
  );
}

/**
 * Hook for accessing the state manager from the context
 * 
 * @template Schema State schema type
 * @returns State manager instance
 * 
 * @example
 * ```tsx
 * function Counter() {
 *   const stateManager = useStateManager<MySchema>();
 *   const [count, setCount] = useAtom(stateManager, stateManager.atoms.counter);
 *   
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStateManager<Schema extends StateSchema>(): StateManager<Schema> {
  const context = useContext(StateManagerContext);
  
  if (!context) {
    throw new Error('useStateManager must be used within a StateProvider');
  }
  
  return context as StateManager<Schema>;
}

/**
 * Create convenience hooks for a specific state manager
 * 
 * @template Schema State schema type
 * @param stateManager The state manager instance
 * @returns Object containing specialized hooks
 * 
 * @example
 * ```tsx
 * // Create state manager and hooks
 * const stateManager = createStateManager({ schema });
 * const { useAtom, useSelector, useTransaction } = createHooks(stateManager);
 * 
 * // Use in components
 * function Counter() {
 *   const [count, setCount] = useAtom('counter');
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function createHooks<Schema extends StateSchema>(
  stateManager: StateManager<Schema>
) {
  // Hook for using an atom by key
  function useAtom<K extends keyof Schema>(
    atomKey: K
  ) {
    const atom = stateManager.atoms[atomKey];
    
    // Use the actual atom hook
    const [value, setValue, meta] = require('./use-atom').useAtom(
      stateManager,
      atom
    );
    
    return [value, setValue, meta] as const;
  }
  
  // Hook for using a selector
  function useSelector<Result>(
    selector: (state: Schema) => Result,
    deps?: (keyof Schema)[]
  ): Result {
    return require('./use-selector').useSelector(
      stateManager,
      selector,
      deps
    );
  }
  
  // Hook for using transactions
  function useTransaction() {
    return require('./use-transaction').useTransaction(
      stateManager
    );
  }
  
  return {
    useAtom,
    useSelector,
    useTransaction
  };
}