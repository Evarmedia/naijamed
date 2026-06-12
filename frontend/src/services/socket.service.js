import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3055';

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

    // ── Emergency events ───────────────────────────────────────────────────

    // AI detected an emergency — fires to the patient's personal socket room
    this.socket.on('emergency_detected', (data) => {
      console.log('🚨 Emergency detected via socket:', data);
      this._emit('emergency_detected', data);
    });

    // A doctor accepted the emergency case — fires to the patient's personal room
    this.socket.on('emergency_accepted', (data) => {
      console.log('✅ Emergency accepted via socket:', data);
      this._emit('emergency_accepted', data);
    });

    // Doctor-side: fires to the doctor confirming their acceptance
    this.socket.on('emergency_case_assigned', (data) => {
      console.log('📋 Emergency case assigned (doctor view):', data);
      this._emit('emergency_case_assigned', data);
    });

    // Doctor-side: a new emergency case is available to accept
    this.socket.on('new_emergency_case', (data) => {
      console.log('🆘 New emergency case available:', data);
      this._emit('new_emergency_case', data);
    });

    // Typing indicators
    this.socket.on('typing', (data) => {
      this._emit('typing', data);
    });

    this.socket.on('typing_stopped', (data) => {
      this._emit('typing_stopped', data);
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
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
