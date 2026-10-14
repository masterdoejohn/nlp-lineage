// Words the site shows for the data's codes. The relationship and evidence wording is the guided tour's
// (src/app_a.js: GROUP_IN, GROUP_OUT, QUAL), so both say the same thing; tests/test_site.py checks they match.
import type { Milestone } from './data';

export const GROUP_IN = { direct: 'Built directly on', influence: 'Influenced by', succession: 'Succeeded', parallel: 'Developed alongside' };
export const GROUP_OUT = { direct: 'Built on directly by', influence: 'Influenced', succession: 'Replaced by', parallel: 'Developed alongside' };
export type Group = keyof typeof GROUP_IN;
export const GROUP_ORDER: Group[] = ['direct', 'influence', 'succession', 'parallel'];
export function relGroup(rel: string): Group {
  if (rel === 'directly built upon') return 'direct';
  if (rel === 'superseded') return 'succession';
  if (['complementary development', 'independently contributed', 'historically adjacent'].includes(rel)) return 'parallel';
  return 'influence';
}

// The tour's lineage tracer: how an ancestor relates to the milestone after it ("X built directly on this").
export const TRACE_VERB = { direct: 'built directly on this', influence: 'was influenced by this', succession: 'succeeded this', parallel: 'developed alongside this' };
// The same relations read from the later milestone ("built directly on X"), for the "after" direction.
export const TRACE_FROM = { direct: 'built directly on', influence: 'was influenced by', succession: 'succeeded', parallel: 'developed alongside' };

// Who stands behind a milestone's reported results (the data's `claim` field), for the milestones filter.
export const CLAIM_LABEL: Record<string, string> = {
  'peer-reviewed': 'Peer reviewed',
  'official': 'Official source',
  'vendor-reported': 'Reported by the builder, not independently verified',
  'mixed': 'Mixed',
  'n-a': 'Not applicable',
};

// Levels (docs/LEVELS.md). The thresholds are lineage_data.py's TP_DIRECT, TP_THREADS and RECENT_FROM;
// tests/test_site.py checks they match.
export const TP_DIRECT = 4, TP_THREADS = 5, RECENT_FROM = '2025';
export const LEVEL_LABEL: Record<string, string> = { 'turning-point': 'Turning point', 'milestone': 'Milestone', 'notable': 'Notable' };
export const LEVEL_PLURAL: Record<string, string> = { 'turning-point': 'Turning points', 'milestone': 'Milestones', 'notable': 'Notable' };
/** One sentence saying why this milestone has its level, in its own numbers. */
export function levelReason(m: Milestone, direct: number, threads: number): string {
  const succ = `${direct} later milestone${direct === 1 ? '' : 's'} ${direct === 1 ? 'descends' : 'descend'} directly from it`;
  if (m.level === 'turning-point') return `A turning point: ${succ}, and its descendants reach ${threads} of the 10 threads.`;
  if (m.level === 'notable') return 'Notable: no later milestone in the data is documented as descending from it.';
  if (direct === 0 && m.date.slice(0, 4) >= RECENT_FROM) return 'Too recent for its influence to be judged: no later milestone in the data descends from it yet.';
  return `A milestone: ${succ}${direct ? `, and its descendants reach ${threads} of the 10 threads` : ''}.`;
}

// Weak evidence is always shown with one of these qualifiers (PLAN.md: weak links stay visibly marked).
export const QUAL: Record<string, string> = {
  'plausible-indirect': 'indirect influence',
  'coincidence': 'timing only, no documented link',
  'retrospective': 'a later reading, not a stated link',
};
export const isWeak = (ev: string) => ev in QUAL;

// The same flags the tour's study card shows.
export function claimFlag(m: Milestone): string | null {
  if (m.claim === 'vendor-reported') return 'Figures quoted here are reported by the organisation that built it, not independently verified.';
  if (m.claim === 'peer-reviewed') return 'The key result has been peer reviewed.';
  return null;
}

const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** The date at its recorded precision, as the tour shows it: "28 May 2020", "May 2020" or "2020". */
export function when(m: Milestone): string {
  const [y, mo, d] = m.date.split('-');
  if (m.dprec === 'year' || !mo) return y;
  if (m.dprec === 'month' || !d) return `${MO[+mo - 1]} ${y}`;
  return `${+d} ${MO[+mo - 1]} ${y}`;
}
export const year = (m: Milestone) => m.date.slice(0, 4);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const access = (m: Milestone) => (m.lic && m.lic !== 'n/a' ? m.lic : 'Not applicable');
export const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');
