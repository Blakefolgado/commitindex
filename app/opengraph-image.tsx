import { ImageResponse } from "next/og";

export const alt = "Open Office — see how technology companies build in public";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function cellLevel(index: number, row: number) {
  const wave = Math.sin(index * 0.41 + row * 1.7) + Math.cos(index * 0.17 - row);
  return Math.max(0, Math.min(4, Math.round(wave + 2)));
}

const colors = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ background: "#0d1117", color: "#f0f6fc", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", height: "100%", padding: "60px 68px", width: "100%" }}>
        <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
          <div style={{ border: "3px solid #f0f6fc", borderRadius: 8, display: "flex", height: 36, width: 36 }} />
          <span style={{ fontSize: 29, fontWeight: 700 }}>Open Office</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 68 }}>
          <span style={{ fontSize: 70, fontWeight: 700, letterSpacing: "-3px", lineHeight: 1.02 }}>How companies<br />ship in public.</span>
          <span style={{ color: "#8b949e", fontSize: 25, marginTop: 20 }}>GitHub activity, leaderboards, top shippers and comparisons.</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 54 }}>
          {Array.from({ length: 52 }, (_, column) => (
            <div key={column} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Array.from({ length: 7 }, (_, row) => (
                <div key={row} style={{ background: colors[cellLevel(column, row)], border: "1px solid #21262d", borderRadius: 2, height: 14, width: 14 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
