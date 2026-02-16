"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiAccount, mdiCogOutline, mdiLogout } from "@mdi/js";

interface AvatarDropdownProps {
  firstName: string | null;
  plan: string;
}

export default function AvatarDropdown({ firstName, plan }: AvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Icon path={mdiAccount} size={0.9} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {firstName || "User"}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {plan === "pro" ? "Pro Plan" : "Free Plan"}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Icon path={mdiCogOutline} size={0.8} className="text-gray-500 dark:text-gray-400" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Icon path={mdiLogout} size={0.8} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
