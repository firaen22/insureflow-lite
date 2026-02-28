import React from 'react';
import { AppView, Language } from '../types';
import { LayoutDashboard, UploadCloud, Users, Settings, Bell, Menu, Languages, BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  language: Language;
  onToggleLanguage: () => void;
  t: typeof TRANSLATIONS['en'];
  children: React.ReactNode;
  syncStatus?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  onChangeView,
  language,
  onToggleLanguage,
  t,
  children,
  syncStatus
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative font-sans selection:bg-white/20 selection:text-white">
      {/* 
          3D Space Atmosphere: 
          - Navy Base
          - White Volumetric Glows
          - Subtle Grid/Depth 
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-Left Volumetric Glow */}
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-slate-800/10 blur-[120px]" />
        {/* Bottom-Right White Glow */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-[150px]" />
        {/* Subtle Perspective Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 text-white flex flex-col transition-all duration-500
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>

        {/* Brand Area / Toggle */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-white/5 transition-all`}>
          {!isCollapsed && (
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent transition-opacity">
              {t.nav.brand.toUpperCase()}
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: AppView.DASHBOARD, icon: LayoutDashboard, label: t.nav.dashboard },
            { id: AppView.UPLOAD, icon: UploadCloud, label: t.nav.upload },
            { id: AppView.CLIENTS, icon: Users, label: t.nav.clients },
            { id: AppView.PRODUCTS, icon: BookOpen, label: t.nav.products },
            { id: AppView.MEETINGS, icon: Clock, label: t.meetings.title },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`
                group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300
                ${currentView === item.id
                  ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className={`w-5 h-5 min-w-[20px] transition-transform duration-500 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {!isCollapsed && <span className="ml-3 font-medium tracking-wide">{item.label}</span>}
              {currentView === item.id && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className={`
              group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300
              ${currentView === AppView.SETTINGS
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
            `}
            title={isCollapsed ? t.nav.settings : ''}
          >
            <Settings className={`w-5 h-5 min-w-[20px] transition-transform duration-700 ${currentView === AppView.SETTINGS ? 'rotate-90 scale-110' : 'group-hover:rotate-45'}`} />
            {!isCollapsed && <span className="ml-3 font-medium">{t.nav.settings}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-slate-900/20 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-6 z-10 transition-colors">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-md transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center ml-auto space-x-6">

            {/* Sync Status Badge */}
            {syncStatus && (
              <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border transition-all duration-500
                ${['Saving', 'Syncing', 'Loading', 'Connecting'].some(s => syncStatus.includes(s)) ? 'animate-pulse' : ''}
                ${['Saved', 'Synced', 'Loaded'].some(s => syncStatus.includes(s))
                  ? 'bg-white/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                  : ['Error', 'Auth'].some(s => syncStatus.includes(s))
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-white/5 text-slate-400 border-white/5'
                }
              `}>
                {['Saving', 'Syncing', 'Loading', 'Connecting'].some(s => syncStatus.includes(s)) && (
                  <div className="w-1.5 h-1.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {syncStatus}
              </div>
            )}

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg border border-white/10 transition-all font-bold text-xs"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'EN' : '中'}</span>
            </button>

          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};