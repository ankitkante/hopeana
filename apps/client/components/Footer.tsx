import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white px-8 py-6 text-gray-500 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-green-600">
                © {new Date().getFullYear()} MotivationQuotes. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
                <Link href="/privacy" className="hover:text-gray-900">
                    Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-gray-900">
                    Terms of Service
                </Link>
                <Link href="/contact" className="hover:text-gray-900">
                    Contact
                </Link>
            </div>
        </footer>
    )
}