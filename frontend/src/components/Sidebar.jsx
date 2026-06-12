import React from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from './ui/Button';
import { LogOut, Plus, MessageSquare, Stethoscope, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { conversations, currentConversation, selectConversation, startNewChat, setMode } = useChat();
  const { user, logout } = useAuth();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'patient_ai': return <MessageSquare className="w-4 h-4" />;
      case 'doctor_ai': return <Stethoscope className="w-4 h-4" />;
      case 'patient_doctor': return <Users className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getLabel = (conv) => {
    switch (conv.type) {
      case 'patient_ai': return 'AI Assistant';
      case 'doctor_ai': return 'Doctor AI';
      case 'patient_doctor': {
        if (user?.role === 'doctor') {
          return conv.patient
            ? `Patient: ${conv.patient.first_name} ${conv.patient.last_name}`
            : 'Patient Chat';
        }
        return conv.doctor
          ? `Dr. ${conv.doctor.first_name} ${conv.doctor.last_name}`
          : 'Doctor Chat';
      }
      default: return 'Chat';
    }
  };

  return (
    <aside className="w-72 bg-gray-900 text-white flex flex-col h-full border-r border-gray-800">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-xl font-bold text-emerald-500">NaijaMed</h2>
        <button 
          onClick={() => setMode('startup')}
          className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-800 flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-lg shadow-inner">
          {user?.first_name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Chat History
        </h3>
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-500 text-center italic">No conversations yet</p>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.conversation_id}
              onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                currentConversation?.conversation_id === conv.conversation_id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className={currentConversation?.conversation_id === conv.conversation_id ? 'text-white' : 'text-emerald-500'}>
                {getTypeIcon(conv.type)}
              </span>
              <span className="truncate">{getLabel(conv)}</span>
            </button>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-800">
        <Button 
          variant="danger" 
          className="w-full text-sm py-2" 
          onClick={() => confirm('Are you sure you want to logout?') && logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
