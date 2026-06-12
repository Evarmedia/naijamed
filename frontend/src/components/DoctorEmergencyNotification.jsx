import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Stethoscope,
  Loader2,
} from 'lucide-react';

const EmergencyCard = ({ emergency, onAccept, onDecline }) => {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept(emergency.caseId);
  };

  const handleDecline = async () => {
    setDeclining(true);
    await onDecline(emergency.caseId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 320, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 320, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative w-80 overflow-hidden rounded-2xl shadow-2xl"
      style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(239,68,68,0.15)',
      }}
    >
      {/* Red accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)' }}
      />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white leading-tight">
            🚨 Emergency Alert
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Action required</p>
        </div>
        <span
          className="ml-auto inline-block w-2 h-2 rounded-full bg-red-500 shrink-0"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        />
      </div>

      {/* Body */}
      <div className="px-5 pb-3 space-y-3">
        {/* Patient info */}
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.2)' }}
          >
            <User className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Patient</p>
            <p className="text-sm font-semibold text-white truncate">
              {emergency.patientName || 'Unknown Patient'}
            </p>
          </div>
        </div>

        {/* Diagnosis */}
        {emergency.diagnosis && (
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-3.5 h-3.5 text-red-400" />
              <p className="text-[10px] uppercase tracking-widest text-red-300 font-semibold">
                AI Diagnosis
              </p>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
              {emergency.diagnosis}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleAccept}
            disabled={accepting || declining}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            {accepting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            {accepting ? 'Accepting…' : 'Accept'}
          </button>

          <button
            onClick={handleDecline}
            disabled={accepting || declining}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 transition-all active:scale-95 disabled:opacity-50 hover:bg-white/10"
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {declining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            {declining ? 'Declining…' : 'Decline'}
          </button>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  );
};

/**
 * DoctorEmergencyNotification — renders stacked emergency notification cards
 * in the top-right corner of the screen for doctor users.
 */
const DoctorEmergencyNotification = () => {
  const {
    doctorEmergencies,
    acceptDoctorEmergency,
    declineDoctorEmergency,
  } = useChat();

  if (!doctorEmergencies.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
      <AnimatePresence mode="popLayout">
        {doctorEmergencies.map((emergency) => (
          <EmergencyCard
            key={emergency.caseId}
            emergency={emergency}
            onAccept={acceptDoctorEmergency}
            onDecline={declineDoctorEmergency}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DoctorEmergencyNotification;
