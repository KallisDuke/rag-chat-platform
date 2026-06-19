---
name: github-pr-automation
description: This skill should be used when the user asks to "commit and push", "ship this branch", "commit, push and open a PR", "create a pull request for these changes", "open a PR", or "automate the github workflow" for the current branch. Stages and commits the working tree, pushes the current branch, then opens a pull request through a GitHub MCP server, always confirming the base branch first and writing a PR description from the actual file changes.
version: 0.1.0
---

# GitHub PR Automation

Automate the commit -> push -> pull request flow for the current branch: gather the
diff context, commit it with a relevant message, push, then open a PR via a GitHub
MCP server with a description generated from the real file changes.

## Workflow

### 1. Gather context of changed files

Run, in this order:

```
git status --porcelain=v1
git diff --stat
git diff
git diff --cached --stat
git diff --cached
```

Build a mental model of: which files changed, whether each is added/modified/deleted,
and *why* (infer intent from the diff content, not just the filenames). This context
feeds both the commit message and the PR description later — do not re-derive it twice.

### 2. Safety check before staging

Before staging, scan `git status --porcelain` output for secret-shaped paths: `.env`,
`.env.*`, `*.pem`, `*.key`, `*_rsa`, `id_rsa*`, `credentials*.json`, `*.p12`, `*.pfx`.

- If none match, stage everything: `git add .`
- If any match, stage everything else explicitly (`git add -- <every changed path
  except the matches>`) and tell the user which files were excluded and why. Do not
  add them without explicit confirmation.

### 3. Commit

Write a commit message that explains *why*, not a file-by-file restatement of the
diff (well-named files already say *what*). Match the repository's existing log style
— check `git log --oneline -5` for tone (this repo favors short, plain-imperative
subjects, e.g. "added docker for development").

Commit via heredoc so formatting survives, and follow the standard commit protocol:
new commit (never amend unless asked), no `--no-verify`/`--no-gpg-sign`, and append
the Co-Authored-By trailer:

```
git commit -m "$(cat <<'EOF'
<concise subject line>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

If the pre-commit hook fails, fix the underlying issue, re-stage, and create a new
commit — never bypass the hook.

### 4. Push

```
git push origin <current-branch>
```

Get `<current-branch>` from `git rev-parse --abbrev-ref HEAD`. If the branch has no
upstream yet, use `git push -u origin <current-branch>`. Report the result (pushed /
up-to-date / rejected) before moving on — do not silently retry a rejected push with
`--force`.

### 5. Open the pull request via GitHub MCP

**Find the tool.** GitHub MCP tool names depend on which server is configured (the
harness namespaces MCP tools as `mcp__<server>__<tool>`). Search for it instead of
guessing a literal name:

```
ToolSearch query: "github pull request mcp"
```

If nothing relevant turns up, no GitHub MCP server is configured in this session.
Stop here and tell the user directly — do not fall back to `gh` or raw `git`/REST
calls for PR creation, since this skill is scoped to the MCP path. Point them at
adding a GitHub MCP server (Claude Code settings / `claude mcp add`) and re-running
the skill afterward.

**Always ask for the base/target branch.** Never assume it. Use AskUserQuestion with
the repository's likely default (e.g. `master`/`main`, visible via `git branch -r` or
prior context) as the recommended option, plus room for the user to name another
branch. Do this even if the answer seems obvious — it's a deliberate checkpoint
before opening a PR.

**Write the PR description from the real diff**, not boilerplate. Structure:

```
## Summary
- <1-3 bullets on why this change, derived from the diff gathered in step 1>

## Changes
- <path>: <added/modified/deleted> — <one-line description of what changed there>
  (repeat per changed file, or group trivial ones, e.g. lockfile bumps)
```

Format the PR title as `<Type>: <commit subject>`, where `<Type>` is one of
`Feature`, `Bug`, or `Chore`, chosen from the diff's intent:
- `Feature` — new functionality or user-facing capability
- `Bug` — a fix for incorrect behavior
- `Chore` — tooling, config, deps, refactors, docs, or other non-functional changes

Use the commit subject (or a short summary if the push included multiple commits)
as the `<commit name>` portion, e.g. `Feature: add file upload page`.

**Create the PR** with the discovered MCP tool, passing: head = current branch,
base = the branch confirmed with the user, title, and the generated body.

Report the returned PR URL to the user as the final step.

## Notes

- Steps 1-4 run without per-step confirmation prompts — invoking this skill is the
  user's authorization for that part of the flow. Step 5's base-branch question is
  the one deliberate pause, by design.
- If there is nothing to commit (working tree clean against the last push) but the
  user still wants a PR for already-pushed commits, skip steps 2-4 and go straight to
  step 5 using the existing commits' diff for context.
