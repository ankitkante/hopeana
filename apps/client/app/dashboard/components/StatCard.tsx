"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  progressBar?: {
    current: number;
    max: number;
  };
  badge?: {
    text: string;
    color?: string;
  };
}

export default function StatCard({
  label,
  value,
  subtitle,
  icon,
  progressBar,
  badge,
}: StatCardProps) {
  const progressPercent = progressBar
    ? Math.min((progressBar.current / progressBar.max) * 100, 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-500">
          {icon}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
          {progressBar && (
            <span className="text-lg text-gray-400 dark:text-gray-500 font-medium">
              / {progressBar.max}
            </span>
          )}
        </div>

        {progressBar && (
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          {badge && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                badge.color || "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              }`}
            >
              {badge.text}
            </span>
          )}
          {subtitle && (
            <span className="text-sm text-gray-400 dark:text-gray-500">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
