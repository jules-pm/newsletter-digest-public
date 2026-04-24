# Generator contract

This file is the source-of-truth prompt for the `newsletter-digest-daily` scheduled task — a local Claude Code job (via the `scheduled-tasks` MCP) that runs on a daily cadence (e.g. 5pm ET).

## Task prompt

> You are running the `newsletter-digest-daily` scheduled task. Follow the playbook in your local agent file (e.g. `~/.claude/agents/newsletter-digest.md`) as the source of truth for **all** search queries, content extraction rules, ranking, subscription-status detection, and section structure (Top 3 → News → Alerts → Job opportunities).
>
> Modifications for this run:
>
> 1. **Time window is 24 hours, not 7 days.** Replace every `newer_than:7d` with `newer_than:1d` on content queries. Keep the `newer_than:365d` window on subscription-status queries.
>
> 2. **Output is JSON, not prose.** After synthesizing the digest, produce a single JSON object matching the schema below and **prepend** it to `data/digests.json` (which is an array). Do not overwrite other entries.
>
> 3. **Commit and push.** After writing the file:
>
>    ```sh
>    cd <your local repo path>
>    git add data/digests.json
>    git commit -m "digest: YYYY-MM-DD"
>    git push origin main
>    ```
>
>    If `git push` fails due to auth, log the error and continue — don't retry in a loop.
>
> 4. **(Optional) Log completion** to a personal daily note if you keep one. Skip if you don't.
>
> 5. **If no qualifying items were found**, write a digest object with `empty: "No AI/PM newsletter content received in the last 24 hours."` and empty `news`/`alerts`/`jobs` arrays. Still commit, push, and log.

## JSON schema

```json
{
  "date": "YYYY-MM-DD",
  "top3": ["sentence 1", "sentence 2", "sentence 3"],
  "convergence": "1–2 line thematic call-out, or omit key if no cluster",
  "news": [
    {
      "takeaway": "<strong>Punchy specific claim with numbers/frameworks/quotes. HTML allowed for inline formatting.</strong>",
      "verdict": "digest only | worth skimming | read in full",
      "sources": [
        {
          "publication": "Newsletter name",
          "author": "Author name, or empty string",
          "date": "Apr 18",
          "subscription": "paid | free | lapsed | unknown",
          "gist": "1-line gist of what this source contributes. HTML allowed."
        }
      ]
    }
  ],
  "alerts": [
    { "headline": "Short headline", "detail": "One-liner with what happened + so-what." }
  ],
  "jobs": [
    { "kind": "role", "role": "Role title", "company": "Company", "source": "Newsletter", "source_date": "Apr 21" },
    { "kind": "deep-dive", "company": "Company (context)", "source": "Newsletter", "source_date": "Apr 23" },
    { "kind": "roundup", "theme": "theme description", "source": "Newsletter", "source_date": "Apr 19" }
  ],
  "also_seen": "Optional 1-line footer. HTML allowed. Omit key if nothing to say.",
  "stats": {
    "threads_scanned": 0,
    "senders": 0,
    "paid": 0,
    "lapsed": 0
  }
}
```

## Rules

- **News cap: 5 items.** Drop weaker items or fold into `also_seen`.
- **HTML in strings is OK** (used for `<strong>`, `<code>`, `<em>` in takeaways and gists). Escape anything untrusted.
- **Verdicts are News-only.** Alerts and Jobs don't get verdicts.
- **Subscription tags on every source line.** Match receipts by publication name (tolerate minor variations).
- **Omit sections entirely** if they have no items — don't emit empty arrays for `alerts` or `jobs` if genuinely empty (or emit empty arrays, which the renderer handles either way).
