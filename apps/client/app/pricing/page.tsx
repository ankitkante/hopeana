"use client";

import { useState } from "react";
import { mdiCheck, mdiChevronUp, mdiChevronDown } from "@mdi/js";
import Icon from "@mdi/react";

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: "Can I cancel any time?",
        answer: "Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.",
    },
    {
        question: "How does the message limit work?",
        answer: "Each plan has a monthly message limit. Messages reset at the beginning of each billing cycle. You can track your usage in your account dashboard.",
    },
    {
        question: "What happens if I use all my messages?",
        answer: "If you reach your message limit, you can upgrade to a higher plan or wait until the next billing cycle for your messages to reset.",
    },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="w-full max-w-3xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700"
                >
                    <button
                        className="w-full py-4 flex items-center justify-between text-left"
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                        <span className="text-gray-800 dark:text-white font-medium">{item.question}</span>
                        <Icon
                            path={openIndex === index ? mdiChevronUp : mdiChevronDown}
                            size={1}
                            className="text-green-500"
                        />
                    </button>
                    {openIndex === index && (
                        <div className="pb-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                            {item.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function CheckItem({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Icon path={mdiCheck} size={0.8} className="text-green-500" />
            <span>{children}</span>
        </div>
    );
}

export default function PricingPage() {
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Hero Section */}
            <section className="py-12 sm:py-16 px-4 sm:px-8">
                <div className="max-w-4xl mx-auto rounded-3xl px-6 py-12 sm:px-12 sm:py-16 md:p-16 text-center bg-gradient-to-br from-[#2c2f33] via-[#3a4a3f] to-[#1f3d2b]">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                        Choose Your Daily Dose of Motivation
                    </h1>
                    <p className="text-gray-300 text-base sm:text-lg mb-8">
                        Simple, transparent pricing to bring inspiration directly to you.
                    </p>
                    <button className="px-6 sm:px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition ease-in-out">
                        Get Started
                    </button>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-8 px-4 sm:px-8">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {/* Starter Plan */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Starter</h3>
                        <div className="mb-2">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">Free</span>
                        </div>
                        <p className="text-green-600 dark:text-green-500 text-sm mb-6">No credit card required</p>
                        <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition ease-in-out mb-8">
                            Try for Free
                        </button>
                        <div className="space-y-4">
                            <CheckItem>First 10 messages free</CheckItem>
                            <CheckItem>Email delivery</CheckItem>
                            <CheckItem>Basic scheduling</CheckItem>
                        </div>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border-2 border-green-500 shadow-sm relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700">
                                Best Value
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Premium</h3>
                        <div className="mb-2">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">$1</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-1">/ month</span>
                        </div>
                        <p className="text-transparent text-sm mb-6">.</p>
                        <button className="w-full py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition ease-in-out mb-8">
                            Subscribe Now
                        </button>
                        <div className="space-y-4">
                            <CheckItem>Up to 100 messages/month</CheckItem>
                            <CheckItem>Social media & Email</CheckItem>
                            <CheckItem>Advanced scheduling options</CheckItem>
                            <CheckItem>Priority support</CheckItem>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-12 sm:py-16 px-4 sm:px-8 bg-white dark:bg-gray-800">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-8 sm:mb-12">
                    Frequently Asked Questions
                </h2>
                <FAQAccordion items={faqData} />
            </section>
        </div>
    );
}
