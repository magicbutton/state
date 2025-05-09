import React, { useState } from 'react';
import { z } from 'zod';
import {
  createStateManager,
  StateProvider,
  useAtom,
  useSelector,
  useTransaction
} from '@magicbutton/state';

// Define the Todo type
const Todo = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean().default(false),
});

// Define the state schema
const schema = {
  todos: z.array(Todo).default([]),
  filter: z.enum(['all', 'active', 'completed']).default('all'),
};

// Create the state manager
const stateManager = createStateManager({
  schema,
  storageAdapter: 'localStorage',
  syncAdapter: 'broadcastChannel',
});

// Main App component
export function TodoApp() {
  return (
    <StateProvider stateManager={stateManager}>
      <div className="todo-app">
        <h1>Todo App</h1>
        <AddTodo />
        <TodoFilters />
        <TodoList />
        <TodoStats />
        <div className="sync-info">
          <small>Changes are synchronized across tabs and persisted in localStorage</small>
        </div>
      </div>
    </StateProvider>
  );
}

// Component to add new todos
function AddTodo() {
  const [todos, setTodos] = useAtom(stateManager.atoms.todos);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Add new todo
    setTodos([
      ...todos,
      {
        id: Date.now().toString(),
        title: title.trim(),
        completed: false,
      },
    ]);

    // Reset input
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
      />
      <button type="submit">Add</button>
    </form>
  );
}

// Component to filter todos
function TodoFilters() {
  const [filter, setFilter] = useAtom(stateManager.atoms.filter);

  return (
    <div className="filters">
      <button
        className={filter === 'all' ? 'active' : ''}
        onClick={() => setFilter('all')}
      >
        All
      </button>
      <button
        className={filter === 'active' ? 'active' : ''}
        onClick={() => setFilter('active')}
      >
        Active
      </button>
      <button
        className={filter === 'completed' ? 'active' : ''}
        onClick={() => setFilter('completed')}
      >
        Completed
      </button>
    </div>
  );
}

// Component to display todos
function TodoList() {
  const [todos, setTodos] = useAtom(stateManager.atoms.todos);
  const [filter] = useAtom(stateManager.atoms.filter);
  const { begin, update, commit } = useTransaction(stateManager);

  // Use a selector to filter todos based on the current filter
  const filteredTodos = useSelector(
    stateManager,
    (state) => {
      switch (state.filter) {
        case 'active':
          return state.todos.filter(todo => !todo.completed);
        case 'completed':
          return state.todos.filter(todo => todo.completed);
        default:
          return state.todos;
      }
    },
    ['todos', 'filter'] // Dependencies
  );

  // Toggle todo completion status
  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a todo
  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Mark all todos as completed or active
  const markAll = (completed: boolean) => {
    // Use a transaction to update all todos at once
    begin();
    update('todos', todos.map(todo => ({ ...todo, completed })));
    commit();
  };

  return (
    <div className="todo-list">
      {filteredTodos.length > 0 && (
        <div className="mark-all">
          <button onClick={() => markAll(true)}>Mark all completed</button>
          <button onClick={() => markAll(false)}>Mark all active</button>
        </div>
      )}
      
      {filteredTodos.length === 0 ? (
        <p className="empty-state">No todos to display</p>
      ) : (
        <ul>
          {filteredTodos.map(todo => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.title}</span>
              <button onClick={() => deleteTodo(todo.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Component to display todo statistics
function TodoStats() {
  // Use selectors to compute statistics
  const totalTodos = useSelector(stateManager, state => state.todos.length);
  const completedTodos = useSelector(
    stateManager,
    state => state.todos.filter(todo => todo.completed).length
  );
  const activeTodos = useSelector(
    stateManager,
    state => state.todos.filter(todo => !todo.completed).length
  );

  return (
    <div className="todo-stats">
      <p>Total: {totalTodos}</p>
      <p>Active: {activeTodos}</p>
      <p>Completed: {completedTodos}</p>
    </div>
  );
}

export default TodoApp;