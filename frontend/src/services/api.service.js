import axios from 'axios';

const API_BASE_URL = 'http://localhost:3055/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export const apiService = {
  // Auth
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (userData) => apiClient.post('/auth/signup', userData),
  verifyOtp: (email, otp) => apiClient.post('/auth/verify-otp', { email, otp }),

  // Chat
  getConversations: () => apiClient.get('/chats'),
  initiateConversation: (type, options = {}) => apiClient.post('/chats/initiate', { type, ...options }),
  getMessages: (conversationId, page = 1, limit = 50) =>
    apiClient.get(`/chats/${conversationId}/messages`, { params: { page, limit } }),
  sendMessage: (conversationId, message) =>
    apiClient.post(`/chats/${conversationId}/messages`, { message, message_type: 'text' }),

  // Users / Doctors
  getDoctors: () => apiClient.get('/users/doctors'),

  // AI
  triage: (data) => apiClient.post('/ai/triage', data),

  // Emergency
  // Patient confirms they want a doctor — triggers batch doctor notifications
  confirmEmergency: (caseId) => apiClient.post(`/emergencies/confirm/${caseId}`),
  // Patient declines to see a doctor — cancels the emergency log
  declineEmergency: (caseId) => apiClient.post(`/emergencies/decline/${caseId}`),
  // Doctor accepts a case (doctor-side, kept here for completeness)
  acceptEmergency: (caseId) => apiClient.post(`/emergencies/accept/${caseId}`),
  // Get emergency history
  getEmergencies: (params) => apiClient.get('/emergencies', { params }),
};
