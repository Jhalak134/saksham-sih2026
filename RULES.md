# Project Code Quality Rules — Read Before Editing

You are an AI agent working in this codebase. Before writing, editing, or
committing **any** code, you must read this file. These are hard gates, not
suggestions. If a change would violate any threshold below, do not commit it —
refactor until it passes, or stop and flag the conflict to the human.

## Non-negotiable thresholds

| Metric                          | Limit           |
| -------------------------------- | ---------------- |
| Cyclomatic Complexity (per function) | < 22 |
| Cognitive Complexity (per function)  | < 22 |
| Halstead Difficulty (per module)     | < 80 |
| Lines of Code (per file)             | < 500 |
| Test Coverage                        | 100% |
| CRAP Score (per method)              | < 25 |
| Surviving Mutants (mutation testing) | 0 |
| Dead Code                            | 0 |
| Redundant Code (duplication)         | 0 |
| `any` / `unknown` types              | 0 |

## What each metric means and how to check it

**Cyclomatic Complexity** — counts independent paths through a function
(branches, loops, conditionals). High complexity means the function is doing
too much. Split it into smaller, named functions instead of adding a
suppression comment.
- JS/TS: `eslint` with `complexity` rule
- Python: `radon cc`
- C++: `lizard` or `pmccabe`

**Cognitive Complexity** — like cyclomatic complexity but penalizes nesting
and control-flow that's hard for a *human* to follow (nested conditionals,
early returns mixed with loops, etc.). Flatten nesting, use guard clauses,
extract helper functions.
- `eslint-plugin-sonarjs` (`sonarjs/cognitive-complexity`)
- SonarQube/SonarCloud for other languages

**Halstead Difficulty** — derived from operator/operand counts; high values
mean dense, hard-to-parse code even if it "reads fine." Break up long
expressions, name intermediate values instead of chaining.
- `radon hal` (Python), `lizard` (multi-language)

**Lines of Code per File** — a hard ceiling on file size. If a file is
approaching 500 lines, split it along responsibility boundaries (one class,
one concern) rather than just wrapping code in more files arbitrarily.

**Test Coverage** — 100% line **and** branch coverage required for new or
modified code. Do not write tests that only exercise the happy path to hit a
number — every branch must be covered.
- `pytest --cov`, `jest --coverage`, `gcov`/`lcov`, etc.

**CRAP Score (Change Risk Anti-Patterns)** — combines complexity and coverage:
`complexity² × (1 - coverage)³ + complexity`. A complex, untested method scores
high even if complexity alone looks acceptable. Lower it by reducing
complexity *or* raising coverage — both matter.
- `crap4j` (Java), or compute manually from complexity + coverage tools above

**Surviving Mutants (mutation testing)** — deliberately introduces small bugs
("mutants") into the code and checks whether the test suite catches them. A
surviving mutant means a test gap even if coverage shows 100% — coverage only
proves a line ran, not that it was actually verified.
- `mutmut`/`cosmic-ray` (Python), `stryker` (JS/TS), `mull` (C++)

**Dead Code** — unreachable code, unused exports, unused variables/imports,
commented-out code blocks left in the file. Delete it; don't comment it out
"just in case." Git history is the safety net, not the file.
- `eslint` (`no-unused-vars`), `vulture` (Python), compiler warnings-as-errors

**Redundant Code** — duplicated logic across files or functions. If the same
block appears more than once, extract it into a shared function/module.
- `jscpd` (multi-language copy/paste detector)

**`any` / `unknown` types (TypeScript)** — zero tolerance. Every value must
have a specific, meaningful type. If the real type is genuinely unknown at
that point, model it with a proper union, generic, or discriminated type —
don't escape-hatch with `any`/`unknown`.
- `tsc --strict`, `eslint` (`@typescript-eslint/no-explicit-any`)

## Workflow for the agent

1. **Before editing**: run the relevant checkers above on the file(s) you're
   about to touch, to know the current baseline.
2. **While editing**: keep functions small and single-purpose from the start —
   it's cheaper than refactoring afterward to hit these numbers.
3. **Before finishing a task**: re-run every applicable checker. If any
   threshold is violated by your change, fix it before considering the task
   done — do not leave it for a "future cleanup pass."
4. **If a fix is impossible without breaking other constraints** (e.g.
   splitting a function would break an external API), stop and explain the
   conflict to the human instead of silently ignoring the rule.
5. **Never suppress a linter/complexity warning with an inline disable
   comment** as a way to pass these gates. Suppression hides the problem; it
   doesn't solve it. If a rule is genuinely wrong for a specific case, that's
   a decision for the human to make explicitly, not the agent.

## Notes

- These thresholds apply to new and modified code. Pre-existing violations in
  untouched code are not blockers for an unrelated change, but should be
  flagged if noticed.
- If your toolchain doesn't have a direct equivalent for a metric above,
  say so rather than silently skipping the check.