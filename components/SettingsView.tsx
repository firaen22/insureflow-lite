
import React, { useState, useEffect } from 'react';
import { AppSettings, UserProfile, Client, PolicyData, Product } from '../types';
import { Languages, Database, Cloud, Bell, Trash2, Download, RefreshCw, User, Moon, Sun, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { getUserProfile, listSpreadsheets } from '../services/googleSheets';

interface SettingsViewProps {
    settings: AppSettings;
    onUpdateSettings: (newSettings: AppSettings) => void;
    spreadsheetId: string | null;
    setSpreadsheetId: (id: string | null) => void;
    clients: Client[];
    policies: PolicyData[];
    products: Product[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    settings,
    onUpdateSettings,
    spreadsheetId,
    setSpreadsheetId,
    clients,
    policies,
    products
}) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            if (window.gapi?.client?.getToken()) {
                const profile = await getUserProfile();
                setUserProfile(profile);
            }
        } catch (error) {
            console.log("User not signed in or failed to fetch profile");
        }
    };

    const handleTestConnection = async () => {
        setConnectionStatus('unknown');
        setStatusMessage('Testing connection...');
        try {
            await listSpreadsheets();
            setConnectionStatus('connected');
            setStatusMessage('Connection successful!');
            loadUserProfile(); // Refresh profile if possible
        } catch (error: any) {
            setConnectionStatus('error');
            setStatusMessage(`Connection failed: ${error.message}`);
        }
    };

    const handleExportData = () => {
        const data = {
            clients,
            policies,
            products,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insureflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearCache = () => {
        if (confirm("Are you sure you want to clear the browser cache? This might log you out or reset views.")) {
            localStorage.clear();
            sessionStorage.clear();
            setStatusMessage("Cache cleared. Please refresh the page.");
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

            {/* 1. Account & Version */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-500" />
                    Account & System
                </h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {userProfile ? (
                            <>
                                {userProfile.picture ? (
                                    <img src={userProfile.picture} alt="Profile" className="w-12 h-12 rounded-full" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
                                        {userProfile.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-slate-900">{userProfile.name}</p>
                                    <p className="text-sm text-slate-500">{userProfile.email}</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Not Signed In</p>
                                    <p className="text-sm text-slate-500">Sign in via the Sync button to link account.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-500">InsureFlow Lite</p>
                        <p className="text-xs text-slate-400">v0.1.0</p>
                    </div>
                </div>
            </section>

            {/* 2. Preferences */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-brand-500" />
                    Preferences
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                        <select
                            value={settings.language}
                            onChange={(e) => onUpdateSettings({ ...settings, language: e.target.value as any })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        >
                            <option value="en">English (English)</option>
                            <option value="zh">Traditional Chinese (繁體中文)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                                className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg transition-colors ${settings.theme === 'light' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Sun className="w-4 h-4" /> Light
                            </button>
                            <button
                                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                                className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg transition-colors ${settings.theme === 'dark' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                    }`}
                                title="Dark mode is coming soon"
                            >
                                <Moon className="w-4 h-4" /> Dark
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. AI Parsing Settings (Gemini API) */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-500" />
                    AI Parsing Settings (Gemini API)
                </h2>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Enter your Google Gemini API Key to enable automated policy parsing.
                        This key is stored <strong>locally in your browser</strong> and is never sent to our servers.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter Gemini API Key..."
                            className="flex-1 p-2 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                            onClick={handleSaveKey}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Save
                        </button>
                        {isKeySaved && (
                            <button
                                onClick={handleClearKey}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {isKeySaved && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>API Key is set and ready.</span>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Google Sheets Connection */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-brand-500" />
                    Connection
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Spreadsheet ID</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={spreadsheetId || ''}
                                onChange={(e) => setSpreadsheetId(e.target.value)}
                                placeholder="Not connected"
                                className="flex-1 p-2 border border-slate-300 rounded-lg text-slate-700 font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            />
                            <button
                                onClick={handleTestConnection}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Test
                            </button>
                        </div>
                        {statusMessage && (
                            <div className={`mt-2 text-sm flex items-center gap-2 ${connectionStatus === 'connected' ? 'text-green-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                                {connectionStatus === 'connected' ? <CheckCircle className="w-4 h-4" /> : connectionStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : null}
                                {statusMessage}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 5. Rules */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-brand-500" />
                    Rules & Notifications
                </h2>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Policy Anniversary Reminder (Days)</label>
                    <p className="text-xs text-slate-500 mb-2">Show reminders for policies originating within this many days.</p>
                    <input
                        type="number"
                        value={settings.reminderDays}
                        onChange={(e) => onUpdateSettings({ ...settings, reminderDays: parseInt(e.target.value) || 60 })}
                        className="w-32 p-2 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        min="1"
                        max="365"
                    />
                </div>
            </section>

            {/* 6. Data Management */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-brand-500" />
                    Data Management
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={handleExportData}
                        className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
                    >
                        <Download className="w-5 h-5" />
                        Export Data (JSON)
                    </button>
                    <button
                        onClick={handleClearCache}
                        className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
                    >
                        <Trash2 className="w-5 h-5" />
                        Clear Local Cache
                    </button>
                </div>
            </section>

        </div>
    );
};
