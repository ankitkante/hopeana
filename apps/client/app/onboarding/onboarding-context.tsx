"use client"

import {createContext, useState } from 'react'

export const OnboardingContext = createContext(null)

export function OnboardingProvider({
    children,
}: {
    children: React.ReactNode
}) {

    const [onboardingData, setOnboardingData] = useState({})

    return (
        <OnboardingContext value={{ onboardingData, setOnboardingData }}>
            {children}
        </OnboardingContext>

    )
}
