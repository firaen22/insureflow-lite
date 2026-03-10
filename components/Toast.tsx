import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info as InfoIcon, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    show: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

const ICON_MAP: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
    info: <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
};

const BG_MAP: Record<ToastType, string> = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        const dur = toast.duration ?? 4000;
        if (dur > 0) {
            timerRef.current = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onDismiss(toast.id), 300);
            }, dur);
        }
        return () => clearTimeout(timerRef.current);
    }, [toast.id, toast.duration, onDismiss]);

    const handleDismiss = () => {
        clearTimeout(timerRef.current);
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    };

    return (
        <div
            className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
        shadow-lg shadow-black/10
        max-w-md w-full pointer-events-auto
        transition-all duration-300 ease-out
        ${BG_MAP[toast.type]}
        ${isExiting
                    ? 'opacity-0 translate-x-8 scale-95'
                    : 'opacity-100 translate-x-0 scale-100 animate-in fade-in slide-in-from-right-4'
                }
      `}
        >
            {ICON_MAP[toast.type]}
            <p className="text-sm text-slate-900 dark:text-white flex-1 leading-relaxed break-words">
                {toast.message}
            </p>
            <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0 mt-0.5"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const idCounter = useRef(0);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        const id = `toast-${++idCounter.current}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const value: ToastContextValue = {
        show,
        success: (msg, dur) => show(msg, 'success', dur),
        error: (msg, dur) => show(msg, 'error', dur),
        info: (msg, dur) => show(msg, 'info', dur),
        warning: (msg, dur) => show(msg, 'warning', dur),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast container — fixed top-right */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none print:hidden">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
