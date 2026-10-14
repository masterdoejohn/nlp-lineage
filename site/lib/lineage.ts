// "Before and after": the guided tour's lineage tracer (src/app_b.js, renderTrace), applied to every milestone,
// in both directions. Lineage follows descent only (building on, influence, succession); parallel work is never
// an ancestor or a descendant. Weak links count only when the reader asks for them.
import { relationships, byId, type Relationship } from './data';
import { relGroup, isWeak } from './labels';

export type Dir = 'before' | 'after';

export interface Trace {
  /** Every milestone reached, nearest first by date (before: newest first; after: oldest first). */
  all: string[];
  /** Direct parents (or children) and the turning points: the short version the tour shows first. */
  brief: string[];
  /** Hops from the root, for each milestone reached. */
  depth: Record<string, number>;
}

const descent = (r: Relationship, weak: boolean) => relGroup(r.rel) !== 'parallel' && (weak || !isWeak(r.ev));

export function trace(root: string, dir: Dir, weak: boolean): Trace {
  const depth: Record<string, number> = { [root]: 0 };
  const q = [root];
  while (q.length) {
    const c = q.shift()!;
    for (const r of relationships) {
      const [near, far] = dir === 'before' ? [r.t, r.f] : [r.f, r.t];
      if (near === c && descent(r, weak) && !(far in depth)) { depth[far] = depth[c] + 1; q.push(far); }
    }
  }
  const sign = dir === 'before' ? -1 : 1;
  // Array.prototype.sort is stable, so milestones on the same day keep the order the search found them,
  // exactly as in the tour's tracer.
  const all = Object.keys(depth).filter((i) => i !== root).sort((a, b) => sign * (byId[a].ord - byId[b].ord));
  const brief = all.filter((i) => byId[i].tp || depth[i] === 1);
  return { all, brief, depth };
}

/** The numbers behind a milestone's level (lineage_data.py, influence): direct firm successors, and the
 *  threads its firm descendants reach. Firm means documented or strong, and not parallel work. */
export function influence(id: string) {
  const t = trace(id, 'after', false);
  return { direct: t.all.filter((i) => t.depth[i] === 1).length, threads: new Set(t.all.flatMap((i) => byId[i].lines)).size };
}

/** The links that place `id` in the trace: up to three relationships toward the root, shown ones first. */
export function via(id: string, t: Trace, dir: Dir, weak: boolean, shown: Set<string>): Relationship[] {
  return relationships
    .filter((r) => {
      const [self, toward] = dir === 'before' ? [r.f, r.t] : [r.t, r.f];
      return self === id && toward in t.depth && descent(r, weak) && t.depth[toward] < t.depth[id];
    })
    .sort((a, b) => {
      const ta = dir === 'before' ? a.t : a.f, tb = dir === 'before' ? b.t : b.f;
      return Number(shown.has(tb)) - Number(shown.has(ta));
    })
    .slice(0, 3);
}
