import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import {
  AlertTriangle,
  Phone,
  X,
  CheckCircle2,
  Stethoscope,
  MessageSquare,
  HeartPulse,
  ShieldAlert,
  Minimize2,
  Maximize2,
  Search,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Animated pulse ring used in the "detected" and "connecting" phases
// ─────────────────────────────────────────────────────────────────────────────
const PulseRing = ({ color = '#ef4444' }) => (
  <div className="relative flex items-center justify-center">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${80 + i * 36}px`,
          height: `${80 + i * 36}px`,
          background: color,
          opacity: 0,
          animation: `emergencyPulse 2s ease-out ${i * 0.6}s infinite`,
        }}
      />
    ))}
    <span
      className="relative z-10 flex items-center justify-center rounded-full"
      style={{ width: 80, height: 80, background: color }}
    >
      <AlertTriangle className="w-10 h-10 text-white" strokeWidth={2.5} />
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Spinning loader for the "connecting" phase
// ─────────────────────────────────────────────────────────────────────────────
const ConnectingSpinner = () => (
  <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
    <span
      className="absolute rounded-full border-4 border-transparent"
      style={{
        width: 96,
        height: 96,
        borderTopColor: '#f97316',
        borderRightColor: '#f97316',
        animation: 'spin 1s linear infinite',
      }}
    />
    <span
      className="flex items-center justify-center rounded-full"
      style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
    >
      <Stethoscope className="w-9 h-9 text-white" />
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Green success icon for the "connected" phase
// ─────────────────────────────────────────────────────────────────────────────
const SuccessIcon = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="flex items-center justify-center rounded-full"
    style={{ width: 96, height: 96, background: 'linear-gradient(135deg, #10b981, #059669)' }}
  >
    <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase: detected — patient sees the emergency and chooses yes/no
// ─────────────────────────────────────────────────────────────────────────────
const DetectedPhase = ({ diagnosis, onConfirm, onDismiss }) => (
  <motion.div
    key="detected"
    initial={{ opacity: 0, scale: 0.92, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.92, y: -20 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center text-center gap-6"
  >
    <PulseRing />

    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-white tracking-tight">Emergency Detected</h2>
      <p className="text-red-200 text-sm max-w-xs leading-relaxed">
        Our AI assistant has identified a potentially serious medical situation based on your
        symptoms.
      </p>
    </div>

    {diagnosis && (
      <div
        className="w-full rounded-xl px-4 py-3 text-left"
        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)' }}
      >
        <p className="text-xs uppercase tracking-widest text-red-300 mb-1 font-semibold">
          AI Assessment
        </p>
        <p className="text-white text-sm leading-relaxed">{diagnosis}</p>
      </div>
    )}

    <p className="text-white font-semibold text-base">
      Would you like to speak with a doctor now?
    </p>

    <div className="flex flex-col gap-3 w-full">
      <button
        id="emergency-confirm-btn"
        onClick={onConfirm}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #f97316, #ef4444)',
          boxShadow: '0 4px 24px rgba(239,68,68,0.4)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" />
          Yes, connect me to a doctor
        </span>
      </button>

      <button
        id="emergency-dismiss-btn"
        onClick={onDismiss}
        className="w-full py-3 rounded-xl font-medium text-red-200 text-sm tracking-wide border border-red-400/30 hover:bg-red-400/10 transition-all active:scale-95"
      >
        No, I'm okay for now
      </button>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase: connecting — doctors are being notified (with minimize button)
// ─────────────────────────────────────────────────────────────────────────────
const ConnectingPhase = ({ onMinimize, onCancel }) => (
  <motion.div
    key="connecting"
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center text-center gap-6"
  >
    <ConnectingSpinner />

    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-white tracking-tight">Finding a Doctor</h2>
      <p className="text-orange-200 text-sm max-w-xs leading-relaxed">
        We are still trying to connect you to a doctor. Please wait while we locate an
        available physician.
      </p>
    </div>

    <div
      className="w-full rounded-xl px-4 py-4"
      style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-orange-300 mt-0.5 shrink-0" />
        <p className="text-orange-100 text-xs leading-relaxed text-left">
          If your symptoms are <strong>severe, worsening, or life-threatening</strong>, please
          contact local emergency services or go to the nearest hospital immediately.
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" />
      <p className="text-red-300 text-xs">Notifying available doctors…</p>
    </div>

    <div className="flex gap-3 w-full mt-1">
      <button
        id="emergency-minimize-btn"
        onClick={onMinimize}
        className="flex-1 py-3 rounded-xl font-medium text-orange-200 text-sm tracking-wide border border-orange-400/30 hover:bg-orange-400/10 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Minimize2 className="w-4 h-4" />
        Minimize
      </button>

      <button
        id="emergency-cancel-search-btn"
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl font-medium text-red-300 text-sm tracking-wide border border-red-400/30 hover:bg-red-400/10 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <X className="w-4 h-4" />
        Cancel
      </button>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase: connected — a doctor accepted
// ─────────────────────────────────────────────────────────────────────────────
const ConnectedPhase = ({ doctorName, onOpenChat }) => (
  <motion.div
    key="connected"
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center text-center gap-6"
  >
    <SuccessIcon />

    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-white tracking-tight">Doctor Connected!</h2>
      <p className="text-emerald-200 text-sm max-w-xs leading-relaxed">
        {doctorName
          ? `${doctorName} has accepted your case and is ready to help you.`
          : 'A doctor has accepted your case and is ready to help you.'}
      </p>
    </div>

    <div
      className="w-full rounded-xl px-4 py-3"
      style={{
        background: 'rgba(16,185,129,0.15)',
        border: '1px solid rgba(16,185,129,0.3)',
      }}
    >
      <p className="text-emerald-100 text-xs leading-relaxed">
        A private chat room has been created for you and your doctor. You can discuss your
        symptoms and receive medical guidance in real time.
      </p>
    </div>

    <button
      id="emergency-open-chat-btn"
      onClick={onOpenChat}
      className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        boxShadow: '0 4px 24px rgba(16,185,129,0.4)',
      }}
    >
      <MessageSquare className="w-4 h-4" />
      Open Doctor Chat
    </button>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Minimized pill — shows at bottom of screen when emergency is minimized
// ─────────────────────────────────────────────────────────────────────────────
const MinimizedPill = ({ phase, onExpand }) => {
  const isConnected = phase === 'connected';

  return (
    <motion.button
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onExpand}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl transition-all active:scale-95 hover:scale-105 cursor-pointer"
      style={{
        background: isConnected
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'linear-gradient(135deg, #f97316, #ef4444)',
        boxShadow: isConnected
          ? '0 8px 32px rgba(16,185,129,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
          : '0 8px 32px rgba(239,68,68,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      {isConnected ? (
        <>
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm">Doctor Found! Tap to view</span>
        </>
      ) : (
        <>
          <Search className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-bold text-sm">Finding a doctor…</span>
          <span
            className="w-2 h-2 rounded-full bg-white"
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
        </>
      )}
      <Maximize2 className="w-4 h-4 text-white/70 ml-1" />
    </motion.button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main EmergencyModal component
// ─────────────────────────────────────────────────────────────────────────────
const EmergencyModal = () => {
  const {
    emergencyState,
    emergencyMinimized,
    confirmEmergency,
    dismissEmergency,
    minimizeEmergency,
    expandEmergency,
    openEmergencyConversation,
  } = useChat();

  const { active, phase, diagnosis, doctorName } = emergencyState;

  // Determine backdrop color based on phase
  const backdropColor =
    phase === 'connected'
      ? 'rgba(5, 46, 22, 0.85)'
      : phase === 'connecting'
      ? 'rgba(67, 20, 7, 0.88)'
      : 'rgba(69, 10, 10, 0.9)';

  // Show minimized pill when minimized and still searching or connected
  const showMinimizedPill = active && emergencyMinimized && (phase === 'connecting' || phase === 'connected');

  // Show full modal when active and NOT minimized
  const showFullModal = active && !emergencyMinimized;

  return (
    <>
      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes emergencyPulse {
          0%   { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Minimized pill */}
      <AnimatePresence>
        {showMinimizedPill && (
          <MinimizedPill phase={phase} onExpand={expandEmergency} />
        )}
      </AnimatePresence>

      {/* Full modal */}
      <AnimatePresence>
        {showFullModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40"
              style={{ background: backdropColor, backdropFilter: 'blur(8px)' }}
            />

            {/* Modal card */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Emergency alert"
            >
              <div
                className="relative w-full max-w-sm rounded-2xl p-7 flex flex-col"
                style={{
                  background:
                    phase === 'connected'
                      ? 'linear-gradient(160deg, #064e3b 0%, #022c22 100%)'
                      : phase === 'connecting'
                      ? 'linear-gradient(160deg, #7c1d0c 0%, #450a0a 100%)'
                      : 'linear-gradient(160deg, #7f1d1d 0%, #450a0a 100%)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                {/* Dismiss button — only visible in 'detected' phase */}
                {phase === 'detected' && (
                  <button
                    id="emergency-close-btn"
                    onClick={dismissEmergency}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-500/30 transition-all"
                    aria-label="Close emergency modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <AnimatePresence mode="wait">
                  {phase === 'detected' && (
                    <DetectedPhase
                      key="detected"
                      diagnosis={diagnosis}
                      onConfirm={confirmEmergency}
                      onDismiss={dismissEmergency}
                    />
                  )}

                  {phase === 'connecting' && (
                    <ConnectingPhase
                      key="connecting"
                      onMinimize={minimizeEmergency}
                      onCancel={dismissEmergency}
                    />
                  )}

                  {phase === 'connected' && (
                    <ConnectedPhase
                      key="connected"
                      doctorName={doctorName}
                      onOpenChat={openEmergencyConversation}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyModal;
