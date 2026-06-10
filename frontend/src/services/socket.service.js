import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3005';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(BACKEND_URL, {
      auth: { token },
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this._emit('status', 'connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this._emit('status', 'disconnected');
    });

    this.socket.on('new_message', (message) => {
      this._emit('message', message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this._emit('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  sendMessage(conversationId, message, type = 'patient_ai') {
    if (this.socket?.connected) {
      this.socket.emit('message', { conversationId, message, type });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      this.listeners.get(event).delete(callback);
    };
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
