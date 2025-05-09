import { useState, useCallback } from 'react';
import { StateManager, StateSchema, TransactionHookResult } from '../types';

/**
 * Hook for creating and managing transactions in a state manager
 * 
 * Transactions allow you to batch multiple state updates into a single
 * atomic operation, which can be committed or rolled back as a unit.
 * 
 * @param stateManager State manager instance
 * @returns Transaction methods and state
 * 
 * @example
 * ```tsx
 * const { begin, update, commit, rollback, isActive } = useTransaction(stateManager);
 * 
 * // Example of updating multiple atoms in a transaction
 * const handleSubmit = () => {
 *   begin();
 *   update('user', { ...user, name });
 *   update('preferences', { ...preferences, theme });
 *   commit();
 * };
 * 
 * // Example of rolling back on error
 * const handleUpdate = async () => {
 *   begin();
 *   update('status', 'loading');
 *   
 *   try {
 *     await saveToServer();
 *     update('status', 'success');
 *     commit();
 *   } catch (error) {
 *     rollback();
 *     setError(error.message);
 *   }
 * };
 * ```
 */
export function useTransaction<Schema extends StateSchema>(
  stateManager: StateManager<Schema>
): TransactionHookResult<Schema> {
  // Track the current transaction
  const [transaction, setTransaction] = useState<ReturnType<typeof stateManager.transaction> | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  // Begin a transaction
  const begin = useCallback(() => {
    const newTransaction = stateManager.transaction();
    setTransaction(newTransaction);
    setIsActive(true);
  }, [stateManager]);
  
  // Update a value in the transaction
  const update = useCallback(<K extends keyof Schema>(
    atomId: K,
    value: any
  ) => {
    if (!transaction) {
      console.warn('Cannot update: No active transaction. Call begin() first.');
      return;
    }
    
    transaction.update(atomId, value);
  }, [transaction]);
  
  // Commit the transaction
  const commit = useCallback(() => {
    if (!transaction) {
      console.warn('Cannot commit: No active transaction. Call begin() first.');
      return;
    }
    
    transaction.commit();
    setTransaction(null);
    setIsActive(false);
  }, [transaction]);
  
  // Rollback the transaction
  const rollback = useCallback(() => {
    if (!transaction) {
      console.warn('Cannot rollback: No active transaction. Call begin() first.');
      return;
    }
    
    transaction.rollback();
    setTransaction(null);
    setIsActive(false);
  }, [transaction]);
  
  return {
    begin,
    update,
    commit,
    rollback,
    isActive
  };
}