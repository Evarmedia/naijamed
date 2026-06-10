import React from 'react';
import { useChat } from '../context/ChatContext';
import { MessageSquare, Hospital } from 'lucide-react';
import { motion } from 'framer-motion';

const StartupView = () => {
  const { startNewChat, setMode } = useChat();

  const options = [
    {
      id: 'patient-assistant',
      title: 'Chat with AI Assistant',
      desc: 'Get health advice from our AI',
      icon: <MessageSquare className="w-8 h-8 text-emerald-500" />,
      onClick: () => startNewChat('patient_ai', 'chat'),
    },
    {
      id: 'triage',
      title: 'Medical Triage',
      desc: 'Report symptoms for assessment',
      icon: <Hospital className="w-8 h-8 text-blue-500" />,
      onClick: () => startNewChat('patient_ai', 'triage'),
    },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-xl w-full text-center">
        <motion.h3 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Welcome to NaijaMed AI Chat
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 mb-10"
        >
          Choose an option to get started:
        </motion.p>

        <div className="grid grid-cols-1 gap-4">
          {options.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={opt.onClick}
              className="flex items-center p-6 bg-white rounded-2xl border-2 border-transparent hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 text-left group"
            >
              <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-emerald-50 transition-colors mr-6">
                {opt.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-1">{opt.title}</h4>
                <p className="text-sm text-gray-500">{opt.desc}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartupView;
