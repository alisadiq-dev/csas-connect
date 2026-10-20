import { ImageResponse } from "next/og";

// PWA / home-screen icons, drawn in code (original mark: rising bars on the night palette) so no
// binary assets are needed. `maskable` leaves a 20% safe zone so Android's adaptive masks don't crop it.
export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }, { size: "maskable" }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "192" ? 192 : 512;
  const maskable = size === "maskable";
  const inner = maskable ? px * 0.6 : px * 0.66;
  const bars = [0.42, 0.64, 0.5, 0.86];
  const barW = inner / 7;

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #080b14 0%, #1b2540 55%, #3730a3 100%)",
          borderRadius: maskable ? 0 : px * 0.22,
        }}
      >
        <div style={{ width: inner, height: inner, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                width: barW,
                height: inner * h,
                borderRadius: barW / 2,
                background: i === bars.length - 1 ? "#6beccd" : "#bad7f5",
                opacity: i === bars.length - 1 ? 1 : 0.85,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
