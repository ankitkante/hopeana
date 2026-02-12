"use client";

const templates = [
  { name: "Morning Motivation", icon: "☀️" },
  { name: "Workout Push", icon: "⚡" },
];

export default function QuickTemplatesCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Templates
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => (
          <button
            key={template.name}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition"
          >
            <span className="text-2xl">{template.icon}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
              {template.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
