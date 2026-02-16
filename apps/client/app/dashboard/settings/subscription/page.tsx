"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import {
  mdiShieldCheckOutline,
  mdiCreditCardOutline,
  mdiDownload,
  mdiHelpCircleOutline,
} from "@mdi/js";

interface SubscriptionData {
  plan: string;
  status: string;
  messageLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  billingDate: string | null;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.data);
        }
      } catch {
        // Will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-48 animate-pulse" />
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-32 animate-pulse" />
      </div>
    );
  }

  const isPro = subscription?.plan === "pro";
  const usagePercent = subscription
    ? Math.round((subscription.messagesUsed / subscription.messageLimit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Subscription Management
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your plan, billing history, and payment methods in one place.
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Current Subscription
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Overview of your active plan.
        </p>

        {/* Plan Card */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Icon path={mdiShieldCheckOutline} size={1} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {isPro ? "Hopeana Pro" : "Hopeana Free"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isPro ? "Full access to all wellness features" : "Basic motivational quotes"}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                subscription?.status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
              }`}
            >
              {subscription?.status === "active" ? "ACTIVE" : (subscription?.status || "").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Billing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-1">
              Billing Cycle
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">Monthly</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isPro ? "$12.99/month" : "Free"}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-1">
              Next Payment
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {subscription?.billingDate
                ? new Date(subscription.billingDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isPro ? "Automated charge" : "No charges"}
            </p>
          </div>
        </div>

        {/* Usage */}
        <div className="mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Messages used this period</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {subscription?.messagesUsed ?? 0} / {subscription?.messageLimit ?? 0}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isPro && (
            <button
              onClick={() => alert("Coming soon!")}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition"
            >
              Upgrade Plan
            </button>
          )}
          {isPro && (
            <button
              onClick={() => alert("Coming soon!")}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Payment Method + Billing Support Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Payment Method (mock) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Payment Method
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your primary billing card details.
          </p>

          {/* Card Visual */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white mb-4">
            <div className="flex justify-between items-start mb-8">
              <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">VISA</span>
              <div className="w-8 h-6 rounded bg-yellow-400/30" />
            </div>
            <p className="text-lg tracking-widest mb-4 font-mono">
              **** **** **** 4242
            </p>
            <div className="flex justify-between text-xs">
              <div>
                <p className="text-gray-400 uppercase text-[10px]">Card Holder</p>
                <p className="font-medium">ALEX THOMPSON</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase text-[10px]">Expires</p>
                <p className="font-medium">12/25</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert("Coming soon!")}
            className="w-full py-2.5 text-sm font-medium text-green-600 dark:text-green-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Icon path={mdiCreditCardOutline} size={0.7} />
            Update Card
          </button>
        </div>

        {/* Billing Support (mock) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Billing Support
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Need assistance with your account?
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Icon path={mdiHelpCircleOutline} size={0.8} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Questions about your subscription plan or an unexpected charge? Our billing team is available 24/7.
              </p>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            <li className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Refund Policy Overview
            </li>
            <li className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Change Billing Address
            </li>
          </ul>

          <button
            onClick={() => alert("Coming soon!")}
            className="w-full py-2.5 text-sm font-semibold text-white bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 rounded-lg transition"
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* Billing History (mock) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Billing History
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Manage and download your recent invoices.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Description</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "Oct 12, 2023", desc: "Hopeana Plus - Monthly", amount: "$12.99" },
                { date: "Sep 12, 2023", desc: "Hopeana Plus - Monthly", amount: "$12.99" },
                { date: "Aug 12, 2023", desc: "Hopeana Plus - Monthly", amount: "$12.99" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{row.date}</td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{row.desc}</td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{row.amount}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => alert("Coming soon!")}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1 text-sm font-medium"
                    >
                      <Icon path={mdiDownload} size={0.6} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => alert("Coming soon!")}
            className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            View Full Transaction History
          </button>
        </div>
      </div>
    </div>
  );
}
