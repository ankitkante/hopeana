"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import DashboardHeader from "../components/DashboardHeader";
import SettingsTabs from "./components/SettingsTabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, subRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/subscription"),
        ]);
        if (userRes.ok) {
          const userData = await userRes.json();
          setFirstName(userData.data.firstName);
        }
        if (subRes.ok) {
          const subData = await subRes.json();
          setPlan(subData.data.plan);
        }
      } catch {
        // Header will show defaults
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader firstName={firstName} plan={plan} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition"
        >
          <Icon path={mdiArrowLeft} size={0.7} />
          Back to Dashboard
        </Link>

        <SettingsTabs />

        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
