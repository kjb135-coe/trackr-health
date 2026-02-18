# Vibe

Autonomous infinite development loop. Picks up TODO items, completes them, commits, generates new TODOs, and repeats until you hit Ctrl+C.

## The Loop

Run this loop forever. Do NOT stop or ask for confirmation. Just keep going.

### REPEAT FOREVER:

**1. Read TODO.md**
Read `TODO.md` to find all incomplete items. Parse the priority levels (P0 → P1 → P2 → P3).

**2. Pick the highest-priority incomplete item**
Choose the first incomplete item at the highest priority level (P0 first, then P1, etc.). Skip items marked `[x]` or that say "Fixed" / "Status: Fixed". Skip items where the user's answer says to skip or not touch it.

**3. Plan and execute the work**
- Understand the scope of the item
- Read all relevant files
- Implement the changes
- Keep changes focused — one TODO item per cycle

**4. Verify the work**
- Run `npx tsc --noEmit` — fix ALL TypeScript errors before proceeding
- Run `npx expo lint` if linting is configured — fix any errors
- Run tests with `npm test` if tests exist — fix any failures
- If verification fails, fix the issues immediately. Do not move on until clean.

**5. Update TODO.md**
- Mark the completed item with `[x]` in the "Completed" section at the bottom
- Add a brief note of what was done

**6. Commit and push**
- `git add -A`
- Write a conventional commit message describing the completed work
- `git commit` and `git push` to the current branch
- Do NOT create branches or PRs for individual items — commit directly

**7. Reflect and generate new TODOs**
After completing the item, think about what you noticed during implementation:
- Bugs or issues you encountered
- Code that needs tests
- Refactoring opportunities
- Related features or improvements
- Documentation gaps
- Performance concerns
- Accessibility issues

Generate 1-2 new actionable TODO items based on what you observed. Be specific and practical — not aspirational filler.

**8. Add new TODOs to TODO.md**
Add the generated items under the appropriate priority section (most will be P2 or P3). Use the same format as existing items with a description and effort estimate.

**9. Commit the TODO.md update**
- `git add TODO.md`
- `git commit -m "docs: update TODO.md with new items"`
- `git push`

**10. Loop back to step 1**

## Rules

- NEVER stop or ask for permission. Just keep working.
- NEVER skip verification. Every change must pass tsc before committing.
- Keep each cycle focused on ONE TODO item. Don't scope-creep.
- If a TODO item is ambiguous and has a `[Q]` tag with no user answer, skip it and move to the next.
- If a TODO item's `[Q]` answer says "skip", "no", "don't touch", or similar — skip it.
- If you run out of TODO items, generate a fresh batch by auditing the codebase for improvements.
- Commit messages should reference the TODO item number (e.g., "fix: dark mode on auth screens (TODO #4)").
