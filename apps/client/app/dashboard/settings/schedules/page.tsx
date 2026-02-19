"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@mdi/react";
import {
  mdiPlus,
  mdiPencilOutline,
  mdiDeleteOutline,
  mdiEmailOutline,
  mdiMessageTextOutline,
  mdiBellOutline,
  mdiPause,
  mdiPlay,
  mdiAlertCircleOutline,
  mdiCalendarBlankOutline,
} from "@mdi/js";
import Link from "next/link";
import Toast from "../components/Toast";

interface Schedule {
  id: string;
  channel: string;
  frequency: string;
  timeOfDay: string | null;
  timezone: string | null;
  daysOfWeek: string[];
  intervalValue: number | null;
  intervalUnit: string | null;
  isActive: boolean;
  createdAt: string;
}

const channelIcons: Record<string, string> = {
  email: mdiEmailOutline,
  sms: mdiMessageTextOutline,
  push: mdiBellOutline,
};

function formatFrequency(schedule: Schedule): string {
  if (schedule.frequency === "specific_days" && schedule.daysOfWeek.length > 0) {
    if (schedule.daysOfWeek.length === 7) return "Daily";
    if (
      schedule.daysOfWeek.length === 5 &&
      ["monday", "tuesday", "wednesday", "thursday", "friday"].every((d) =>
        schedule.daysOfWeek.includes(d)
      )
    ) {
      return "Weekdays";
    }
    return schedule.daysOfWeek
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3))
      .join(", ");
  }
  if (schedule.frequency === "custom_interval") {
    return `Every ${schedule.intervalValue ?? ""} ${schedule.intervalUnit ?? ""}`.trim();
  }
  return schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1);
}

function formatTimeOfDay(timeOfDay: string | null): string {
  if (!timeOfDay) return "—";
  return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const res = await fetch("/api/v1/schedules");
        if (res.ok) {
          const data = await res.json();
          setSchedules(data.data.schedules);
        }
      } catch {
        // Will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);

  async function handleToggle(scheduleId: string, currentActive: boolean) {
    const newActive = !currentActive;
    // Optimistic update
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, isActive: newActive } : s))
    );
    try {
      const res = await fetch("/api/v1/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, isActive: newActive }),
      });
      if (!res.ok) throw new Error();
      showToast(`Schedule ${newActive ? "activated" : "paused"} successfully!`, "success");
    } catch {
      // Revert
      setSchedules((prev) =>
        prev.map((s) => (s.id === scheduleId ? { ...s, isActive: currentActive } : s))
      );
      showToast("Failed to update schedule.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: deleteTarget }),
      });
      if (!res.ok) throw new Error();
      setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget));
      showToast("Schedule deleted successfully!", "success");
    } catch {
      showToast("Failed to delete schedule.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-64 animate-pulse" />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            My Active Schedules
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your recurring quote deliveries and timing.
          </p>
        </div>
        <Link
          href="/dashboard/settings/schedules/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition"
        >
          <Icon path={mdiPlus} size={0.7} />
          New Schedule
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Column Headers */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <span className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Channel
          </span>
          <span className="col-span-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Frequency
          </span>
          <span className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Time
          </span>
          <span className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Status
          </span>
          <span className="col-span-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-right">
            Actions
          </span>
        </div>

        {/* Rows */}
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Icon path={mdiCalendarBlankOutline} size={2} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No schedules yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Create your first schedule to start receiving motivational quotes.
            </p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition"
            >
              {/* Channel */}
              <div className="col-span-2 flex items-center gap-2">
                <Icon
                  path={channelIcons[schedule.channel] || mdiEmailOutline}
                  size={0.75}
                  className="text-gray-500 dark:text-gray-400"
                />
                <span className="text-sm text-gray-900 dark:text-white capitalize sm:inline">
                  {schedule.channel}
                </span>
              </div>

              {/* Frequency */}
              <div className="col-span-3 flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatFrequency(schedule)}
                </span>
              </div>

              {/* Time of Day */}
              <div className="col-span-2 flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatTimeOfDay(schedule.timeOfDay)}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center">
                <span
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                    schedule.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {schedule.isActive ? "Active" : "Paused"}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-3 flex items-center justify-end gap-1">
                <button
                  onClick={() => handleToggle(schedule.id, schedule.isActive)}
                  title={schedule.isActive ? "Pause schedule" : "Activate schedule"}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Icon path={schedule.isActive ? mdiPause : mdiPlay} size={0.75} />
                </button>
                <Link
                  href={`/dashboard/settings/schedules/${schedule.id}/edit`}
                  title="Edit schedule"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition inline-flex"
                >
                  <Icon path={mdiPencilOutline} size={0.75} />
                </Link>
                <button
                  onClick={() => setDeleteTarget(schedule.id)}
                  title="Delete schedule"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  <Icon path={mdiDeleteOutline} size={0.75} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon path={mdiAlertCircleOutline} size={1} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Schedule
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this schedule? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
