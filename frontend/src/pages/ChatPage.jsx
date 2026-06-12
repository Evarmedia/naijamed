import React from 'react';
import Sidebar from '../components/Sidebar';
import StartupView from '../components/StartupView';
import ChatContent from '../components/ChatContent';
import TriageForm from '../components/TriageForm';
import EmergencyModal from '../components/EmergencyModal';
import DoctorEmergencyNotification from '../components/DoctorEmergencyNotification';
import { ChatProvider, useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

const ChatLayout = () => {
  const { mode, currentConversation, setMode } = useChat();
  const { user } = useAuth();

  const renderContent = () => {
    switch (mode) {
      case 'startup': return <StartupView />;
      case 'chat': return <ChatContent />;
      case 'triage': return <TriageForm />;
      default: return <StartupView />;
    }
  };

  const getHeaderTitle = () => {
    if (mode === 'startup') return { title: 'Start a conversation', subtitle: 'Select a chat or start a new one' };
    if (mode === 'triage') return { title: 'Medical Triage', subtitle: 'Describe your symptoms for assessment' };
    
    if (currentConversation?.type === 'patient_doctor') {
      if (user?.role === 'doctor') {
        const name = currentConversation.patient
          ? `${currentConversation.patient.first_name} ${currentConversation.patient.last_name}`
          : 'Patient';
        return {
          title: `Chat with ${name}`,
          subtitle: `Consultation chat started on ${new Date(currentConversation.created_at).toLocaleDateString()}`
        };
      } else {
        const name = currentConversation.doctor
          ? `Dr. ${currentConversation.doctor.first_name} ${currentConversation.doctor.last_name}`
          : 'Doctor';
        return {
          title: `Chat with ${name}`,
          subtitle: `Consultation chat started on ${new Date(currentConversation.created_at).toLocaleDateString()}`
        };
      }
    }

    const typeLabels = {
      'patient_ai': 'AI Assistant',
      'doctor_ai': 'Doctor AI'
    };

    return { 
      title: typeLabels[currentConversation?.type] || 'Chat', 
      subtitle: currentConversation ? `Created on ${new Date(currentConversation.created_at).toLocaleDateString()}` : '' 
    };
  };

  const { title, subtitle } = getHeaderTitle();

  return (
    <div className="flex h-screen bg-white">
      <EmergencyModal />
      <DoctorEmergencyNotification />
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-gray-100 px-6 flex items-center justify-between bg-white shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {mode !== 'startup' && (
              <button 
                onClick={() => setMode('startup')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const ChatPage = () => {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
};

export default ChatPage;
