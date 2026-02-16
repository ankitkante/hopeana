const days = [
  { label: "M", value: "monday" },
  { label: "T", value: "tuesday" },
  { label: "W", value: "wednesday" },
  { label: "T", value: "thursday" },
  { label: "F", value: "friday" },
  { label: "S", value: "saturday" },
  { label: "S", value: "sunday" },
];

export default function DayPicker({
  selectedDays,
  onToggle,
}: {
  selectedDays: string[];
  onToggle: (day: string) => void;
}) {
  return (
    <div className="flex justify-center gap-2">
      {days.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => onToggle(value)}
          className={`w-10 h-10 rounded-full font-bold transition-all cursor-pointer ${
            selectedDays.includes(value)
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
