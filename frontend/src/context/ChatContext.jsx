import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('startup'); // startup, chat, triage

  const loadConversations = useCallback(async () => {
    try {
      const response = await apiService.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      setLoading(true);
      const response = await apiService.getMessages(conversationId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    setMode('chat');
    await loadMessages(conversation.conversation_id);
    socketService.joinConversation(conversation.conversation_id);
  };

  const startNewChat = async (type, initialMode = 'chat') => {
    try {
      setLoading(true);
      const response = await apiService.initiateConversation(type);
      const newConv = response.conversation;
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      setMode(initialMode);
      socketService.joinConversation(newConv.conversation_id);
      return newConv;
    } catch (error) {
      console.error('Failed to start new chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content) => {
    if (!currentConversation) return;
    
    // Optimistic update would be nice, but socket handles broadcast
    // So we just send via socket
    socketService.sendMessage(
      currentConversation.conversation_id,
      content,
      currentConversation.type
    );
  };

  useEffect(() => {
    if (user) {
      loadConversations();
      const token = localStorage.getItem('token');
      socketService.connect(token);

      const handleMessage = (message) => {
        if (currentConversation && message.conversation_id === currentConversation.conversation_id) {
          setMessages(prev => [...prev, message]);
        }
      };

      const unsubscribe = socketService.on('message', handleMessage);
      
      return () => {
        unsubscribe();
        socketService.disconnect();
      };
    }
  }, [user, currentConversation, loadConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      loading,
      mode,
      setMode,
      selectConversation,
      startNewChat,
      sendMessage,
      refreshConversations: loadConversations
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
