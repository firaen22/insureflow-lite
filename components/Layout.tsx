import React from 'react';
import { AppView, Language } from '../types';
import { LayoutDashboard, UploadCloud, Users, Settings, Bell, Menu, Languages, BookOpen } from 'lucide-react';
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
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex-col transition-transform duration-300 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex hidden'}
      `}>
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex-col transition-transform duration-300 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex hidden'}
      `}>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => onChangeView(AppView.DASHBOARD)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.DASHBOARD ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t.nav.dashboard}</span>
            </button>

            <button
              onClick={() => onChangeView(AppView.UPLOAD)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.UPLOAD ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <UploadCloud className="w-5 h-5" />
              <span>{t.nav.upload}</span>
            </button>

            <button
              onClick={() => onChangeView(AppView.CLIENTS)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.CLIENTS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Users className="w-5 h-5" />
              <span>{t.nav.clients}</span>
            </button>

            <button
              onClick={() => onChangeView(AppView.PRODUCTS)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.PRODUCTS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>{t.nav.products}</span>
            </button>

            <button
              onClick={() => onChangeView(AppView.REMINDERS)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.REMINDERS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Bell className="w-5 h-5" />
              <span>{t.nav.reminders}</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => onChangeView(AppView.SETTINGS)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.SETTINGS ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Settings className="w-5 h-5" />
              <span>{t.nav.settings}</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center ml-auto space-x-4">

              {/* Sync Status Badge */}
              {syncStatus && (
                <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all animate-in fade-in zoom-in duration-300
                ${['Saved', 'Synced', 'Loaded'].some(s => syncStatus.includes(s))
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : ['Error', 'Auth'].some(s => syncStatus.includes(s))
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }
              `}>
                  {['Saving', 'Syncing', 'Loading'].some(s => syncStatus.includes(s)) && (
                    <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  {['Saved', 'Synced', 'Loaded'].some(s => syncStatus.includes(s)) && (
                    <span className="text-emerald-500">✓</span>
                  )}
                  {syncStatus}
                </div>
              )}

              {/* Language Switcher */}
              <button
                onClick={onToggleLanguage}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-sm font-medium"
              >
                <Languages className="w-4 h-4" />
                <span>{language === 'en' ? 'EN' : '中'}</span>
              </button>

              <button
                onClick={() => onChangeView(AppView.REMINDERS)}
                className="p-2 text-slate-400 hover:text-brand-600 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
                AD
              </div>
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