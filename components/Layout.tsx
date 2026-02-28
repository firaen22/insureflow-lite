import React from 'react';
import { AppView, Language } from '../types';
import { LayoutDashboard, UploadCloud, Users, Settings, Bell, Menu, Languages, BookOpen, Clock, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  language: Language;
  onToggleLanguage: () => void;
  t: typeof TRANSLATIONS['en'];
  children: React.ReactNode;
  syncStatus?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  onChangeView,
  language,
  onToggleLanguage,
  t,
  children,
  syncStatus,
  theme,
  onToggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className={`flex h-screen overflow-hidden relative font-sans selection:bg-brand-500/20 selection:text-brand-700 dark:selection:bg-white/20 dark:selection:text-slate-900 dark:text-white transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-slate-900 dark:text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* 
          3D Space Atmosphere: 
          - Navy/White Base
          - Volumetric Glows
          - Subtle Grid/Depth 
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-Left Volumetric Glow */}
        <div className={`absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full blur-[120px] transition-colors duration-1000 ${theme === 'dark' ? 'bg-slate-800/10' : 'bg-brand-500/5'}`} />
        {/* Bottom-Right White Glow */}
        <div className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] transition-colors duration-1000 ${theme === 'dark' ? 'bg-white dark:bg-white/[0.03]' : 'bg-brand-100/30'}`} />
        {/* Subtle Perspective Grid */}
        <div
          className={`absolute inset-0 opacity-[0.03] transition-opacity ${theme === 'dark' ? 'opacity-[0.03]' : 'opacity-[0.1]'}`}
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${theme === 'dark' ? 'white' : '#0ea5e9'} 1px, transparent 0)`,
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
        fixed md:static inset-y-0 left-0 z-50 transition-all duration-500 border-r
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        ${theme === 'dark' ? 'bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl border-slate-100 dark:border-white/5 text-slate-900 dark:text-white' : 'bg-white shadow-sm dark:shadow-xl border-slate-200 text-slate-900'}
      `}>

        {/* Brand Area / Toggle */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-100 dark:border-white/5 transition-all`}>
          {!isCollapsed && (
            <span className={`text-lg font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent transition-opacity ${theme === 'dark' ? 'from-white to-slate-400' : 'from-brand-600 to-brand-900'}`}>
              {t.nav.brand.toUpperCase()}
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white' : 'hover:bg-slate-100 text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
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
                  ? `${theme === 'dark' ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border-slate-200 dark:border-white/10' : 'bg-brand-50 text-brand-600 border-brand-100'}`
                  : `border-transparent ${theme === 'dark' ? 'text-slate-500 hover:bg-white dark:bg-white/5 hover:text-slate-700 dark:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-600'}`}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className={`w-5 h-5 min-w-[20px] transition-transform duration-500 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {!isCollapsed && <span className="ml-3 font-medium tracking-wide">{item.label}</span>}
              {currentView === item.id && !isCollapsed && (
                <div className={`ml-auto w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white shadow-[0_0_8px_white]' : 'bg-brand-600 shadow-[0_0_8px_rgba(14,165,233,0.5)]'}`} />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className={`
              group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300
              ${currentView === AppView.SETTINGS
                ? `${theme === 'dark' ? 'bg-white/10 text-white border-slate-200 dark:border-white/10' : 'bg-brand-50 text-brand-600 border-brand-100'}`
                : `border-transparent ${theme === 'dark' ? 'text-slate-500 hover:bg-white dark:bg-white/5 hover:text-slate-700 dark:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-600'}`}
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
        <header className={`h-16 flex items-center justify-between px-6 z-10 transition-colors border-b ${theme === 'dark' ? 'bg-slate-900/20 backdrop-blur-xl border-slate-100 dark:border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
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
                  ? 'bg-white dark:bg-white/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                  : ['Error', 'Auth'].some(s => syncStatus.includes(s))
                    ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                    : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5'
                }
              `}>
                {['Saving', 'Syncing', 'Loading', 'Connecting'].some(s => syncStatus.includes(s)) && (
                  <div className="w-1.5 h-1.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {syncStatus}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`flex items-center justify-center w-9 h-9 transition-all rounded-lg border active:scale-95 ${theme === 'dark' ? 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-amber-400 border-slate-200 dark:border-white/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className={`flex items-center space-x-2 px-3 py-1.5 transition-all font-bold text-xs rounded-lg border ${theme === 'dark' ? 'bg-white dark:bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white/70 hover:text-slate-900 dark:text-white border-slate-200 dark:border-white/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200'}`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'EN' : language === 'zh' ? '繁' : '简'}</span>
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