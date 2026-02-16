import Icon from "@mdi/react";

export default function CardRadio({
  icon,
  value,
  label,
  subtitle,
  isSelected,
  onClick,
}: {
  icon: string;
  value: string;
  label: string;
  subtitle: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-6 text-center transition-all ${
        isSelected
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
      }`}
    >
      <div className="mb-2">
        <Icon
          path={icon}
          size={1.5}
          className={isSelected ? "text-green-500" : "text-gray-400 dark:text-gray-500"}
        />
      </div>
      <span className="font-bold text-gray-900 dark:text-white">{label}</span>
      <span className="text-xs text-gray-500 mt-1 dark:text-gray-400">{subtitle}</span>
    </button>
  );
}
