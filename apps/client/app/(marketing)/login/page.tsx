"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const loginSchema = yup.object({
    email: yup
        .string()
        .email("Please enter a valid email address")
        .required("Email is required"),
    password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: yupResolver(loginSchema),
        mode: "onBlur",
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true);
        // TODO: Implement actual login logic
        console.log("Login attempt:", data);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3 mb-2">
                        <Image
                            className="dark:invert"
                            src="/globe.svg"
                            alt="Hopeana Logo"
                            width={48}
                            height={48}
                        />
                        <h1 className="text-3xl font-bold text-primary">Hopeana</h1>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                        Sign in to your account
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
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
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                {...register("password")}
                                className={`w-full rounded-lg border bg-white dark:bg-gray-700 p-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                    errors.password
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-gray-300 dark:border-gray-600 focus:border-primary"
                                }`}
                                placeholder="Enter your password"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-primary hover:text-green-600 transition"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/signup"
                                className="text-primary hover:text-green-600 font-semibold transition"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
