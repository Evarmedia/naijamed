import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api.service';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

// Initial shape for emergencyState
const INITIAL_EMERGENCY_STATE = {
  active: false,       // Whether the modal should be visible
  caseId: null,
  emergencyId: null,
  diagnosis: null,
  treatment: null,
  conversationId: null,
  // Modal phase: 'detected' | 'connecting' | 'connected' | null
  phase: null,
  // Doctor info once a doctor accepts
  doctorName: null,
  doctorConversationId: null,
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState('startup'); // startup, chat, triage

  // Emergency modal state
  const [emergencyState, setEmergencyState] = useState(INITIAL_EMERGENCY_STATE);

  // ── Conversations ──────────────────────────────────────────────────────────

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
    setIsTyping(false);
    await loadMessages(conversation.conversation_id);
    socketService.joinConversation(conversation.conversation_id);
  };

  const startNewChat = async (type, initialMode = 'chat', options = {}) => {
    try {
      setLoading(true);
      const response = await apiService.initiateConversation(type, options);
      const newConv = response.conversation;
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      setMode(initialMode);
      setIsTyping(false);
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
    socketService.sendMessage(
      currentConversation.conversation_id,
      content,
      currentConversation.type
    );
  };

  // ── Emergency handlers ─────────────────────────────────────────────────────

  /**
   * Called when patient clicks "Yes, connect me to a doctor".
   * Hits the confirm endpoint which triggers doctor batch notifications.
   */
  const confirmEmergency = async () => {
    if (!emergencyState.caseId) return;

    setEmergencyState(prev => ({ ...prev, phase: 'connecting' }));

    try {
      await apiService.confirmEmergency(emergencyState.caseId);
      // phase stays 'connecting' until we receive emergency_accepted via socket
    } catch (error) {
      console.error('Failed to confirm emergency:', error);
      // Revert to detected phase so the patient can retry
      setEmergencyState(prev => ({ ...prev, phase: 'detected' }));
    }
  };

  /**
   * Called when patient clicks "No, I'm okay".
   * Cancels the emergency log on the backend.
   */
  const dismissEmergency = async () => {
    const caseId = emergencyState.caseId;
    // Reset state immediately for snappy UX
    setEmergencyState(INITIAL_EMERGENCY_STATE);

    if (caseId) {
      try {
        await apiService.declineEmergency(caseId);
      } catch (error) {
        console.error('Failed to decline emergency:', error);
      }
    }
  };

  /**
   * Navigate to the patient-doctor conversation created when a doctor accepts.
   */
  const openEmergencyConversation = async () => {
    const convId = emergencyState.doctorConversationId;
    if (!convId) return;

    // Reload conversations so the new patient-doctor one appears in the sidebar
    await loadConversations();

    // Find conversation object in list (or build a minimal one)
    const found = conversations.find(c => c.conversation_id === convId);
    if (found) {
      await selectConversation(found);
    } else {
      // If not yet in state, load messages directly and switch mode
      setCurrentConversation({ conversation_id: convId, type: 'patient_doctor' });
      setMode('chat');
      await loadMessages(convId);
      socketService.joinConversation(convId);
    }

    setEmergencyState(INITIAL_EMERGENCY_STATE);
  };

  // ── Socket event subscriptions ─────────────────────────────────────────────

  const currentConversationRef = useRef(currentConversation);

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    if (!user) return;

    loadConversations();
    const token = localStorage.getItem('token');
    socketService.connect(token);

    // New chat message
    const handleMessage = (message) => {
      const activeConv = currentConversationRef.current;
      if (activeConv && String(message.conversation_id) === String(activeConv.conversation_id)) {
        setMessages(prev => {
          if (prev.some(m => m.message_id === message.message_id)) return prev;
          return [...prev, message];
        });
      }
    };

    // AI typing indicators
    const handleTyping = (data) => {
      const activeConv = currentConversationRef.current;
      if (activeConv && String(data.conversationId) === String(activeConv.conversation_id)) {
        setIsTyping(true);
      }
    };

    const handleTypingStopped = (data) => {
      const activeConv = currentConversationRef.current;
      if (activeConv && String(data.conversationId) === String(activeConv.conversation_id)) {
        setIsTyping(false);
      }
    };

    // AI detected an emergency → show the modal
    const handleEmergencyDetected = (data) => {
      setEmergencyState({
        active: true,
        caseId: data.caseId,
        emergencyId: data.emergencyId,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        conversationId: data.conversationId,
        phase: 'detected',
        doctorName: null,
        doctorConversationId: null,
      });
    };

    // A doctor accepted → update modal to 'connected' state
    const handleEmergencyAccepted = (data) => {
      setEmergencyState(prev => ({
        ...prev,
        phase: 'connected',
        doctorName: data.doctorName,
        doctorConversationId: data.conversationId,
      }));

      // Refresh conversations so the new patient-doctor one appears in the sidebar
      loadConversations();
    };

    const unsubscribeMsg = socketService.on('message', handleMessage);
    const unsubscribeTyping = socketService.on('typing', handleTyping);
    const unsubscribeTypingStopped = socketService.on('typing_stopped', handleTypingStopped);
    const unsubscribeEmergencyDetected = socketService.on('emergency_detected', handleEmergencyDetected);
    const unsubscribeEmergencyAccepted = socketService.on('emergency_accepted', handleEmergencyAccepted);

    return () => {
      unsubscribeMsg();
      unsubscribeTyping();
      unsubscribeTypingStopped();
      unsubscribeEmergencyDetected();
      unsubscribeEmergencyAccepted();
      socketService.disconnect();
    };
  }, [user]);

  // Refresh conversation list when it's empty after mount
  useEffect(() => {
    if (user && !conversations.length) {
      loadConversations();
    }
  }, [user, conversations.length, loadConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      loading,
      isTyping,
      mode,
      setMode,
      selectConversation,
      startNewChat,
      sendMessage,
      refreshConversations: loadConversations,
      // Emergency
      emergencyState,
      confirmEmergency,
      dismissEmergency,
      openEmergencyConversation,
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
