// Glossary links in running text: the first mention of each term on a page links to the term's page.
// Only the terms that name this milestone (introduced_by or used_by) are linked, so a link always means
// "this term matters here". Text is escaped; only the links are added as HTML.
import type { Term } from './data';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const rx = (term: string) => new RegExp(`(^|[^\\p{L}\\p{N}])(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=$|[^\\p{L}\\p{N}])`, 'iu');

/** Returns `text` as HTML, linking the first mention of each term not yet in `linked`, and records it there. */
export function linkTerms(text: string, terms: Term[], linked: Set<string>): string {
  type Hit = { start: number; end: number; t: Term };
  const hits: Hit[] = [];
  for (const t of [...terms].sort((a, b) => b.term.length - a.term.length)) {
    if (linked.has(t.id)) continue;
    const m = rx(t.term).exec(text);
    if (!m) continue;
    const start = m.index + m[1].length, end = start + m[2].length;
    if (hits.some((h) => start < h.end && end > h.start)) continue;  // a longer term already covers this text
    hits.push({ start, end, t });
    linked.add(t.id);
  }
  hits.sort((a, b) => a.start - b.start);
  let out = '', at = 0;
  for (const h of hits) {
    out += esc(text.slice(at, h.start)) + `<a class="gl" href="/glossary/${h.t.id}/">${esc(text.slice(h.start, h.end))}</a>`;
    at = h.end;
  }
  return out + esc(text.slice(at));
}
