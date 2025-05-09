import { useState, useEffect, useRef } from 'react';
import { Selector, StateManager, StateSchema } from '../types';

/**
 * Hook for using a selector to derive state from the state manager
 * 
 * @param stateManager State manager instance
 * @param selector Function that selects/computes derived state
 * @param deps Optional explicit dependencies for this selector
 * @returns The derived state value
 * 
 * @example
 * ```tsx
 * // Simple selection
 * const user = useSelector(stateManager, state => state.user);
 * 
 * // Computed/derived state
 * const incompleteTodos = useSelector(
 *   stateManager,
 *   state => state.todos.filter(todo => !todo.completed)
 * );
 * 
 * // With explicit dependencies
 * const userNameAndTheme = useSelector(
 *   stateManager,
 *   state => ({
 *     name: state.user.name,
 *     theme: state.user.theme
 *   }),
 *   ['user'] // Explicit dependencies
 * );
 * ```
 */
export function useSelector<Schema extends StateSchema, Result>(
  stateManager: StateManager<Schema>,
  selector: Selector<Schema, Result>,
  deps?: (keyof Schema)[]
): Result {
  // Create a ref to store the memoized selector
  const selectorRef = useRef<Selector<Schema, Result> | null>(null);
  
  // Create or get memoized selector
  if (!selectorRef.current) {
    selectorRef.current = stateManager.selectors.create(selector, deps);
  }
  
  // Get initial value
  const [value, setValue] = useState<Result>(() => 
    selector(stateManager.getState())
  );
  
  // Subscribe to selector changes
  useEffect(() => {
    if (!selectorRef.current) {
      selectorRef.current = stateManager.selectors.create(selector, deps);
    }
    
    const unsubscribe = stateManager.selectors.subscribe(
      selectorRef.current,
      newValue => {
        setValue(newValue);
      }
    );
    
    // Set initial value
    setValue(selector(stateManager.getState()));
    
    return unsubscribe;
  }, [stateManager, selector, deps]);
  
  return value;
}