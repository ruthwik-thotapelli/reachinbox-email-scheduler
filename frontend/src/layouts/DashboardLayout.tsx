import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Plus } from 'lucide-react';
import { useState } from 'react';
import ComposeModal from '../components/ComposeModal';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-white tracking-tight">ReachInbox</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/10 text-blue-500 font-medium transition-colors">
            <LayoutDashboard size={20} />
            Dashboard
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10">
          <h1 className="text-xl font-semibold text-white">Campaigns</h1>
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            <Plus size={18} />
            New Campaign
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>

      {isComposeOpen && <ComposeModal onClose={() => setIsComposeOpen(false)} />}
    </div>
  );
};

export default DashboardLayout;
