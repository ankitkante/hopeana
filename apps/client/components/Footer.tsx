import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-900 px-4 sm:px-8 py-6 text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-green-600 dark:text-primary text-center sm:text-left">
                © {new Date().getFullYear()} Ankit Kante. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition">
                    About Us
                </Link>
                <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white transition">
                    Contact
                </Link>
                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition">
                    Terms of Service
                </Link>
            </div>
        </footer>
    )
}
