
import React, { useState, useEffect } from 'react';
import {
    initGoogleClient,
    signIn,
    signOut,
    getIsSignedIn,
    listSpreadsheets,
    createSpreadsheet,
    saveData,
    loadData
} from '../services/googleSheets';
import { Client, PolicyData } from '../types';

interface Props {
    clients: Client[];
    policies: PolicyData[];
    onSync: (clients: Client[], policies: PolicyData[]) => void;
}

export const GoogleSheetsSync: React.FC<Props> = ({ clients, policies, onSync }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [lastSync, setLastSync] = useState<string>('');
    const [availableSheets, setAvailableSheets] = useState<Array<{ id: string, name: string }>>([]);

    useEffect(() => {
        const init = async () => {
            const initialized = await initGoogleClient();
            if (initialized) {
                const signedIn = getIsSignedIn();
                setIsSignedIn(signedIn);
                if (signedIn) {
                    checkSpreadsheets();
                }
            }
        };
        init();
    }, []);

    const checkSpreadsheets = async () => {
        setStatus('Searching for spreadsheets...');
        try {
            const sheets = await listSpreadsheets();
            setAvailableSheets(sheets);

            // Auto-select if we find a likely candidate
            const existing = sheets.find(s => s.name === "InsureFlow Data");
            if (existing) {
                setSpreadsheetId(existing.id);
                setStatus(`Connected to "${existing.name}"`);
            } else {
                setStatus('No "InsureFlow Data" sheet found.');
            }
        } catch (error: any) {
            setStatus(`Error listing sheets: ${error.message}`);
        }
    };

    const handleSignIn = async () => {
        try {
            await signIn();
            setIsSignedIn(true);
            checkSpreadsheets();
        } catch (error: any) {
            setStatus(`Sign in failed: ${error.message}`);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setIsSignedIn(false);
        setSpreadsheetId(null);
        setAvailableSheets([]);
        setStatus('');
    };

    const handleCreate = async () => {
        setStatus('Creating new spreadsheet...');
        try {
            const id = await createSpreadsheet("InsureFlow Data");
            setSpreadsheetId(id);
            setStatus('Created "InsureFlow Data" successfully!');
            // Refresh list
            const sheets = await listSpreadsheets();
            setAvailableSheets(sheets);
        } catch (error: any) {
            setStatus(`Create failed: ${error.message}`);
        }
    };

    const handleSave = async () => {
        if (!spreadsheetId) return;
        setStatus('Saving to Google Sheets...');
        try {
            await saveData(spreadsheetId, clients, policies);
            setLastSync(new Date().toLocaleTimeString());
            setStatus('Saved successfully!');
        } catch (error: any) {
            console.error(error);
            setStatus(`Save failed: ${error.message}`);
        }
    };

    const handleLoad = async () => {
        if (!spreadsheetId) return;
        setStatus('Loading from Google Sheets...');
        try {
            const data = await loadData(spreadsheetId);
            onSync(data.clients, data.policies);
            setLastSync(new Date().toLocaleTimeString());
            setStatus(`Loaded ${data.clients.length} clients and ${data.policies.length} policies.`);
        } catch (error: any) {
            console.error(error);
            setStatus(`Load failed: ${error.message}`);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-50 flex items-center gap-2"
                title="Google Sheets Sync"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Google Sheets Sync</h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="space-y-6">
                            {!isSignedIn ? (
                                <button
                                    onClick={handleSignIn}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Sign in with Google
                                </button>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            {spreadsheetId ? 'Connected' : 'Signed In'}
                                        </span>
                                        <button onClick={handleSignOut} className="text-red-500 hover:text-red-600 font-medium">Sign Out</button>
                                    </div>

                                    {!spreadsheetId && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-slate-500">Select a spreadsheet or create a new one:</p>
                                            {availableSheets.length > 0 && (
                                                <div className="max-h-32 overflow-y-auto border rounded p-2">
                                                    {availableSheets.map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => { setSpreadsheetId(s.id); setStatus(`Selected ${s.name}`); }}
                                                            className="block w-full text-left px-2 py-1 hover:bg-slate-100 text-sm truncate"
                                                        >
                                                            {s.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleCreate}
                                                className="w-full py-2 px-4 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium"
                                            >
                                                + Create "InsureFlow Data" Sheet
                                            </button>
                                        </div>
                                    )}

                                    {spreadsheetId && (
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleLoad}
                                                className="w-full py-3 px-4 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium flex justify-center gap-2"
                                            >
                                                ⬇️ Load from Sheets
                                            </button>

                                            <button
                                                onClick={handleSave}
                                                className="w-full py-3 px-4 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium flex justify-center gap-2"
                                            >
                                                ⬆️ Save to Sheets
                                            </button>
                                        </div>
                                    )}

                                    {lastSync && <div className="text-center text-xs text-slate-400">Last Sync: {lastSync}</div>}

                                    {status && (
                                        <div className={`p-3 rounded-lg text-sm text-center ${status.includes('failed') || status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {status}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
