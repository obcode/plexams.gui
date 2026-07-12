---
name: versioning-policy
description: Client major version tracks the plexams server major; bump on every server breaking change
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 880b6433-6bff-4d79-82fa-83d2fb15b7a0
---

The GUI (client) **major version must match the plexams server major version**. As of 2026-07-12 the server is at v3, so the client was moved to v3.0.0.

**Why:** the user wants server and client majors to stay aligned so compatibility is obvious from the version alone.

**How to apply:**
- Version is driven by **semantic-release** via git tags (not package.json — that stays the `0.0.x` placeholder, see vite.config.js fallback chain). The footer shows the tag via `__APP_VERSION__`.
- To bump a major, push a commit with a Conventional-Commits breaking marker (`feat!:` or a `BREAKING CHANGE:` footer) to `main`; CI runs semantic-release and tags the new version.
- semantic-release bumps **only one major per release** — to jump two majors you must wait for the first tag, then push another breaking commit.
- **On every plexams-server breaking change, bump the client major too** (with a `BREAKING CHANGE:` commit) so the majors stay in lockstep — even if the client diff itself isn't breaking.
- Pushing to main triggers a real release + Docker build (outward-facing) — see [[always-commit-push]].
