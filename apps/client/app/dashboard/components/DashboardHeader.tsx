"use client";

import Image from "next/image";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiAccount } from "@mdi/js";

interface DashboardHeaderProps {
  firstName: string | null;
  plan: string;
}

export default function DashboardHeader({ firstName, plan }: DashboardHeaderProps) {
  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo.png" alt="Hopeana logo" width={40} height={40} />
            <span className="text-lg font-bold text-primary">Hopeana</span>
          </Link>
        </div>

        {/* Right: Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon path={mdiAccount} size={0.9} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {firstName || "User"}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {plan === "pro" ? "Pro Plan" : "Free Plan"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
