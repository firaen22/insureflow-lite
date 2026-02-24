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
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-slate-900/85 backdrop-blur-md border-r border-slate-800/50 text-white flex flex-col transition-all duration-300
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>

        {/* Brand Area / Toggle */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-800 transition-all`}>
          {!isCollapsed && <span className="text-lg font-bold truncate transition-opacity">{t.nav.brand}</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => onChangeView(AppView.DASHBOARD)}
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg active:scale-[0.97] transition-all duration-200 ${currentView === AppView.DASHBOARD ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            title={isCollapsed ? t.nav.dashboard : ''}
          >
            <LayoutDashboard className="w-5 h-5 min-w-[20px] group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3 truncate">{t.nav.dashboard}</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.UPLOAD)}
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg active:scale-[0.97] transition-all duration-200 ${currentView === AppView.UPLOAD ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            title={isCollapsed ? t.nav.upload : ''}
          >
            <UploadCloud className="w-5 h-5 min-w-[20px] group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3 truncate">{t.nav.upload}</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.CLIENTS)}
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg active:scale-[0.97] transition-all duration-200 ${currentView === AppView.CLIENTS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            title={isCollapsed ? t.nav.clients : ''}
          >
            <Users className="w-5 h-5 min-w-[20px] group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3 truncate">{t.nav.clients}</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.PRODUCTS)}
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg active:scale-[0.97] transition-all duration-200 ${currentView === AppView.PRODUCTS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            title={isCollapsed ? t.nav.products : ''}
          >
            <BookOpen className="w-5 h-5 min-w-[20px] group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3 truncate">{t.nav.products}</span>}
          </button>

          <button
            onClick={() => onChangeView(AppView.MEETINGS)}
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg active:scale-[0.97] transition-all duration-200 ${currentView === AppView.MEETINGS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            title={isCollapsed ? t.meetings.title : ''}
          >
            <Clock className="w-5 h-5 min-w-[20px] group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3 truncate">{t.meetings.title}</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg active:scale-[0.97] transition-all duration-200 ${currentView === AppView.SETTINGS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            title={isCollapsed ? t.nav.settings : ''}
          >
            <Settings className="w-5 h-5 min-w-[20px] group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3 truncate">{t.nav.settings}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-16 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-all active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center ml-auto space-x-4">

            {/* Sync Status Badge */}
            {syncStatus && (
              <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all animate-in fade-in zoom-in duration-300
                ${['Saving', 'Syncing', 'Loading', 'Connecting'].some(s => syncStatus.includes(s)) ? 'animate-pulse' : ''}
                ${['Saved', 'Synced', 'Loaded'].some(s => syncStatus.includes(s))
                  ? 'bg-emerald-50/80 backdrop-blur-sm text-emerald-700 border-emerald-200/50'
                  : ['Error', 'Auth'].some(s => syncStatus.includes(s))
                    ? 'bg-red-50/80 backdrop-blur-sm text-red-700 border-red-200/50'
                    : ['Not Connected'].some(s => syncStatus.includes(s))
                      ? 'bg-slate-100/80 backdrop-blur-sm text-slate-500 border-slate-200/50'
                      : 'bg-blue-50/80 backdrop-blur-sm text-blue-700 border-blue-200/50'
                }
              `}>
                {['Saving', 'Syncing', 'Loading', 'Connecting'].some(s => syncStatus.includes(s)) && (
                  <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {['Saved', 'Synced', 'Loaded'].some(s => syncStatus.includes(s)) && (
                  <span className="text-emerald-500 animate-in zoom-in spin-in-3 duration-300">✓</span>
                )}
                {['Not Connected'].some(s => syncStatus.includes(s)) && (
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                )}
                {syncStatus}
              </div>
            )}

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all active:scale-95 text-sm font-medium"
            >
              <Languages className="w-4 h-4" />
              <span>{language === 'en' ? 'EN' : '中'}</span>
            </button>

          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};