// One problem per fix. causes.ts sorts reports by tenant and channel; a report whose body
// describes a different symptom than its cause predicts is its own problem, whatever it was filed under.
import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

// `parser` and `hint` both flip day and month. `shift` moves a date by one day: the desk's
// one-day-move reports (desk-notes.json), which no date-order fix can reach.
export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export type ProblemGroup = { problem: Problem; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

export function problemOf(r: Report, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, tenantOf(r)) ?? 'unplaced';
}

export function groupByProblem(reports: Report[], ticket: number, oneDayMove: readonly string[]): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
