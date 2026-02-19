"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiMenu, mdiClose } from "@mdi/js";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        fetch("/api/v1/auth/status")
            .then((res) => res.json())
            .then((data) => setIsAuthenticated(data.authenticated === true))
            .catch(() => setIsAuthenticated(false));
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="w-full bg-white dark:bg-gray-900 relative border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4">
                <Link href="/" className="flex items-center">
                    <Image
                        src="/logo.png"
                        alt="Hopeana logo"
                        width={50}
                        height={50}
                    />
                    <h1 className="text-xl sm:text-2xl font-bold leading-none text-primary">
                        Hopeana
                    </h1>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
                        Pricing
                    </Link>
                    {isAuthenticated ? (
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 rounded-md bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="px-4 py-2 rounded-md bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    className="md:hidden p-2 text-gray-700 dark:text-gray-300"
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMenuOpen}
                >
                    <Icon path={isMenuOpen ? mdiClose : mdiMenu} size={1.5} />
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
                    <nav className="flex flex-col p-4 gap-4">
                        <Link
                            href="/pricing"
                            className="text-gray-700 dark:text-gray-300 py-2 hover:text-gray-900 dark:hover:text-white transition"
                            onClick={closeMenu}
                        >
                            Pricing
                        </Link>
                        {isAuthenticated ? (
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 rounded-md bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out text-center"
                                onClick={closeMenu}
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-gray-700 dark:text-gray-300 py-2 hover:text-gray-900 dark:hover:text-white transition"
                                    onClick={closeMenu}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 rounded-md bg-primary text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out text-center"
                                    onClick={closeMenu}
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
