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
