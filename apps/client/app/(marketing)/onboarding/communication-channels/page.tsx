"use client"

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChannelSelector from "./ChannelSelector";

function SelectCommunicationChannelInner() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan") as "free" | "pro" | null;

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const channelOptions = [
        {
            label: "Email",
            value: "email",
            subtitle: 'Get quotes delivered straight to your inbox.',
            icon: 'mdiEmailOutline',
            input: {
                type: 'email',
                placeholder: 'Enter your email address'
            }
        },
        // {
        //     label: "SMS",
        //     value: "sms",
        //     subtitle: 'Receive quotes via text message.',
        //     icon: 'mdiMessageTextOutline',
        //     input: {
        //         type: 'phone',
        //         placeholder: 'Enter your phone number'
        //     }
        // },
        // {
        //     label: "Social Media",
        //     value: "socialMedia",
        //     subtitle: 'Receive quotes via DM on your favorite platform.',
        //     icon: 'mdiForums',
        //     input: {
        //         // TBD
        //     }
        // }
    ]

    return (
        <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8">
            <main className="w-full max-w-2xl">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-gray-900 dark:text-white mb-4 sm:mb-6">
                        Receive your daily inspiration
                    </h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">First Name</label>
                        <input
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-3 text-base font-normal leading-normal text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                            placeholder="First name"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">Last Name</label>
                        <input
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-3 text-base font-normal leading-normal text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                            placeholder="Last name"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                </div>

                <ChannelSelector
                    options={channelOptions}
                    defaultSelection="email"
                    firstName={firstName}
                    lastName={lastName}
                    plan={plan || undefined}
                />
            </main>
        </div>
    )
}

export default function SelectCommunicationChannel() {
    return (
        <Suspense>
            <SelectCommunicationChannelInner />
        </Suspense>
    );
}