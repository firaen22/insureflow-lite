import React, { useState } from 'react';
import { MeetingLog, Client } from '../types';
import { Clock, User, Filter, Search, Calendar, ChevronRight, MessageSquare } from 'lucide-react';

interface MeetingHubViewProps {
    clients: Client[];
    onViewClient: (client: Client) => void;
    t: any;
}

export const MeetingHubView: React.FC<MeetingHubViewProps> = ({ clients, onViewClient, t }) => {
    const [filterDays, setFilterDays] = useState<number | 'all' | 'over90'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Aggregate all logs with client info
    const allLogs = clients.flatMap(client =>
        (client.meetingLogs || []).map(log => ({
            ...log,
            clientName: client.name,
            clientId: client.id,
            clientObj: client
        }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredLogs = allLogs.filter(log => {
        const matchesSearch = log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.summary.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterDays === 'all') return true;

        const logDate = new Date(log.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (filterDays === 'over90') return diffDays > 90;
        return diffDays <= (filterDays as number);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        {t.title}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Timeline of all client interactions and reviews</p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl p-1 rounded-lg border border-white/10 shadow-lg shadow-black/20">
                    {[
                        { label: 'All', value: 'all' },
                        { label: '30d', value: 30 },
                        { label: '60d', value: 60 },
                        { label: '90d', value: 90 },
                        { label: '90d+', value: 'over90' }
                    ].map(btn => (
                        <button
                            key={btn.value}
                            onClick={() => setFilterDays(btn.value as any)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterDays === btn.value
                                ? 'bg-slate-900 text-white shadow-xl shadow-black/40'
                                : 'text-slate-400 hover:bg-white/[0.02]'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search logs or clients..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-lg shadow-black/20"
                />
            </div>

            <div className="space-y-4">
                {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                    <div
                        key={log.id}
                        className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 hover:border-brand-300 transition-all hover:shadow-xl shadow-black/40 group relative overflow-hidden"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/[0.05] group-hover:bg-white/100 transition-colors" />

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${log.type === 'Policy Review' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                        log.type === 'Intro' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            log.type === 'Claim' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-white/[0.02] text-slate-200 border-white/10'
                                        }`}>
                                        {t.types?.[log.type.replace(/\s+/g, '')] || log.type}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {log.date}
                                    </span>
                                </div>

                                <h3
                                    onClick={() => onViewClient(log.clientObj)}
                                    className="font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-colors"
                                >
                                    <User className="w-4 h-4 text-slate-400" />
                                    {log.clientName}
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                                </h3>

                                <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-white/5 pl-3">
                                    "{log.summary}"
                                </p>

                                {log.rawNotes && (
                                    <details className="mt-2 group/notes">
                                        <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-300 font-bold uppercase tracking-tight list-none flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> View Rough Notes
                                        </summary>
                                        <div className="mt-2 p-3 bg-white/[0.02] rounded-lg text-xs text-slate-400 whitespace-pre-wrap leading-normal font-mono">
                                            {log.rawNotes}
                                        </div>
                                    </details>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-dashed border-white/20">
                        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">{t.noLogs}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
