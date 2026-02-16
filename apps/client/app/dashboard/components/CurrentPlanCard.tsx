"use client";

import Icon from "@mdi/react";
import { mdiCheckCircle } from "@mdi/js";

interface CurrentPlanCardProps {
  billingDate: string | null;
}

const features = [
  "Priority support included",
  "Access to exclusive quotes",
  "Advanced analytics",
];

export default function CurrentPlanCard({ billingDate }: CurrentPlanCardProps) {
  const formattedDate = billingDate
    ? new Date(billingDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h3>
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full uppercase">
          Active
        </span>
      </div>

      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Pro</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Next billing date: {formattedDate}
      </p>

      <div className="space-y-3 mb-5">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2">
            <Icon path={mdiCheckCircle} size={0.7} className="text-green-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
          </div>
        ))}
      </div>

      <button className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition">
        Update Payment Method
      </button>
    </div>
  );
}
