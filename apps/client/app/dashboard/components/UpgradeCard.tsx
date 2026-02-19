"use client";

import Link from "next/link";
import Icon from "@mdi/react";
import { mdiCheckCircle, mdiArrowRight, mdiLightningBolt } from "@mdi/js";

const features = [
  "Unlimited Quotes",
  "AI-Generated Text",
  "No Watermarks",
];

export default function UpgradeCard() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-green-950 to-green-900 rounded-xl p-6 text-white overflow-hidden relative">
      {/* Decorative circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10">
        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
          <Icon path={mdiLightningBolt} size={1} className="text-green-400" />
        </div>

        <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
        <p className="text-gray-300 text-sm mb-6">
          Get unlimited scheduling, multi-platform posting, and remove watermarks.
        </p>

        <div className="space-y-3 mb-6">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <Icon path={mdiCheckCircle} size={0.7} className="text-green-400" />
              <span className="text-sm text-gray-200">{feature}</span>
            </div>
          ))}
        </div>

        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg transition"
        >
          Unlock Pro
          <Icon path={mdiArrowRight} size={0.8} />
        </Link>
      </div>
    </div>
  );
}
