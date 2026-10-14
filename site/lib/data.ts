// Reads the research data in data/ at build time. The files are described in docs/DATA.md and checked by
// check_data.py; this module trusts that check and only shapes the data for the pages.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8'));
const jsonFiles = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : []);

export interface Milestone {
  id: string; title: string; short: string; date: string; dprec: 'day' | 'month' | 'year'; dtype: string; other: string;
  authors: string; inst: string; type: string; branches: string[]; imp: string[]; tp: boolean; phase: number[];
  lic: string; src: string; before: string; problem: string; breakthrough: string; why: string; next: string;
  inherits: string; claim: string; ord: number; ch: number; lines: string[]; featured?: true;
}
export interface Relationship { f: string; t: string; rel: string; ev: string; note: string; src: string; dateflip?: true }
export interface Thread { id: string; name: string; hex: string; branches: string[] }
export interface Chapter { n: number; id: string; title: string; years: string; lede: string; keystones: string[]; all: string[] }
export interface Study { understand: string[]; prereq: string }
export interface Term { id: string; term: string; definition: string; introduced_by: string; used_by: string[] }

export const milestones: Milestone[] = jsonFiles(join(DATA, 'milestones'))
  .map((f) => readJson<Milestone>(join(DATA, 'milestones', f)))
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
export const relationships: Relationship[] = readFileSync(join(DATA, 'relationships.jsonl'), 'utf8')
  .split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
export const threads: Thread[] = jsonFiles(join(DATA, 'threads')).map((f) => readJson<Thread>(join(DATA, 'threads', f)));
export const chapters: Chapter[] = jsonFiles(join(DATA, 'chapters')).map((f) => readJson<Chapter>(join(DATA, 'chapters', f)));
export const study: Record<string, Study> = readJson(join(DATA, 'study.json'));
export const phases: Record<string, string> = readJson(join(DATA, 'phases.json'));
export const terms: Term[] = jsonFiles(join(DATA, 'glossary'))
  .map((f) => readJson<Term>(join(DATA, 'glossary', f)))
  .sort((a, b) => a.term.localeCompare(b.term, 'en'));

export const byId: Record<string, Milestone> = Object.fromEntries(milestones.map((m) => [m.id, m]));
export const threadById: Record<string, Thread> = Object.fromEntries(threads.map((t) => [t.id, t]));
export const chapterByN: Record<number, Chapter> = Object.fromEntries(chapters.map((c) => [c.n, c]));

export const incoming = (id: string) => relationships.filter((r) => r.t === id);
export const outgoing = (id: string) => relationships.filter((r) => r.f === id);
export const onThread = (tid: string) => milestones.filter((m) => m.lines.includes(tid));
export const termsFor = (id: string) => terms.filter((t) => t.introduced_by === id || t.used_by.includes(id));
