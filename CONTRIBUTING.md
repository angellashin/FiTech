# Contributing to FiTech

## Branch workflow

1. Start from `main`.
2. Create a focused branch:
   - `feature/planner-rules`
   - `feature/session-audio`
   - `fix/history-save`
   - `refactor/plan-preview-split`
3. Keep PRs small and reviewable.

## Before opening a PR

Run:

```bash
cd apps/web
npm run typecheck
npm run build
```

For UI changes, include screenshots or a short screen recording.

## PR description checklist

- What product problem does this solve?
- What changed?
- How was it verified?
- Screenshots/GIFs for UI changes.
- Known limitations or follow-up tasks.

## Commit guidance

Prefer intent-first commit messages. Example:

```txt
Make workout guidance audible during screenless sessions

The MVP needs to demonstrate the GA5 voice-first interaction model in the browser, so session cues now flow through Web Speech API when available.

Constraint: Browser apps cannot reliably receive arbitrary Bluetooth earbud tap events
Rejected: Native-only earbud integration | too large for current web MVP
Tested: npm run typecheck; npm run build
Not-tested: Physical earbud hardware events
```
