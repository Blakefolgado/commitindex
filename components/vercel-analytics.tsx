"use client";

import dynamic from "next/dynamic";

export const VercelAnalytics = dynamic(
  () => import("@vercel/analytics/next").then((module) => module.Analytics),
  { ssr: false },
);
