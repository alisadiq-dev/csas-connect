import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon (iOS rounds the corners itself, so the artwork is a full square).
export default function AppleIcon() {
  const bars = [0.42, 0.64, 0.5, 0.86];
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #080b14 0%, #1b2540 55%, #3730a3 100%)",
        }}
      >
        <div style={{ width: 118, height: 118, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {bars.map((h, i) => (
            <div key={i} style={{ width: 17, height: 118 * h, borderRadius: 9, background: i === 3 ? "#6beccd" : "#bad7f5" }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
