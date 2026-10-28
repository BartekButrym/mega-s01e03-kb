// One problem per fix, counted the desk's way. causes.ts files each report under its cause, by
// tenant and channel; the reports the desk read as something else (desk-notes.json) stay counted
// where they are filed, and the problem they show is counted from them on its own row.
import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

// `parser` and `hint` both flip day and month. `shift` moves a date by one day: the desk's
// one-day-move reports, which no date-order fix can reach.
export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export type ProblemGroup = { problem: Problem; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string; filedUnder?: Problem };

export function groupByProblem(reports: Report[], ticket: number, oneDayMove: readonly string[]): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const groups: ProblemGroup[] = groupByCause(merged, tenantOf).map((g) => ({
    problem: g.cause,
    reports: g.reports,
    tenants: g.tenants,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
  }));
  const shift = merged.filter((r) => oneDayMove.includes(r.id));
  if (shift.length) {
    const days = shift.map((r) => r.receivedAt.slice(0, 10)).sort();
    const filedUnder = groupByCause(merged, tenantOf).find((g) => readAs(g, oneDayMove))?.cause;
    groups.push({ problem: 'shift', reports: shift, tenants: new Set(shift.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1], filedUnder });
  }
  return groups;
}
