"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@mdi/react";
import {
    mdiCheck,
    mdiAlertCircleOutline,
    mdiViewDashboard,
    mdiCalendarClock,
    mdiRefresh,
} from "@mdi/js";
import Link from "next/link";

type PageState =
    | "loading"          // polling for payment confirmation
    | "free_success"     // free plan onboarding complete
    | "pro_success"      // pro payment confirmed
    | "payment_failed"   // payment declined
    | "setup_error"      // server error during account creation
    | "checkout_error";  // account created but checkout redirect failed

const MAX_POLL_ATTEMPTS = 15; // 15 × 2s = 30s max
const POLL_INTERVAL_MS = 2000;

function StatusContent() {
    const params = useSearchParams();
    const router = useRouter();

    const dodoStatus = params.get("status");   // "active" | "failed" from Dodo redirect
    const plan = params.get("plan");           // "free" from internal redirect
    const reason = params.get("reason");       // "setup_failed" | "checkout_failed"

    const [pageState, setPageState] = useState<PageState>("loading");

    useEffect(() => {
        // Free plan onboarding success
        if (plan === "free") {
            setPageState("free_success");
            return;
        }

        // Onboarding/server errors
        if (reason === "setup_failed") {
            setPageState("setup_error");
            return;
        }
        if (reason === "checkout_failed") {
            setPageState("checkout_error");
            return;
        }

        // Payment failure confirmed by Dodo redirect
        if (dodoStatus === "failed") {
            setPageState("payment_failed");
            return;
        }

        // Payment success — poll DB until webhook creates the real payment record
        if (dodoStatus === "active") {
            let attempt = 0;
            let cancelled = false;

            async function poll() {
                if (cancelled) return;
                try {
                    // While the synthetic "pending" record exists, the webhook hasn't fired yet.
                    // Once the webhook fires it resolves the synthetic record (updates its status),
                    // so status=pending returns empty — then we fetch the real payment result.
                    const pendingRes = await fetch("/api/v1/payments?status=pending&limit=1");
                    if (pendingRes.ok) {
                        const pendingData = await pendingRes.json();
                        if (pendingData.success && pendingData.data?.payments?.length === 0) {
                            // No more pending → webhook fired, fetch the result
                            const resultRes = await fetch("/api/v1/payments?limit=1");
                            if (resultRes.ok) {
                                const resultData = await resultRes.json();
                                const latest = resultData.data?.payments?.[0];
                                if (latest?.status === "succeeded") {
                                    if (!cancelled) setPageState("pro_success");
                                    return;
                                }
                                if (latest?.status === "failed") {
                                    if (!cancelled) setPageState("payment_failed");
                                    return;
                                }
                            }
                        }
                        // pending record still exists → webhook not yet received, keep polling
                    }
                } catch {
                    // keep polling
                }

                attempt++;
                if (attempt < MAX_POLL_ATTEMPTS) {
                    setTimeout(poll, POLL_INTERVAL_MS);
                } else {
                    // Webhook is delayed — trust Dodo's status=active
                    if (!cancelled) setPageState("pro_success");
                }
            }

            poll();
            return () => { cancelled = true; };
        }

        // No recognisable params — user navigated here directly
        router.replace("/dashboard");
    }, [dodoStatus, plan, reason, router]);

    // ── Loading ──────────────────────────────────────────────────────────────

    if (pageState === "loading") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                    <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                        Confirming your subscription…
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Please wait a moment while we activate your Pro plan.
                    </p>
                </div>
            </div>
        );
    }

    // ── Free plan success ────────────────────────────────────────────────────

    if (pageState === "free_success") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-lg text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <Icon path={mdiCheck} size={2.5} className="text-primary" />
                    </div>
                    <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">
                        All Set! Your Quotes are Scheduled.
                    </h1>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">
                        Get ready for a daily dose of inspiration. We&apos;ve saved your preferences and your first quote is on its way.
                    </p>
                    <div className="mb-8 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left dark:border-blue-800 dark:bg-blue-900/20">
                        <span className="text-blue-500 text-lg leading-none mt-0.5">ℹ</span>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            To ensure our quotes reach your inbox, please whitelist{" "}
                            <span className="font-semibold">mail.hopeana.com</span> in your email settings.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-green-600 active:scale-95"
                        >
                            <Icon path={mdiViewDashboard} size={0.9} />
                            Go to Dashboard
                        </button>
                        <Link
                            href="/dashboard/settings/schedules"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <Icon path={mdiCalendarClock} size={0.9} />
                            View Schedules
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Pro subscription confirmed ───────────────────────────────────────────

    if (pageState === "pro_success") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-lg text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <Icon path={mdiCheck} size={2.5} className="text-primary" />
                    </div>
                    <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">
                        You&apos;re on Pro!
                    </h1>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">
                        Your Pro subscription is now active. You&apos;ll be charged $1/month starting today. Enjoy up to 30 motivational messages per month.
                    </p>
                    <div className="mb-8 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left dark:border-blue-800 dark:bg-blue-900/20">
                        <span className="text-blue-500 text-lg leading-none mt-0.5">ℹ</span>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            To ensure our quotes reach your inbox, please whitelist{" "}
                            <span className="font-semibold">mail.hopeana.com</span> in your email settings.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-green-600 active:scale-95"
                        >
                            <Icon path={mdiViewDashboard} size={0.9} />
                            Go to Dashboard
                        </button>
                        <Link
                            href="/dashboard/settings/schedules"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <Icon path={mdiCalendarClock} size={0.9} />
                            View Schedules
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Payment failed ───────────────────────────────────────────────────────

    if (pageState === "payment_failed") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <Icon path={mdiAlertCircleOutline} size={2.5} className="text-red-500" />
                    </div>
                    <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">
                        Payment Failed
                    </h1>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">
                        We couldn&apos;t process your payment. No charges were made. You can try again or reach out to support if the issue persists.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => router.push("/pricing")}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-green-600 active:scale-95"
                        >
                            <Icon path={mdiRefresh} size={0.9} />
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <Icon path={mdiViewDashboard} size={0.9} />
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Setup error (server error during account creation) ───────────────────

    if (pageState === "setup_error") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <Icon path={mdiAlertCircleOutline} size={2.5} className="text-red-500" />
                    </div>
                    <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">Setup Failed</h1>
                    <p className="mb-10 text-gray-500 dark:text-gray-400">
                        We couldn&apos;t complete your account setup due to a server error. Your information has not been saved. Please try again.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => router.push(`/onboarding/communication-channels${plan === 'pro' ? '?plan=pro' : ''}`)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-green-600 active:scale-95"
                        >
                            <Icon path={mdiRefresh} size={0.9} />
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <Icon path={mdiViewDashboard} size={0.9} />
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Checkout error (account created but redirect to checkout failed) ──────

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <Icon path={mdiAlertCircleOutline} size={2.5} className="text-red-500" />
                </div>
                <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">Checkout Unavailable</h1>
                <p className="mb-10 text-gray-500 dark:text-gray-400">
                    Your account was created successfully, but we couldn&apos;t redirect you to checkout. You can upgrade to Pro anytime from your dashboard.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-green-600 active:scale-95"
                    >
                        <Icon path={mdiViewDashboard} size={0.9} />
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => router.push("/pricing")}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        View Pricing
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingStatusPage() {
    return (
        <Suspense>
            <StatusContent />
        </Suspense>
    );
}
