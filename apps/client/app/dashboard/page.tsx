"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@mdi/react";
import {
  mdiLightningBolt,
  mdiCalendarClock,
  mdiSend,
  mdiCheckCircleOutline,
  mdiPlus,
} from "@mdi/js";
import DashboardHeader from "./components/DashboardHeader";
import StatCard from "./components/StatCard";
import UpgradeCard from "./components/UpgradeCard";
import CurrentPlanCard from "./components/CurrentPlanCard";

import SentMessagesTable from "./components/SentMessagesTable";

interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface SubscriptionData {
  plan: string;
  status: string;
  messageLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  billingDate: string | null;
}

interface SchedulesData {
  count: number;
  activeCount: number;
  newThisWeek: number;
}

interface MessageStats {
  totalSent: number;
  successRate: number;
  sentThisMonth: number;
  sentLastMonth: number;
  monthOverMonthChange: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [schedules, setSchedules] = useState<SchedulesData | null>(null);
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [userRes, subRes, schedRes, msgRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/subscription"),
          fetch("/api/schedules"),
          fetch("/api/messages/stats"),
        ]);

        if (!userRes.ok) throw new Error("Failed to load user data");

        const [userData, subData, schedData, msgData] = await Promise.all([
          userRes.json(),
          subRes.json(),
          schedRes.json(),
          msgRes.json(),
        ]);

        setUser(userData.data);
        setSubscription(subData.data);
        setSchedules(schedData.data);
        setMessageStats(msgData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !user || !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "Failed to load dashboard"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isPro = subscription.plan === "pro";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader firstName={user.firstName} plan={subscription.plan} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPro ? (
          <ProDashboard
            user={user}
            subscription={subscription}
            schedules={schedules}
            messageStats={messageStats}
          />
        ) : (
          <FreeDashboard
            user={user}
            subscription={subscription}
            schedules={schedules}
            messageStats={messageStats}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Free Tier Dashboard ─── */

function FreeDashboard({
  user,
  subscription,
  schedules,
  messageStats,
}: {
  user: UserData;
  subscription: SubscriptionData;
  schedules: SchedulesData | null;
  messageStats: MessageStats | null;
}) {
  return (
    <>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user.firstName || "there"} 👋
        </h1>
        <Link
          href="/dashboard/settings/schedules/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
        >
          <Icon path={mdiPlus} size={0.8} />
          Create Schedule
        </Link>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Here is your scheduling overview.</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Messages Remaining"
          value={subscription.messagesRemaining}
          icon={<Icon path={mdiLightningBolt} size={1} />}
          progressBar={{
            current: subscription.messagesRemaining,
            max: subscription.messageLimit,
          }}
        />
        <StatCard
          label="Scheduled Posts"
          value={schedules?.activeCount ?? 0}
          icon={<Icon path={mdiCalendarClock} size={1} />}
        />
        <StatCard
          label="Total Sent"
          value={messageStats?.totalSent ?? 0}
          icon={<Icon path={mdiSend} size={1} />}
        />
      </div>

      {/* Bottom section: Quote + Upgrade */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left side - Sent Messages */}
        <div className="lg:col-span-3">
          <SentMessagesTable />
        </div>

        {/* Right side */}
        <div className="lg:col-span-2 space-y-6">
          <UpgradeCard />
        </div>
      </div>
    </>
  );
}

/* ─── Pro Tier Dashboard ─── */

function ProDashboard({
  user,
  subscription,
  schedules,
  messageStats,
}: {
  user: UserData;
  subscription: SubscriptionData;
  schedules: SchedulesData | null;
  messageStats: MessageStats | null;
}) {
  return (
    <>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.firstName || "there"} 👋
          </h1>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full uppercase flex items-center gap-1">
            <Icon path={mdiCheckCircleOutline} size={0.5} />
            Pro
          </span>
        </div>
        <Link
          href="/dashboard/settings/schedules/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
        >
          <Icon path={mdiPlus} size={0.8} />
          Create Schedule
        </Link>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Here is your scheduling overview.
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Messages Remaining"
          value={subscription.messagesRemaining}
          icon={<Icon path={mdiLightningBolt} size={1} />}
          progressBar={{
            current: subscription.messagesRemaining,
            max: subscription.messageLimit,
          }}
        />
        <StatCard
          label="Scheduled Posts"
          value={schedules?.activeCount ?? 0}
          icon={<Icon path={mdiCalendarClock} size={1} />}
        />
        <StatCard
          label="Total Sent This Month"
          value={messageStats?.sentThisMonth ?? 0}
          icon={<Icon path={mdiSend} size={1} />}
        />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left side - Sent Messages */}
        <div className="lg:col-span-3">
          <SentMessagesTable />
        </div>

        {/* Right side */}
        <div className="lg:col-span-2 space-y-6">
          <CurrentPlanCard billingDate={subscription.billingDate} />
        </div>
      </div>
    </>
  );
}

/* ─── Loading Skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title skeleton */}
        <div className="mb-8">
          <div className="h-8 w-72 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-2" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-40 animate-pulse"
            >
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-4" />
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-4" />
            </div>
          ))}
        </div>

        {/* Bottom section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3" />
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-48 animate-pulse" />
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-64 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
