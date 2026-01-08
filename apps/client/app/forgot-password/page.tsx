import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
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
                        Reset your password
                    </p>
                </div>

                {/* Placeholder Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <div className="py-12">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                            Coming Soon
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            The password reset feature is currently under development.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block py-3 px-6 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Login Link */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Remember your password?{" "}
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
    );
}
