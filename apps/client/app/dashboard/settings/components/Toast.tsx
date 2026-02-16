"use client";

import { useEffect } from "react";
import Icon from "@mdi/react";
import { mdiCheckCircle, mdiAlertCircle, mdiClose } from "@mdi/js";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
          type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        <Icon
          path={type === "success" ? mdiCheckCircle : mdiAlertCircle}
          size={0.8}
        />
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80 transition">
          <Icon path={mdiClose} size={0.7} />
        </button>
      </div>
    </div>
  );
}
