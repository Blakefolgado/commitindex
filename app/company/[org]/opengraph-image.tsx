import { ImageResponse } from "next/og";
import { getOrganizationActivity } from "@/lib/github";

export const runtime = "nodejs";
export const alt = "Company public GitHub activity on Open Office";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const colors = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

export default async function Image({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const data = await getOrganizationActivity(org);
  let avatarDataUrl = "";
  try {
    const avatarResponse = await fetch(data.avatarUrl, { next: { revalidate: 86400 } });
    if (avatarResponse.ok) {
      const mime = avatarResponse.headers.get("content-type") || "image/png";
      avatarDataUrl = `data:${mime};base64,${Buffer.from(await avatarResponse.arrayBuffer()).toString("base64")}`;
    }
  } catch {
    avatarDataUrl = "";
  }
  const days = data.activity.slice(-364);
  const max = Math.max(...days.map((day) => day.count), 1);
  const weeks = Array.from({ length: 52 }, (_, week) => days.slice(week * 7, week * 7 + 7));

  return new ImageResponse(
    (
      <div style={{ background: "#0d1117", color: "#f0f6fc", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", height: "100%", padding: "54px 62px", width: "100%" }}>
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
            <div style={{ border: "3px solid #f0f6fc", borderRadius: 8, display: "flex", height: 34, width: 34 }} />
            <span style={{ fontSize: 27, fontWeight: 700 }}>Open Office</span>
          </div>
          <span style={{ color: "#8b949e", fontSize: 21 }}>Public GitHub activity</span>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 28, marginTop: 48 }}>
          {avatarDataUrl ? (
            <img src={avatarDataUrl} alt="" width="112" height="112" style={{ border: "1px solid #30363d", borderRadius: 18, height: 112, objectFit: "cover", width: 112 }} />
          ) : (
            <div style={{ alignItems: "center", background: "#161b22", border: "1px solid #30363d", borderRadius: 18, display: "flex", fontSize: 48, fontWeight: 700, height: 112, justifyContent: "center", width: 112 }}>
              {data.name.slice(0, 1)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 60, fontWeight: 700, letterSpacing: "-2px" }}>{data.name}</span>
            <span style={{ color: "#8b949e", fontSize: 25 }}>@{data.org} · {data.sampledRepos.length} public repos sampled</span>
          </div>
        </div>
        <div style={{ borderBottom: "1px solid #30363d", borderTop: "1px solid #30363d", display: "flex", justifyContent: "space-around", marginTop: 34, padding: "22px 0" }}>
          {[
            [data.totalCommits.toLocaleString(), "commits"],
            [String(data.activeDays), "active days"],
            [`${data.stats.consistency}%`, "consistency"],
            [`${data.stats.momentum > 0 ? "+" : ""}${data.stats.momentum}%`, "30-day momentum"],
          ].map(([value, label]) => (
            <div key={label} style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
              <span style={{ color: label === "30-day momentum" && data.stats.momentum >= 0 ? "#39d353" : "#f0f6fc", fontSize: 34, fontWeight: 700 }}>{value}</span>
              <span style={{ color: "#8b949e", fontSize: 17 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 34 }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {week.map((day) => {
                const level = day.count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((day.count / max) * 4)));
                return <div key={day.date} style={{ background: colors[level], border: "1px solid #21262d", borderRadius: 2, height: 14, width: 14 }} />;
              })}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
