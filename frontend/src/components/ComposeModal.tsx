import { useState } from 'react';
import { X, UploadCloud, Clock, Zap, Target } from 'lucide-react';
import Papa from 'papaparse';
import axios from 'axios';

interface ComposeModalProps {
  onClose: () => void;
}

const ComposeModal = ({ onClose }: ComposeModalProps) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [delay, setDelay] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const parsedEmails = results.data
            .map((row: any) => row[0]) // Assuming first column is email
            .filter((email: string) => /^\S+@\S+\.\S+$/.test(email)); // basic validation
          setEmails(parsedEmails);
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emails.length === 0) {
      alert('Please upload a CSV with valid emails');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/campaigns', {
        subject,
        body,
        emails,
        startTime: startTime || new Date().toISOString(),
        delaySeconds: delay,
        hourlyLimit
      });
      onClose();
      // Optionally trigger a refetch of data in dashboard
      window.location.reload();
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      alert('Failed to schedule campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">Create Campaign</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="campaign-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Exciting Job Opportunity!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email Body</label>
              <textarea 
                required
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[120px] resize-y"
                placeholder="Hi there, ..."
              />
            </div>

            <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50 hover:bg-slate-950 transition-colors group relative flex flex-col items-center justify-center text-center">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-blue-500 transition-colors mb-3" />
              <p className="text-sm font-medium text-white mb-1">Upload Contacts CSV</p>
              <p className="text-xs text-slate-500">Only the first column will be used for emails</p>
              
              {emails.length > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/20">
                  <Target size={14} />
                  {emails.length} Valid Emails Detected
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Clock size={16} /> Start Time
                </label>
                <input 
                  type="datetime-local" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Zap size={16} /> Delay (secs)
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={delay}
                  onChange={e => setDelay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Target size={16} /> Hourly Limit
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={hourlyLimit}
                  onChange={e => setHourlyLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="campaign-form"
            disabled={isLoading || emails.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {isLoading ? 'Scheduling...' : 'Schedule Campaign'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ComposeModal;
