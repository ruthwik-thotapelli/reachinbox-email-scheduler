import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';

type EmailJob = {
  id: string;
  toAddress: string;
  status: string;
  scheduledTime: string;
  sentTime: string | null;
  campaign: {
    subject: string;
  };
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      setIsLoading(true);
      try {
        const endpoint = activeTab === 'scheduled' 
          ? 'http://localhost:3000/api/campaigns/scheduled' 
          : 'http://localhost:3000/api/campaigns/sent';
        const response = await axios.get(endpoint);
        setEmails(response.data);
      } catch (error) {
        console.error('Failed to fetch emails', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmails();
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-6 mb-8 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('scheduled')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'scheduled' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            Scheduled
          </div>
          {activeTab === 'scheduled' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full shadow-[0_-4px_12px_rgba(59,130,246,0.5)]" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'sent' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send size={16} />
            Sent
          </div>
          {activeTab === 'sent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full shadow-[0_-4px_12px_rgba(16,185,129,0.5)]" />
          )}
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Subject</th>
                <th className="py-4 px-6">{activeTab === 'scheduled' ? 'Scheduled For' : 'Sent At'}</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-500">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full mb-3" />
                    <p>Loading emails...</p>
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-500">
                    <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      {activeTab === 'scheduled' ? <Calendar size={24} className="text-slate-400" /> : <Send size={24} className="text-slate-400" />}
                    </div>
                    <p>No {activeTab} emails found.</p>
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-slate-200">{email.toAddress}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400 truncate max-w-xs">
                      {email.campaign.subject}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock size={14} className="text-slate-500" />
                        {new Date(activeTab === 'scheduled' ? email.scheduledTime : email.sentTime!).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        email.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        email.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {email.status === 'SCHEDULED' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                        {email.status === 'SENT' && <CheckCircle2 size={12} />}
                        {email.status === 'FAILED' && <XCircle size={12} />}
                        {email.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
