// A hand-built, spec-minimal single-page PDF generator — no new dependency
// (project stays on the free tier / existing package.json per this run's
// scope). Produces a real, valid PDF file (correct xref table and byte
// offsets), not a fake ".pdf"-named text file — every PDF viewer/browser
// renders it. Good enough for demo "date sheet" / "result" attachments;
// not a general-purpose PDF library.

function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildSimplePdf(title: string, lines: string[]): Buffer {
  const contentLines = ["BT", "/F1 16 Tf", "50 740 Td", `(${escapePdfText(title)}) Tj`, "/F1 11 Tf", "0 -30 Td"];
  for (const line of lines) {
    contentLines.push(`(${escapePdfText(line)}) Tj`, "0 -18 Td");
  }
  contentLines.push("ET");
  const content = contentLines.join("\n");
  const contentBytes = Buffer.from(content, "latin1");

  const objects: Record<number, string> = {
    1: "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    2: "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    3: "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n",
    4: "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    5: `5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream\nendobj\n`,
  };

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += objects[i];
  }
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += xref;
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
