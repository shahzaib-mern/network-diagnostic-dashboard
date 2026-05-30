import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { GlossaryPanel } from './components/Tooltip';
import DashboardPage from './pages/DashboardPage';
import InterfacesPage from './pages/InterfacesPage';
import PingPage from './pages/PingPage';
import TraceroutePage from './pages/TraceroutePage';
import DnsPage from './pages/DnsPage';
import HistoryPage from './pages/HistoryPage';
import GlossaryPage from './pages/GlossaryPage';
import { fetchHealth } from './utils/api';
import { useLocalStorage } from './hooks/useLocalStorage';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [history, setHistory] = useLocalStorage('netpulse-history', []);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      try { await fetchHealth(); setBackendReady(true); }
      catch { setBackendReady(false); }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const addHistory = (item) => setHistory(prev => [item, ...prev].slice(0, 100));

  const pages = {
    dashboard:  <DashboardPage onNavigate={setPage} history={history} />,
    interfaces: <InterfacesPage />,
    ping:       <PingPage onResult={addHistory} />,
    traceroute: <TraceroutePage onResult={addHistory} />,
    dns:        <DnsPage onResult={addHistory} />,
    history:    <HistoryPage history={history} onClear={() => setHistory([])} onNavigate={setPage} />,
    glossary:   <GlossaryPage />,
  };

  return (
    <div className="flex min-h-screen grid-bg" style={{ background: '#0a0e1a', color: '#e2e8f0' }}>
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
            Backend not running — start with{' '}
            <code className="bg-[#ffaa0011] px-1.5 py-0.5 rounded">npm run dev</code>
            {' '}from the project root
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
