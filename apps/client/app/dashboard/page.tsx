"use client";

import { useState, useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@mdi/react";
import {
  mdiLightningBolt,
  mdiCalendarClock,
  mdiSend,
  mdiCheckCircleOutline,
  mdiPlus,
  mdiEmailAlertOutline,
  mdiCalendarPlusOutline,
} from "@mdi/js";
import DashboardHeader from "./components/DashboardHeader";
import StatCard from "./components/StatCard";
// PAYMENT_DISABLED
// import UpgradeCard from "./components/UpgradeCard";
// import CurrentPlanCard from "./components/CurrentPlanCard";

import SentMessagesTable from "./components/SentMessagesTable";

interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  hasPassword: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
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
  const posthog = usePostHog();
  const router = useRouter();
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
          fetch("/api/v1/user"),
          fetch("/api/v1/subscription"),
          fetch("/api/v1/schedules"),
          fetch("/api/v1/messages/stats"),
        ]);

        if (!userRes.ok) throw new Error("Failed to load user data");

        const [userData, subData, schedData, msgData] = await Promise.all([
          userRes.json(),
          subRes.json(),
          schedRes.json(),
          msgRes.json(),
        ]);

        const u: UserData = userData.data;

        // Gate: password not set → redirect to set-password interstitial
        if (!u.hasPassword) {
          router.replace("/set-password");
          return;
        }

        // Gate: email unverified for > 7 days → hard block
        if (!u.emailVerifiedAt) {
          const daysSinceCreation =
            (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCreation > 7) {
            router.replace("/verify-email-required");
            return;
          }
        }

        setUser(u);
        setSubscription(subData.data);
        setSchedules(schedData.data);
        setMessageStats(msgData.data);

        posthog.identify(u.id, {
          email: u.email,
          firstName: u.firstName,
          plan: subData.data?.plan,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [posthog, router]);

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

  const showVerificationBanner = !user.emailVerifiedAt;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader firstName={user.firstName} plan={subscription.plan} />

      {showVerificationBanner && <EmailVerificationBanner email={user.email} />}

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
  const hasNoSchedules = (schedules?.count ?? 0) === 0;

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

      {hasNoSchedules ? (
        <NoSchedulesCTA />
      ) : (
        <>
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

          {/* Bottom section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-5">
              <SentMessagesTable />
            </div>
            {/* PAYMENT_DISABLED
            <div className="lg:col-span-2 space-y-6">
              <UpgradeCard />
            </div>
            */}
          </div>
        </>
      )}
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
  const hasNoSchedules = (schedules?.count ?? 0) === 0;

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

      {hasNoSchedules ? (
        <NoSchedulesCTA />
      ) : (
        <>
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
            <div className="lg:col-span-5">
              <SentMessagesTable />
            </div>
            {/* PAYMENT_DISABLED
            <div className="lg:col-span-2 space-y-6">
              <CurrentPlanCard billingDate={subscription.billingDate} />
            </div>
            */}
          </div>
        </>
      )}
    </>
  );
}

/* ─── Email Verification Banner ─── */

function EmailVerificationBanner({ email }: { email: string }) {
  const posthog = usePostHog();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    try {
      await fetch("/api/v1/auth/resend-verification", { method: "POST" });
      posthog.capture("email_verification_resent", { source: "dashboard_banner" });
      setSent(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <Icon path={mdiEmailAlertOutline} size={0.8} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
          Please verify your email address.{" "}
          <span className="font-medium">{email}</span> — check your inbox for the link.
        </p>
        {sent ? (
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300 shrink-0">
            Email sent!
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={isSending}
            className="text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition shrink-0 disabled:opacity-50"
          >
            {isSending ? "Sending…" : "Resend email"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── No Schedules CTA ─── */

function NoSchedulesCTA() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
        <Icon path={mdiCalendarPlusOutline} size={2} className="text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Set up your first schedule
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center max-w-sm">
        Choose when and how often you want to receive motivational quotes, and we&apos;ll
        deliver them straight to your inbox.
      </p>
      <Link
        href="/dashboard/settings/schedules/new"
        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-green-600 text-white font-semibold rounded-lg transition"
      >
        <Icon path={mdiPlus} size={0.8} />
        Create Schedule
      </Link>
    </div>
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
