import { BroadcastChannel } from 'broadcast-channel';
import { StateChangeEvent, SyncAdapter, SyncAdapterType } from '../types';

/**
 * BroadcastChannel adapter for cross-tab synchronization
 */
export const broadcastChannelAdapter = (): SyncAdapter => {
  let channel: BroadcastChannel | null = null;
  let listeners = new Set<(change: StateChangeEvent) => void>();
  
  return {
    initialize(): void {
      if (channel) {
        return;
      }
      
      try {
        channel = new BroadcastChannel('magicbutton_state_sync');
        
        channel.onmessage = (event: StateChangeEvent) => {
          if (event && typeof event === 'object' && 'atomId' in event) {
            listeners.forEach(listener => listener(event));
          }
        };
      } catch (error) {
        console.error('Failed to initialize BroadcastChannel:', error);
      }
    },
    
    sendChange(change: StateChangeEvent): void {
      if (!channel) {
        console.warn('BroadcastChannel not initialized');
        return;
      }
      
      try {
        channel.postMessage(change);
      } catch (error) {
        console.error('Failed to send change via BroadcastChannel:', error);
      }
    },
    
    subscribeToChanges(callback: (change: StateChangeEvent) => void): () => void {
      listeners.add(callback);
      
      return () => {
        listeners.delete(callback);
      };
    },
    
    close(): void {
      if (channel) {
        channel.close();
        channel = null;
      }
      
      listeners.clear();
    }
  };
};

/**
 * WebSocket adapter for cross-client synchronization
 */
export const websocketAdapter = (url: string): SyncAdapter => {
  let socket: WebSocket | null = null;
  let listeners = new Set<(change: StateChangeEvent) => void>();
  let isConnected = false;
  let reconnectTimer: any = null;
  const pendingMessages: StateChangeEvent[] = [];
  
  // Connect to WebSocket server
  const connect = () => {
    if (socket) {
      return;
    }
    
    try {
      socket = new WebSocket(url);
      
      socket.onopen = () => {
        isConnected = true;
        
        // Send any pending messages
        while (pendingMessages.length > 0) {
          const message = pendingMessages.shift();
          if (message) {
            sendChange(message);
          }
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data && typeof data === 'object' && 'atomId' in data) {
            listeners.forEach(listener => listener(data));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        isConnected = false;
        socket = null;
        
        // Attempt to reconnect
        if (reconnectTimer === null) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 5000);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Close and attempt reconnect
        if (socket) {
          socket.close();
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };
  
  // Send a change event
  const sendChange = (change: StateChangeEvent): void => {
    if (!socket || !isConnected) {
      pendingMessages.push(change);
      return;
    }
    
    try {
      socket.send(JSON.stringify(change));
    } catch (error) {
      console.error('Failed to send change via WebSocket:', error);
      pendingMessages.push(change);
    }
  };
  
  return {
    initialize(): void {
      connect();
    },
    
    sendChange,
    
    subscribeToChanges(callback: (change: StateChangeEvent) => void): () => void {
      listeners.add(callback);
      
      return () => {
        listeners.delete(callback);
      };
    },
    
    close(): void {
      if (socket) {
        socket.close();
        socket = null;
      }
      
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      listeners.clear();
      pendingMessages.length = 0;
    }
  };
};

/**
 * SharedWorker adapter for cross-tab synchronization
 */
export const sharedWorkerAdapter = (): SyncAdapter => {
  let worker: SharedWorker | null = null;
  let listeners = new Set<(change: StateChangeEvent) => void>();
  
  // SharedWorker code as a blob URL
  const createWorkerBlob = () => {
    const code = `
      // List of connected ports
      const ports = [];
      
      self.onconnect = function(e) {
        const port = e.ports[0];
        ports.push(port);
        
        port.onmessage = function(event) {
          // Broadcast message to all other ports
          ports.forEach(p => {
            if (p !== port) {
              p.postMessage(event.data);
            }
          });
        };
        
        // Remove port when it closes
        port.onclose = function() {
          const index = ports.indexOf(port);
          if (index !== -1) {
            ports.splice(index, 1);
          }
        };
        
        port.start();
      };
    `;
    
    const blob = new Blob([code], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  };
  
  return {
    initialize(): void {
      if (worker || typeof SharedWorker === 'undefined') {
        return;
      }
      
      try {
        const workerUrl = createWorkerBlob();
        worker = new SharedWorker(workerUrl);
        
        worker.port.onmessage = (event) => {
          const data = event.data;
          
          if (data && typeof data === 'object' && 'atomId' in data) {
            listeners.forEach(listener => listener(data));
          }
        };
        
        worker.port.start();
        
        // Clean up the Blob URL
        URL.revokeObjectURL(workerUrl);
      } catch (error) {
        console.error('Failed to initialize SharedWorker:', error);
      }
    },
    
    sendChange(change: StateChangeEvent): void {
      if (!worker) {
        console.warn('SharedWorker not initialized');
        return;
      }
      
      try {
        worker.port.postMessage(change);
      } catch (error) {
        console.error('Failed to send change via SharedWorker:', error);
      }
    },
    
    subscribeToChanges(callback: (change: StateChangeEvent) => void): () => void {
      listeners.add(callback);
      
      return () => {
        listeners.delete(callback);
      };
    },
    
    close(): void {
      if (worker) {
        worker.port.close();
        worker = null;
      }
      
      listeners.clear();
    }
  };
};

/**
 * Factory function to create a sync adapter based on type
 */
export function createSyncAdapter(type: SyncAdapterType, url?: string): SyncAdapter {
  switch (type) {
    case 'broadcastChannel':
      return broadcastChannelAdapter();
    case 'websocket':
      if (!url) {
        throw new Error('URL is required for websocket sync adapter');
      }
      return websocketAdapter(url);
    case 'sharedWorker':
      return sharedWorkerAdapter();
    default:
      console.warn(`Unknown sync adapter type: ${type}, falling back to broadcastChannel`);
      return broadcastChannelAdapter();
  }
}