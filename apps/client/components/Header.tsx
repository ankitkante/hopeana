"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiMenu, mdiClose } from "@mdi/js";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="w-full bg-white relative">
            <div className="flex items-center justify-between p-4">
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

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
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

                {/* Mobile Hamburger Button */}
                <button
                    className="md:hidden p-2 text-gray-700"
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMenuOpen}
                >
                    <Icon path={isMenuOpen ? mdiClose : mdiMenu} size={1.5} />
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                    <nav className="flex flex-col p-4 gap-4">
                        <Link
                            href="/pricing"
                            className="text-gray-700 py-2"
                            onClick={closeMenu}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/login"
                            className="text-gray-700 py-2"
                            onClick={closeMenu}
                        >
                            Login
                        </Link>
                        <Link
                            href="/signup"
                            className="px-4 py-2 rounded-md bg-green-500 text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out text-center"
                            onClick={closeMenu}
                        >
                            Sign Up
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
