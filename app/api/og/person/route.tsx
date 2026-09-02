import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPersonContributionHistory } from "@/lib/github-person";
import { buildMonthlySeries } from "@/lib/types";

export const runtime = "nodejs";

const size = { width: 1200, height: 630 };
const cacheHeaders = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

const fallbackYears = ["2022", "2023", "2024", "2025", "2026"];
const fallbackReleases = [
  { label: "ChatGPT", left: 245 },
  { label: "GPT-4", left: 390 },
  { label: "Claude Code", left: 790 },
  { label: "Codex app", left: 980 },
];

function Wordmark() {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 14 }}>
      <div
        style={{
          alignItems: "flex-end",
          border: "1px solid #30363d",
          borderRadius: 8,
          display: "flex",
          gap: 3,
          height: 38,
          justifyContent: "center",
          padding: "7px",
          width: 38,
        }}
      >
        {[10, 17, 24].map((height, index) => (
          <div
            key={height}
            style={{
              background: ["#0e4429", "#26a641", "#39d353"][index],
              borderRadius: 2,
              display: "flex",
              height,
              width: 5,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.7px" }}>Commit Index</span>
    </div>
  );
}

/** The generic card, used when no user is given and when GitHub lookup fails. */
function genericCard() {
  return (
    <div
      style={{
        background: "#0d1117",
        color: "#f0f6fc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        height: "100%",
        padding: "48px 58px",
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Wordmark />
        <span style={{ color: "#8b949e", fontSize: 19 }}>commitindex.com/people</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 38, width: 735 }}>
        <span style={{ fontSize: 57, fontWeight: 700, letterSpacing: "-2.7px", lineHeight: 1.02 }}>
          Your GitHub momentum,
        </span>
        <span style={{ color: "#8b949e", fontSize: 57, fontWeight: 700, letterSpacing: "-2.7px", lineHeight: 1.02 }}>
          mapped against the AI era.
        </span>
      </div>

      <div
        style={{
          background: "#0f141b",
          border: "1px solid #21262d",
          borderRadius: 12,
          display: "flex",
          height: 270,
          marginTop: 35,
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        {fallbackReleases.map((release) => (
          <div
            key={release.label}
            style={{
              alignItems: "center",
              color: "#c4b5fd",
              display: "flex",
              flexDirection: "column",
              fontSize: 11,
              left: release.left,
              position: "absolute",
              top: 43,
            }}
          >
            <span>{release.label}</span>
            <div style={{ background: "#a78bfa", display: "flex", height: 185, marginTop: 8, opacity: 0.82, width: 2 }} />
          </div>
        ))}

        <svg
          height="176"
          style={{ bottom: 31, left: 20, position: "absolute" }}
          viewBox="0 0 1040 176"
          width="1040"
        >
          <polyline
            fill="none"
            points="0,164 45,163 90,164 135,162 180,163 225,162 270,164 315,163 360,161 405,162 450,160 495,159 540,160 585,158 630,155 675,151 720,143 765,135 810,139 850,117 890,124 925,89 955,74 980,96 1005,48 1040,29"
            stroke="#58a6ff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>

        <div style={{ bottom: 10, display: "flex", justifyContent: "space-between", left: 20, position: "absolute", width: 1040 }}>
          {fallbackYears.map((year) => <span key={year} style={{ color: "#8b949e", fontSize: 12 }}>{year}</span>)}
        </div>
      </div>
    </div>
  );
}

function metric(label: string, value: string) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ color: "#8b949e", fontSize: 17 }}>{label}</span>
      <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-1px" }}>{value}</span>
    </div>
  );
}

function personCard(person: {
  avatarUrl: string;
  login: string;
  months: Array<{ start: string; total: number }>;
  name: string;
}) {
  const { months } = person;
  const chart = { width: 1040, height: 168 };
  const maximum = Math.max(...months.map((month) => month.total), 1);
  const points = months
    .map((month, index) => {
      const x = (index / Math.max(months.length - 1, 1)) * chart.width;
      const y = chart.height - (month.total / maximum) * chart.height;
      return `${Math.round(x)},${Math.round(y)}`;
    })
    .join(" ");
  const lastYearTotal = months.slice(-12).reduce((sum, month) => sum + month.total, 0);
  const priorYearTotal = months.slice(-24, -12).reduce((sum, month) => sum + month.total, 0);
  const change = priorYearTotal
    ? Math.round(((lastYearTotal - priorYearTotal) / priorYearTotal) * 100)
    : null;
  const firstLabel = months[0]?.start.slice(0, 4) ?? "";
  const lastLabel = months.at(-1)?.start.slice(0, 4) ?? "";

  return (
    <div
      style={{
        background: "#0d1117",
        color: "#f0f6fc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        height: "100%",
        padding: "44px 58px",
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Wordmark />
        <span style={{ color: "#8b949e", fontSize: 19 }}>commitindex.com/people</span>
      </div>

      <div style={{ alignItems: "center", display: "flex", gap: 28, marginTop: 30 }}>
        <img
          alt=""
          height={148}
          src={person.avatarUrl}
          style={{ borderRadius: 74, height: 148, objectFit: "cover", width: 148 }}
          width={148}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-2px", lineHeight: 1.05 }}>
            {person.name}
          </span>
          <span style={{ color: "#8b949e", fontSize: 28 }}>@{person.login}</span>
        </div>
        <div style={{ display: "flex", gap: 44, marginLeft: "auto" }}>
          {metric("Last 12 months", lastYearTotal.toLocaleString())}
          {change === null
            ? metric("Contributions", months.reduce((sum, month) => sum + month.total, 0).toLocaleString())
            : metric("Year on year", `${change >= 0 ? "+" : ""}${change}%`)}
        </div>
      </div>

      <div
        style={{
          background: "#0f141b",
          border: "1px solid #21262d",
          borderRadius: 12,
          display: "flex",
          height: 244,
          marginTop: 26,
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <span style={{ color: "#8b949e", fontSize: 15, left: 22, position: "absolute", top: 16 }}>
          Contributions per month, last 3 years
        </span>
        <svg
          height={chart.height}
          style={{ bottom: 30, left: 20, position: "absolute" }}
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          width={chart.width}
        >
          <polyline
            fill="none"
            points={points}
            stroke="#58a6ff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
        <div style={{ bottom: 8, display: "flex", justifyContent: "space-between", left: 20, position: "absolute", width: chart.width }}>
          <span style={{ color: "#8b949e", fontSize: 13 }}>{firstLabel}</span>
          <span style={{ color: "#8b949e", fontSize: 13 }}>{lastLabel}</span>
        </div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("user")?.trim();
  if (!username) {
    return new ImageResponse(genericCard(), { ...size, headers: cacheHeaders });
  }

  try {
    const person = await getPersonContributionHistory(username);
    const months = buildMonthlySeries(person.contributions);
    if (!months.length) throw new Error("no contribution months");
    return new ImageResponse(
      personCard({
        avatarUrl: person.avatarUrl,
        login: person.login,
        months,
        name: person.name,
      }),
      { ...size, headers: cacheHeaders },
    );
  } catch {
    return new ImageResponse(genericCard(), { ...size, headers: cacheHeaders });
  }
}
