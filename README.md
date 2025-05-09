# Magic Button State

[![npm version](https://img.shields.io/npm/v/@magicbutton/state.svg)](https://www.npmjs.com/package/@magicbutton/state)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

A distributed state management system for TypeScript and React applications, providing robust, type-safe state management with support for synchronization across clients, persistence, and real-time updates.

## Features

- 📦 **Atomic State Model**: State is managed in atomic pieces for granular updates and efficient synchronization
- 🔄 **Distributed Synchronization**: Seamlessly sync state across multiple clients and servers
- 🧩 **Type-Safe Schema Definition**: Define your state with full TypeScript type inference
- 🔌 **Pluggable Storage Adapters**: Persist state locally or remotely with built-in and custom adapters
- 🎣 **React Hooks API**: Simple, powerful React integration with custom hooks
- 📱 **Cross-Tab/Window Synchronization**: Out-of-the-box support for state sharing across browser tabs
- 🚀 **Optimistic Updates**: Built-in support for optimistic UI updates with automatic rollback
- 🧪 **Time-Travel Debugging**: Development tools for inspecting and manipulating state over time
- 📊 **Selectors and Computed Values**: Efficient derived state with automatic dependency tracking
- 🔒 **Transactional Updates**: Batch multiple state changes into a single atomic transaction

## Installation

```bash
npm install @magicbutton/state
# or
yarn add @magicbutton/state
# or
pnpm add @magicbutton/state
```

## Quick Start

```tsx
import { createStateManager, useAtom, useSelector } from '@magicbutton/state';
import { z } from 'zod';

// Define your state schema
const schema = {
  counter: z.number().default(0),
  user: z.object({
    name: z.string().optional(),
    theme: z.enum(['light', 'dark']).default('light'),
  }).default({}),
  todos: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean().default(false),
  })).default([]),
};

// Create a state manager
const stateManager = createStateManager({
  schema,
  storageAdapter: 'localStorage', // Optional: persist to localStorage
  syncAdapter: 'broadcastChannel', // Optional: sync across tabs
});

// Use state in your components
function Counter() {
  // Read and update state with an atom
  const [count, setCount] = useAtom(stateManager.atoms.counter);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

function TodoList() {
  // Access the full todos array
  const [todos, setTodos] = useAtom(stateManager.atoms.todos);
  
  // Use a selector for derived state
  const incompleteTodos = useSelector(stateManager, (state) => 
    state.todos.filter(todo => !todo.completed)
  );
  
  // Add a new todo
  const addTodo = (title) => {
    setTodos([...todos, { 
      id: Date.now().toString(), 
      title, 
      completed: false 
    }]);
  };
  
  // Toggle a todo
  const toggleTodo = (id) => {
    setTodos(
      todos.map(todo => 
        todo.id === id 
          ? { ...todo, completed: !todo.completed } 
          : todo
      )
    );
  };
  
  return (
    <div>
      <h2>Todos ({incompleteTodos.length} remaining)</h2>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.title}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => {
        e.preventDefault();
        const title = e.target.elements.title.value;
        addTodo(title);
        e.target.reset();
      }}>
        <input name="title" placeholder="Add todo" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

## Core Concepts

### Atoms

Atoms are the fundamental units of state. Each atom represents a distinct piece of state that can be updated independently.

```typescript
// Define state schema with atoms
const schema = {
  counter: z.number().default(0),
  user: z.object({
    name: z.string().optional(),
    theme: z.enum(['light', 'dark']).default('light'),
  }).default({}),
};

// Create state manager with atoms
const stateManager = createStateManager({ schema });

// Use atoms in components
function Component() {
  const [count, setCount] = useAtom(stateManager.atoms.counter);
  // ...
}
```

### Storage Adapters

Storage adapters provide persistence for state. Magic Button State includes several built-in adapters:

```typescript
// LocalStorage adapter
const stateManager = createStateManager({
  schema,
  storageAdapter: 'localStorage',
});

// SessionStorage adapter
const stateManager = createStateManager({
  schema,
  storageAdapter: 'sessionStorage',
});

// Memory adapter (no persistence)
const stateManager = createStateManager({
  schema,
  storageAdapter: 'memory',
});

// IndexedDB adapter
const stateManager = createStateManager({
  schema,
  storageAdapter: 'indexedDB',
});

// Custom adapter
const stateManager = createStateManager({
  schema,
  storageAdapter: myCustomAdapter,
});
```

### Sync Adapters

Sync adapters enable state synchronization across multiple clients:

```typescript
// Cross-tab synchronization
const stateManager = createStateManager({
  schema,
  syncAdapter: 'broadcastChannel',
});

// WebSocket synchronization
const stateManager = createStateManager({
  schema,
  syncAdapter: websocketAdapter('wss://api.example.com/state-sync'),
});

// SharedWorker synchronization
const stateManager = createStateManager({
  schema,
  syncAdapter: 'sharedWorker',
});
```

### Transactions

Transactions allow you to batch multiple state changes into a single atomic operation:

```typescript
// Using the transaction API
const transaction = stateManager.transaction();
transaction.update('counter', 5);
transaction.update('user', { name: 'Alice', theme: 'dark' });
transaction.commit();

// Using the useTransaction hook
function Component() {
  const { begin, update, commit } = useTransaction(stateManager);
  
  const handleSubmit = () => {
    begin();
    update('counter', 5);
    update('user', { name: 'Alice', theme: 'dark' });
    commit();
  };
  
  // ...
}
```

### Selectors

Selectors derive new values from state:

```typescript
// Define and use a selector
const userGreeting = (state) => {
  return state.user.name
    ? `Hello, ${state.user.name}!`
    : 'Hello, Guest!';
};

function Component() {
  const greeting = useSelector(stateManager, userGreeting);
  // ...
}
```

## API Reference

For detailed API documentation, visit [our documentation site](https://docs.magicbutton.cloud/state).

## Examples

### Basic Counter

```tsx
import { createStateManager, useAtom } from '@magicbutton/state';
import { z } from 'zod';

const schema = {
  counter: z.number().default(0),
};

const stateManager = createStateManager({ schema });

function Counter() {
  const [count, setCount] = useAtom(stateManager.atoms.counter);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

### Form with Validation

```tsx
import { createStateManager, useAtom } from '@magicbutton/state';
import { z } from 'zod';

const schema = {
  form: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Must be at least 18 years old'),
  }).default({
    name: '',
    email: '',
    age: 0,
  }),
  formErrors: z.record(z.string()).default({}),
};

const stateManager = createStateManager({ schema });

function Form() {
  const [form, setForm] = useAtom(stateManager.atoms.form);
  const [errors, setErrors] = useAtom(stateManager.atoms.formErrors);
  
  const validate = () => {
    try {
      schema.form.parse(form);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = {};
        error.errors.forEach(err => {
          const field = err.path[0];
          formattedErrors[field] = err.message;
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Process form...
      console.log('Form submitted:', form);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Magic Button Messaging](https://github.com/magicbutton/messaging) - Type-safe, domain-driven messaging for distributed systems
- [Magic Button Auth](https://github.com/magicbutton/auth) - Authentication and authorization for TypeScript and React