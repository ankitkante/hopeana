"use client";

import Image from "next/image";
import Link from "next/link";
import AvatarDropdown from "./AvatarDropdown";

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

        {/* Right: Avatar Dropdown */}
        <AvatarDropdown firstName={firstName} plan={plan} />
      </div>
    </header>
  );
}
