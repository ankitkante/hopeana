"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { usePostHog } from "posthog-js/react";
import Icon from "@mdi/react";
import { mdiEmailCheckOutline } from "@mdi/js";

const schema = yup.object({
    email: yup.string().email("Please enter a valid email address").required("Email is required"),
});

type FormData = yup.InferType<typeof schema>;

export default function ForgotPasswordPage() {
    const posthog = usePostHog();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
        mode: "onBlur",
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        posthog.capture("forgot_password_requested", { email: data.email });

        try {
            await fetch("/api/v1/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });
        } catch {
            // Always show success to prevent email enumeration
        } finally {
            setSubmittedEmail(data.email);
            setSubmitted(true);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3 mb-2">
                        <Image src="/logo.png" alt="Hopeana logo" width={48} height={48} />
                        <h1 className="text-3xl font-bold text-primary">Hopeana</h1>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                        {submitted ? "Check your inbox" : "Reset your password"}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    {submitted ? (
                        <div className="text-center py-4">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <Icon path={mdiEmailCheckOutline} size={1.6} className="text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Email sent
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                If <span className="font-medium">{submittedEmail}</span> is associated with an
                                account, you&apos;ll receive a reset link shortly.
                            </p>
                            <Link
                                href="/login"
                                className="text-primary hover:text-green-600 font-semibold transition text-sm"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Enter the email address for your account and we&apos;ll send you a reset link.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    {...register("email")}
                                    className={`w-full rounded-lg border bg-white dark:bg-gray-700 p-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                        errors.email
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-gray-300 dark:border-gray-600 focus:border-primary"
                                    }`}
                                    placeholder="you@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    )}
                </div>

                {!submitted && (
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Remember your password?{" "}
                            <Link href="/login" className="text-primary hover:text-green-600 font-semibold transition">
                                Sign in
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
