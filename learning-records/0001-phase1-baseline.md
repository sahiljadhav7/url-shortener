# Phase 1 baseline: design reasoned through, infra half-built

Before the teaching workspace existed, the user reasoned through every decision in `docs/DESIGN.md` (Base62 vs Base64, 7-char capacity math, counter + scrambler vs hashing, 302 vs 301) and wrote `template.yaml` themselves: LinksTable, CounterTable, and a shorten function with an HttpApi `POST /shorten` event and `DynamoDBWritePolicy` on both tables. Next up: shorten logic (Step 3), then the redirect function (Step 4).

**Evidence**: template.yaml written by the user and lints clean (2026-10-05). The walkthrough happened in earlier sessions.

**Implications**: don't re-teach the design rationale. Build on it. Known gaps: YAML indentation, Handler file vs function name, and the REST (v1) vs HTTP API (v2) event shape.
