# Mission: Serverless URL Shortener on AWS

## Why
Build a serverless URL shortener on AWS phase by phase, so I understand every piece well enough to explain it and rebuild it from scratch. Each phase teaches one system-design topic. (Drafted from `.claude/CLAUDE.md` and `docs/DESIGN.md`; correct if off.)

## Success looks like
- I can explain the HLD box by box and map each box to `template.yaml`
- I write the SAM template and Lambda handlers myself (Phase 1 MVP: shorten + redirect)
- I can justify each design decision: Base62, 7 chars, counter + scrambler, 302 vs 301
- I extend the system through Phases 2–7 (aliases, TTL, analytics, caching, rate limiting, auth)

## Constraints
- Teaching mode: no solution code from Claude; hints and concepts only
- Node.js, AWS SAM, DynamoDB, HTTP API; personal AWS account in ap-south-1
- Time: user wants all 7 phases in one week (stated 2026-10-10, target ~Oct 17). Needs ~8 hrs/day and a minimal version of each phase. Teaching mode stays: user writes all code; Claude front-loads reference facts to save time

## Out of scope
- Express or other frameworks inside Lambda
- Frontend UI (for now)
