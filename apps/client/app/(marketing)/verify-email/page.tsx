"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import Icon from "@mdi/react";
import { mdiCheck, mdiAlertCircleOutline } from "@mdi/js";

type State = "loading" | "success" | "error";

function VerifyEmailContent() {
    const posthog = usePostHog();
    const params = useSearchParams();
    const token = params.get("token");

    const [state, setState] = useState<State>("loading");

    useEffect(() => {
        if (!token) {
            setState("error");
            return;
        }

        posthog.capture("email_verification_attempted");

        fetch("/api/v1/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then((res) => {
                if (res.ok) {
                    setState("success");
                    posthog.capture("email_verified");
                } else {
                    setState("error");
                }
            })
            .catch(() => setState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    if (state === "loading") {
        return (
            <div className="flex flex-col items-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Verifying your email…</p>
            </div>
        );
    }

    if (state === "success") {
        return (
            <div className="text-center py-4">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Icon path={mdiCheck} size={1.6} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Email verified!
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Your email address has been confirmed. You&apos;re all set.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block py-2.5 px-5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-green-600 transition"
                >
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="text-center py-4">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Icon path={mdiAlertCircleOutline} size={1.6} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Link invalid or expired
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                This verification link is no longer valid. Log in and request a new one from your dashboard.
            </p>
            <Link
                href="/login"
                className="inline-block py-2.5 px-5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-green-600 transition"
            >
                Go to Sign In
            </Link>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3 mb-2">
                        <Image src="/logo.png" alt="Hopeana logo" width={48} height={48} />
                        <h1 className="text-3xl font-bold text-primary">Hopeana</h1>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-center">Email verification</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg" />}>
                        <VerifyEmailContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
