# What Does It Take to Be Happy?

An independently readable illustrated essay for a SOC SCI midterm, created by TJ, Koj, and Vier. Original stickmen, an unseen narrator, and changing scenes explore different good lives and the conditions that make them possible.

The visual and presentation reference is [Nicky Case's The Evolution of Trust](https://ncase.me/trust/). This project uses its presentation rhythm and handwritten aesthetic as inspiration, with original artwork and an original argument about happiness.

**Current status:** the agreed brief, source notes, architecture, and implementation backlog are documented; an initial character concept sheet has been generated; and the editorial package is drafted — an 87-scene storyboard with its sources audited at passage level. On 9 October the owner authorized autonomous implementation of the six build packages, automatic merging after verification, and generated-art support from this chat. Application and release progress is tracked on the issues; new unrelated tickets remain unqueued by default.

## Read first

| Document | Purpose |
| --- | --- |
| [Project brief](docs/brief.md) | Audience, thesis, agreed experience, assignment requirements |
| [Decisions](docs/decisions.md) | Confirmed choices and superseded proposals |
| [Architecture](docs/architecture.md) | Content contract, reader, illustration, citations, hosted/offline outputs |
| [Content plan](docs/content-plan.md) | Six shared questions, perspectives, conceptual lenses, coverage |
| [Storyboard](docs/storyboard.md) | The authored main path: chapters, scenes, exact prose, dialogue, visible caveats, visual purpose |
| [Cast registry](docs/cast.md) | Stable identifiers for the three members and the fictional friends, and the six expression states |
| [Coverage matrix](docs/coverage.md) | Assignment parts, six questions, lenses, and member positions mapped to scenes; reading measurement; delta inventory |
| [Research register](docs/research.md) | Source pool with a per-source evidence record: what was read, the supported claim, and the limitation |
| [Art direction](docs/art-direction.md) | Original characters, emotions, typography, meaningful scene changes |
| [Asset workflow](docs/asset-workflow.md) | Built-in generation, first character sheet, drawing parts, animation, optional tools |
| [Autonomous build](docs/autonomous-build.md) | Owner authorization, reviewed merges, issue labels, art requests, local supervision |
| [Notes and future updates](docs/notes/README.md) | Imported notes and how to contribute a delta |
| [Delivery](docs/delivery.md) | Vercel hosting and the offline submission file |
| [Verification](docs/verification.md) | Narrative, navigation, accessibility, offline, and release checks |
| [Work plan](docs/work-plan.md) | Implementation packages and evidenced prerequisites |

## Narrative questions

1. What counts as happiness?
2. Must enjoyment become meaningful or productive?
3. Whose definition are we following?
4. How do relationships help, and when does care become pressure?
5. Who has room for happiness?
6. What could change, and what do we still disagree about?

The working synthesis is that happiness takes different forms: small joys matter, while security, time, relationships, and freedom shape who can sustain them. The story preserves disagreement rather than declaring one definition correct.

## Contributing

Add new member notes using [the delta template](docs/notes/delta-template.md), then reconcile the affected story sections and references. Research can be shared among all three contributors; personal claims should remain faithful to what each member endorses.

Two editorial commands exist. They need nothing beyond coreutils, grep, and awk:

```sh
./tools/check-storyboard.sh    # storyboard, cast, and research-register consistency
./tools/count-main-path.sh     # main-path word count and reading estimate (--chapters, --text)
```

There are still no application commands. The implementation foundation ticket will establish and document the chosen tooling, local preview, validation, hosted build, and offline packaging commands.

## Work tracking

Start with the [project index](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/1), [work plan](docs/work-plan.md), and [GitHub issues](https://github.com/duckycodess/what-it-takes-to-be-happy/issues). Six implementation packages have canonical contracts and verified classification labels. The owner's overnight-build request authorizes those six; the index stays unqueued. The installed Agent Flow front door publishes tickets; exact `agent:ready` records implementation authorization.

## Source material

The [group Google Doc](https://docs.google.com/document/d/1NL3B3DEtVc3QeblkBwtClMhwEmDhqnkwZByL2hFDyVU/edit) contains Instructions, Brainstorm, and Website ideas — TJ. Imported snapshots are historical evidence; the confirmed decisions in this repository govern implementation.
