
import React, { useState, useEffect } from 'react';
import { AppSettings, UserProfile, Client, PolicyData, Product } from '../types';
import { Languages, Database, Cloud, Bell, Trash2, Download, RefreshCw, User, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
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

    // Gemini API Key State
    const [apiKey, setApiKey] = useState('');
    const [isKeySaved, setIsKeySaved] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('');

    useEffect(() => {
        loadUserProfile();
        const savedKey = localStorage.getItem('gemini_api_key');
        const savedModel = localStorage.getItem('gemini_model_id');
        const cached = localStorage.getItem('cached_models');
        if (savedKey) {
            setApiKey(savedKey);
            setIsKeySaved(true);
        }
        if (savedModel) {
            setSelectedModel(savedModel);
        }
        if (cached) {
            try { setAvailableModels(JSON.parse(cached)); } catch (e) { }
        }
    }, []);

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            setIsKeySaved(true);
        }
    };

    const handleClearKey = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setIsKeySaved(false);
    };

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

                <div className="space-y-4">
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
                </div>
            </section>

            {/* 3. AI Parsing Settings (Pro) */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-500" />
                    AI Parsing Settings
                </h2>

                <div className="space-y-4">
                    {/* Provider Select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">AI Provider</label>
                        <select
                            value={settings.aiProvider || 'gemini'}
                            onChange={(e) => onUpdateSettings({ ...settings, aiProvider: e.target.value as any })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="kimi">Kimi / Moonshot AI (OpenAI Compatible)</option>
                            <option value="nvidia">NVIDIA NIM</option>
                            <option value="openai">OpenAI (GPT-4 Vision)</option>
                        </select>
                    </div>

                    {/* Base URL (Conditional) */}
                    {(settings.aiProvider === 'kimi' || settings.aiProvider === 'openai' || settings.aiProvider === 'nvidia') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {settings.aiProvider === 'kimi' ? 'Moonshot API Base URL' :
                                    settings.aiProvider === 'nvidia' ? 'NVIDIA Base URL' : 'OpenAI Base URL'}
                            </label>
                            <input
                                type="text"
                                value={settings.aiBaseUrl || (
                                    settings.aiProvider === 'kimi' ? 'https://api.moonshot.cn/v1' :
                                        settings.aiProvider === 'nvidia' ? 'https://integrate.api.nvidia.com/v1' :
                                            'https://api.openai.com/v1'
                                )}
                                onChange={(e) => onUpdateSettings({ ...settings, aiBaseUrl: e.target.value })}
                                placeholder="https://api.moonshot.cn/v1"
                                className="w-full p-2 border border-slate-300 rounded-lg text-slate-700 text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {settings.aiProvider === 'kimi' ? "Default: https://api.moonshot.cn/v1" :
                                    settings.aiProvider === 'nvidia' ? "Default: https://integrate.api.nvidia.com/v1" :
                                        "Default: https://api.openai.com/v1"}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                        <p className="text-xs text-slate-500 mb-2">
                            Stored locally in your browser.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    const newKey = e.target.value;
                                    setApiKey(newKey);

                                    // Auto-detect provider based on key prefix
                                    if (newKey.startsWith('AIza')) {
                                        if (settings.aiProvider !== 'gemini') {
                                            onUpdateSettings({ ...settings, aiProvider: 'gemini' });
                                        }
                                    } else if (newKey.startsWith('nvapi-')) {
                                        if (settings.aiProvider !== 'nvidia') {
                                            onUpdateSettings({ ...settings, aiProvider: 'nvidia' });
                                        }
                                    } else if (newKey.startsWith('sk-')) {
                                        // 'sk-' is used by OpenAI, Moonshot (Kimi), and others.
                                        // Only switch if currently on a provider that definitely doesn't use sk- (like Gemini or NVIDIA)
                                        // If user is already on Kimi or OpenAI, leave it as is to avoid overriding specific choice.
                                        if (settings.aiProvider !== 'openai' && settings.aiProvider !== 'kimi') {
                                            onUpdateSettings({ ...settings, aiProvider: 'openai' });
                                        }
                                    }
                                }}
                                placeholder={`Enter ${settings.aiProvider === 'gemini' ? 'Gemini' : 'API'} Key...`}
                                className="flex-1 p-2 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <button
                                onClick={async () => {
                                    handleSaveKey();
                                    try {
                                        setStatusMessage("Verifying key and fetching models...");
                                        const { validateAIKey } = await import('../services/gemini');
                                        const models = await validateAIKey(settings.aiProvider || 'gemini', apiKey, settings.aiBaseUrl);

                                        setAvailableModels(models);

                                        // Auto-select logic
                                        let defaultModel = '';
                                        if (settings.aiProvider === 'gemini') {
                                            defaultModel = models.includes('gemini-1.5-flash') ? 'gemini-1.5-flash' : models[0];
                                        } else if (settings.aiProvider === 'kimi') {
                                            // Moonshot usually has moonshot-v1-8k, 32k, 128k
                                            defaultModel = models.find(m => m.includes('moonshot-v1')) || models[0];
                                        } else if (settings.aiProvider === 'nvidia') {
                                            // Select a vision model if available
                                            defaultModel = models.find(m => m.includes('llama-3.2-11b-vision')) ||
                                                models.find(m => m.includes('neva')) ||
                                                models.find(m => m.includes('vision')) ||
                                                models[0];
                                        } else {
                                            defaultModel = models.includes('gpt-4-turbo') ? 'gpt-4-turbo' : models[0];
                                        }

                                        if (defaultModel) {
                                            setSelectedModel(defaultModel);
                                            localStorage.setItem('gemini_model_id', defaultModel);
                                        }

                                        // Persist provider settings
                                        localStorage.setItem('ai_provider', settings.aiProvider || 'gemini');
                                        localStorage.setItem('ai_base_url', settings.aiBaseUrl || '');
                                        localStorage.setItem('cached_models', JSON.stringify(models));

                                        alert(`Key Verified! Available models: ${models.join(', ')}`);
                                    } catch (e) {
                                        const provider = settings.aiProvider || 'gemini';
                                        let fallbacks: string[] = [];

                                        if (provider === 'nvidia') {
                                            fallbacks = ['nvidia/neva-22b', 'meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct'];
                                        } else if (provider === 'kimi') {
                                            fallbacks = ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
                                        } else if (provider === 'openai') {
                                            fallbacks = ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini'];
                                        }

                                        if (fallbacks.length > 0) {
                                            setAvailableModels(fallbacks);
                                            setSelectedModel(fallbacks[0]);
                                            localStorage.setItem('gemini_model_id', fallbacks[0]);
                                            localStorage.setItem('cached_models', JSON.stringify(fallbacks));
                                            localStorage.setItem('ai_provider', provider);
                                            localStorage.setItem('ai_base_url', settings.aiBaseUrl || '');
                                            alert(`Connection check failed (${(e as Error).message}), but enabled standard models for ${provider}. You can proceed.`);
                                        } else {
                                            alert(`Key Verification Failed: ${(e as Error).message}`);
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Verify & Save
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
                    </div>

                    {availableModels.length > 0 && (
                        <div className="mt-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select AI Model</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => {
                                    setSelectedModel(e.target.value);
                                    localStorage.setItem('gemini_model_id', e.target.value);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> key works with selected model.
                            </p>
                        </div>
                    )}

                    {isKeySaved && availableModels.length === 0 && (
                        <div className="text-sm text-amber-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>Key saved, but not verified. Click "Verify & Save" to check models.</span>
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
