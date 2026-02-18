# Merge

Fully autonomous: commit → push → PR → merge → cleanup. Zero interaction.

## Steps

1. Run `git status` and `git diff` to understand all changes
2. Get the current branch name with `git branch --show-current`
3. If on `main`, create a new branch with a descriptive name based on the changes (e.g., `fix/dark-mode-auth-screens`) and switch to it
4. Stage all changes with `git add -A`
5. Write a conventional commit message (feat:, fix:, chore:, refactor:, etc.) and commit
6. Push to remote with `git push -u origin <branch>`
7. Create a PR with `gh pr create` using a concise title, a ## Summary section, and a ## Test Plan section
8. Merge the PR with `gh pr merge --squash --delete-branch`
9. Switch back to main with `git checkout main` and pull latest with `git pull`

Do NOT ask for confirmation at any step. Just do it.

If the merge fails (e.g., merge conflicts, CI checks), report the error and stop — do not force merge.
