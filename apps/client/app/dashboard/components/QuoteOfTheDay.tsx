"use client";

interface QuoteOfTheDayProps {
  content: string;
  author: string | null;
}

export default function QuoteOfTheDay({ content, author }: QuoteOfTheDayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-4 block">
        Quote of the Day
      </span>
      <div className="relative">
        {/* Decorative circle */}
        <div className="absolute -top-2 -right-2 w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full opacity-60" />
        <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed relative z-10">
          &quot;{content}&quot;
        </p>
        {author && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">— {author}</p>
        )}
      </div>
    </div>
  );
}
