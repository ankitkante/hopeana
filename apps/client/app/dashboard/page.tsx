"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@mdi/react";
import {
  mdiEmailOutline,
  mdiCalendarClock,
  mdiChartLine,
  mdiCog,
  mdiFormatQuoteClose,
  mdiStar,
  mdiCrown,
  mdiCheck,
} from "@mdi/js";

type UserPlan = "free" | "premium";

interface UserStats {
  messagesUsed: number;
  messagesLimit: number;
  nextDelivery: string;
  deliveryMethod: string;
}

function UpgradeBanner() {
  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon path={mdiCrown} size={1.5} className="text-yellow-300" />
          <div>
            <h3 className="font-semibold text-lg">Unlock Premium Features</h3>
            <p className="text-green-100 text-sm">
              Get 100 messages/month, social media delivery, and more!
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="px-6 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition whitespace-nowrap"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  );
}

function StatsCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <Icon path={icon} size={1} className="text-green-500" />
        </div>
        <span className="text-gray-600 dark:text-gray-400 text-sm">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function QuoteCard({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="bg-gradient-to-br from-[#2c2f33] via-[#3a4a3f] to-[#1f3d2b] rounded-xl p-6 text-white">
      <Icon path={mdiFormatQuoteClose} size={1.5} className="text-green-400 mb-3" />
      <p className="text-lg leading-relaxed mb-4">&quot;{quote}&quot;</p>
      <p className="text-green-300 text-sm">— {author}</p>
    </div>
  );
}

function FeatureItem({
  available,
  children,
}: {
  available: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon
        path={mdiCheck}
        size={0.8}
        className={available ? "text-green-500" : "text-gray-300 dark:text-gray-600"}
      />
      <span
        className={
          available
            ? "text-gray-700 dark:text-gray-300"
            : "text-gray-400 dark:text-gray-500"
        }
      >
        {children}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  // Simulated user state - in production this would come from auth context
  const [userPlan] = useState<UserPlan>("free");

  // Simulated stats - in production this would come from API
  const stats: UserStats = {
    messagesUsed: userPlan === "free" ? 3 : 42,
    messagesLimit: userPlan === "free" ? 10 : 100,
    nextDelivery: "Tomorrow at 8:00 AM",
    deliveryMethod: userPlan === "free" ? "Email" : "Email & Twitter",
  };

  const usagePercentage = (stats.messagesUsed / stats.messagesLimit) * 100;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here&apos;s your motivation dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                userPlan === "premium"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {userPlan === "premium" ? (
                <span className="flex items-center gap-1">
                  <Icon path={mdiStar} size={0.6} />
                  Premium
                </span>
              ) : (
                "Free Plan"
              )}
            </span>
          </div>
        </div>

        {/* Upgrade Banner (only for free users) */}
        {userPlan === "free" && <UpgradeBanner />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={mdiEmailOutline}
            title="Messages Used"
            value={`${stats.messagesUsed} / ${stats.messagesLimit}`}
            subtitle={`${stats.messagesLimit - stats.messagesUsed} remaining this month`}
          />
          <StatsCard
            icon={mdiCalendarClock}
            title="Next Delivery"
            value={stats.nextDelivery.split(" at ")[0]}
            subtitle={stats.nextDelivery.split(" at ")[1]}
          />
          <StatsCard
            icon={mdiChartLine}
            title="Delivery Method"
            value={stats.deliveryMethod}
          />
          <StatsCard
            icon={mdiCog}
            title="Status"
            value="Active"
            subtitle="Receiving quotes daily"
          />
        </div>

        {/* Usage Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Monthly Usage
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.messagesUsed} of {stats.messagesLimit} messages
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                usagePercentage >= 90
                  ? "bg-red-500"
                  : usagePercentage >= 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          {usagePercentage >= 80 && userPlan === "free" && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              You&apos;re running low on messages.{" "}
              <Link href="/pricing" className="underline font-medium">
                Upgrade to Premium
              </Link>{" "}
              for more.
            </p>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Quote */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Today&apos;s Quote
            </h2>
            <QuoteCard
              quote="The only way to do great work is to love what you do."
              author="Steve Jobs"
            />
          </div>

          {/* Your Plan Features */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Plan Features
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <FeatureItem available={true}>
                  {userPlan === "free" ? "10 messages/month" : "100 messages/month"}
                </FeatureItem>
                <FeatureItem available={true}>Email delivery</FeatureItem>
                <FeatureItem available={userPlan === "premium"}>
                  Social media delivery
                </FeatureItem>
                <FeatureItem available={true}>Basic scheduling</FeatureItem>
                <FeatureItem available={userPlan === "premium"}>
                  Advanced scheduling options
                </FeatureItem>
                <FeatureItem available={userPlan === "premium"}>
                  Priority support
                </FeatureItem>
              </div>
              {userPlan === "free" && (
                <Link
                  href="/pricing"
                  className="mt-5 block w-full py-2 text-center bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition"
                >
                  Upgrade to Premium
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 text-left hover:border-green-500 transition">
              <Icon path={mdiCalendarClock} size={1.2} className="text-green-500 mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Adjust Schedule
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Change when you receive quotes
              </p>
            </button>
            <button className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 text-left hover:border-green-500 transition">
              <Icon path={mdiEmailOutline} size={1.2} className="text-green-500 mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Delivery Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure how you receive quotes
              </p>
            </button>
            <button className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 text-left hover:border-green-500 transition">
              <Icon path={mdiCog} size={1.2} className="text-green-500 mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Account Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your profile and preferences
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
