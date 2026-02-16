"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiAccountOutline, mdiCreditCardOutline, mdiClockOutline } from "@mdi/js";

const tabs = [
  { label: "Personal Info", href: "/dashboard/settings", icon: mdiAccountOutline },
  { label: "Subscription", href: "/dashboard/settings/subscription", icon: mdiCreditCardOutline },
  { label: "My Schedules", href: "/dashboard/settings/schedules", icon: mdiClockOutline },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <nav className="flex gap-0">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                isActive
                  ? "border-green-500 text-green-600 dark:text-green-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon path={tab.icon} size={0.75} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
