# Levels

Each milestone has one of three levels: turning point, milestone, or notable. The level is measured from the documented relationships. Nobody sets it by hand.

The rule is in `lineage_data.py` (`influence`, `expected_level`), and `check_data.py` rejects any level that does not follow it. It was agreed in phase 5 of [PLAN.md](PLAN.md).

## The rule

A link counts only if it is **firm**:
- Its evidence is `documented` or `strong`.
- It is not a parallel relationship ("complementary development", "independently contributed" or "historically adjacent").

These are the same rules the lineage tracer uses without weak links.

| Level | Rule |
|---|---|
| `turning-point` | At least 4 later milestones are linked to it by a firm link (`TP_DIRECT`), and its firm descendants reach at least 5 of the 10 threads (`TP_THREADS`). |
| `notable` | No later milestone is linked to it by a firm link, and it is dated before 2025 (`RECENT_FROM`). |
| `milestone` | Everything else, including recent work that has had no time to gain successors. |

The `tp` field is `true` exactly when the level is `turning-point`. The guided tour reads `tp`, so the tour and the site always agree.

## When a level changes

A new or corrected relationship can change a level. `check_data.py` then fails, and it names the level the relationships now give. Update the `level` and `tp` fields in the same pull request, so the reviewer sees the change.

## What the rule cannot see

- **Fame is not the same as documented influence.** A famous milestone is only a "milestone" when few later milestones in the data are documented as building on it. ChatGPT and word2vec are examples. The fix is to document more relationships, with primary sources. Do not change the level by hand.
- **Recent work cannot qualify yet.** Recent work is never called notable, and its page says that it is too recent to judge. `RECENT_FROM` should move forward over time. Review it once a year.
- **The rule only sees the data.** Influence on work outside the data is not counted.
