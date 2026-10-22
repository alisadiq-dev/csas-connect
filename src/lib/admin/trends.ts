import { sql } from "drizzle-orm";
import { db } from "@/db";

export type AdminTrends = { weeks: string[]; sessions: number[]; notices: number[] };

/**
 * Weekly counts for the last `weeks` weeks (Monday-based, zero-filled) of attendance sessions marked and
 * notices posted. Aggregate counts only; used on the admin dashboard, which already reads via the raw `db`.
 * Returns null if the query fails so the dashboard simply omits the trend cards.
 */
export async function getAdminTrends(weeks = 10): Promise<AdminTrends | null> {
  try {
    const rows = await db.execute<{ wk: string; sessions: number; notices: number }>(sql`
      select to_char(w, 'DD Mon') as wk,
             (select count(*) from attendance_sessions s where date_trunc('week', s.session_date) = w)::int as sessions,
             (select count(*) from notices_events n where date_trunc('week', n.created_at) = w)::int as notices
      from generate_series(
        date_trunc('week', now()) - (${weeks - 1}::int * interval '1 week'),
        date_trunc('week', now()),
        interval '1 week'
      ) as w
      order by w
    `);
    return { weeks: rows.map((r) => r.wk), sessions: rows.map((r) => r.sessions), notices: rows.map((r) => r.notices) };
  } catch {
    return null;
  }
}
