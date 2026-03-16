"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePostHog } from "posthog-js/react";
import Icon from "@mdi/react";
import { mdiEmailOutline, mdiCheck } from "@mdi/js";

export default function VerifyEmailRequiredPage() {
    const posthog = usePostHog();
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResend = async () => {
        setIsSending(true);
        setError(null);

        try {
            const res = await fetch("/api/v1/auth/resend-verification", { method: "POST" });
            const json = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    setError("Please wait a moment before requesting another email.");
                } else {
                    setError(json.error || "Failed to send. Please try again.");
                }
                return;
            }

            posthog.capture("email_verification_resent", { source: "hard_block" });
            setSent(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3 mb-2">
                        <Image src="/logo.png" alt="Hopeana logo" width={48} height={48} />
                        <h1 className="text-3xl font-bold text-primary">Hopeana</h1>
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Icon path={mdiEmailOutline} size={1.6} className="text-amber-500" />
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Please verify your email
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Your account requires email verification to continue. Check your inbox for the verification
                        link, or request a new one below.
                    </p>

                    {sent ? (
                        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
                            <Icon path={mdiCheck} size={0.8} />
                            Verification email sent — check your inbox.
                        </div>
                    ) : (
                        <>
                            {error && (
                                <p className="text-sm text-red-500 mb-4">{error}</p>
                            )}
                            <button
                                onClick={handleResend}
                                disabled={isSending}
                                className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                            >
                                {isSending ? "Sending..." : "Resend Verification Email"}
                            </button>
                        </>
                    )}

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Link
                            href="/login"
                            className="text-sm text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition"
                        >
                            Sign in with a different account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
