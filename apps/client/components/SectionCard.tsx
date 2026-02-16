import Icon from "@mdi/react";

export default function SectionCard({
  icon,
  label,
  grid = 1,
  children,
}: {
  icon: string;
  label: string;
  grid?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Icon path={icon} size={1} className="text-gray-400 dark:text-gray-500" />
        {label}
      </h3>
      <div
        className={`grid gap-4 ${
          grid === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : grid === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
