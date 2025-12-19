import Icon from "@mdi/react";
import {
  mdiAccountPlus,
  mdiTune,
  mdiEmailCheckOutline,
  mdiBrain,
  mdiLightningBolt,
  mdiEmoticonHappyOutline,
  mdiFlagVariant,
} from "@mdi/js";

export default function Home() {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 py-12 sm:py-16 md:py-24">
        <div
          className="w-full max-w-3xl rounded-3xl px-6 py-12 sm:px-12 sm:py-16 md:px-16 md:py-20 text-center
            bg-gradient-to-br
            from-[#2c2f33]
            via-[#3a4a3f]
            to-[#1f3d2b]"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white mb-4 sm:mb-6">
            Start Your Day with a Dose of Inspiration
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-gray-300 mb-8 sm:mb-10 max-w-xl mx-auto">
            Schedule personalized motivational quotes delivered directly to your email or
            social media. Never miss a chance to be inspired.
          </p>
          <a
            href="#"
            className="inline-block px-6 py-3 sm:px-8 sm:py-3 rounded-md bg-green-500 text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out"
          >
            Start Your Journey
          </a>
        </div>
        <p className="mt-6 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          Join 10,000+ happy subscribers
        </p>
      </main>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800">
        <h2 className="text-2xl sm:text-3xl text-gray-900 dark:text-white font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-base sm:text-lg text-center text-gray-600 dark:text-gray-300 mb-10 sm:mb-16 max-w-2xl mx-auto">
          Get your daily boost in three simple steps. We make it easy to
          customize your motivational journey.
        </p>
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-center mx-auto w-12 h-12 mb-4">
              <Icon
                path={mdiAccountPlus}
                size={1.5}
                className="text-green-500"
              />
            </div>
            <h3 className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold mb-2">
              1. Sign Up
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Create your free account in seconds.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-center mx-auto w-12 h-12 mb-4">
              <Icon path={mdiTune} size={1.5} className="text-green-500" />
            </div>
            <h3 className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold mb-2">
              2. Customize
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Choose your topics, frequency, and delivery method.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-600 sm:col-span-2 md:col-span-1 sm:max-w-sm sm:mx-auto md:max-w-none">
            <div className="flex items-center justify-center mx-auto w-12 h-12 mb-4">
              <Icon
                path={mdiEmailCheckOutline}
                size={1.5}
                className="text-green-500"
              />
            </div>
            <h3 className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold mb-2">
              3. Receive
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Get inspired with quotes delivered when you need them most.
            </p>
          </div>
        </div>
      </section>

      {/* Why Motivation Matters Section */}
      <section className="py-12 sm:py-16 px-4 bg-gray-100 dark:bg-gray-900">
        <h2 className="text-2xl sm:text-3xl text-gray-900 dark:text-white font-bold text-center mb-4">
          Why Motivation Matters
        </h2>
        <p className="text-base sm:text-lg text-center text-gray-600 dark:text-gray-300 mb-10 sm:mb-16 max-w-2xl mx-auto">
          Consistent inspiration isn&apos;t just a feel-good moment; it&apos;s a tool for building a stronger, more
          resilient mindset.
        </p>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Icon path={mdiBrain} size={1} className="text-green-500" />
              <h3 className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold">
                Mental Resilience
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Daily exposure to positive reinforcement helps rewire your brain to handle stress better and bounce
              back from setbacks with greater ease.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Icon path={mdiLightningBolt} size={1} className="text-green-500" />
              <h3 className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold">
                Productivity Boost
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Starting your morning with an inspiring thought sets a productive tone, helping you focus on your
              priorities and tackle tasks with renewed energy.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Icon path={mdiEmoticonHappyOutline} size={1} className="text-green-500" />
              <h3 className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold">
                Emotional Well-being
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Uplifting words can shift your mood instantly. Regular doses of positivity contribute to lower
              anxiety levels and a more optimistic outlook on life.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Icon path={mdiFlagVariant} size={1} className="text-green-500" />
              <h3 className="text-lg sm:text-xl text-gray-900 dark:text-white font-semibold">
                Goal Achievement
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Motivation fuels action. Reminders of why you started and what&apos;s possible keep you aligned with
              your long-term goals, even when the path gets tough.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
