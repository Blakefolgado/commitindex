"use client";

import { useState } from "react";
import { ContributionGrid, type Period } from "@/components/contribution-grid";
import type { ActivityDay } from "@/lib/types";

export function ContributionGridSelector({
  activity,
  org,
}: {
  activity: ActivityDay[];
  org: string;
}) {
  const [period, setPeriod] = useState<Period>("rolling");
  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="inline-period-controls">
        {([
          ["rolling", "Last 12 months"],
          ["current", String(currentYear)],
          ["previous", String(currentYear - 1)],
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={period === value}
            className={period === value ? "active" : ""}
            key={value}
            onClick={() => setPeriod(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <ContributionGrid activity={activity} org={org} period={period} />
    </>
  );
}
