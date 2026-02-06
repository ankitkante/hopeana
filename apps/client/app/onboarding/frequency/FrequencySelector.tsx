"use client"
import {
    mdiCalendarWeek,
    mdiCalendarMonth,
    mdiUpdate,
    mdiWhiteBalanceSunny,
    mdiWeatherSunny,
    mdiWeatherNight,
    mdiCalendarClock,
    mdiClockOutline,
    mdiRepeat,
} from "@mdi/js";
import Icon from "@mdi/react";
import React, { useState, useContext, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingContext } from "../onboarding-context";

function CardRadio({ icon, value, label, subtitle, isSelected, onClick }: { icon: string; label: string; subtitle: string, value: string; isSelected: boolean; onClick: () => void }) {

    return (
        <label
            className={`radio-card relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-6 text-center transition-all hover:border-primary/50 dark:border-gray-700 ${isSelected ? "selected" : ""}`}>
            <input className="hidden" name={value} type="radio" value={value} onClick={onClick} />
            <div className="mb-2">
                <Icon path={icon} size={1.5} className="text-gray-400 dark:text-gray-500 radio-icon" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{label}</span>
            <span className="text-xs text-gray-500 mt-1 dark:text-gray-400">{subtitle}</span>
        </label>
    )
}

function IntervalPicker({ unitList = [{ label: 'Days', value: 'days' }, { label: 'Weeks', value: 'weeks' }], defaultValue = { value: "1", unit: "days" }, onIntervalChange }: { unitList?: { label: string; value: string }[]; defaultValue?: { value: string; unit: string }; onIntervalChange: (obj: { value: string | null, unit: string | null }) => void }) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(defaultValue.unit);
    const [selectedValue, setSelectedValue] = useState<string | null>(defaultValue.value);

    const onUnitSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedUnit(event.target.value);
    }

    const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(event.target.value);
    }

    useEffect(() => {
        onIntervalChange({ value: selectedValue, unit: selectedUnit });
    }, [selectedValue, selectedUnit, onIntervalChange]);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">Repeat
                    every</label>
                <div className="relative">
                    <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-bold text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        min="1" type="number" value={selectedValue || ""} onChange={onValueChange} />
                </div>
            </div>
            <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">Frequency
                    Unit</label>
                <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-bold text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    value={selectedUnit || ""}
                    onChange={onUnitSelect}>
                    {unitList.map(({ label, value }) => {
                        return (
                            <option key={value} value={value}>{label}</option>
                        )
                    })}

                </select>
            </div>
        </div>
    )
}

function DayPicker({ onDaysSelect }: { onDaysSelect?: (days: string[]) => void }) {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    const days = [
        { label: 'M', value: 'monday' },
        { label: 'T', value: 'tuesday' },
        { label: 'W', value: 'wednesday' },
        { label: 'T', value: 'thursday' },
        { label: 'F', value: 'friday' },
        { label: 'S', value: 'saturday' },
        { label: 'S', value: 'sunday' }
    ];

    useEffect(() => {
        onDaysSelect?.(selectedDays);
    }, [selectedDays, onDaysSelect]);

    const toggleDay = (dayValue: string) => {
        setSelectedDays(prev => {
            const newDays = prev.includes(dayValue)
                ? prev.filter(d => d !== dayValue)
                : [...prev, dayValue];
            return newDays;
        });
    };

    return (
        <div className="flex justify-center gap-2">
            {days.map(({ label, value }) => (
                <button
                    key={value}
                    onClick={() => toggleDay(value)}
                    className={`w-10 h-10 rounded-full font-bold transition-all cursor-pointer ${selectedDays.includes(value)
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

function SectionCard({ icon, label, grid=1, children }: { label: string, icon: string; grid?: string | number; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Icon path={icon} size={1.5} className="text-gray-400 dark:text-gray-500 channel-icon" />
                {label}
            </h3>
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-${grid}`}>
                {children}
            </div>
        </div>
    )
}

export default function FrequencySelector() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error("OnboardingContext missing");
    const { onboardingData } = ctx;

    const router = useRouter();

    const [selectedSchedule, setSelectedSchedule] = useState<string | null>('specific_days');
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string | null>(null);
    const [selectedInterval, setSelectedInterval] = useState<{ value: string | null, unit: string | null }>({ value: "1", unit: "days" });
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onScheduleSelect = useCallback((value: string) => {
        setSelectedSchedule(value);
    }, [])

    const onTimeOfDaySelect = useCallback((value: string) => {
        setSelectedTimeOfDay(value);
    }, [])

    const onIntervalChange = useCallback((obj: { value: string | null, unit: string | null }) => {
        setSelectedInterval(obj)
    }, [])

    const onDaysSelect = useCallback((days: string[]) => {
        setSelectedDays(days);
    }, [])

    const scheduleOptions = [
        {
            label: "Specific Days",
            value: "specific_days",
            subtitle: "Pick exact days of the week",
            icon: mdiCalendarWeek
        },
        {
            label: 'Custom Interval',
            value: 'custom_interval',
            subtitle: 'Set a repeating interval',
            icon: mdiUpdate
        }
    ]

    const timeOfDayOptions = [
        {
            label: "Morning",
            value: "morning",
            subtitle: "6AM - 12PM",
            icon: mdiWhiteBalanceSunny
        },
        {
            label: "Afternoon",
            value: "afternoon",
            subtitle: "12PM - 6PM",
            icon: mdiWeatherSunny
        },
        {
            label: "Evening",
            value: "evening",
            subtitle: "6PM - 12AM",
            icon: mdiWeatherNight
        }
    ]

    const sectionList = [
        {
            type: 'radioGroup',
            label: "Schedule Type",
            icon: mdiCalendarClock,
            options: scheduleOptions,
            grid: 2,
            onSelect: onScheduleSelect,
        },
        {
            type: 'radioGroup',
            label: "Time of Day",
            icon: mdiClockOutline,
            grid: 3,
            options: timeOfDayOptions,
            onSelect: onTimeOfDaySelect
        },
        {
            type: 'intervalPicker',
            label: 'Repeat Interval',
            icon: mdiRepeat,
        },
        {
            type: 'dayPicker',
            label: 'Select days',
            icon: mdiCalendarMonth
        }
    ].filter(section => {
        if (selectedSchedule === 'specific_days') {
            return section.type !== 'intervalPicker';
        }
        return true;
    });

    const isFormValid = !!selectedSchedule && !!selectedTimeOfDay && selectedDays.length > 0
        && (selectedSchedule !== 'custom_interval' || (!!selectedInterval.value && !!selectedInterval.unit));

    const onCompleteSetup = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: onboardingData.firstName,
                    lastName: onboardingData.lastName,
                    channelData: onboardingData.channelData,
                    frequencyData: {
                        selectedSchedule,
                        timeOfDay: selectedTimeOfDay,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        interval: selectedInterval,
                        daysOfWeek: selectedDays,
                    },
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong');
                return;
            }

            router.push('/dashboard');
        } catch {
            setError('Failed to complete setup. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <div className="space-y-6">
                {sectionList.map(({ label, icon, options, onSelect, type, grid }) => (
                    <SectionCard key={label} icon={icon} label={label} grid={grid}>
                        {type === 'radioGroup' && options?.map(({ label, value, subtitle, icon }) => (
                            <CardRadio
                                key={value}
                                icon={icon}
                                label={label}
                                subtitle={subtitle}
                                value={value}
                                isSelected={selectedSchedule === value || selectedTimeOfDay === value}
                                onClick={() => onSelect(value)} />
                        ))}
                        {type === 'intervalPicker' && (
                            <IntervalPicker defaultValue={{ value: "1", unit: "days" }} onIntervalChange={onIntervalChange}></IntervalPicker>
                        )}
                        {
                            type === 'dayPicker' && (<DayPicker onDaysSelect={onDaysSelect}></DayPicker>)
                        }
                    </SectionCard>
                ))}
            </div>
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            )}
            <div className="pt-4">
                <button
                    className={`flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary px-6 py-3 text-base font-bold text-background-dark shadow-sm transition-all ${!isFormValid || submitting ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-95"}`}
                    onClick={onCompleteSetup}
                    disabled={!isFormValid || submitting}
                >
                    <span className="truncate">{submitting ? 'Setting up...' : 'Complete Setup'}</span>
                </button>
            </div>

        </>
    )
}