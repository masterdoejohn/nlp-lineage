"""Read the research data from data/ and assemble the payload the page uses.

The data lives in one file per entry so that each change is small and easy to review:
  data/milestones/<id>.json    one milestone each; the file name is the id
  data/relationships.jsonl     one relationship per line; the line order is kept
  data/threads/NN-<id>.json    one research thread each; NN is its position
  data/chapters/NN.json        one chapter each; NN is its number
  data/study.json              study notes, keyed by milestone id
  data/phases.json             the eight learning phases
  data/trace.json              the models offered in the lineage tracer

load_payload() rebuilds the exact structure the page expects: {nodes, edges, story}.
Milestones are ordered by (date, id). Everything else keeps its stored order.
check_data.py checks the rules; this module only reads and formats.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / 'data'


def _read(p):
    return json.loads(p.read_text(encoding='utf-8'))


def milestone_files(data=DATA):
    return sorted((data / 'milestones').glob('*.json'))


def thread_files(data=DATA):
    return sorted((data / 'threads').glob('*.json'))


def chapter_files(data=DATA):
    return sorted((data / 'chapters').glob('*.json'))


def load_milestones(data=DATA):
    return sorted((_read(p) for p in milestone_files(data)), key=lambda n: (n['date'], n['id']))


def load_relationships(data=DATA):
    lines = (data / 'relationships.jsonl').read_text(encoding='utf-8').splitlines()
    return [json.loads(l) for l in lines if l.strip()]


def load_payload(data=DATA):
    """The payload in the exact shape and order the page scripts read."""
    threads = [_read(p) for p in thread_files(data)]
    story = {
        'chapters': [_read(p) for p in chapter_files(data)],
        'study': _read(data / 'study.json'),
        'lines': [[t['id'], t['name'], t['hex'], t['branches']] for t in threads],
        'phases': _read(data / 'phases.json'),
        'trace': _read(data / 'trace.json'),
    }
    return {'nodes': load_milestones(data), 'edges': load_relationships(data), 'story': story}


# Canonical layout for the data files: one key per line, short lists on one line,
# long lists with one item per line. check_data.py rejects files that differ from it.
def _fmt(v, ind):
    pad, pad2 = '  ' * ind, '  ' * (ind + 1)
    if isinstance(v, dict):
        if not v:
            return '{}'
        items = [f'{pad2}{json.dumps(k, ensure_ascii=False)}: {_fmt(x, ind + 1)}' for k, x in v.items()]
        return '{\n' + ',\n'.join(items) + '\n' + pad + '}'
    if isinstance(v, list):
        flat = json.dumps(v, ensure_ascii=False)
        if all(not isinstance(x, (dict, list)) for x in v) and len(flat) + len(pad2) <= 100:
            return flat
        return '[\n' + ',\n'.join(pad2 + _fmt(x, ind + 1) for x in v) + '\n' + pad + ']'
    return json.dumps(v, ensure_ascii=False)


def dumps_entry(obj):
    """Text of one data file in the canonical layout, ending with a newline."""
    return _fmt(obj, 0) + '\n'


def dumps_relationship(rel):
    """One line of relationships.jsonl."""
    return json.dumps(rel, ensure_ascii=False) + '\n'
