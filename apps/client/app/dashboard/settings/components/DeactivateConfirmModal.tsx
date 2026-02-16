"use client";

import Icon from "@mdi/react";
import { mdiAlertCircleOutline } from "@mdi/js";

interface DeactivateConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeactivating: boolean;
}

export default function DeactivateConfirmModal({
  onConfirm,
  onCancel,
  isDeactivating,
}: DeactivateConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Icon path={mdiAlertCircleOutline} size={1} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deactivate Account
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Are you sure you want to deactivate your account? This will:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 list-disc list-inside space-y-1">
          <li>Pause all your active schedules</li>
          <li>Stop all scheduled message deliveries</li>
          <li>Log you out of your account</li>
        </ul>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your data will not be deleted. Contact support to reactivate your account.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeactivating}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeactivating}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
          >
            {isDeactivating ? "Deactivating..." : "Deactivate Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
