import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api.service';
import { 
  MessageSquare, 
  Hospital, 
  Stethoscope, 
  Users, 
  Search, 
  X, 
  User as UserIcon,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StartupView = () => {
  const { startNewChat } = useChat();
  const { user } = useAuth();
  
  // Doctor modal states
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorError, setDoctorError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch doctors when modal opens
  useEffect(() => {
    if (showDoctorModal) {
      const fetchDoctors = async () => {
        setLoadingDoctors(true);
        setDoctorError(null);
        try {
          const res = await apiService.getDoctors();
          setDoctors(res.doctors || []);
        } catch (err) {
          console.error('Failed to load doctors:', err);
          setDoctorError('Could not retrieve available doctors. Please try again.');
        } finally {
          setLoadingDoctors(false);
        }
      };
      fetchDoctors();
    }
  }, [showDoctorModal]);

  const handleSelectDoctor = (doctorUserId) => {
    setShowDoctorModal(false);
    startNewChat('patient_doctor', 'chat', { doctor_user_id: doctorUserId });
  };

  // Filtered doctors list based on search query
  const filteredDoctors = doctors.filter(doc => {
    const fullName = `${doc.user?.first_name || ''} ${doc.user?.last_name || ''}`.toLowerCase();
    const spec = (doc.specialization || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || spec.includes(query);
  });

  // Options shown to doctors
  const doctorOptions = [
    {
      id: 'doctor-ai',
      title: 'Consult Doctor AI',
      desc: 'Ask our medical AI assistant for clinical information & support',
      icon: <Stethoscope className="w-8 h-8 text-emerald-500" />,
      onClick: () => startNewChat('doctor_ai', 'chat'),
    },
    {
      id: 'patient-ai-test',
      title: 'Test Patient AI',
      desc: 'Interact with the patient-facing AI assistant to review flows',
      icon: <MessageSquare className="w-8 h-8 text-blue-500" />,
      onClick: () => startNewChat('patient_ai', 'chat'),
    },
  ];

  // Options shown to patients
  const patientOptions = [
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
    {
      id: 'doctor-patient',
      title: 'Chat with a Doctor',
      desc: 'Connect and chat directly with available doctors',
      icon: <Users className="w-8 h-8 text-purple-500" />,
      onClick: () => setShowDoctorModal(true),
    },
  ];

  const currentOptions = user?.role === 'doctor' ? doctorOptions : patientOptions;

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 relative h-full overflow-y-auto">
      <div className="max-w-xl w-full text-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
        >
          <Activity className="w-10 h-10 animate-pulse" />
        </motion.div>

        <motion.h3 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Welcome to NaijaMed
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 mb-10"
        >
          {user?.role === 'doctor' 
            ? 'Access AI diagnostic tooling and simulated test environments' 
            : 'Select an option to get clinical guidance or contact a doctor'}
        </motion.p>

        <div className="grid grid-cols-1 gap-4">
          {currentOptions.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={opt.onClick}
              className="flex items-center p-5 bg-white rounded-2xl border border-gray-100 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 text-left group"
            >
              <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-emerald-50 transition-colors mr-6">
                {opt.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-1">{opt.title}</h4>
                <p className="text-sm text-gray-500">{opt.desc}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Doctor Selection Modal */}
      <AnimatePresence>
        {showDoctorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Available Doctors</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Select a doctor to start a consultation chat</p>
                </div>
                <button 
                  onClick={() => setShowDoctorModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or specialization..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Doctors list container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[200px]">
                {loadingDoctors && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500 mt-3">Loading available doctors...</span>
                  </div>
                )}

                {doctorError && (
                  <div className="text-center py-8 text-red-500 text-sm">
                    {doctorError}
                  </div>
                )}

                {!loadingDoctors && !doctorError && filteredDoctors.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No doctors found matching "{searchQuery}"</p>
                  </div>
                )}

                {!loadingDoctors && !doctorError && filteredDoctors.map((doc) => {
                  const doctorName = `Dr. ${doc.user?.first_name || ''} ${doc.user?.last_name || ''}`;
                  return (
                    <motion.div
                      key={doc.doctor_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-white border border-gray-150 rounded-2xl hover:border-emerald-500 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {doc.user?.profile_url ? (
                          <img 
                            src={`http://localhost:3055${doc.user.profile_url}`} 
                            alt={doctorName}
                            className="w-12 h-12 rounded-xl object-cover shadow-inner"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg border border-emerald-100">
                            {doc.user?.first_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h5 className="font-bold text-gray-900 truncate leading-tight">{doctorName}</h5>
                          <p className="text-xs text-emerald-600 font-medium truncate mt-0.5">{doc.specialization || 'General Practitioner'}</p>
                          {doc.hospital_affiliation && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{doc.hospital_affiliation}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectDoctor(doc.user_id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer shadow-sm group-hover:shadow"
                      >
                        Chat
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
  );
};

export default StartupView;
