# Serverless URL Shortener: Design & Tech Stack

A serverless URL shortener on AWS, built phase by phase as a learning project. Every decision below was reasoned through (not just picked), and each phase teaches one system design topic.

---

## 1. What the system does

Two jobs:

1. **Shorten (write):** take `https://example.com/some/very/long/path` and return `sho.rt/9k2Xp`.
2. **Redirect (read):** when someone visits `sho.rt/9k2Xp`, look up the long URL and send the browser there.

### What "serverless" means here

- We don't manage servers. Functions run only when a request arrives, scale automatically, and are billed per call.
- Functions are **stateless**. Nothing reliable persists in memory between calls, so all state lives in external stores.
- **Cold starts:** the first call after a quiet period is slower.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Language | **Node.js** | Already familiar, so the focus stays on concepts |
| Compute | **AWS Lambda** | Runs code only when a request arrives |
| HTTP entry point | **API Gateway (HTTP API)** | Receives HTTP requests, routes them, and invokes the right Lambda |
| Database | **DynamoDB** | Key-value lookups (code → long URL) are exactly what it's built for |
| Infrastructure as Code | **AWS SAM** | AWS's official tool; one YAML template describes functions, API and tables; `sam local` for testing on your machine |
| Later additions | **CloudFront**, **DynamoDB TTL**, **DynamoDB Streams** | Caching, expiring links, and analytics, added as those phases come up |

### Why plain Lambda handlers instead of Express

- In a normal server, Express *is* the server: it listens on a port and does routing.
- In serverless, **API Gateway does the routing**. It calls your function with the request as a plain `event` object.
- Running Express inside Lambda (a "Lambdalith") works, but hides the core serverless idea: small, separate functions triggered by events.
- With only 2–3 endpoints, plain handlers are simpler and teach the model directly.

| Express | AWS serverless |
|---|---|
| `app.get('/:code', ...)` does the routing | API Gateway route `GET /{code}` (defined in the SAM template) |
| The `(req, res) => {...}` callback is the handler | The Lambda handler function |
| `req` | The `event` object (path params, headers, body) |
| `res.status(...).redirect(...)` sends a response | The handler **returns** a plain object describing the response |

### Prerequisites

1. An AWS account (the free tier covers this project); use an IAM user, not the root account
2. AWS CLI, configured with credentials
3. AWS SAM CLI
4. Node.js 20+
5. Docker (used by `sam local` to imitate Lambda)

---

## 3. Phased roadmap

Build an MVP first, then add one feature per phase.

| Phase | Feature | System design topic |
|---|---|---|
| **1 (MVP)** | Shorten + redirect | ID generation, encoding, key-value data modeling |
| 2 | Custom aliases | Uniqueness, race conditions, conditional writes |
| 3 | Expiring links | TTL, lazy vs. active deletion |
| 4 | Click analytics | Async processing, keeping the hot path fast |
| 5 | Caching | CDN, cache headers, 301 vs. 302 |
| 6 | Rate limiting | Abuse prevention, throttling |
| 7 | User accounts | Authentication (JWTs) |

---

## 4. Key design decisions

### 4.1 The system is read-heavy (about 100:1)

- A link is created once and clicked many times. The usual assumption for shorteners is ~100 reads per write.
- **Principle: optimize the hot path.** The redirect function must be fast: it carries most of the traffic, and it sits between the user and the page they wanted. Shorten is a one-time action and can afford to be slower.

### 4.2 Base62 alphabet, not Base64

- Base62 = `a-z A-Z 0-9` (62 characters).
- Standard Base64 adds `+` and `/`, which break in URLs:
  - `/` separates path segments, so `sho.rt/ab/cd` would not match the `GET /{code}` route → 404.
  - `+` is decoded as a space in query strings (verified: `new URLSearchParams('q=a+b').get('q')` → `"a b"`), so a lookup silently fails → 404 for a link that exists.
- Base62 characters pass through URLs unchanged, which rules out that whole class of silent bugs.

### 4.3 Seven-character codes (capacity planning)

| | Value |
|---|---|
| Codes with 6 chars (`62 ** 6`) | ~56.8 billion |
| Links per year at 1,000/sec | ~31.5 billion |
| 6 chars last | ~1.8 years |
| Codes with 7 chars (`62 ** 7`) | ~3.5 trillion |
| 7 chars last | ~110 years |

**Decision: 7 characters.** One extra character buys about a century of runway at a load far higher than we'll see.

### 4.4 ID generation: counter + reversible scrambling

Three approaches were compared:

| Method | Collision-safe? | Unguessable? | Stateless-friendly? |
|---|---|---|---|
| Random | No, needs a check | Yes | Yes |
| Hashing (truncated) | No, collisions likely | Mostly | Yes |
| Counter (Base62) | Yes | No, guessable | Needs an atomic DB operation |

Why hashing was rejected:

- Truncating a hash to 7 characters throws away its huge output space.
- Hex hashes are Base16: `16 ** 7` ≈ 268 million, about 13,000× smaller than `62 ** 7`.
- **Birthday problem:** collisions appear around the square root of the space. With 268M possibilities, there's about a 50% chance of a collision after only ~20,000 links.
- DynamoDB `PutItem` **silently overwrites** an existing key by default, so a collision would redirect one user's link to someone else's URL with no error.

Why a raw counter isn't enough:

- **Race condition:** two Lambdas reading `41`, adding 1 and writing `42` both get 42. Fix: an **atomic increment** done by the database (DynamoDB `UpdateItem` with `ADD`, returning the new value).
- **The counter can't live in Lambda memory.** Warm containers can keep a variable between calls, but parallel containers each have their own copy and can be destroyed at any time. Lambda memory is for things that are safe to lose (like a cached DB connection), never the source of truth.
- **Enumeration:** sequential codes (`...g7`, `...g8`, `...g9`) let anyone script through every link and find private ones, and they leak how many links exist.

**Decision:**

1. DynamoDB **atomic counter** → a guaranteed-unique number (no collisions, no race conditions).
2. A **reversible scrambler** (a bijection, e.g. the Hashids library) → the number becomes a non-sequential-looking code. It only needs to *look* random, not *be* random, so it stays one-to-one.
3. Store `code → longUrl`.

Because codes can't collide, the MVP doesn't need a conditional write. It becomes necessary in **Phase 2 (custom aliases)**, where users pick codes themselves (look up `attribute_not_exists`).

### 4.5 HTTP responses on redirect

- **302 (temporary)**, not 301. Browsers cache 301s and skip the server on later clicks, which would make Phase 4 click counts inaccurate. The trade-off is accurate analytics vs. less server load.
- **410 Gone** for expired links: the link existed but no longer does (more accurate than 404).
- The 302 response carries a **`Location` header** telling the browser where to go.

---

## 5. Data model

In DynamoDB, **design around access patterns first**, tables second.

### Access patterns

| Pattern | Phase |
|---|---|
| Save a new code → long URL mapping | 1 |
| Look up the long URL by short code (hot path) | 1 |
| Atomically increment the global counter | 1 |
| Check whether a link has expired | 3 |
| Record a click event | 4 |

### Tables

| Table | Partition key | Attributes | Why separate |
|---|---|---|---|
| **Links** | `code` (e.g. `"9k2Xp"`) | `longUrl`, `createdAt`, `expiresAt` (Phase 3) | The partition key is the short code because that's the only thing the redirect Lambda receives, and a key lookup is the fastest read |
| **Clicks** | `code` + `day` (Phase 4) | `count` (number), atomically incremented | High-volume writes shouldn't bloat or slow the item the redirect path reads |

### Clicks table design (Phase 4)

- **Requirements:** total clicks and clicks per day, per link.
- **Decision: pre-aggregated daily counters** — one item per link per day (`{code, day, count}`), incremented with an atomic `ADD`.
- Why not one raw event per click: a 30-day chart would read every click (e.g. 50,000 items) instead of 30.
- Trade-off: daily counts can't be split into hours or referrers later. Only the questions planned for can be answered.
| **Counter** | `id` (e.g. `"global"`) | `value` (number) | Atomic increment targets one specific item; one global sequence guarantees unique numbers |

---

## 6. Sequence diagrams

### Shorten (write) flow

```
User              ----POST /shorten (longUrl)-------->  API Gateway
API Gateway       ----invokes------------------------->  Lambda (shorten)
Lambda (shorten)  ----atomic increment (ADD 1)-------->  Counter table
Counter table     ----returns new number (47)--------->  Lambda (shorten)
Lambda (shorten)  ----[internal: scramble 47]---------> produces code "9k2Xp"
Lambda (shorten)  ----save {code: "9k2Xp", longUrl}-->  Links table
Links table       ----confirms save success----------->  Lambda (shorten)
Lambda (shorten)  ----returns response----------------->  API Gateway
API Gateway       ----{shortUrl: "sho.rt/9k2Xp"}------->  User
```

### Redirect (read) flow

```
User               ----GET /9k2Xp--------------------->  API Gateway
API Gateway        ----invokes------------------------->  Lambda (redirect)
Lambda (redirect)  ----get item by code---------------->  Links table
Links table        ----returns item {longUrl, expiresAt}-> Lambda (redirect)
Lambda (redirect)  ----[internal: is expiresAt in the past?]

  [If expired]
  Lambda (redirect)  ----returns 410-------------------->  API Gateway
  API Gateway        ----returns 410-------------------->  User

  [If valid]
  Lambda (redirect)  ----returns 302, Location header--->  API Gateway
  API Gateway        ----returns 302, Location header--->  User
```

---

## 7. Open questions

- [ ] **Analytics timing (Phase 4):** does logging a click happen before or after the 302 is sent? Does the browser wait for it? What mechanism lets the redirect Lambda record a click without waiting? (Look up "fire and forget" and decoupling the hot path.)
- [ ] **Counter bottleneck:** every shorten request hits the same single counter item. Could that become a hot spot, and which function would it affect?

## 8. Next steps

1. Answer the open questions above.
2. Set up the project skeleton with AWS SAM: folder structure, template, first Lambda function.
3. Build Phase 1 (MVP): shorten + redirect.
