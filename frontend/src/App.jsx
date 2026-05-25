import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { GlossaryPanel } from './components/Tooltip';
import DashboardPage from './pages/DashboardPage';
import InterfacesPage from './pages/InterfacesPage';
import PingPage from './pages/PingPage';
import TraceroutePage from './pages/TraceroutePage';
import DnsPage from './pages/DnsPage';
import HistoryPage from './pages/HistoryPage';
import { fetchHealth } from './utils/api';
import { useLocalStorage } from './hooks/useLocalStorage';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [history, setHistory] = useLocalStorage('netpulse-history', []);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  // Check backend connectivity
  useEffect(() => {
    const check = () => {
      fetchHealth()
        .then(() => setBackendReady(true))
        .catch(() => setBackendReady(false));
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  // Network online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const addHistory = (item) => {
    setHistory(prev => [item, ...prev].slice(0, 100));
  };

  const pages = {
    dashboard:  <DashboardPage onNavigate={setPage} history={history} />,
    interfaces: <InterfacesPage />,
    ping:       <PingPage onResult={addHistory} />,
    traceroute: <TraceroutePage onResult={addHistory} />,
    dns:        <DnsPage onResult={addHistory} />,
    history:    <HistoryPage history={history} onClear={() => setHistory([])} onNavigate={setPage} />,
  };

  return (
    <div className="flex min-h-screen grid-bg">
      <Sidebar
        active={page}
        onNavigate={setPage}
        onGlossary={() => setGlossaryOpen(true)}
        isOnline={isOnline && backendReady}
      />

      <main className="flex-1 overflow-y-auto min-h-screen">
        {/* Backend warning banner */}
        {!backendReady && (
          <div className="sticky top-0 z-40 bg-[#ffaa0011] border-b border-[#ffaa0033] px-6 py-2.5
            text-xs font-mono text-[#ffaa00] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-pulse" />
            Backend server not running — start it with{' '}
            <code className="bg-[#ffaa0011] px-1.5 py-0.5 rounded">cd backend && npm start</code>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {pages[page] || pages.dashboard}
        </div>
      </main>

      <GlossaryPanel isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  );
}
