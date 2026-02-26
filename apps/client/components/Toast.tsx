"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiCheckCircleOutline, mdiAlertCircleOutline, mdiInformationOutline, mdiClose } from "@mdi/js";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

const config: Record<ToastType, { icon: string; bg: string; border: string; text: string }> = {
    success: {
        icon: mdiCheckCircleOutline,
        bg: "bg-green-50 dark:bg-green-900/30",
        border: "border-green-200 dark:border-green-700",
        text: "text-green-800 dark:text-green-300",
    },
    error: {
        icon: mdiAlertCircleOutline,
        bg: "bg-red-50 dark:bg-red-900/30",
        border: "border-red-200 dark:border-red-700",
        text: "text-red-800 dark:text-red-300",
    },
    info: {
        icon: mdiInformationOutline,
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-700",
        text: "text-blue-800 dark:text-blue-300",
    },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
    const c = config[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`flex items-start gap-3 rounded-lg border ${c.border} ${c.bg} p-4 shadow-lg animate-in slide-in-from-right duration-300 max-w-sm`}
            role="alert"
        >
            <Icon path={c.icon} size={0.85} className={`${c.text} shrink-0 mt-0.5`} />
            <p className={`text-sm font-medium ${c.text} flex-1`}>{toast.message}</p>
            <button onClick={() => onDismiss(toast.id)} className={`${c.text} shrink-0 hover:opacity-70`}>
                <Icon path={mdiClose} size={0.7} />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = nextId++;
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx;
}
