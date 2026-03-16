"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { usePostHog } from "posthog-js/react";

const schema = yup.object({
    password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords do not match")
        .required("Please confirm your password"),
});

type FormData = yup.InferType<typeof schema>;

export default function SetPasswordPage() {
    const router = useRouter();
    const posthog = usePostHog();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    // If user already has a password, redirect to dashboard
    useEffect(() => {
        fetch("/api/v1/user")
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                if (!json?.success) {
                    // Not authenticated — redirect to login
                    router.replace("/login");
                    return;
                }
                if (json.data?.hasPassword) {
                    // Already has a password — go straight to dashboard
                    router.replace("/dashboard");
                    return;
                }
                setChecking(false);
            })
            .catch(() => router.replace("/login"));
    }, [router]);

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

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setServerError(null);

        try {
            const res = await fetch("/api/v1/auth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: data.password }),
            });

            const json = await res.json();

            if (!res.ok) {
                setServerError(json.error || "Something went wrong. Please try again.");
                return;
            }

            posthog.capture("set_password_completed");
            router.push("/dashboard");
        } catch {
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
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
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                        Secure your account
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    {checking ? (
                        <div className="h-40 flex items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                Set a password
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Your account was created without a password. Set one now so you can log back in anytime.
                            </p>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Password
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
                                        Confirm Password
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

                                {serverError && (
                                    <p className="text-sm text-red-500 text-center">{serverError}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Saving..." : "Set Password"}
                                </button>
                            </form>

                            <div className="mt-4 text-center">
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition"
                                >
                                    Skip for now
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
