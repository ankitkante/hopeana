import Image from "next/image";
import Link from "next/link";

export default function Header() {
    return (
        <header className="w-full flex items-center justify-between p-4 bg-white">
            <Link href="/" className="flex items-center gap-3">
                <Image
                    className="dark:invert"
                    src="/globe.svg"
                    alt="Logo"
                    width={32}
                    height={32}
                />
                <h1 className="text-2xl font-bold leading-none text-green-500">
                    Hopeana
                </h1>
            </Link>
            <div className="flex items-center gap-4">
                <Link href="/pricing" className="text-gray-700">
                    Pricing
                </Link>
                <Link href="/login" className="text-gray-700">
                    Login
                </Link>
                <Link
                    href="/signup"
                    className="px-4 py-2 rounded-md bg-green-500 text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out"
                >
                    Sign Up
                </Link>
            </div>
        </header>
    )
}
