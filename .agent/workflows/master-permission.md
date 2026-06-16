---
description: Master Permission - One-time approval for full autonomous execution of changes, file edits, git operations, and commands.
---

# Master Permission Workflow

This workflow grants **one-time approval** for the entire implementation. Once the user approves the plan, all subsequent steps run autonomously without individual confirmations.

## How It Works

1. **User requests a change** (feature, bug fix, refactor, git push, etc.)
2. **I create an implementation plan** summarizing ALL changes that will be made (files to edit, commands to run, git operations).
3. **User reviews and approves the plan ONCE.**
4. **I execute EVERYTHING autonomously** — no more step-by-step permission prompts.

## Rules

// turbo-all

### Planning Phase
- Research the task fully before proposing changes.
- Present a clear, concise implementation plan listing:
  - Files to create / modify / delete
  - Commands to run (install deps, build, migrate, etc.)
  - Git operations (add, commit, push)
- **Ask for user approval ONCE** on the entire plan.

### Execution Phase (after approval)
- Execute all file edits without asking again.
- Run all commands (npm install, prisma generate, dev server, etc.) without asking again.
- Run all git commands (git add, git commit, git push) without asking again.
- Only pause if an **unexpected error** occurs that changes the plan.

### Git Push Operations
- When the user asks to push code, stage all changes, create a descriptive commit message, and push — all in one go after a single confirmation.

### Post-Execution
- Provide a summary of everything that was done.
- Report any errors or warnings encountered.
