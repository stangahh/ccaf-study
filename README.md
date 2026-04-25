# CCAF Study Hub

A practice exam and study guide for the Anthropic Claude Certified AI Fundamentals (CCAF) certification.

## Pages

- **Home** (`index.html`) — overview and domain breakdown
- **Study Guide** (`study.html`) — concept notes organised by domain
- **Practice Exam** (`exam.html`) — 55 questions with explanations, per-domain filtering, and shuffle

## Domains

| # | Domain | Weight |
|---|--------|--------|
| 1 | Agentic Architecture | 27% |
| 2 | Tool Design & MCP | 18% |
| 3 | Claude Code Config | 20% |
| 4 | Prompt Engineering | 20% |
| 5 | Context & Reliability | 15% |

## Live Site

https://ccaf-study-buv.pages.dev

## Local Development

Open any `.html` file directly in a browser — no build step required.

## Deploy

```bash
npm run deploy
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set in your environment (see `~/.zshrc`).

## Tests

```bash
npm test
```

Runs the Playwright test suite (33 tests across all three pages).
