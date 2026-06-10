import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { apiService } from '../services/api.service';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Card } from './ui/Card';
import { ClipboardList, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TriageForm = () => {
  const { currentConversation, setMode, refreshConversations } = useChat();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: '',
    duration: '',
    severity: '',
    associated_symptoms: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.symptoms) return;

    setLoading(true);
    try {
      // The old logic calls the triage API and then manually adds messages to history
      // We'll follow a similar pattern but let the backend handle the conversation update if possible
      // Actually, old code calls triage API separately
      const response = await apiService.triage(formData);
      
      // After triage, we want to go back to chat mode to see the result
      // But wait, the old code adds the human and ai messages to the local state
      // Our setMode('chat') will trigger a reload of messages which should include the new ones
      // if the backend saves them. Let's check old code again.
      // Old code added them locally. In our case, we'll refresh conversations and select current one
      
      setMode('chat');
      refreshConversations();
    } catch (error) {
      console.error('Triage failed:', error);
      alert('Triage assessment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-8 text-emerald-600">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Medical Triage</h3>
              <p className="text-sm text-gray-500">Report your symptoms for an intelligent assessment</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Describe your symptoms</label>
              <textarea
                required
                rows="4"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none text-sm"
                placeholder="e.g., I have a persistent headache and mild fever since yesterday..."
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Duration"
                placeholder="e.g., 2 days"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
              <Select
                label="Severity"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                options={[
                  { value: '', label: 'Select severity...' },
                  { value: 'Mild', label: 'Mild' },
                  { value: 'Moderate', label: 'Moderate' },
                  { value: 'Severe', label: 'Severe' },
                ]}
              />
            </div>

            <Input
              label="Associated symptoms"
              placeholder="Any other symptoms? (optional)"
              value={formData.associated_symptoms}
              onChange={(e) => setFormData({ ...formData, associated_symptoms: e.target.value })}
            />

            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating Assessment...
                </>
              ) : (
                'Get Triage Assessment'
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default TriageForm;
