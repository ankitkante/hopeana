import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Suspense } from "react";
import { ToastProvider } from "@/components/Toast";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PostHogPageView } from "@/components/PostHogPageView";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hopeana - Motivation as a Service",
  description: "Personalized motivational quotes delivered to your inbox",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}>
        <PostHogProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            {children}
          </ToastProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
