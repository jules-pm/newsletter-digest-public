# Newsletter Digest — autonomous AI agent template

A template for an autonomous [Claude Code](https://claude.com/claude-code) agent that reads the last 24 hours of newsletters from your Gmail, synthesizes a daily AI/PM digest, commits the output to Git, and auto-deploys a static site to Cloudflare Pages — end-to-end in under 30 seconds.

This repo is a **clean-room template** — it contains the agent playbook, JSON data contract, and static site frontend, plus synthetic example digests so the site renders out-of-the-box. Fork it, plug in your own Gmail, and you have your own daily digest pipeline.

## What the agent does

Every day at your chosen time (e.g. 5pm ET):

1. A Claude Code **scheduled task** fires on your local machine.
2. The task follows the playbook in `GENERATOR.md`:
   - Searches your Gmail for AI/PM newsletters received in the last 24 hours.
   - Extracts and ranks items into **Top 3 → News → Alerts → Job opportunities**.
   - Detects subscription status per publication (paid / free / lapsed) by scanning receipts.
3. It writes today's digest as a JSON object and **prepends** it to `data/digests.json`.
4. It `git push`es the change. Cloudflare Pages rebuilds in ~30 seconds.
5. The static site at your Pages URL shows today's digest at the top with an expandable archive below.

No server. No database. The Git repo *is* the database.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────────────┐
│  Scheduled Task │ ──► │  Gmail MCP   │ ──► │   Agent    │ ──► │  data/digests.   │
│   (Claude Code) │     │  (read-only) │     │  playbook  │     │       json       │
└─────────────────┘     └──────────────┘     └────────────┘     └──────────────────┘
                                                                         │
                                                                         ▼
                                                                  ┌─────────────┐
                                                                  │  git push   │
                                                                  └─────────────┘
                                                                         │
                                                                         ▼
                                                                  ┌─────────────┐
                                                                  │ Cloudflare  │
                                                                  │ Pages build │
                                                                  └─────────────┘
```

Two clean separations make this easy to reason about:

- **Playbook vs. data contract.** `GENERATOR.md` owns the agent's reasoning; the JSON schema is the contract between the agent and the frontend. You can rewrite one without touching the other.
- **Source vs. sink.** Gmail is the only input. Git is the only output. No state lives in between.

## Repo layout

```
newsletter-digest-public/
├── README.md                ← this file
├── GENERATOR.md             ← agent prompt + JSON schema (the recipe)
├── index.html               ← static site entry point
├── assets/
│   ├── app.js               ← minimal renderer: fetches data/digests.json, renders today + archive
│   └── style.css            ← site styling
└── data/
    └── digests.json         ← synthetic example data (2 entries) — replaced by your real digests after first run
```

## Fork and run it yourself

1. **Fork this repo.**
2. **Install Claude Code** and connect the Gmail MCP server.
3. **Drop the playbook** somewhere your scheduled task can read it (e.g. `~/.claude/agents/newsletter-digest.md`). The prompt in `GENERATOR.md` references this path.
4. **Register a scheduled task** that fires daily at your preferred time with the prompt in `GENERATOR.md`.
5. **Point the task at your local clone** so its `git push` goes to your fork.
6. **Deploy the `main` branch to Cloudflare Pages** (or any static host — Vercel, GitHub Pages, Netlify all work).
7. **(Optional) Gate the Pages URL** with Cloudflare Access or similar — the repo can stay public while your digest content stays private-to-you.

After the first successful run, the example entries in `data/digests.json` get bumped down the archive and eventually rotated out.

## Design choices worth calling out

- **Agent playbook is a markdown file, not code.** The whole generator lives in plain English inside `GENERATOR.md`, so you can read and edit it without touching TypeScript.
- **Prepend, don't overwrite.** New digests go on top of the JSON array. The archive grows monotonically, with the newest visible by default.
- **No retries on `git push` failure.** A duplicate daily email or digest is worse than a missed one. The task runs again tomorrow.
- **Graceful empty days.** If no qualifying newsletters arrived, the agent still writes a "nothing today" entry and commits — so the site always reflects the most recent run, even when empty.
- **Static frontend.** The site is plain HTML/CSS/JS fetching a single JSON file. Zero build step, zero framework, infinite hosting options.

## What this demonstrates

- Long-running autonomous agent execution (scheduled + unsupervised)
- MCP-based tool integration (Gmail)
- Git as a zero-ops deployment substrate
- Clean separation of agent logic from data contract from presentation
- Product-shaped editorial decisions encoded in prompts (ranking, subscription tags, verdict language)

## License

MIT.
