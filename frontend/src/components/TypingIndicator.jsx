import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex items-center gap-1">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
        />
      </div>
    </div>
  );
};

export default TypingIndicator;
