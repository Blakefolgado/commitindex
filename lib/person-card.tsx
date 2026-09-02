import { ImageResponse } from "next/og";
import type { PeopleIndexEntry } from "@/lib/people-index";

const size = { width: 1200, height: 630 };

/**
 * Crawlers (X in particular) are fussy about a chunked image response, so the
 * PNG is buffered and served with an explicit Content-Length.
 */
export const cardHeaders = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  "Content-Type": "image/png",
};

async function render(element: React.ReactElement) {
  return new ImageResponse(element, size).arrayBuffer();
}

export function renderGenericCard() {
  return render(genericCard());
}

export function renderPersonCard(person: PeopleIndexEntry) {
  return render(personCard(person));
}

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
          How much shipping?
        </span>
        <span style={{ color: "#8b949e", fontSize: 57, fontWeight: 700, letterSpacing: "-2.7px", lineHeight: 1.02 }}>
          Your commits against the AI era.
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
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ color: "#8b949e", fontSize: 19 }}>{label}</span>
      <span style={{ color: "#39d353", fontSize: 52, fontWeight: 700, letterSpacing: "-1.6px" }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Landmark releases worth naming on a share card. Kept deliberately short and
 * hand-picked: the full aiReleases list is far too dense to label at 1200px.
 */
const milestones = [
  { date: "2024-05-13", domain: "openai.com", label: "GPT-4o" },
  { date: "2024-11-24", domain: "cursor.com", label: "Cursor Agent" },
  { date: "2025-02-24", domain: "anthropic.com", label: "Claude Code" },
  { date: "2025-08-07", domain: "openai.com", label: "GPT-5" },
  { date: "2025-11-18", domain: "google.com", label: "Gemini 3" },
  { date: "2026-02-02", domain: "openai.com", label: "Codex app" },
];

function logoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function personCard(person: PeopleIndexEntry) {
  const months = person.months.map((total) => ({ total }));
  const chart = { width: 1096, height: 244, inset: 10 };
  const maximum = Math.max(...months.map((month) => month.total), 1);
  const point = (index: number, total: number) => [
    Math.round(
      chart.inset
      + (index / Math.max(months.length - 1, 1)) * (chart.width - chart.inset * 2),
    ),
    Math.round(chart.inset + (1 - total / maximum) * (chart.height - chart.inset * 2)),
  ];
  const points = months.map((month, index) => point(index, month.total).join(",")).join(" ");
  const areaPoints = `${chart.inset},${chart.height} ${points} ${chart.width - chart.inset},${chart.height}`;
  const change = person.contributionsPrior12m
    ? Math.round(
      ((person.contributions12m - person.contributionsPrior12m)
        / person.contributionsPrior12m) * 100,
    )
    : null;
  const [peakX, peakY] = point(months.length - 1, months.at(-1)?.total ?? 0);
  // Months are the trailing 36 whole months, so a release date maps to an index
  // by counting back from the most recent of them.
  const lastMonth = new Date();
  lastMonth.setUTCDate(1);
  lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
  const monthIndex = (date: string) => {
    const target = new Date(`${date.slice(0, 7)}-01T00:00:00Z`);
    const back = (lastMonth.getUTCFullYear() - target.getUTCFullYear()) * 12
      + (lastMonth.getUTCMonth() - target.getUTCMonth());
    const index = months.length - 1 - back;
    return index >= 0 && index < months.length ? index : -1;
  };
  // Alternate rows so neighbouring labels cannot overlap at this width.
  const visibleMilestones = milestones
    .map((milestone) => ({ ...milestone, index: monthIndex(milestone.date) }))
    .filter((milestone) => milestone.index >= 0)
    .map((milestone, row) => ({
      ...milestone,
      row: row % 2,
      x: point(milestone.index, 0)[0],
    }));

  return (
    <div
      style={{
        background: "#0d1117",
        color: "#f0f6fc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        height: "100%",
        // X lays its own title bar over the bottom of the card, so the chart
        // stops well short of the edge rather than being half covered.
        padding: "38px 52px 96px",
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Wordmark />
        <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
          <div style={{ alignItems: "flex-end", display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-1.2px", lineHeight: 1.1 }}>
              {person.name}
            </span>
            <span style={{ color: "#8b949e", fontSize: 21 }}>@{person.login}</span>
          </div>
          <img
            alt=""
            height={82}
            src={person.avatarUrl}
            style={{
              border: "3px solid #39d353",
              borderRadius: 41,
              height: 82,
              objectFit: "cover",
              width: 82,
            }}
            width={82}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 64, marginTop: 20 }}>
        {metric("Last 12 months", person.contributions12m.toLocaleString())}
        {metric(
          "Year on year",
          change === null ? "—" : `${change >= 0 ? "+" : ""}${change}%`,
        )}
        {metric("Current streak", `${person.streak}d`)}
      </div>

      <div
        style={{
          display: "flex",
          flexGrow: 1,
          marginTop: 16,
          position: "relative",
          width: "100%",
        }}
      >
        <svg
          height={chart.height}
          style={{ bottom: 0, left: 0, position: "absolute" }}
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          width={chart.width}
        >
          {visibleMilestones.map((milestone) => (
            <line
              key={milestone.label}
              stroke="#8b949e"
              strokeDasharray="4 6"
              strokeWidth="2"
              x1={milestone.x}
              x2={milestone.x}
              y1="0"
              y2={chart.height}
            />
          ))}
          <polygon fill="#39d353" fillOpacity="0.16" points={areaPoints} />
          <polyline
            fill="none"
            points={points}
            stroke="#39d353"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          <circle cx={peakX} cy={peakY} fill="#39d353" r="9" stroke="#0d1117" strokeWidth="4" />
        </svg>

        {visibleMilestones.map((milestone) => (
          <div
            key={milestone.label}
            style={{
              alignItems: "center",
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 999,
              display: "flex",
              gap: 7,
              left: Math.min(Math.max(milestone.x - 60, 0), chart.width - 130),
              padding: "5px 12px 5px 6px",
              position: "absolute",
              top: milestone.row * 40,
            }}
          >
            <img alt="" height={22} src={logoUrl(milestone.domain)} width={22} />
            <span style={{ color: "#f0f6fc", fontSize: 17 }}>{milestone.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

