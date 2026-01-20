"use client"

import {createContext, useState, Dispatch, SetStateAction } from 'react'

interface OnboardingData {
    channelData?: {
        selectedChannel: string | null;
        data: {
            email?: string;
        }
    };
    frequencyData?: {
       selectedSchedule: string | null;
       timeOfDay?: string | null;
       interval?: string | null;
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