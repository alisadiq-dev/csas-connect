// Draws the CSAS Connect UI shown on the 3D laptop and phone screens. Pure
// canvas 2D — no external assets besides the university crest already in
// public/brand — so the scene never needs a network fetch for its "content".

const INDIGO_900 = "#312e81";
const INDIGO_700 = "#4338ca";
const INDIGO_600 = "#4f46e5";
const INDIGO_100 = "#e0e7ff";
const SLATE_900 = "#0f172a";
const SLATE_500 = "#64748b";
const SLATE_200 = "#e2e8f0";
const SLATE_50 = "#f8fafc";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCrest(ctx: CanvasRenderingContext2D, crest: HTMLImageElement | null, x: number, y: number, h: number) {
  if (!crest) return;
  const w = (crest.naturalWidth / crest.naturalHeight) * h;
  ctx.drawImage(crest, x, y, w, h);
}

function bars(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, values: number[]) {
  const gap = w / values.length;
  const bw = gap * 0.55;
  values.forEach((v, i) => {
    const bh = h * v;
    ctx.fillStyle = i === values.length - 2 ? INDIGO_600 : "#a5b4fc";
    roundRect(ctx, x + i * gap + (gap - bw) / 2, y + h - bh, bw, bh, bw / 4);
    ctx.fill();
  });
}

/** Landscape (16:10) dashboard shown on the laptop. */
export function drawLaptopScreen(canvas: HTMLCanvasElement, crest: HTMLImageElement | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1440;
  ctx.setTransform(u, 0, 0, u, 0, 0);

  ctx.fillStyle = SLATE_50;
  ctx.fillRect(0, 0, 1440, 900);

  // Sidebar
  const side = ctx.createLinearGradient(0, 0, 0, 900);
  side.addColorStop(0, INDIGO_900);
  side.addColorStop(1, INDIGO_700);
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 300, 900);
  drawCrest(ctx, crest, 36, 40, 64);
  ctx.fillStyle = "#fff";
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText("CSAS Connect", 36, 150);
  ctx.fillStyle = "#c7d2fe";
  ctx.font = "500 18px system-ui, sans-serif";
  ctx.fillText("Student portal", 36, 178);
  ["Overview", "Attendance", "Results", "Timetable", "Notices"].forEach((label, i) => {
    const y = 240 + i * 66;
    if (i === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(ctx, 24, y - 28, 252, 50, 12);
      ctx.fill();
    }
    ctx.fillStyle = i === 0 ? "#fff" : "#c7d2fe";
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.fillText(label, 60, y + 4);
  });

  // Header
  ctx.fillStyle = SLATE_900;
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText("Good morning", 350, 90);
  ctx.fillStyle = SLATE_500;
  ctx.font = "500 22px system-ui, sans-serif";
  ctx.fillText("BS Statistics · Fall 2026", 350, 126);

  // Stat cards
  const stats = [
    { label: "Attendance", value: "92%", tone: INDIGO_600 },
    { label: "Current CGPA", value: "3.64", tone: "#0891b2" },
    { label: "Courses", value: "6", tone: "#7c3aed" },
  ];
  stats.forEach((s, i) => {
    const x = 350 + i * 345;
    ctx.fillStyle = "#fff";
    roundRect(ctx, x, 170, 315, 150, 20);
    ctx.fill();
    ctx.strokeStyle = SLATE_200;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SLATE_500;
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.fillText(s.label, x + 28, 214);
    ctx.fillStyle = s.tone;
    ctx.font = "700 62px system-ui, sans-serif";
    ctx.fillText(s.value, x + 28, 286);
  });

  // Chart card
  ctx.fillStyle = "#fff";
  roundRect(ctx, 350, 350, 650, 500, 20);
  ctx.fill();
  ctx.strokeStyle = SLATE_200;
  ctx.stroke();
  ctx.fillStyle = SLATE_900;
  ctx.font = "700 26px system-ui, sans-serif";
  ctx.fillText("Semester GPA", 382, 400);
  bars(ctx, 392, 440, 566, 340, [0.58, 0.66, 0.74, 0.7, 0.82, 0.9]);
  ctx.fillStyle = SLATE_500;
  ctx.font = "500 18px system-ui, sans-serif";
  ["S1", "S2", "S3", "S4", "S5", "S6"].forEach((l, i) => ctx.fillText(l, 410 + i * 94.3, 818));

  // Schedule card
  ctx.fillStyle = "#fff";
  roundRect(ctx, 1030, 350, 366, 500, 20);
  ctx.fill();
  ctx.strokeStyle = SLATE_200;
  ctx.stroke();
  ctx.fillStyle = SLATE_900;
  ctx.font = "700 26px system-ui, sans-serif";
  ctx.fillText("Today", 1060, 400);
  ["Probability Theory", "Linear Models", "Biostatistics Lab", "Actuarial Maths"].forEach((c, i) => {
    const y = 440 + i * 100;
    ctx.fillStyle = INDIGO_100;
    roundRect(ctx, 1060, y, 306, 78, 14);
    ctx.fill();
    ctx.fillStyle = INDIGO_700;
    ctx.fillRect(1060, y + 14, 5, 50);
    ctx.fillStyle = SLATE_900;
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.fillText(c, 1084, y + 34);
    ctx.fillStyle = SLATE_500;
    ctx.font = "500 16px system-ui, sans-serif";
    ctx.fillText(`${9 + i}:00 – ${10 + i}:00`, 1084, y + 60);
  });

  void H;
}

/** Portrait sign-in/attendance card shown on the phone. */
export function drawPhoneScreen(canvas: HTMLCanvasElement, crest: HTMLImageElement | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const u = W / 720;
  ctx.setTransform(u, 0, 0, u, 0, 0);
  const H = canvas.height / u;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, INDIGO_900);
  bg.addColorStop(1, INDIGO_600);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 720, H);

  // Content is laid out across the full 720 x 1560 screen (status bar and
  // dynamic island occupy the top ~170px, home indicator the bottom ~80px).
  drawCrest(ctx, crest, 60, 250, 120);
  ctx.fillStyle = "#fff";
  ctx.font = "700 58px system-ui, sans-serif";
  ctx.fillText("CSAS Connect", 60, 400);
  ctx.fillStyle = "#c7d2fe";
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillText("University of the Punjab", 60, 450);

  ctx.fillStyle = "#fff";
  roundRect(ctx, 50, 540, 620, 470, 40);
  ctx.fill();
  ctx.fillStyle = SLATE_500;
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("Attendance today", 90, 620);
  ctx.fillStyle = INDIGO_600;
  ctx.font = "700 120px system-ui, sans-serif";
  ctx.fillText("92%", 90, 760);
  bars(ctx, 340, 600, 300, 300, [0.5, 0.7, 0.6, 0.85, 0.75, 0.95]);
  ctx.fillStyle = SLATE_500;
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText("4 of 4 classes marked present", 90, 960);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundRect(ctx, 50, 1050, 620, 140, 34);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.fillText("Next: Linear Models", 90, 1122);
  ctx.fillStyle = "#c7d2fe";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText("10:00 · Room 204", 90, 1162);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundRect(ctx, 50, 1220, 620, 120, 34);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.fillText("Latest result: Probability", 90, 1290);
  ctx.fillStyle = "#c7d2fe";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText("Grade A−  ·  GPA 3.67", 90, 1326);
}

export function loadCrest(src = "/brand/pu-crest.png"): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
