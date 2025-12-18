import Link from "next/link";

export default function Header() {
    return (
        <header className="w-full flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
                <svg
                    className="w-6 h-6 text-green-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-xl font-bold text-gray-900">
                    MotivationQuotes
                </span>
            </Link>
            <nav className="flex items-center gap-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                    Home
                </Link>
                <Link href="/#features" className="text-gray-600 hover:text-gray-900">
                    Features
                </Link>
                <Link href="/#faq" className="text-gray-600 hover:text-gray-900">
                    FAQ
                </Link>
                <Link
                    href="/login"
                    className="px-5 py-2 rounded-full border-2 border-green-500 text-green-500 font-medium hover:bg-green-50 transition ease-in-out"
                >
                    Login
                </Link>
            </nav>
        </header>
    )
}