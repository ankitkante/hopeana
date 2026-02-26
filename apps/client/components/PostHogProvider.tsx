"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host: "/hpa",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
      capture_pageview: false,   // fired manually in PostHogPageView
      capture_pageleave: true,   // helps detect abandonment
      autocapture: true,         // captures link + button clicks automatically
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
