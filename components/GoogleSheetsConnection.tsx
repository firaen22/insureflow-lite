import React, { useState, useEffect } from 'react';
import { initGoogleClient, signIn, signOut, getIsSignedIn, fetchSheetData, createSpreadsheet, listSpreadsheets, ClientRow } from '../services/googleSheets';

interface Props {
    t: any;
    onSync: (data: any) => void;
}

export const GoogleSheetsConnection: React.FC<Props> = ({ t, onSync }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [sheetId, setSheetId] = useState(localStorage.getItem('user_sheet_id') || '');
    const [status, setStatus] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [availableSheets, setAvailableSheets] = useState<Array<{ id: string, name: string }>>([]);

    useEffect(() => {
        initGoogleClient()
            .then(() => {
                setIsSignedIn(getIsSignedIn());
            })
            .catch((err) => {
                console.error(err);
                setStatus("System Error: Google API failed to load. Check API Keys.");
            });
    }, []);

    const handleSignIn = async () => {
        try {
            await signIn();
            setIsSignedIn(true);
        } catch (e) {
            console.error(e);
            setStatus('Login failed');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setIsSignedIn(false);
    };

    const handleSync = async () => {
        if (!sheetId) return;
        localStorage.setItem('user_sheet_id', sheetId);
        setStatus('Syncing...');
        try {
            const data = await fetchSheetData(sheetId);

            const mappedClients = data.map((row: ClientRow, index: number) => ({
                id: `sheet-${index}-${Date.now()}`,
                name: row.name,
                email: row.email,
                phone: row.phone,
                status: row.status,
                birthday: '1900-01-01',
                totalPolicies: 1,
                lastContact: new Date().toISOString().split('T')[0],
                tags: [row.policy]
            }));

            onSync({ clients: mappedClients });
            setStatus(`Success! Imported ${mappedClients.length} clients.`);
            alert(`Success! Imported ${mappedClients.length} clients from your sheet.`);
            setTimeout(() => setStatus(''), 4000);
        } catch (e: any) {
            console.error(e);
            const msg = e.result?.error?.message || e.message || 'Sync failed.';
            setStatus(`Error: ${msg}`);
            alert(`Sync Error: ${msg}\n\nPlease check:\n1. Is the Sheet ID correct?\n2. Did you enable the API?\n3. Is the sheet empty?`);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-50 flex items-center gap-2"
                title="Connect Database"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Google Sheets Database</h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {!isSignedIn ? (
                                <button
                                    onClick={handleSignIn}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Sign in with Google
                                </button>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Connected
                                        </span>
                                        <button onClick={handleSignOut} className="text-red-500 hover:text-red-600 font-medium">Sign Out</button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">Spreadsheet ID</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={sheetId}
                                                onChange={(e) => setSheetId(e.target.value)}
                                                placeholder="1BxiMVs..."
                                                className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                                            />
                                            <button
                                                onClick={handleShowPicker}
                                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                                                title="Select from Drive"
                                            >
                                                📂
                                            </button>
                                        </div>

                                        {showPicker && (
                                            <div className="absolute bg-white border border-slate-200 shadow-xl rounded-lg p-2 max-h-48 overflow-y-auto w-64 z-10 mt-1">
                                                <div className="text-xs font-bold text-slate-400 mb-2 px-2">YOUR SHEETS</div>
                                                {availableSheets.map(f => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => selectSheet(f.id)}
                                                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-blue-50 text-slate-700 rounded truncate"
                                                    >
                                                        {f.name}
                                                    </button>
                                                ))}
                                                {availableSheets.length === 0 && <div className="text-xs text-slate-400 px-2">No sheets found.</div>}
                                                <button onClick={() => setShowPicker(false)} className="w-full text-center text-xs text-red-400 mt-2 hover:text-red-500">Close</button>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center text-xs mt-1">
                                            <span className="text-slate-500">Or create a new one:</span>
                                            <button
                                                onClick={handleCreateSheet}
                                                className="text-blue-600 hover:text-blue-700 font-medium underline"
                                            >
                                                + Create New Database
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSync}
                                        disabled={!sheetId || status === 'Syncing...'}
                                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${!sheetId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                                            status === 'Syncing...' ? 'bg-blue-100 text-blue-600 cursor-wait' :
                                                'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                    >
                                        {status === 'Syncing...' ? 'Syncing...' : 'Sync Data'}
                                    </button>

                                    {status && status !== 'Syncing...' && (
                                        <div className={`p-3 rounded-lg text-sm ${status.includes('failed') || status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {status}
                                        </div>
                                    )}
                                    <div className="text-xs text-slate-300 text-center mt-4">Debug v1.1</div>
                                </>
                            )}
                        </div>
                        <div className="text-xs text-slate-300 text-center mt-4">Debug v1.2</div>
                    </div>
                </div>
            )}
        </>
    );
};
