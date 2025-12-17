import Icon from "@mdi/react";
import {
  mdiAccountPlus,
  mdiTune,
  mdiEmailFast,
} from "@mdi/js";

export default function Home() {
  return (
    <div className="bg-white">
      <header className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Image
            className="dark:invert"
            src="/globe.svg"
            alt="Logo"
            width={32}
            height={32}
          />
          <h1 className="text-2xl font-bold leading-none text-green-500">
            MotivationQuotes
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-700">
            Pricing
          </a>
          <a href="#" className="text-gray-700">
            Login
          </a>
          <a
            href="#"
            className="px-4 py-2 rounded-md bg-green-500 text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out"
          >
            Sign Up
          </a>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center py-32 bg-gray-100">
        <div className="bg-gray-800 rounded-3xl p-16 text-center">
          <h2 className="text-5xl font-bold leading-tight text-white mb-8">
            Start Your Day with a Dose of Inspiration
          </h2>
          <p className="text-lg leading-6 text-gray-300 mb-12">
            Schedule personalized motivational quotes delivered directly to
            your email or social media. Never miss a chance to be inspired.
          </p>
          <a
            href="#"
            className="px-8 py-3 rounded-full bg-green-500 text-white font-semibold shadow-sm hover:bg-green-600 transition ease-in-out"
          >
            Start Your Journey
          </a>
        </div>
        <p className="mt-4 text-gray-500">Join 10,000+ happy subscribers</p>
      </main>

      <section className="py-16">
        <h2 className="text-3xl text-black font-bold text-center mb-8">How It Works</h2>
        <p className="text-lg text-center text-gray-700 mb-16">
          Get your daily boost in three simple steps. We make it easy to
          customize your motivational journey.
        </p>
        <div className="container mx-auto grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center rounded-full bg-green-100 p-4 mx-auto w-16 h-16 mb-4">
              <Icon
                path={mdiAccountPlus}
                size={1}
                className="text-green-500"
              />
            </div>
            <h3 className="text-xl text-black font-semibold mb-2">1. Sign Up</h3>
            <p className="text-gray-600">
              Create your free account in seconds.
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center rounded-full bg-green-100 p-4 mx-auto w-16 h-16 mb-4">
              <Icon
                path={mdiTune}
                size={1}
                className="text-green-500"
              />

            </div>
            <h3 className="text-xl text-black font-semibold mb-2">2. Customize</h3>
            <p className="text-gray-600">
              Choose your topics, frequency, and delivery method.
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center rounded-full bg-green-100 p-4 mx-auto w-16 h-16 mb-4">
              <Icon
                path={mdiEmailFast}
                size={1}
                className="text-green-500"
              />

            </div>
            <h3 className="text-xl text-black font-semibold mb-2">3. Receive</h3>
            <p className="text-gray-600">
              Get inspired with quotes delivered when you need them most.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-100">
        <h2 className="text-3xl font-bold text-center mb-8">
          Words That Inspire
        </h2>
        <p className="text-lg text-center text-gray-700 mb-16">
          See what our users are saying and get a taste of the motivation
          you'll receive.
        </p>
        <div className="container mx-auto grid grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <p className="text-gray-800 italic mb-4">
              &quot;The only way to do great work is to love what you do. If you
              haven&apos;t found it yet, keep looking. Don&apos;t settle.&quot;
            </p>
            <p className="text-gray-500 text-sm text-right">- Steve Jobs</p>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-md">
            <p className="text-gray-800 italic mb-4">
              "This service is a game-changer! I wake up to an inspiring quote
              every morning, and it completely sets the tone for my day."
            </p>
            <p className="text-gray-500 text-sm text-right">- Alex R.</p>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-md">
            <p className="text-gray-800 italic mb-4">
              "Believe you can and you're halfway there."
            </p>
            <p className="text-gray-500 text-sm text-right">
              - Theodore Roosevelt
            </p>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-md">
            <p className="text-gray-800 italic mb-4">
              "I love how I can customize the types of quotes I get. It feels
              so personal and is genuinely helpful."
            </p>
            <p className="text-gray-500 text-sm text-right">- Sarah K.</p>
          </div>
        </div>
      </section>

      <footer className="bg-white py-4 text-center text-gray-500 border-t border-gray-200">
        © 2024 MotivationQuotes. All rights reserved.
        <div className="mt-2">
          <a href="#" className="ml-4">
            About Us
          </a>
          <a href="#" className="ml-4">
            Contact
          </a>
          <a href="#" className="ml-4">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
}
