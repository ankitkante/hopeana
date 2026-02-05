"use client"

import {createContext, useState, Dispatch, SetStateAction } from 'react'

interface OnboardingData {
    firstName?: string;
    lastName?: string;
    channelData?: {
        selectedChannel: string | null;
        data: {
            email?: string;
        }
    };
    frequencyData?: {
       selectedSchedule: string | null;
       timeOfDay?: string | null;
       timezone?: string | null;
       interval?: { value: string | null; unit: string | null } | null;
       days?: string[] | null;
    };
}

interface OnboardingContextType {
    onboardingData: OnboardingData;
    setOnboardingData: Dispatch<SetStateAction<OnboardingData>>;
}

export const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function OnboardingProvider({
    children,
}: {
    children: React.ReactNode
}) {

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({})

    return (
        <OnboardingContext value={{ onboardingData, setOnboardingData }}>
            {children}
        </OnboardingContext>
        
    )
}