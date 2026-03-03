"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { usePostHog } from "posthog-js/react";
import Icon from "@mdi/react";
import { mdiAlertCircleOutline } from "@mdi/js";

const schema = yup.object({
    password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords do not match")
        .required("Please confirm your password"),
});

type FormData = yup.InferType<typeof schema>;

function ResetPasswordContent() {
    const router = useRouter();
    const posthog = usePostHog();
    const params = useSearchParams();
    const token = params.get("token");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
        mode: "onBlur",
    });

    const inputClass = (hasError: boolean) =>
        `w-full rounded-lg border bg-white dark:bg-gray-700 p-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            hasError
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-primary"
        }`;

    if (!token) {
        return (
            <InvalidLink reason="No reset token found in the URL." />
        );
    }

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const res = await fetch("/api/v1/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: data.password }),
            });

            const json = await res.json();

            if (!res.ok) {
                if (res.status === 400) {
                    setServerError("expired");
                } else {
                    setServerError(json.error || "Something went wrong. Please try again.");
                }
                return;
            }

            posthog.capture("password_reset_completed");
            router.push("/dashboard");
        } catch {
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (serverError === "expired") {
        return <InvalidLink reason="This reset link has expired or already been used." />;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                </label>
                <input
                    type="password"
                    autoComplete="new-password"
                    {...register("password")}
                    className={inputClass(!!errors.password)}
                    placeholder="At least 8 characters"
                />
                {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                </label>
                <input
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className={inputClass(!!errors.confirmPassword)}
                    placeholder="Re-enter your password"
                />
                {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
            </div>

            {serverError && serverError !== "expired" && (
                <p className="text-sm text-red-500 text-center">{serverError}</p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Saving..." : "Set New Password"}
            </button>
        </form>
    );
}

function InvalidLink({ reason }: { reason: string }) {
    return (
        <div className="text-center py-4">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Icon path={mdiAlertCircleOutline} size={1.6} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Link invalid</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{reason}</p>
            <Link
                href="/forgot-password"
                className="inline-block py-2.5 px-5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-green-600 transition"
            >
                Request a new link
            </Link>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3 mb-2">
                        <Image className="dark:invert" src="/globe.svg" alt="Hopeana Logo" width={48} height={48} />
                        <h1 className="text-3xl font-bold text-primary">Hopeana</h1>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-center">Set a new password</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg" />}>
                        <ResetPasswordContent />
                    </Suspense>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-sm text-primary hover:text-green-600 transition">
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
