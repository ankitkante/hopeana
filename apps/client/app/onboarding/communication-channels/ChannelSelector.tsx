"use client"
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";

import Icon from "@mdi/react";
import {
    mdiEmailOutline,
    mdiMessageTextOutline,
} from "@mdi/js";
import { OnboardingContext } from "../onboarding-context";

export default function ChannelSelector({
    options,
    defaultSelection,
    firstName,
    lastName,
}: {
    options: Array<{
        label: string;
        value: string;
        subtitle: string;
        icon: string;
        input?: { type?: string; placeholder?: string };
    }>;
    defaultSelection?: string;
    firstName?: string;
    lastName?: string;
}) {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error("OnboardingContext missing");
    const { setOnboardingData } = ctx;

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [selectedChannel, setSelectedChannel] = useState(
        defaultSelection || null
    );

    const iconMap: Record<string, string> = {
        mdiEmailOutline,
        mdiMessageTextOutline,
    };

    const handleChannelClick = (clickedChannel: string) => {
        setSelectedChannel(clickedChannel)
    };

    const onEmailInput = (e: React.FormEvent<HTMLInputElement>) => {
        setEmail(e.currentTarget.value);
    }

    const onChannelSave = () => {
        setOnboardingData((prev) => {
            return {
                ...prev,
                firstName,
                lastName,
                channelData: {
                    selectedChannel,
                    data: {
                        email: email
                    }
                }

            }
        })

        router.push('/onboarding/frequency');
    }

    return (
        <>
            <div className="mt-10 space-y-6">
                <div className="space-y-4">
                    {options.map(({ label, value, subtitle, icon, input }) => {
                        const path = (iconMap as Record<string, string>)[icon] ?? icon;
                        return (
                            <div
                                className={`channel-card flex cursor-pointer items-start gap-4 rounded-xl border border-solid border-gray-200 dark:border-gray-700 p-4 mt-10 transition-all duration-200 hover:border-primary/50 dark:hover:border-primary/50 ${selectedChannel === value ? "selected" : ""
                                    }`}
                                onClick={() => {
                                    handleChannelClick(value);
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
                                            onInput={onEmailInput}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="pt-4">
                <button
                    className={`flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary px-6 py-3 text-base font-bold text-background-dark shadow-sm transition-all ${!selectedChannel || !email ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-95"}`}
                    onClick={onChannelSave}
                    disabled={!selectedChannel || !email}
                >
                    <span className="truncate">Next</span>
                </button>
            </div>
        </>
    );
}