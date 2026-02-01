
import React from 'react';;

export const SettingsView: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-600">Application settings are coming soon.</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                    <p><strong>App Version:</strong> 0.1.0 (Lite)</p>
                    <p><strong>Backend:</strong> Google Sheets (Active)</p>
                </div>
            </div>
        </div>
    );
};
