"use client"

import {createContext, useState, Dispatch, SetStateAction } from 'react'

interface OnboardingData {
    channel?: string | null;
    data?: {
        email?: string;
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