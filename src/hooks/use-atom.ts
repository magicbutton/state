import { useState, useEffect, useCallback } from 'react';
import { Atom, AtomResult, StateChangeEvent, StateManager, StateSchema } from '../types';

/**
 * Hook for using an atom from the state manager
 * 
 * @param stateManager State manager instance
 * @param atom Atom to use
 * @returns Tuple containing the current value and an update function
 * 
 * @example
 * ```tsx
 * const [count, setCount] = useAtom(stateManager, stateManager.atoms.counter);
 * 
 * // Update directly
 * setCount(5);
 * 
 * // Update using a function
 * setCount(prev => prev + 1);
 * ```
 */
export function useAtom<Schema extends StateSchema, T>(
  stateManager: StateManager<Schema>,
  atom: Atom<T>
): AtomResult<T> {
  // Get current value from state
  const [value, setValue] = useState<T>(() => {
    const state = stateManager.getState();
    return state[atom.id as keyof typeof state] as T;
  });
  
  // Track loading state
  const [loading, setLoading] = useState(false);

  // Update function
  const updateAtom = useCallback((newValue: T | ((current: T) => T)) => {
    const state = stateManager.getState();
    const currentValue = state[atom.id as keyof typeof state] as T;
    
    // Determine the new value
    const valueToSet = typeof newValue === 'function'
      ? (newValue as (current: T) => T)(currentValue)
      : newValue;
    
    // Start a transaction
    const transaction = stateManager.transaction();
    
    // Update the atom in the transaction
    transaction.update(atom.id as keyof typeof state, valueToSet as any);
    
    // Commit the transaction
    transaction.commit();
  }, [stateManager, atom]);
  
  // Reset function
  const resetAtom = useCallback(() => {
    updateAtom(atom.default);
  }, [updateAtom, atom]);

  // Subscribe to atom changes
  useEffect(() => {
    const handleChange = (change: StateChangeEvent<T>) => {
      setValue(change.newValue);
      setLoading(false);
    };
    
    const unsubscribe = stateManager.subscribe(
      atom.id as any,
      handleChange as any
    );
    
    // Initial value
    const state = stateManager.getState();
    setValue(state[atom.id as keyof typeof state] as T);
    
    return unsubscribe;
  }, [stateManager, atom]);

  return [
    value,
    updateAtom,
    {
      loading,
      reset: resetAtom
    }
  ];
}