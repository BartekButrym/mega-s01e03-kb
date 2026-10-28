<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, type Problem } from '#lib/kb/problems';

  // issues: problem → its ticket, as a link.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const total = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket).length);
  const groups = $derived(groupByProblem(reports as Report[], ticket, notes.oneDayMove));
  const WHAT: Record<Problem, string> = {
    parser: 'the shared parser reads dates month first; day-first tenants get day and month swapped',
    hint: 'booking-v3 prints MM/DD/YYYY under its date field; people type month first, the form reads day first',
    shift: 'the date moves by one day, not a swap: a time zone or offset bug',
    unplaced: 'no tenant on file, or the tenant writes month first',
  };
  const num = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  <strong>{total}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>what goes wrong</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td class="what">{WHAT[g.problem]}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{num(issues[g.problem]!)}</a>{:else}none yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups.filter((g) => g.problem === 'shift') as g (g.problem)}
  <p class="note">The {g.reports.length} one-day reports: {g.reports.map((r) => r.id).join(', ')}.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .what { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
