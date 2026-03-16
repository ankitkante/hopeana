"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { usePostHog } from "posthog-js/react";

const signupSchema = yup.object({
    firstName: yup.string().max(50).required("First name is required"),
    lastName: yup.string().max(50).required("Last name is required"),
    email: yup.string().email("Please enter a valid email address").required("Email is required"),
    password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords do not match")
        .required("Please confirm your password"),
});

type SignupFormData = yup.InferType<typeof signupSchema>;

export default function SignUpPage() {
    const router = useRouter();
    const posthog = usePostHog();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: yupResolver(signupSchema),
        mode: "onBlur",
    });

    const onSubmit = async (data: SignupFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        posthog.capture("signup_attempted", { email: data.email });

        try {
            const res = await fetch("/api/v1/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: data.password,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setServerError("email_taken");
                } else {
                    setServerError(json.error || "Something went wrong. Please try again.");
                }
                posthog.capture("signup_failed", { reason: json.error });
                return;
            }

            posthog.capture("signup_completed", { email: data.email });
            router.push("/dashboard");
        } catch {
            setServerError("Something went wrong. Please try again.");
            posthog.capture("signup_failed", { reason: "network_error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (hasError: boolean) =>
        `w-full rounded-lg border bg-white dark:bg-gray-700 p-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            hasError
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-primary"
        }`;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3 mb-2">
                        <Image
                            src="/logo.png"
                            alt="Hopeana logo"
                            width={48}
                            height={48}
                        />
                        <h1 className="text-3xl font-bold text-primary">Hopeana</h1>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                        Create your account
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Name row */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    {...register("firstName")}
                                    className={inputClass(!!errors.firstName)}
                                    placeholder="Jane"
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    {...register("lastName")}
                                    className={inputClass(!!errors.lastName)}
                                    placeholder="Doe"
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                autoComplete="email"
                                {...register("email")}
                                className={inputClass(!!errors.email)}
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
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

                        {/* Confirm Password */}
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

                        {/* Server error */}
                        {serverError && serverError !== "email_taken" && (
                            <p className="text-sm text-red-500 text-center">{serverError}</p>
                        )}
                        {serverError === "email_taken" && (
                            <p className="text-sm text-red-500 text-center">
                                An account with this email already exists.{" "}
                                <Link href="/login" className="underline font-semibold">
                                    Log in instead
                                </Link>
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-primary hover:text-green-600 font-semibold transition"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
