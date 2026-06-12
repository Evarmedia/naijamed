import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import TypingIndicator from './TypingIndicator';
const ChatContent = () => {
  const { messages, sendMessage, isTyping } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-white relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isUser = msg.sender_role !== 'ai' && msg.identifier !== 'agent' && msg.identifier !== 'ai' && msg.user_id === user?.user_id;
              return (
                <motion.div
                  key={msg.message_id || i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                    <div className={`text-[10px] mt-1.5 opacity-60 ${isUser ? 'text-right text-emerald-100' : 'text-left text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                rows="1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-3 pr-12 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none max-h-32 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 bottom-2 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e5e7eb;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #d1d5db;
          }
        `}</style>
      </div>
    </>
  );
};

export default ChatContent;
