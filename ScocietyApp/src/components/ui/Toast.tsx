import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    const success = (msg: string) => addToast(msg, "success");
    const error = (msg: string) => addToast(msg, "error");
    const info = (msg: string) => addToast(msg, "info");

    return (
        <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-[400px]">
                {toasts.map((t) => (
                    <ToastItem key={t.id} {...t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ message, type, onClose }: Toast & { onClose: () => void }) => {
    const icons: Record<ToastType, LucideIcon> = {
        success: CheckCircle2,
        error: AlertCircle,
        info: Info,
    };

    const Icon = icons[type];

    const styles = {
        success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400",
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg pointer-events-auto animate-in slide-in-from-top-4 sm:slide-in-from-right-full duration-300 w-full",
                styles[type]
            )}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="ml-auto p-1 hover:bg-black/5 rounded-full transition-colors"
            >
                <X className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
        </div>
    );
};
