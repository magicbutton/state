# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- path/to/test-file.test.ts

# Run tests in watch mode
npm run test -- --watch

# Lint code
npm run lint

# Type check without emitting files
npm run typecheck

# Clean build artifacts
npm run clean
```

## Project Architecture

Magic Button State is a distributed state management system for TypeScript and React applications. It provides robust, type-safe state management with support for synchronization, persistence, and real-time updates.

### Core Concepts

1. **Atomic State Model**: State is split into atomic pieces for granular updates and efficient synchronization.
2. **Schema Validation**: Runtime validation of state using Zod schemas ensures type safety and data integrity.
3. **Storage Abstraction**: Pluggable storage adapters allow for different persistence mechanisms.
4. **Synchronization**: Cross-client state synchronization with pluggable transport mechanisms.
5. **Transactions**: Atomic state updates that can be committed or rolled back as a unit.
6. **Selectors**: Memoized derived state with automatic dependency tracking.
7. **React Integration**: Custom hooks for accessing state in React components.
8. **Time-Travel Debugging**: Development tools for inspecting and manipulating state over time.
9. **Optimistic Updates**: Built-in support for optimistic UI updates with automatic rollback.

### Key Components

#### Core
- `state-manager.ts` (`src/core/state-manager.ts`): Core implementation of the state manager with state handling logic. Provides the `createStateManager` function which is the main entry point.

#### Hooks
- `use-atom.ts` (`src/hooks/use-atom.ts`): Hook for accessing and updating individual atoms.
- `use-selector.ts` (`src/hooks/use-selector.ts`): Hook for computed values and derived state.
- `use-transaction.ts` (`src/hooks/use-transaction.ts`): Hook for creating and managing transactions.

#### Providers
- `state-provider.tsx` (`src/providers/state-provider.tsx`): React context provider for state manager.

#### Adapters
- `storage-adapters.ts` (`src/adapters/storage-adapters.ts`): Implementations for different storage strategies (localStorage, sessionStorage, memory, indexedDB).
- `sync-adapters.ts` (`src/adapters/sync-adapters.ts`): Implementations for different synchronization methods (broadcastChannel, websocket, sharedWorker).

#### Utilities
- `state-utils.ts` (`src/utils/state-utils.ts`): Utility functions for state operations.

#### Types
- `index.ts` (`src/types/index.ts`): TypeScript interfaces and type definitions.

### Testing Architecture

Tests are configured using Jest with the following setup:

- Test files should be named `*.test.ts` or `*.test.tsx`
- Tests use the JSDOM environment for React component testing
- Common mocks for BroadcastChannel, IndexedDB, localStorage, and sessionStorage are provided in `jest.setup.js`
- React Testing Library is used for component testing

## Implementation Patterns

1. **Immutable Updates**: State is never mutated directly; updates create new state objects.
2. **Dependency Tracking**: Selectors automatically track their dependencies for efficient updates.
3. **Event-Based Updates**: State changes emit events that can be subscribed to.
4. **Schema Validation**: All state updates are validated against Zod schemas.
5. **Atomic Transactions**: Multiple state updates can be batched into atomic transactions.
6. **Cross-Tab Synchronization**: State can be synchronized across browser tabs/windows.

## Development Workflow

When working with this codebase:

1. **Schema Definition**: Start by defining the state schema using Zod.
2. **State Manager Creation**: Create a state manager with appropriate configuration.
3. **React Integration**: Use hooks like `useAtom` and `useSelector` for component integration.
4. **Storage Configuration**: Configure storage adapters for state persistence.
5. **Sync Configuration**: Set up synchronization for multi-client applications.
6. **Transaction Management**: Use transactions for complex state updates.

## Example Implementation

```typescript
// Define schema
const schema = {
  counter: z.number().default(0),
  user: z.object({
    name: z.string().optional(),
    theme: z.enum(['light', 'dark']).default('light'),
  }).default({}),
};

// Create state manager
const stateManager = createStateManager({
  schema,
  storageAdapter: 'localStorage',
  syncAdapter: 'broadcastChannel',
});

// Use in React components
function Counter() {
  const [count, setCount] = useAtom(stateManager, stateManager.atoms.counter);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

## Available Adapters

### Storage Adapters
- `'localStorage'`: Persists state to browser's localStorage
- `'sessionStorage'`: Persists state to browser's sessionStorage
- `'memory'`: In-memory storage with no persistence
- `'indexedDB'`: Persists state to IndexedDB database

### Sync Adapters
- `'broadcastChannel'`: Synchronizes state across browser tabs using the BroadcastChannel API
- `websocketAdapter(url)`: Synchronizes state via WebSocket connection
- `'sharedWorker'`: Synchronizes state using a SharedWorker

## Debug Features

When creating a state manager with debug options enabled, you get access to:

- Time-travel debugging through the `debug.getTimeline()` and `debug.travelTo()` APIs
- State change logging
- Middleware support for custom processing of state changes