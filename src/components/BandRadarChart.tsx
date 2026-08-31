"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export function BandRadarChart({
  listening,
  reading,
  writing,
  speaking,
}: {
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
}) {
  const data = [
    { skill: "Listening", band: listening ?? 0 },
    { skill: "Reading", band: reading ?? 0 },
    { skill: "Writing", band: writing ?? 0 },
    { skill: "Speaking", band: speaking ?? 0 },
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="55%" margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
          <PolarGrid stroke="var(--card-border)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 9]} tick={false} axisLine={false} />
          <Radar dataKey="band" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
