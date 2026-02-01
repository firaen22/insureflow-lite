import React, { useState, useEffect } from 'react';
import { initGoogleClient, signIn, signOut, getIsSignedIn } from '../services/googleSheets'; // Reuse auth
import { initDB, exportDB, importDB, getAllData, saveFullState } from '../services/db';
import { findDatabaseFile, downloadDatabaseFile, saveDatabaseFile } from '../services/cloudDrive';

interface Props {
    clients: any[];
    policies: any[];
    onSync: (clients: any[], policies: any[]) => void;
}

export const CloudSyncManager: React.FC<Props> = ({ clients, policies, onSync }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [status, setStatus] = useState('');
    const [fileId, setFileId] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<string>('');

    useEffect(() => {
        const bootstrap = async () => {
            console.log("CloudSyncManager: Bootstrapping...");
            try {
                await initGoogleClient();
                const signedIn = getIsSignedIn();
                console.log("CloudSyncManager: Auth initialized. SignedIn:", signedIn);
                setIsSignedIn(signedIn);
            } catch (e: any) {
                console.error("Auth Init error", e);
                setStatus(`Auth Error: ${e.message || e}`);
            }

            try {
                await initDB();
                console.log("CloudSyncManager: DB initialized.");
            } catch (e: any) {
                console.error("DB Init error", e);
                setStatus(`DB Error: ${e.message || e}. Is sql-wasm.wasm in public/?`);
            }
        };
        bootstrap();
    }, []);

    const handleSignIn = async () => {
        setStatus('Signing in...');
        try {
            console.log("CloudSyncManager: Calling signIn()...");
            await signIn();
            console.log("CloudSyncManager: signIn() returned.");
            setIsSignedIn(true);
            setStatus('Signed in! Checking Drive...');
            await checkForFile();
        } catch (e: any) {
            console.error("Sign In Error", e);
            setStatus(`Login Warning: ${JSON.stringify(e)}`);
            alert(`Login Failed. \n\nError: ${JSON.stringify(e)}\n\nCheck the console (F12) for more details.`);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setIsSignedIn(false);
        setFileId(null);
        setStatus('');
    };

    const checkForFile = async () => {
        setStatus('Searching Drive for "insureflow.sqlite"...');
        try {
            const id = await findDatabaseFile();
            if (id) {
                setFileId(id);
                setStatus('Found existing database!');
            } else {
                setStatus('No database found on Drive.');
                setFileId(null);
            }
        } catch (e: any) {
            setStatus(`Drive Search Error: ${e.message}`);
        }
    };

    const handleDownload = async () => {
        if (!fileId) return;
        setStatus('Downloading database...');
        try {
            const data = await downloadDatabaseFile(fileId);
            await importDB(data);
            const { clients: newClients, policies: newPolicies } = getAllData();
            onSync(newClients, newPolicies);
            setLastSync(new Date().toLocaleTimeString());
            setStatus(`Loaded ${newClients.length} clients & ${newPolicies.length} policies.`);
        } catch (e: any) {
            setStatus(`Download failed: ${e.message}`);
            alert(`Download failed: ${e.message}`);
        }
    };

    const handleUpload = async () => {
        setStatus('Saving to Drive...');
        try {
            saveFullState(clients, policies);
            const data = exportDB();
            const newId = await saveDatabaseFile(data, fileId || undefined);
            setFileId(newId);
            setLastSync(new Date().toLocaleTimeString());
            setStatus('Database saved to Drive successfully!');
        } catch (e: any) {
            console.error(e);
            setStatus(`Upload failed: ${e.message}`);
            alert(`Upload failed: ${e.message}`);
        }
    };

    const handleCreateNew = async () => {
        setStatus('Initializing new database...');
        try {
            await initDB();
            await handleUpload();
        } catch (e: any) {
            setStatus(`Create failed: ${e.message}`);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50 flex items-center gap-2"
                title="Cloud Sync"
            >
                {/* SVG Icon */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Cloud Sync (SQLite)</h2>
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
                                            {fileId ? 'Connected to Drive File' : 'Connected to Google'}
                                        </span>
                                        <button onClick={handleSignOut} className="text-red-500 hover:text-red-600 font-medium">Sign Out</button>
                                    </div>

                                    <div className="space-y-3">
                                        {fileId ? (
                                            <button
                                                onClick={handleDownload}
                                                className="w-full py-3 px-4 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium flex justify-center gap-2"
                                            >
                                                ⬇️ Load from Drive
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleCreateNew}
                                                className="w-full py-3 px-4 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium"
                                            >
                                                + Create New Database File
                                            </button>
                                        )}

                                        <button
                                            onClick={handleUpload}
                                            className="w-full py-3 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium flex justify-center gap-2"
                                        >
                                            ⬆️ Save to Drive
                                        </button>

                                        <button
                                            onClick={() => {
                                                try {
                                                    const data = exportDB();
                                                    const blob = new Blob([data], { type: 'application/x-sqlite3' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `insureflow-${new Date().toISOString().split('T')[0]}.sqlite`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    document.body.removeChild(a);
                                                    setStatus('Downloaded to your computer!');
                                                } catch (e: any) {
                                                    setStatus(`Export Error: ${e.message}`);
                                                }
                                            }}
                                            className="w-full py-3 px-4 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium flex justify-center gap-2"
                                        >
                                            💾 Download Backup (Local)
                                        </button>
                                    </div>

                                    {lastSync && <div className="text-center text-xs text-slate-400">Last Sync: {lastSync}</div>}

                                    {status && (
                                        <div className={`p-3 rounded-lg text-sm text-center ${status.includes('failed') || status.includes('Error') || status.includes('Warning') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
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
