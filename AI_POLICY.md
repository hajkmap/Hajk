# AI Policy

Hajk's maintainer team is small. This policy exists to protect that limited time of the maintainers – not to discourage
AI use as such. We use AI tools ourselves. The issue is specifically
**contributions where AI replaces understanding**, because those cost the
project more time to review than they save the contributor to produce.

This policy applies to any pull request where an AI tool (Copilot, Cursor,
Claude, ChatGPT, or similar) generated a non-trivial share of the diff —
whether that's the whole PR or a large chunk of it. Trivial use, like
IDE autocomplete for a line or two, or AI-assisted spelling/wording fixes in
docs, does not need to follow this process.

## The rule

**We do not review unsolicited AI-generated pull requests.** If you open a
substantial AI-assisted PR without following the steps below, a maintainer
will close it, link here, and will not provide a detailed review.

This is a hard line, not a suggestion — see [Why](#why) if you want the
reasoning.

## What we require instead

1. **Open an issue first, and get a maintainer to confirm the approach**
   before writing any code. Describe the problem and your proposed solution
   in plain language. Wait for a maintainer to comment that the approach is
   acceptable. This is the step that actually saves time: it's much cheaper
   for us to correct a misunderstanding in a paragraph than in a 400-line
   diff.
2. **Disclose AI use in the PR description.** State which tool you used and
   roughly how (e.g. "implementation drafted with Claude Code based on the
   approach agreed in #1234, then tested manually against GeoServer 2.28").
3. **You must be able to explain and defend every line.** If a maintainer
   asks "why does this touch the WMS proxy layer" or "what does this do to
   existing saved map configs," you need to answer from your own
   understanding, not by re-pasting the question into an AI tool and
   forwarding the answer. If you can't explain it, you shouldn't be
   submitting it yet.
4. **You are responsible for testing it.** "It builds" and "the AI said
   it works" are not tests. Run it against a real Hajk instance. Tell us
   what you tested and how, in the PR description.
5. **Keep the PR scoped to the linked issue.** Don't let the agent wander
   into unrelated refactors, formatting churn, or "while I was in there"
   changes. Large diffs mixing unrelated concerns are closed regardless of
   how they were produced.

**PRs that skip step 1 (no prior issue / no maintainer sign-off on approach)
will be closed on sight, even if the code looks fine.** This isn't about the
code being bad — it's that we have no way to cheaply verify it's good
without the up-front discussion.

## Why

An open pull request is a _request for a maintainer's time_. Historically,
the effort it took a human to write a PR was itself a rough filter — if
you'd spent hours on it, you'd usually understood the codebase well enough
for the PR to be reviewable in a reasonable amount of time. AI coding tools
remove that filter: a plausible-looking, large diff can now be produced in
minutes by someone with no context on Hajk's architecture, and reviewing it
still takes a maintainer the same amount of time it always did — often
longer, since diagnosing _why_ an AI-generated approach doesn't fit isn't
always obvious from the code alone.

We're a small team maintaining GIS infrastructure used in production by
municipalities. Pre-approving the approach in an issue is how we keep that
tradeoff sane without shutting the door on contributors entirely.

## If you don't have coding capacity

You don't need to write code to contribute meaningfully. See
[CONTRIBUTING.md](CONTRIBUTING.md) — writing user documentation on the
[Wiki](https://github.com/hajkmap/Hajk/wiki), filing detailed bug reports,
or testing releases are all genuinely useful and don't run into any of the
above.
