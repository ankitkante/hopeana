"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Icon from "@mdi/react";
import {
  mdiArrowLeft,
  mdiEmailOutline,
  mdiCalendarWeek,
  mdiUpdate,
  mdiWhiteBalanceSunny,
  mdiWeatherSunny,
  mdiWeatherNight,
  mdiCalendarClock,
  mdiClockOutline,
  mdiRepeat,
  mdiCalendarMonth,
} from "@mdi/js";
import CardRadio from "@/components/CardRadio";
import SectionCard from "@/components/SectionCard";
import DayPicker from "@/components/DayPicker";

/* ─── Data ─── */

const channelOptions = [
  { label: "Email", value: "email", subtitle: "Receive via email", icon: mdiEmailOutline },
];

const scheduleOptions = [
  { label: "Specific Days", value: "specific_days", subtitle: "Pick exact days of the week", icon: mdiCalendarWeek },
  { label: "Custom Interval", value: "custom_interval", subtitle: "Set a repeating interval", icon: mdiUpdate },
];

const timeOfDayOptions = [
  { label: "Morning", value: "morning", subtitle: "6AM - 12PM", icon: mdiWhiteBalanceSunny },
  { label: "Afternoon", value: "afternoon", subtitle: "12PM - 6PM", icon: mdiWeatherSunny },
  { label: "Evening", value: "evening", subtitle: "6PM - 12AM", icon: mdiWeatherNight },
];

/* ─── Page ─── */

export default function EditSchedulePage() {
  const posthog = usePostHog();
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [channel, setChannel] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string>("specific_days");
  const [timeOfDay, setTimeOfDay] = useState<string | null>(null);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [intervalValue, setIntervalValue] = useState("1");
  const [intervalUnit, setIntervalUnit] = useState("days");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch(`/api/v1/schedules/${scheduleId}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const { data } = await res.json();
        setChannel(data.channel);
        setFrequency(data.frequency);
        setTimeOfDay(data.timeOfDay);
        setDaysOfWeek(data.daysOfWeek || []);
        if (data.intervalValue) setIntervalValue(String(data.intervalValue));
        if (data.intervalUnit) setIntervalUnit(data.intervalUnit);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [scheduleId]);

  const toggleDay = useCallback((day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const isFormValid =
    !!channel &&
    !!frequency &&
    !!timeOfDay &&
    daysOfWeek.length > 0 &&
    (frequency !== "custom_interval" || (!!intervalValue && !!intervalUnit));

  async function handleSubmit() {
    if (!isFormValid) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          frequency,
          timeOfDay,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          daysOfWeek,
          ...(frequency === "custom_interval" && {
            intervalValue,
            intervalUnit,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        posthog.capture("schedule_update_failed", { error: data.error });
        setError(data.error || "Something went wrong");
        return;
      }

      posthog.capture("schedule_updated", { channel, frequency, time_of_day: timeOfDay });
      router.push("/dashboard/settings/schedules");
    } catch {
      setError("Failed to update schedule. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Schedule not found.</p>
        <Link
          href="/dashboard/settings/schedules"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Back to Schedules
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/settings/schedules"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition"
      >
        <Icon path={mdiArrowLeft} size={0.7} />
        Back to Schedules
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Edit Schedule
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Update your recurring quote delivery settings.
      </p>

      <div className="space-y-6">
        {/* Channel */}
        <SectionCard icon={mdiEmailOutline} label="Delivery Channel" grid={3}>
          {channelOptions.map((opt) => (
            <CardRadio
              key={opt.value}
              icon={opt.icon}
              value={opt.value}
              label={opt.label}
              subtitle={opt.subtitle}
              isSelected={channel === opt.value}
              onClick={() => setChannel(opt.value)}
            />
          ))}
        </SectionCard>

        {/* Schedule Type */}
        <SectionCard icon={mdiCalendarClock} label="Schedule Type" grid={2}>
          {scheduleOptions.map((opt) => (
            <CardRadio
              key={opt.value}
              icon={opt.icon}
              value={opt.value}
              label={opt.label}
              subtitle={opt.subtitle}
              isSelected={frequency === opt.value}
              onClick={() => setFrequency(opt.value)}
            />
          ))}
        </SectionCard>

        {/* Time of Day */}
        <SectionCard icon={mdiClockOutline} label="Time of Day" grid={3}>
          {timeOfDayOptions.map((opt) => (
            <CardRadio
              key={opt.value}
              icon={opt.icon}
              value={opt.value}
              label={opt.label}
              subtitle={opt.subtitle}
              isSelected={timeOfDay === opt.value}
              onClick={() => setTimeOfDay(opt.value)}
            />
          ))}
        </SectionCard>

        {/* Interval Picker (only for custom_interval) */}
        {frequency === "custom_interval" && (
          <SectionCard icon={mdiRepeat} label="Repeat Interval">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Repeat every
                </label>
                <input
                  type="number"
                  min="1"
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 font-bold text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
                />
              </div>
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Frequency Unit
                </label>
                <select
                  value={intervalUnit}
                  onChange={(e) => setIntervalUnit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 font-bold text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Day Picker */}
        <SectionCard icon={mdiCalendarMonth} label="Select Days">
          <DayPicker selectedDays={daysOfWeek} onToggle={toggleDay} />
        </SectionCard>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3 mt-6">
        <Link
          href="/dashboard/settings/schedules"
          className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
