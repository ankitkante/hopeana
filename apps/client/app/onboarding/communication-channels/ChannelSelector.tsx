"use client"
import React, { useState, useContext } from "react";
import Icon from "@mdi/react";
import {
    mdiEmailOutline,
    mdiMessageTextOutline,
} from "@mdi/js";
import { OnboardingContext } from "../onboarding-context";

export default function ChannelCard({
    options,
    defaultSelection,
}: {
    options: Array<{
        label: string;
        value: string;
        subtitle: string;
        icon: string;
        input?: { type?: string; placeholder?: string };
    }>;
    defaultSelection?: string;
}) {
    const {onboardingData, setOnboardingData} = useContext(OnboardingContext);

    const [selectedChannel, setSelectedChannel] = useState<string | null>(
        defaultSelection || null
    );

    const iconMap: Record<string, string> = {
        mdiEmailOutline,
        mdiMessageTextOutline,
    };

    const handleClick = (clickedChannel: string) => {
        setSelectedChannel(clickedChannel)
        setOnboardingData((prev) => {
            return { ...prev, communicationChannel: clickedChannel }
        })
    };

    return (
        <>
            {options.map(({ label, value, subtitle, icon, input }) => {
                const path = (iconMap as any)[icon] ?? icon;
                return (
                    <div
                        className={`channel-card flex cursor-pointer items-start gap-4 rounded-xl border border-solid border-gray-200 dark:border-gray-700 p-4 mt-10 transition-all duration-200 hover:border-primary/50 dark:hover:border-primary/50 ${
                            selectedChannel === value ? "selected" : ""
                        }`}
                        onClick={() => {
                            handleClick(value);
                        }}
                        key={value}
                    >
                        <div className="flex-shrink-0 pt-1">
                            <Icon path={path} size={1.5} className="text-gray-400 dark:text-gray-500 channel-icon" />
                        </div>
                        <div className="flex grow flex-col">
                            <p className="text-base font-medium leading-normal text-gray-900 dark:text-white">{label}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                            <div className="mt-4">
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-3 text-base font-normal leading-normal text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                                    placeholder={input?.placeholder}
                                    type={input?.type ?? "text"}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}