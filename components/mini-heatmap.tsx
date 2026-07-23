import type { ActivityDay } from "@/lib/types";

const COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

export function MiniHeatmap({ activity }: { activity: ActivityDay[] }) {
  const days = activity.slice(-112);
  const max = Math.max(...days.map((day) => day.count), 1);

  return (
    <div className="mini-heatmap" role="img" aria-label="Recent public commit activity">
      {days.map((day) => {
        const level = day.count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((day.count / max) * 4)));
        return <i key={day.date} style={{ backgroundColor: COLORS[level] }} title={`${day.count} commits on ${day.date}`} />;
      })}
    </div>
  );
}
