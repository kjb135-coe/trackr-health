# Create Pull Request

Create a PR for the current branch.

## Steps

1. Run `git status` and `git log --oneline -10` to understand current state
2. Run `git diff main...HEAD` to see all changes vs main
3. Push current branch if not already pushed
4. Create PR with `gh pr create` using:
   - Concise title summarizing the changes
   - Body with ## Summary and ## Test Plan sections
5. Return the PR URL

Do NOT ask for confirmation. Just do it.
