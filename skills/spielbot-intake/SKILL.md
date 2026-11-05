---
name: spielbot-intake
description: Phase 0 of a spielbot video. Use when the user asks for a new video, walkthrough, demo, tutorial or explainer, before anything else.
---

# Intake

Turn the request into a confirmed `brief.md`.

1. Create the project: `bin/spielbot new <slug>` (kebab-case from the subject), or the folder the user names.
2. Fill what you can infer: read the request, and when an app or a codebase is named, skim its README, routes and
   screens to propose what the video covers and in which order.
3. Ask for the rest in one short round, at most 5 questions, each with a recommended default. Every field of
   `templates/project/brief.md` needs an answer or a stated default. The usual unknowns:
   - goal and audience;
   - language (default pt-BR) and target length;
   - kind: app walkthrough, animated explainer, or mixed;
   - for app scenes: the URL of a non-production environment, how to log in, and what the scenes will create
     there (that drives the hooks);
   - delivery: file name and destination.
4. Credentials: list the variable names in `.env.example` and ask the user to fill `.env` themselves.
5. Write `brief.md`, show it, and wait.

**Gate:** the user confirms the brief. Next: `spielbot-doctor`.
