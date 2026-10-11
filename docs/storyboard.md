# Storyboard

> **HISTORICAL, as of 11 October 2026.** This is the superseded 87-beat build's editorial source:
> beats `s001`–`s087`, their prose, their dialogue and their visual purposes. The website is now a
> transfer of [the approved 45-scene script](redesign/approved-scene-script.md), which reuses the
> `s088`–`s132` identifiers and none of the ones below. Nothing here is implemented, and nothing
> here should be implemented from.
>
> It is kept, unaltered, because it is the evidence behind work that was really done: the audit in
> [the research register](research.md) was carried out against these beats, and
> `./tools/check-storyboard.sh` still keeps this document internally consistent. What the current
> essay covers is [the coverage matrix](coverage.md).

The authored main path of the illustrated essay, in reading order. This document is the editorial
source of truth for chapters, scenes, exact prose, dialogue, visible caveats, and visual purpose. It
is not an implementation: it selects no framework, no file format, and no artwork.

Status: **drafted**. Every scene carries its final main-path text. Artwork, renderer, and packaging
belong to other work packages.

## How to read a scene

Everything inside a blockquote (`>`) is **main-path prose**: narrator text, dialogue, and visible
caveats that every reader sees, in presentation view, in the full reading view, and in print. It is
the text that is measured for the reading estimate. Everything outside a blockquote is editorial
metadata for the people building the site, and never appears in the product.

| Field | What it holds |
| --- | --- |
| Beat purpose | Why this scene exists in the argument |
| Cast | Figures present, with their expression state in this scene |
| Narrator | Exact unseen-narrator prose |
| Dialogue | Exact lines, each with speaker, standing, expression, and the notes they come from |
| Visible caveat | A limitation the reader must see here, not in a panel they may never open |
| Sources/concepts | Source identifiers from the register and the lenses in play |
| Visual purpose | What the illustration has to make visible |
| Static description | The same meaning in words, for reduced motion, print, and screen readers |
| Optional detail | Supplementary surface, its trigger, and its static equivalent — never the only statement of anything |
| Transition | How this beat hands over to the next |
| Provenance | The note, source, or decision each element comes from |

Dialogue standing is one of:

- **member-endorsed** — the position comes from that member's own notes, with the source given:
  `(Brainstorm <lines>)` for the imported snapshot, or `(delta: <file under docs/notes/deltas/>)` for
  a later contribution. Wording may be tightened for reading; the position may not be changed, and no
  member is given an event, memory, or circumstance their notes do not contain.
- **fictional illustration** — a generic invented figure. Never evidence, never anyone's biography.

## How to read the identifiers

- Chapter identifiers are `c0`–`c6`. `c0` is the opening; `c1`–`c6` are the six shared questions
  from [the content plan](content-plan.md).
- Scene identifiers are assigned once and **never renumbered**. Reading order comes from each
  chapter's ordered scene list, not from the number. A scene inserted later takes the next unused
  number and is placed into a chapter's list wherever it belongs; a scene that is removed takes its
  number out of use rather than freeing it, so gaps in the sequence are expected and correct.
- Highest scene identifier assigned: `s087`. This is a high-water mark, not a count of scenes. Raise
  it when a scene is added; never lower it.
- Retired scene identifiers: none. When a scene is removed, move its identifier to this line rather
  than letting the number fall out of the document. A retired identifier is never reused.
- Cast identifiers come from [the cast registry](cast.md). Expression names come from the same
  file's six-state vocabulary.
- Source identifiers come from [the research register](research.md). A scene may only cite a source
  whose evidence record supports the specific sentence it is attached to. Where a record's status is
  `not-accessed` or `verified-locator`, the scene says so in its own main-path text.
- Concept identifiers are the lens names used in the content plan. They are editorial labels, not
  claims that a named theorist endorsed our application of their work.

The high-water mark and the retired list are what make permanence checkable rather than merely
promised. Every number from `s001` up to the mark must be either in use above or listed as retired,
so a gap is always something somebody wrote down on purpose, and `tools/check-storyboard.sh` rejects
an identifier that is in use and retired at once.

## Boundaries this storyboard keeps

- Essential argument, findings, caveats, and reflection live on the main path. Optional detail may
  expand a scene but never carries the only statement of a perspective.
- Members speak only what the group notes supply or what a member has endorsed. Fictional friends
  illustrate; they never serve as evidence and never become a member's biography.
- Shared research keeps its original attribution regardless of which avatar explains it.
- Where a source could not be verified at passage level, the scene narrows its claim and says so in
  the reader-visible text, not only in an internal note.

## Chapter index

| Chapter | Question | Scenes | Order |
| --- | --- | --- | --- |
| `c0` | Opening | 2 | `s001`, `s002` |
| `c1` | What counts as happiness? | 13 | `s003`–`s015` |
| `c2` | Must enjoyment become meaningful or productive? | 14 | `s016`–`s029` |
| `c3` | Whose definition are we following? | 15 | `s030`–`s044` |
| `c4` | How do relationships help, and when does care become pressure? | 12 | `s045`–`s056` |
| `c5` | Who has room for happiness? | 19 | `s057`–`s075` |
| `c6` | What could change, and what do we still disagree about? | 12 | `s076`–`s087` |

Chapter shortcuts land on the first scene of each chapter: `s001`, `s003`, `s016`, `s030`, `s045`,
`s057`, `s076`.

---

## `c0` — Opening

Purpose: state the question, show that it has more than one honest answer, and say who is speaking
and from where before any argument begins.

#### `s001` — What does it take to be happy?
- Beat purpose: the landing. The working question, Begin, the three names, and an honest reading estimate.
- Cast: `tj` `koj` `vier` `bob` — mixed, including `joy`, `fatigue`, and `reflection`
- Narrator:
  > **What does it take to be happy?**
  >
  > Three of us tried to answer that for a class. We ended up disagreeing — about what happiness is, about whether it has to be earned, about how much of it is ours to decide. We kept the disagreements in.
  >
  > TJ. Koj. Vier. Roughly 35 to 44 minutes, depending on how long you look at things. Next and Back are yours.
- Sources/concepts: —
- Visual purpose: the centred question surrounded by stickmen in different states, so the opening never implies one correct emotion.
- Static description: Four figures stand around a large question. One is laughing, one is slumped and tired, one is looking off and thinking, one is watching the others. Nothing in the picture says which of them has it right.
- Optional detail: none.
- Transition: Begin moves to `s002`.
- Provenance: Working title and landing composition from `docs/brief.md`, "Landing and visual direction". Reading estimate measured by `tools/count-main-path.sh`.
- Status: drafted

#### `s002` — Who is talking, and from where
- Beat purpose: introduce the three contributors, the unseen narrator, and the fact that this is a group with disagreements rather than one voice. State the standpoint early instead of saving it for the end.
- Cast: `tj` `koj` `vier` (`curiosity`)
- Narrator:
  > A voice you will not see will do most of the connecting. That is this one. When one of us has something of our own to say, we will step in with our names above our heads.
  >
  > We should say where we are standing before we start. We are university students in the Philippines. We have classmates, internet, and enough schedule to argue about happiness for a midterm. That is a position, not a neutral place to look from, and we will come back to it when it starts to matter.
- Visible caveat:
  > Some of the people in these drawings are invented. When we say "this is our friend Bob", Bob is a stickman we made up to show you something. He is not evidence, and he is not one of us.
- Sources/concepts: standpoint
- Visual purpose: the three members with names above their heads, standing apart rather than as a united block; a fourth, blank-headed figure beside them to mark the invented ones.
- Static description: TJ, Koj, and Vier stand with a gap between each of them, each labelled. A fourth figure stands slightly outside the group with a dotted outline, unnamed.
- Optional detail: none.
- Transition: the narrator stops explaining and shows an ordinary day instead.
- Provenance: Standpoint requirement from `docs/brief.md`, "Purpose and audience", and the assignment's instruction to say which position you are answering from (`docs/notes/2026-10-08-instructions.md`). Fictional-friend boundary from `docs/decisions.md`, "Examples".
- Status: drafted

---

## `c1` — What counts as happiness?

Covers the assignment's first two parts: what we think happiness is, and what constitutes it. Ends
without merging the three definitions.

#### `s003` — One ordinary day, three snapshots
- Beat purpose: open with play, meaningful challenge, and rest in the same day, before any theory.
- Cast: `bob` (`joy`), `koj` (`reflection`), `tj` (`fatigue`)
- Narrator:
  > Here is one Tuesday.
  >
  > In the afternoon, someone is playing basketball badly and laughing about it. In the evening, someone else is three hours into something difficult and is not enjoying a minute of it, and does not want to stop. At eleven, someone is lying down doing nothing at all, and that is the best part of the day.
  >
  > Start here, before anyone defines anything.
- Sources/concepts: —
- Visual purpose: three small panels of ordinary activity that a reader recognises without explanation.
- Static description: Three panels side by side — a figure mid-game and laughing, a figure hunched over work with a furrowed face, a figure lying flat and loose-limbed. No labels, no arrows between them.
- Optional detail: none.
- Transition: the three panels stay on screen while the cast walks into frame.
- Provenance: Opening-through-snapshots method from `docs/content-plan.md`, chapter 1. Activities drawn from TJ's notes (Brainstorm 79–95) and Koj's (Brainstorm 49–61) without attaching either to a particular member yet.
- Status: drafted

#### `s004` — The same day, read three ways
- Beat purpose: show the three members reaching different readings of the identical day. Establishes that the disagreement is the material, not a flaw.
- Cast: `narrator` `tj` `koj` `vier` (`curiosity`)
- Narrator:
  > We looked at a day like that and came away with three different answers about which part was the happiness.
  >
  > That is where this essay actually starts. Not with a definition we agreed on, but with the fact that we didn't.
- Sources/concepts: —
- Visual purpose: one scene, three thought directions leaving it.
- Static description: The Tuesday panels sit in the middle. Three lines run out from them to TJ, Koj, and Vier, each line ending at a different panel.
- Optional detail: none.
- Transition: Koj speaks first.
- Provenance: Six-questions-woven structure and preserved disagreement from `docs/decisions.md`, "Story organization" and "Argument".
- Status: drafted

#### `s005` — Koj: not happy all the time
- Beat purpose: Koj's opening move — constant positive emotion is unrealistic, and sadness, frustration, boredom, and grief are normal.
- Cast: `koj` (`reflection`, `sadness`)
- Dialogue:
  - `koj` — member-endorsed (Brainstorm 17–23) — `reflection`
    > Happiness is not being happy all the time. Sadness, frustration, boredom, grief — those are normal. If happiness means constant positive emotions, then it is probably unrealistic.
  - `koj` — member-endorsed (Brainstorm 23) — `reflection`
    > I think happiness is closer to living well than to simply feeling good.
- Sources/concepts: —
- Visual purpose: Koj with a mixed-emotion sequence rather than a single smile.
- Static description: Koj drawn four times across the frame with four different faces — content, bored, frustrated, calm. The line under all four is continuous.
- Optional detail: none.
- Transition: Koj starts listing what living well would include.
- Provenance: Brainstorm 17–23, Koj's own wording, lightly tightened.
- Status: drafted

#### `s006` — Koj's list
- Beat purpose: the constituents Koj names — relationships, purpose, choice, improvement, time for what he enjoys, security, and a life he can judge worth living.
- Cast: `koj` (`reflection`)
- Dialogue:
  - `koj` — member-endorsed (Brainstorm 25–39) — `reflection`
    > For me it could include meaningful relationships. A sense of purpose. Being able to make my own choices. Improving at things that matter to me. Having time for things I enjoy. Feeling secure enough that I am not constantly worried about survival. And being able to look at my life and think that it is worth living.
- Narrator:
  > Notice how many of those are conditions rather than feelings. Time. Security. Choice. We are going to come back to that, hard, in a few chapters.
- Sources/concepts: —
- Visual purpose: the list as drawn objects around Koj rather than a bulleted slide.
- Static description: Koj stands in the middle. Around him: two figures talking, a path ahead, a fork in a road, a rising line, a clock, a roof. Each one is a small drawing, not a word.
- Optional detail: none.
- Transition: the narrator names the tradition Koj's answer is closest to.
- Provenance: Brainstorm 25–39, Koj's list in his own order. The narrator's observation about conditions is this essay's framing, set up for chapter 5.
- Status: drafted

#### `s007` — Aristotle: flourishing across a life
- Beat purpose: explain eudaimonia accurately from Book I before anyone applies it.
- Cast: `narrator` `koj` (`curiosity`)
- Narrator:
  > Koj's answer has a long history behind it. In Book I of the Nicomachean Ethics, Aristotle lands on the human good as "activity of soul in accordance with virtue" — and if there is more than one virtue, in accordance with the best and most complete.
  >
  > The part that matters here is the timescale. Right after that line he writes: "For one swallow does not make a summer, nor does one day; and so too one day, or a short time, does not make a man blessed and happy."
  >
  > So this is not a theory about good moods. It is a theory about how a whole life goes.
- Sources/concepts: `R01`; eudaimonia
- Visual purpose: a life drawn as a long line rather than a single good moment.
- Static description: A long horizontal line runs the width of the frame, bumpy, with high and low stretches. One tiny bright point on it is circled and labelled "one day". The circle is very small against the line.
- Optional detail: Opening the source panel shows the full Book I citation, the Ross translation link, and the two quoted sentences in context. Keyboard: the panel opens with Enter or Space on the source button and closes with Escape, returning focus to the button. Static equivalent: the same citation and quotations are printed in the full reading view, so the panel is never the only place they appear.
- Transition: the narrator turns Aristotle's own qualification into the next question.
- Provenance: `R01`, verified in full — Book I ch. 7. Koj's link to eudaimonia is his own (Brainstorm 41–47).
- Status: drafted

#### `s008` — Aristotle, questioned
- Beat purpose: apply and then question — external goods matter in Aristotle's own account, which raises who is in a position to flourish at all.
- Cast: `narrator` `vier` (`curiosity`)
- Narrator:
  > Aristotle does not leave it at virtue. A chapter later: "Yet evidently, as we said, it needs the external goods as well; for it is impossible, or not easy, to do noble acts without the proper equipment." He names friends, money, and political power as instruments.
  >
  > Read that slowly and it stops being comforting. If flourishing needs equipment, then flourishing is distributed by whoever distributes the equipment.
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 377–383) — `curiosity`
    > A person can have a healthy mindset and still be stuck in circumstances that really limit their choices. So if we care about people's happiness, we have to care about the conditions that give them room to choose.
- Sources/concepts: `R01`; eudaimonia; conditions
- Visual purpose: the same long line, with sections of it fenced off.
- Static description: The long life-line returns. Now parts of it are behind a low fence, and a figure stands outside the fence looking in.
- Optional detail: none.
- Transition: TJ interrupts the tradition with a distinction of his own.
- Provenance: `R01`, verified in full — Book I ch. 8. Vier's line from Brainstorm 377–383. The inference about distribution is this essay's, stated as the narrator's reading rather than Aristotle's claim.
- Status: drafted

#### `s009` — TJ: three different questions
- Beat purpose: TJ separates feeling good now, being satisfied with life, and becoming someone he wants to be. Good mood today, uncertain about the future; proud of the direction, exhausted this week.
- Cast: `tj` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 71) — `reflection`
    > Feeling good right now, being satisfied with my life, and becoming someone I want to be — magkakaugnay, pero magkaiba. Pwedeng good mood ako today and uncertain pa rin about the future. Pwedeng proud ako sa overall direction and exhausted naman this week.
- Narrator:
  > Three questions, not one. Ask someone only the first and you will miss most of their life. Ask only the second and you will miss today.
- Sources/concepts: well-being measures
- Visual purpose: three dials that can point in different directions at once.
- Static description: Three dials side by side, labelled "today", "my life so far", "where I am going". Their needles all point to different places. Nobody is adjusting them.
- Optional detail: none.
- Transition: the narrator notes that researchers ran into the same split.
- Provenance: Brainstorm 71, TJ's own wording and Taglish retained.
- Status: drafted

#### `s010` — Measuring two different things
- Beat purpose: the research distinction between everyday emotional well-being and life evaluation, with population and measure visible.
- Cast: `narrator` `tj` (`curiosity`)
- Narrator:
  > Kahneman and Deaton ran into the same split when they tried to measure it. They separated emotional well-being — "the emotional quality of an individual's everyday experience" — from life evaluation, "the thoughts that people have about their life when they think about it". Then they measured each a different way: yesterday's emotions by asking about yesterday, life evaluation on a ladder scale.
  >
  > The two turned out to have different correlates. Income and education tracked life evaluation more closely. Health, caregiving, loneliness, and smoking tracked daily emotion more closely.
- Visible caveat:
  > That is one study: more than 450,000 people in the United States, surveyed in 2008 and 2009, answering about themselves. It tells us the questions come apart. It does not tell us what the answers are here.
- Sources/concepts: `R02`; well-being measures
- Visual purpose: two different instruments pointed at the same person.
- Static description: One figure stands in the centre. On the left, a thermometer labelled "yesterday". On the right, a ladder labelled "your life". The two readings do not match.
- Optional detail: Source panel gives the full PNAS citation, the survey name, the sample, and the two measures. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: all of it is printed in the full reading view.
- Transition: TJ answers the question for himself.
- Provenance: `R02`, verified in full from the author copy. TJ's use of this source is his own (Brainstorm 73).
- Status: drafted

#### `s011` — TJ's working definition
- Beat purpose: enough security to breathe, people he can be himself with, some say over his life, time for what he cares about. Room to live rather than only surviving.
- Cast: `tj` (`joy`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 67, 75) — `joy`
    > Working definition ko: enough security to breathe, people I can be myself with, some say over my life, and time for things I care about. Hindi perfect life. More like may room to live, hindi puro pag-survive.
  - `tj` — member-endorsed (Brainstorm 67) — `reflection`
    > Ang gusto ko, a life na gusto kong balikan. May stressful, boring, disappointing days pa rin. Pero may people and possibilities that make the day feel worth living.
- Sources/concepts: —
- Visual purpose: a small cleared space around a figure, not a perfect life.
- Static description: TJ stands in a small clearing. The clutter around him has not been removed; it has just been pushed back far enough that he can turn around.
- Optional detail: none.
- Transition: Vier objects to the whole exercise of defining it.
- Provenance: Brainstorm 67 and 75, TJ's own wording.
- Status: drafted

#### `s012` — Vier: the words we reach for first
- Beat purpose: Vier's difficulty defining happiness, and his unpacking of contentment, no regrets, and meaning — each of which imposes its own cost.
- Cast: `vier` (`frustration`, `reflection`)
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 279–285) — `frustration`
    > To be honest, defining happiness in one sentence is something I have a hard time with. People say contentment. Or having no regrets. Or in general, stuff that makes life meaningful.
  - `vier` — member-endorsed (Brainstorm 289–293) — `reflection`
    > Unpack those, though. Contentment feels too passive — parang nawawala yung ambition once you get there. No regrets feels unforgiving for a human being who is going to make mistakes, and the past is not changeable anyway. And meaning — so happiness gets quantified through some kind of metric again?
- Sources/concepts: —
- Visual purpose: three offered words, each one cracking when leaned on.
- Static description: Three word-shaped blocks on the ground, labelled contentment, no regrets, meaning. Vier steps on each in turn and each one splits under his weight.
- Optional detail: none.
- Transition: having rejected the three words, Vier offers a different shape of answer.
- Provenance: Brainstorm 279–293, Vier's own argument in his own order. Vier's material begins at the unheaded line 277 and is his, not a continuation of TJ's section.
- Status: drafted

#### `s013` — Vier: a relationship with life
- Beat purpose: happiness as a relationship with life rather than a condition to reach; dissatisfaction and regret can coexist with it; agency is the thread.
- Cast: `vier` (`reflection`)
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 295–301) — `reflection`
    > So maybe happiness is less of a condition and more like having some kind of relationship with life. We can be dissatisfied with something and still be happy. Have regrets and still be happy. Be having a hard time and still feel like it is a fight worth fighting.
  - `vier` — member-endorsed (Brainstorm 303–307) — `reflection`
    > Which makes me think my definition is tangled up with agency. As long as there is something I can do, change, or respond to. Ang thought process ko: as long as pakiramdam ko ako yung sumusulat ng sarili kong buhay, mas kaunti yung pakiramdam na pabigat lang, and I guess that is part of what makes a life worth living.
- Sources/concepts: agency
- Visual purpose: a figure writing the line he is standing on.
- Static description: Vier stands on a line that continues to the right. He is holding a pen and drawing the next part of it himself. The line behind him is already drawn and is not straight.
- Optional detail: none.
- Transition: the narrator sets the three definitions beside each other.
- Provenance: Brainstorm 295–307, Vier's own wording and Taglish retained.
- Status: drafted

#### `s014` — Three definitions that do not merge
- Beat purpose: hold the three side by side, name what they share and where they genuinely differ, and refuse to average them.
- Cast: `narrator` `tj` `koj` `vier` (`reflection`)
- Narrator:
  > Put them together and they overlap more than we expected. All three of us refuse to make happiness mean a constant good mood. All three of us put other people in it. All three of us put some kind of freedom in it.
  >
  > But they do not collapse into one. Koj's answer is about whether a life is going well. TJ's is about whether there is room inside a life. Vier's is about whether the person is participating in it at all. You can satisfy one and fail another, and that is the point — it is why we did not vote.
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 309) — `curiosity`
    > Medyo parallel sa definition ni TJ, just from another lens.
- Sources/concepts: —
- Visual purpose: three overlapping shapes with a real uncovered area in each.
- Static description: Three circles overlap in the centre. Each circle still has a large part of itself outside the overlap, and those parts are drawn just as solidly as the shared middle.
- Optional detail: none.
- Transition: Vier turns his own objection back on all three answers.
- Provenance: Overlap and difference read off the three note sets (Brainstorm 15–61, 65–275, 277–393). Vier's line from Brainstorm 309. Refusal to merge from `docs/brief.md`, "Working argument".
- Status: drafted

#### `s015` — Our definitions are metrics too
- Beat purpose: first inward turn. Vier's objection to "meaning" as a metric applies to our own answers; naming a definition already decides what counts.
- Cast: `narrator` `vier` (`curiosity`)
- Narrator:
  > One more thing before we move. Vier's complaint about "meaning" — that it turns happiness into something you score — applies to us.
  >
  > "Living well" is a standard. "Room to live" is a standard. "Writing your own life" is a standard. Each one quietly decides whose life is going badly. We are going to keep using them, because we need something to think with. We are telling you now that they are not neutral.
- Visible caveat:
  > If any definition in this essay makes your life sound like a failure, that is a problem with the definition, not with you. We will keep checking ours.
- Sources/concepts: standpoint
- Visual purpose: the measuring instrument from `s010` turned back on the three of us.
- Static description: The thermometer and ladder from the earlier scene are now pointed at TJ, Koj, and Vier. All three look uncomfortable.
- Optional detail: none.
- Transition: the chapter closes and the next one picks up the first panel of the Tuesday — the basketball.
- Provenance: Vier's metric objection, Brainstorm 293. The application to our own definitions is this essay's, and answers the assignment's instruction to interrogate assumptions (`docs/notes/2026-10-08-instructions.md`).
- Status: drafted

---

## `c2` — Must enjoyment become meaningful or productive?

Holds Koj's meaningful difficulty and TJ's defence of pleasure at their strongest. Ends in a
negotiation, not a winner.

#### `s016` — Bob, basketball, nothing to show for it
- Beat purpose: introduce Bob conversationally and let an ordinary enjoyable afternoon exist before it is evaluated.
- Cast: `bob` (`joy`)
- Narrator:
  > This is our friend Bob. Bob is made up.
  >
  > Bob played basketball this afternoon. He lost. He is sweaty, his legs hurt, and he has nothing to show anyone. He had a great time.
  >
  > Hold onto that afternoon. For the next few minutes, everyone is going to tell you what it was worth.
- Sources/concepts: —
- Visual purpose: Bob mid-game, tired and enjoying it; no scoreboard, no outcome.
- Static description: Bob is drawn mid-stumble with a ball bouncing away from him, face open and laughing. There is no scoreboard anywhere in the frame.
- Optional detail: none.
- Transition: TJ asks what the source of the enjoyment actually was.
- Provenance: Bob is a fictional illustration (`docs/cast.md`). The afternoon's elements come from TJ's notes on basketball and co-op games (Brainstorm 81–83).
- Status: drafted

#### `s017` — The activity or the company?
- Beat purpose: TJ's question about whether the source is the activity or the people; the same game feels different with people you are comfortable with. Pleasure is not the same as comfort.
- Cast: `tj` `bob` (`joy`, `frustration`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 81–83) — `curiosity`
    > Ang interesting sa akin: yung activity ba talaga yung source, or yung may kasama? Same game, ibang feeling kapag yung mga tao around you are people you are comfortable with.
  - `tj` — member-endorsed (Brainstorm 83) — `joy`
    > And basketball can be tiring. Co-op games can be chaotic or frustrating. So pleasure is not the same as comfort. May saya sa shared effort, sa trying again, sa kalokohan habang ginagawa.
- Sources/concepts: —
- Visual purpose: the same game drawn twice, with and without familiar figures.
- Static description: Two versions of the same court. In the first, Bob plays alone with faceless figures and looks neutral. In the second, the same play with familiar faces around him and his expression is open.
- Optional detail: none.
- Transition: Koj raises the comparison that started the disagreement.
- Provenance: Brainstorm 81–83, TJ's own wording and Taglish retained.
- Status: drafted

#### `s018` — Koj: Netflix and the difficult thing
- Beat purpose: Koj's comparison — a pleasurable day of watching against a stressful difficult effort — and his conclusion that he can feel more fulfilled by the second.
- Cast: `koj` (`fatigue`, `joy`)
- Dialogue:
  - `koj` — member-endorsed (Brainstorm 51–59) — `reflection`
    > Some of my happiest moments are not the most fun. Watching Netflix all day might be pleasurable. Studying for something difficult might be stressful. But I could still feel more fulfilled by the second, because I am working toward something meaningful.
  - `koj` — member-endorsed (Brainstorm 61) — `curiosity`
    > Which makes me question the assumption that the happiest life is the easiest or most pleasurable one.
- Sources/concepts: —
- Visual purpose: two evenings side by side with different weights.
- Static description: Two panels. In the first, Koj is comfortable on a couch, face flat. In the second, Koj is hunched and frowning over work — and the second panel sits slightly lower on the page, as if it weighs more.
- Optional detail: none.
- Transition: TJ pushes back immediately.
- Provenance: Brainstorm 51–61, Koj's own example and wording.
- Status: drafted

#### `s019` — TJ: bakit kailangan may lesson?
- Beat purpose: TJ's counter — laughing with friends needs no output, and demanding a lesson from every pleasure is itself a position worth examining.
- Cast: `tj` (`joy`), `koj` (`curiosity`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 69) — `joy`
    > Agree ako na living well is bigger than feeling good. Pero gusto ko ring ipagtanggol yung pleasure na walang grand achievement sa dulo. Masaya lang tumawa with friends. Bakit kailangan may lesson or output pa?
  - `tj` — member-endorsed (Brainstorm 85) — `reflection`
    > For me a good hangout doesn't need to become a core memory agad. Pwedeng ordinary lang. Happiness can live in things we repeat, hindi lang sa milestones.
- Narrator:
  > So: same afternoon, two readings. Now watch three traditions walk in and read it a third, fourth, and fifth way.
- Sources/concepts: —
- Visual purpose: an afternoon with nothing attached to it.
- Static description: Bob's afternoon from `s016` is drawn again, this time with an empty speech bubble above it where a lesson would go. The bubble stays empty.
- Optional detail: none.
- Transition: the narrator brings in Bentham.
- Provenance: Brainstorm 69 and 85, TJ's own wording and Taglish retained. The named Koj–TJ tension is flagged in TJ's own notes (Brainstorm 273).
- Status: drafted

#### `s020` — Bentham's question
- Beat purpose: explain the hedonic calculus accurately as one way of evaluating the same afternoon.
- Cast: `narrator` (`curiosity`)
- Narrator:
  > Bentham opens with: "Nature has placed mankind under the governance of two sovereign masters, pain and pleasure." So evaluate the afternoon by what it produced.
  >
  > He is specific about how. Measure a pleasure by its intensity, its duration, its certainty or uncertainty, its propinquity or remoteness — how near it is. Then, for an act, its fecundity, "the chance it has of being followed by sensations of the same kind", and its purity, the chance of not being followed by the opposite. And then one more: "Its extent; that is, the number of persons to whom it extends."
  >
  > Bob's afternoon scores well on intensity and badly on duration. Nobody asked whether it was meaningful. On this view, nobody has to.
- Sources/concepts: `R05`; utilitarianism
- Visual purpose: the afternoon weighed on a simple balance.
- Static description: Bob's afternoon sits in one pan of a two-pan balance. Small weights labelled with the seven dimensions are being added. The pan moves.
- Optional detail: Source panel gives the chapter locations — Chapter I for the opening sentence, Chapter IV for the seven circumstances — so the passage can be found in any edition. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: the narrator raises the obvious objection and lets Mill answer it.
- Provenance: `R05`, verified in full at an alternate host after the register's link refused access; Chapter I opening and Chapter IV circumstances.
- Status: drafted

#### `s021` — Mill's answer, and its problem
- Beat purpose: explain higher and lower pleasures and the competent-judges move accurately.
- Cast: `narrator` (`curiosity`)
- Narrator:
  > Mill thought that was too flat. In Chapter II of Utilitarianism he keeps the principle — "actions are right in proportion as they tend to promote happiness" — but adds that "some kinds of pleasure are more desirable and more valuable than others". Hence the famous line: "It is better to be a human being dissatisfied than a pig satisfied."
  >
  > Then comes the hard part. Who decides which pleasures are higher? Mill's answer is to appeal to "the judgment of those who are qualified by knowledge of both" — the people who have tried each kind and can compare.
- Sources/concepts: `R06`; utilitarianism
- Visual purpose: the same balance with the pans at different heights before anything is placed on them.
- Static description: The two-pan balance returns, but one pan now hangs permanently higher than the other before anything is weighed. A figure stands beside it with a hand on the higher pan.
- Optional detail: none.
- Transition: TJ takes the competent-judges move apart.
- Provenance: `R06`, verified in full; Chapter II.
- Status: drafted

#### `s022` — Who is doing the ranking?
- Beat purpose: question the lens. TJ's objection that class, education, taste, and approval sit inside the judgment that studying outranks gaming.
- Cast: `tj` (`frustration`), `vier` (`curiosity`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 101) — `frustration`
    > Pero sino ang may authority magsabi na mas mataas yung pleasure of studying kaysa gaming? May class, education, and taste sa judgment na yan. Gaming can involve friendship and imagination. Studying can also be done purely for approval.
- Narrator:
  > That is not a refutation of Mill. It is a question about who gets counted as acquainted with both. The people asked to rank pleasures have usually had the time and money to sample the expensive ones.
- Visible caveat:
  > We are students arguing that studying is overrated. That is worth noticing about us too.
- Sources/concepts: `R06`; utilitarianism; standpoint
- Visual purpose: the judge stepping into frame beside the balance.
- Static description: The tilted balance from the previous scene, with a figure now standing clearly beside it, hand still on the pan. The figure is drawn the same size as the balance, not smaller.
- Optional detail: none.
- Transition: the third tradition gets its turn.
- Provenance: Brainstorm 101, TJ's own objection and Taglish retained. The point about who gets counted as a competent judge is this essay's extension of it. The self-implicating caveat answers the assignment's instruction to interrogate biases.
- Status: drafted

#### `s023` — What kind of person is being made
- Beat purpose: Aristotle's question returns as a third reading of the afternoon, and is also tested against the other two.
- Cast: `narrator` `koj` (`reflection`)
- Narrator:
  > Aristotle asks a third thing about the same afternoon: not what it produced and not how good the pleasure was, but what kind of life and what kind of person these activities are building.
  >
  > Which sounds deeper, until you remember the swallow. One afternoon does not make a person. So Aristotle cannot tell you whether Bob's Tuesday was worth it either. He can only tell you to look at more Tuesdays.
- Sources/concepts: `R01`; eudaimonia
- Visual purpose: the afternoon as one segment of the long life-line from `s007`.
- Static description: The long life-line returns with Bob's afternoon marked as one short segment. A magnifying glass over the segment shows nothing conclusive.
- Optional detail: none.
- Transition: the narrator introduces a fourth vocabulary, this one from psychology.
- Provenance: `R01`, verified in full — Book I ch. 7, the swallow passage used to limit the lens rather than only to state it.
- Status: drafted

#### `s024` — Three names for what a hobby gives
- Beat purpose: autonomy, competence, and relatedness explained as a lens on the same activities, then limited — three needs do not exhaust happiness, and no member reached this theory independently.
- Cast: `narrator` `tj` (`curiosity`)
- Narrator:
  > Deci and Ryan's self-determination theory gives three names to what Bob's afternoon might be supplying. It argues that understanding motivation "requires a consideration of innate psychological needs for competence, autonomy, and relatedness", and treats those needs as specifying "the necessary conditions for psychological growth, integrity, and well-being".
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 89) — `curiosity`
    > May say ako sa ginagawa ko. May progress or skill. May connection. A hobby can have all three, kahit walang grade or money involved.
- Visible caveat:
  > This is a theory about motivation, published in 2000 as a target article, not a measurement of happiness. Three needs are its proposal, not a complete account of a good life — and none of us arrived at it on our own. It gave names to something TJ had already described.
- Sources/concepts: `R03`; autonomy/competence/relatedness
- Visual purpose: three threads running through one ordinary activity.
- Static description: Bob's afternoon again, with three coloured threads running through it and out the other side, each one tagged with a word.
- Optional detail: none.
- Transition: TJ returns to the disagreement with Koj with a sharper version of it.
- Provenance: `R03`, verified in full — abstract, Psychological Inquiry 11(4), p. 227. TJ's line from Brainstorm 89. The caveat about redistribution follows `docs/decisions.md`, "Research ownership".
- Status: drafted

#### `s025` — Chosen difficulty is not endured hardship
- Beat purpose: TJ's hesitation about Koj's position — difficulty alone does not make something good, and a chosen challenge differs from hardship no one can refuse.
- Cast: `tj` (`reflection`), `koj` (`curiosity`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 103) — `reflection`
    > Gets ko yung fulfillment from doing something hard, like Koj's take. Ang hesitation ko lang: difficulty alone doesn't make something good. Chosen challenge is different from being forced to endure hardship.
- Narrator:
  > That distinction does a lot of work later. A hard climb you picked and a hard climb you cannot get out of look similar from the outside. They are not the same thing to the person doing the climbing.
- Sources/concepts: —
- Visual purpose: two uphill climbs, one entered and one imposed.
- Static description: Two identical slopes. On the first, a figure walks up with a gate open behind them. On the second, an identical figure walks up and the gate behind them is shut.
- Optional detail: none.
- Transition: TJ turns the same suspicion on rest.
- Provenance: Brainstorm 103, TJ's own wording. The forward link to chapter 5 is this essay's structure.
- Status: drafted

#### `s026` — Rest that does not have to earn its place
- Beat purpose: if rest is defended only as recharging for tomorrow's work, work is still deciding what the day is for. Hobby becomes side hustle, exercise becomes a score, gala becomes content.
- Cast: `tj` (`fatigue`, `reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 105) — `reflection`
    > Rest doesn't have to earn its place by making me productive tomorrow. Kapag "recharge so you can work harder" lang yung defense of rest, work pa rin yung nagdedecide what the day is for.
  - `tj` — member-endorsed (Brainstorm 107) — `frustration`
    > Ang weird din ng turning everything into self-improvement. Hobby becomes side hustle, exercise becomes a score, gala becomes content. Pwede bang may ginagawa akong gusto ko simply because gusto ko?
- Sources/concepts: optimisation
- Visual purpose: a resting figure with a productivity frame drawn around it, then removed.
- Static description: A figure lies down. A rectangular frame labelled "so that tomorrow…" is drawn around them. In the second half of the image the frame is gone and the figure is unchanged.
- Optional detail: none.
- Transition: the narrator brings in a writer who reached the same question from the work side.
- Provenance: Brainstorm 105 and 107, TJ's own wording and Taglish retained.
- Status: drafted

#### `s027` — When work becomes the whole frame
- Beat purpose: bring in an outside reflection on work filling a life, marked as a personal essay rather than evidence, and note the material limit of "just work less".
- Cast: `narrator` `tj` (`frustration`)
- Narrator:
  > A time-management coach, Alexis Haselberger, wrote about a woman whose life emptied out when her job ended: "Work, as it turned out, was all she had." Her diagnosis is cultural — "we live in a culture that asks us to put productivity above humanity, output above joy, and speed above rest."
- Visible caveat:
  > That is one person's essay on the internet, not a study. It tells us the worry is being said out loud. It cannot tell us how common it is, and nothing in this essay rests on it alone.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 109) — `frustration`
    > Pero may limit din ang "just work less". Choosing fewer hours is a very different thing kapag may savings ka versus kapag may bills and dependents.
- Sources/concepts: `R07`; gray literature boundary
- Visual purpose: a day with one block expanding until it touches every edge.
- Static description: A day drawn as a row of blocks. One block labelled "work" grows across three panels until it reaches both edges and the other blocks are gone.
- Optional detail: none.
- Transition: the narrator corrects a diagram the reader has probably seen.
- Provenance: `R07`, verified in full; post dated 14 July 2026. TJ's limit from Brainstorm 109. The gray-literature boundary is required by the assignment instructions and `docs/research.md`.
- Status: drafted

#### `s028` — Needs shape attention
- Beat purpose: explain the needs argument from the paper itself, including partial satisfaction and exceptions, against the rigid staircase picture.
- Cast: `narrator` `koj` (`curiosity`)
- Narrator:
  > You have seen the pyramid: food and shelter at the bottom, self-actualisation at the top, one floor at a time. The idea that needs shape what you can pay attention to is genuinely useful.
  >
  > The pyramid is not in Maslow's paper. What is in it, in his own words, is that the hierarchy "is not nearly as rigid as we may have implied", that most people are "partially satisfied in all their basic needs and partially unsatisfied in all their basic needs" at the same time, and that a new need "is not a sudden, saltatory phenomenon but rather a gradual emergence by slow degrees from nothingness".
  >
  > So the paper does not say that friendship and meaning are locked until survival is solved. The diagram says that. The diagram came later.
- Sources/concepts: `R08`; needs; classroom shorthand
- Visual purpose: the familiar pyramid drawn, then redrawn as overlapping partial fills.
- Static description: A clean five-tier pyramid is drawn, then crossed out. Beside it, five bars each partly filled to different levels, all at once.
- Optional detail: Source panel gives the 1943 citation, the section headings quoted, and notes that Maslow's own satisfaction percentages are stated by him as arbitrary illustration. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: the chapter closes without declaring a winner.
- Provenance: `R08`, verified in full — Section III. The identification of the pyramid as later shorthand follows the register's instruction to separate original work from classroom simplification.
- Status: drafted

#### `s029` — No winning activity
- Beat purpose: close the chapter on negotiation among pleasure, meaning, growth, and rest, with the Koj/TJ disagreement intact rather than resolved.
- Cast: `narrator` `tj` `koj` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 113) — `reflection`
    > So may room for pleasure, meaning, growth, and rest. Ayokong piliin yung isa tapos i-dismiss yung iba. Baka ang good life is negotiating among them, depending on what's happening.
- Narrator:
  > Koj still thinks the difficult thing gives him something the easy thing does not. TJ still thinks the easy thing does not owe anyone an explanation. Neither of them moved, and we are not going to pretend otherwise.
  >
  > What they agree on is smaller and more useful: whichever one you are after, you need to be in a position to reach for it. That is the next three chapters.
- Sources/concepts: —
- Visual purpose: four elements held in one frame without ranking.
- Static description: Four small drawings — laughter, a hard climb, a rising line, a figure lying down — arranged in a ring rather than a column. No arrows, no order.
- Optional detail: none.
- Transition: Vier opens the next chapter by asking where the ranking came from in the first place.
- Provenance: Brainstorm 113, TJ's own wording. The preserved disagreement is required by `docs/brief.md`, "Working argument".
- Status: drafted

---

## `c3` — Whose definition are we following?

Vier's chapter, joined by TJ's ambivalence about consumption, comparison, and online life. Ends by
asking what we want to keep rather than how to escape.

#### `s030` — We were not born knowing
- Beat purpose: Vier's observation that children play and are curious without justifying it, and that the staged idea of success-then-happiness arrives later.
- Cast: `vier` (`reflection`), `bob` (`joy`)
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 313–319) — `reflection`
    > I doubt we are born knowing what happiness is supposed to look like. Kahit noong bata tayo, wala tayong abstract idea na kailangan mag-succeed muna bago maging masaya. We just played all day, curious at small things. Masaya tayo noon without needing to justify why we were doing any of it.
  - `vier` — member-endorsed (Brainstorm 321–325) — `curiosity`
    > Pero as we grow older, dito natin mas na-conceptualise, nasusukat, at hinahabol yung happiness. We get a general idea of what a good life looks like. Society plays a vital part in putting those ideas into us.
- Sources/concepts: socially produced expectations
- Visual purpose: a small figure playing, with no frame around the play.
- Static description: A small figure plays with something on the ground. In the next panel the same figure is taller and a frame has appeared around them, with labels on the frame they are not looking at.
- Optional detail: none.
- Transition: Vier names the templates.
- Provenance: Brainstorm 313–325, Vier's own argument and Taglish retained.
- Status: drafted

#### `s031` — The templates
- Beat purpose: the common markers Vier names — grades, a good school and university, a relationship, financial capacity — presented as supplied rather than chosen.
- Cast: `vier` (`curiosity`)
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 327–333) — `curiosity`
    > Yung happiness na hinahabol natin is not purely our own idea of happiness. Society is handing out templates. Common examples: good grades, good school and university, a relationship, financial capacity.
- Narrator:
  > Read that list again and notice that most of it is checkable by someone else. That is part of what makes a template a template.
- Sources/concepts: socially produced expectations
- Visual purpose: identical outline figures handed identical shapes to carry.
- Static description: A row of identical blank figures. A hand from outside the frame gives each one the same four shapes to hold. Every figure is holding the same four.
- Optional detail: none.
- Transition: Vier qualifies his own claim before anyone can accuse him of dismissing the list.
- Provenance: Brainstorm 327–333, Vier's own list. The observation about external checkability is this essay's.
- Status: drafted

#### `s032` — Nothing wrong with the path; something wrong with "only"
- Beat purpose: Vier's qualification — following these standards is not a mistake; presenting them as the one correct way is what makes deviation feel like living wrongly.
- Cast: `vier` (`frustration`)
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 335–343) — `frustration`
    > Wala namang mali na sinusunod natin yung mga standards na to. However, it becomes harmful if it is presented as the only correct way. Pag deviate ka sa kahit alin sa mga path na yan, pakiramdam mo mali yung buhay na binubuhay mo. Kaya siguro naghahanap tayo ng karamay — to validate na tama yung ginagawa natin.
- Sources/concepts: socially produced expectations
- Visual purpose: several paths, with all but one erased.
- Static description: Five paths leave one point. Four fade out until only one remains drawn. A figure stands at the start, facing the one that is left.
- Optional detail: none.
- Transition: Vier states the strongest version of his claim.
- Provenance: Brainstorm 335–343, Vier's own wording and Taglish retained.
- Status: drafted

#### `s033` — Vier: happiness as ideology
- Beat purpose: Vier's strongest claim, attributed to Vier — society tells us what to desire, we internalise it and regulate ourselves, and the choosing can feel free while the definition was constructed.
- Cast: `vier` (`reflection`)
- Narrator:
  > This next part is Vier's own argument. He is not quoting anyone, and we are not going to attach a theorist's name to it to make it sound heavier.
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 345–363) — `reflection`
    > Happiness is an ideology. Society tells us what to desire. It tells us the things that should make us fulfilled. We internalise those expectations and then regulate ourselves. We stop chasing some things because in our heads we already decided they are not worth it, or that wanting them means failing. It can look like we are freely choosing happiness — but the definition is something that was constructed over a long time.
  - `vier` — member-endorsed (Brainstorm 347–351) — `frustration`
    > Instead of pursuing what we want, we pursue what we need in order to be happy. The question shifts, and it assumes someone else already figured out what happiness should consist of.
- Sources/concepts: ideology; agency
- Visual purpose: a figure holding its own leash.
- Static description: A figure stands upright holding a leash. The other end of the leash is attached to its own collar. Nobody else is in the frame.
- Optional detail: none.
- Transition: the narrator connects this to a class phrase, carefully.
- Provenance: Brainstorm 345–363, Vier's own argument. The attribution warning is required by `docs/research.md`, "Class concepts and attribution".
- Status: drafted

#### `s034` — Desires have a history
- Beat purpose: the class link to social upbringing and habitus as it actually appears in the notes, kept separate from Vier's own argument, with the attribution limit stated.
- Cast: `narrator` (`curiosity`)
- Narrator:
  > There is a phrase from class that sits next to this: social upbringing, habitus. The idea is that even wants have a history — some goals feel natural because they were valued by the people and places around you. That does not make the want fake. It makes it worth asking where it came from.
- Visible caveat:
  > We are repeating a phrase from class notes. We have not read the original formulation it comes from, so we are not going to quote anyone or claim this is what that theory says. And it is not Vier's argument — his is in the scene before this one, and it is his own.
- Sources/concepts: social upbringing/habitus; classroom shorthand
- Visual purpose: a desire drawn with a visible trail behind it.
- Static description: A want is drawn as a small shape above a figure's head. Behind it, a faint trail runs back off the edge of the frame through other figures.
- Optional detail: none.
- Transition: TJ puts himself in the frame.
- Provenance: Class link recorded at Brainstorm 197. No source exists for it in the pool and none was invented; see `docs/research.md`, "Claims we narrowed or dropped after the audit".
- Status: drafted

#### `s035` — I am not above consumer happiness
- Beat purpose: TJ's self-implicating turn — he likes devices and buying things, and the useful question is what a purchase gives him: convenience, a hobby, status, connection, or short novelty.
- Cast: `tj` (`curiosity`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 91) — `curiosity`
    > I like tech devices and buying stuff, so ayokong magkunwaring above consumer happiness ako. Ang tanong ko na lang: anong binibigay sa akin ng bagay? Convenience? A hobby? Status? A way to connect? Or novelty na mabilis lang mawala?
- Sources/concepts: consumption; standpoint
- Visual purpose: one object with four different arrows leaving it.
- Static description: A single boxed object in the centre. Four arrows leave it in four directions, each ending at a small drawing: a cleared desk, a hobby, other people looking, and a shrug.
- Optional detail: none.
- Transition: the narrator brings in the research TJ used on this.
- Provenance: Brainstorm 91, TJ's own wording and Taglish retained.
- Status: drafted

#### `s036` — The divide that does not hold
- Beat purpose: the experiential-versus-material research explained, then qualified by the group — a laptop can open a whole hobby, a trip can arrive with debt.
- Cast: `narrator` `tj` (`reflection`)
- Narrator:
  > There is a well-known study on this. Van Boven and Gilovich asked whether experiences make people happier than things. Across two surveys, respondents said experiential purchases — the ones made mainly to have a life experience — made them happier than material ones, and in a follow-up experiment people felt better after thinking about an experiential purchase than a material one.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 93–95) — `reflection`
    > Useful yan sa gala-versus-gadget question. Pero hindi automatic na travel good, object bad. A laptop can enable a whole hobby. An expensive trip can come with debt and stress. Baka hindi object versus experience yung pinaka-interesting divide — baka things that open a life I value versus things I buy because I'm trying to keep up.
- Visible caveat:
  > We read the abstract of that study, not the full paper. It tells us what people reported about purchases they classified themselves. It does not tell us that objects are shallow.
- Sources/concepts: `R04`; consumption
- Visual purpose: two columns with items visibly crossing between them.
- Static description: Two labelled columns, experiences and things. Several items sit on the line between them, and one item has been drawn in both columns at once.
- Optional detail: none.
- Transition: the same question moves onto a screen.
- Provenance: `R04`, verified at abstract level only. TJ's qualification from Brainstorm 93–95, his own wording.
- Status: drafted

#### `s037` — Connection and comparison on the same screen
- Beat purpose: refuse the automatic verdict. A screen is where friends talk and communities form; the same screen keeps other people's milestones permanently visible.
- Cast: `tj` (`joy`, `frustration`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 185) — `joy`
    > Ayokong yung default answer ay social media bad. A screen can be where friends talk, where communities form, where someone learns that something is even possible. Co-op games and online friendships count as social life too.
  - `tj` — member-endorsed (Brainstorm 187) — `frustration`
    > Pero yung milestones, laging nakikita. Somebody else's career, relationship, savings, travel. Tapos yung "ano ba gusto ko?" quietly becomes "ano na dapat yung na-achieve ko by now?"
- Sources/concepts: online life
- Visual purpose: one screen, two things happening on it.
- Static description: A single rectangle. On its left half, two figures are talking and both look engaged. On its right half, a column of other people's achievements scrolls past a figure whose shoulders have dropped.
- Optional detail: none.
- Transition: the narrator checks both halves against the research.
- Provenance: Brainstorm 185–187, TJ's own wording and Taglish retained.
- Status: drafted

#### `s038` — What the research actually found
- Beat purpose: the review and the large-dataset association, with effect size, population, and the absence of a clean active/passive rule all visible. Dino appears as a reminder that comfort does not settle the question.
- Cast: `narrator` `dino` (`reflection`)
- Narrator:
  > Two findings, stated at their actual size.
  >
  > Verduyn and colleagues reviewed the literature and reported negative relationships between passive use and well-being and positive relationships between active use — with the passive relationship "being more robust than the latter". The proposed mechanisms are comparison and envy on one side, social capital and connectedness on the other.
  >
  > Orben and Przybylski went at three large datasets, 355,358 people in total, and found the association between adolescent technology use and well-being "negative but small, explaining at most 0.4% of the variation in well-being".
  >
  > And here is Dino, who is made up. Dino's circumstances are comfortable. Dino is not happy. No average is going to explain him either.
- Visible caveat:
  > We read abstracts for both of these, not the full papers. "Active good, passive bad" is cleaner than how anyone actually uses a phone, and a tiny average effect across hundreds of thousands of people says almost nothing about whether a particular screen is good for a particular person.
- Sources/concepts: `R23`, `R24`; online life; measurement limits
- Visual purpose: a small effect drawn at its actual size next to the claim it is often used to make.
- Static description: A very large headline-shaped block sits on the left. Next to it, a bar representing 0.4 per cent is drawn to scale — a thin sliver. Dino stands beside both, unmoved.
- Optional detail: Source panel gives both citations with sample sizes, the dates, and the measures. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: the narrator turns from averages to one kind of pressure in particular.
- Provenance: `R23` and `R24`, both verified at abstract level. Dino is a fictional illustration (`docs/cast.md`), introduced to block the inference that comfortable circumstances settle the question — a requirement from `docs/brief.md`, "Working argument".
- Status: drafted

#### `s039` — A shared timeline, unequal circumstances
- Beat purpose: an external account of feeling behind at thirty, used as a perspective and labelled as one, to raise the mismatch between a visible shared schedule and invisible different circumstances.
- Cast: `narrator` `tj` (`reflection`)
- Narrator:
  > TJ's notes point to a thread on r/adultingph started by someone turning thirty who was worried about their savings. What he wrote down afterwards was not any single reply.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 189) — `reflection`
    > Para sa akin, yung important na issue doon is that the timeline looks shared while the circumstances aren't.
- Visible caveat:
  > We could not open that thread while writing this. Everything above comes from TJ's own notes, not from our reading of what anyone in it actually wrote, and the observation we are keeping is his. Anonymous posts would be strangers' accounts in any case — not a sample of anyone's generation, and not proof of anything.
- Sources/concepts: `R22`; external accounts boundary
- Visual purpose: one timeline above several very different ground levels.
- Static description: A single horizontal timeline with age markers runs across the top. Below it, four figures stand on ground at four completely different heights, all reaching up toward the same markers.
- Optional detail: none.
- Transition: the narrator takes on the usual advice.
- Provenance: `R22`, `not-accessed` — Reddit is unreachable from the environment this was written in; see `docs/research.md`. TJ's observation from Brainstorm 189.
- Status: drafted

#### `s040` — "Don't compare" answers one half
- Beat purpose: emotional reassurance and material support answer different parts of the problem; the advice can ease pressure without changing insecurity.
- Cast: `tj` (`frustration`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 191) — `frustration`
    > "Don't compare" can ease one kind of pressure. Pero hindi niya binabago yung actual financial insecurity. Magkaibang parte ng problema yung sinasagot ng emotional reassurance at ng material support.
- Narrator:
  > Both halves are real. The trouble starts when the first one is offered as though it finished the job.
- Sources/concepts: —
- Visual purpose: a weight partly lifted, the rest still resting.
- Static description: A figure under a stack of weights. One weight has been lifted away and is floating above. The rest of the stack has not moved.
- Optional detail: none.
- Transition: the pressure gets more specific — the pressure to be fine.
- Provenance: Brainstorm 191, TJ's own wording and Taglish retained.
- Status: drafted

#### `s041` — When sadness starts to look like failure
- Beat purpose: the research on perceived expectations to avoid sadness, stated as the specific finding rather than a verdict on positivity in general.
- Cast: `narrator` `koj` (`sadness`), `tj` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 205) — `reflection`
    > Kapag happiness becomes something I have to display all the time, sadness starts to look like failure. Parang may problema na nga, may extra guilt pa, kasi hindi ko siya hina-handle nang positive enough.
- Narrator:
  > There is research behind that specific worry. Bastian and colleagues found across four studies that when people think others expect them not to feel negative emotions, "they experience more negative emotion and reduced well-being" — and that those perceived social expectations predicted the difference more consistently than people's own expectations of themselves.
- Visible caveat:
  > Abstract read, not the full paper. The finding is about perceiving that other people expect you not to be sad. It does not say that encouragement is harmful or that cheerful company makes anything worse. The samples were Australian and Japanese, and the effect showed up more clearly in the Australian ones — which is itself a reason not to carry the result here unchanged.
- Sources/concepts: `R25`; compulsory positivity
- Visual purpose: a sad figure with a second, external pressure arrow added.
- Static description: A figure sits with its head down. A first weight labelled with the original trouble rests on its back. A second, separate arrow presses down from outside the frame.
- Optional detail: none.
- Transition: the narrator separates two things that get collapsed together.
- Provenance: `R25`, verified at abstract level. TJ's framing from Brainstorm 205, redistributed to appear alongside Koj's expression state here; the position remains TJ's.
- Status: drafted

#### `s042` — Gratitude and anger in the same person
- Beat purpose: "others have it worse" can recall privilege and can also end the conversation; praise for coping without asking why coping is needed; joy among poor people is real and poverty is still unjust.
- Cast: `tj` (`joy`, `frustration`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 209–211) — `reflection`
    > "Others have it worse" can remind me of privilege. Pero pwede rin niyang tapusin yung conversation bago may makinig. Gratitude and wanting change can coexist. Same with resilience — coping is valuable, pero kapag puro papuri sa coping, walang nagtatanong kung bakit paulit-ulit na lang tayong kailangang mag-cope.
  - `tj` — member-endorsed (Brainstorm 213) — `frustration`
    > Joy among poor people is real. Poverty can still be unjust. Ayokong i-romanticise yung hardship, at ayoko ring i-imply na walang joy or meaning yung buhay ng mga taong nasa hirap.
- Narrator:
  > Hold both. Most of the rest of this essay depends on being able to.
- Sources/concepts: compulsory positivity
- Visual purpose: two expressions held by one figure at once.
- Static description: One figure drawn with its face split down the middle — one half open and grateful, the other half set and angry. It is one face, not two figures.
- Optional detail: none.
- Transition: the narrator closes off one escape route from the problem.
- Provenance: Brainstorm 209–213, TJ's own wording and Taglish retained.
- Status: drafted

#### `s043` — Adaptation is not a guarantee
- Beat purpose: the set-point review used to limit the claim that everyone returns to one fixed baseline, and therefore to limit "people get used to it".
- Cast: `narrator` (`curiosity`)
- Narrator:
  > There is a comforting idea that everyone drifts back to the same personal baseline, so circumstances do not really matter in the long run. Diener, Lucas and Scollon reviewed the evidence and proposed five revisions to it: set points are not neutral, people have different ones, a single person can have several that move in different directions, set points "can change under some conditions", and people differ in how much they adapt at all.
  >
  > So "they will get used to it" is not something anyone can promise on someone else's behalf.
- Visible caveat:
  > Abstract read, not the full paper. This revises adaptation rather than denying it — people do adapt to a great deal. It just is not guaranteed, and it is not uniform.
- Sources/concepts: `R26`; adaptation
- Visual purpose: several lines returning to different levels, some not returning.
- Static description: Five lines start together, dip sharply, and then recover. Three return to different heights than they started. One does not come back up.
- Optional detail: none.
- Transition: Vier closes the chapter.
- Provenance: `R26`, verified at abstract level. TJ's use of this source is his own (Brainstorm 215).
- Status: drafted

#### `s044` — Negotiate the definition rather than escape it
- Beat purpose: Vier's resolution — there is no society-free self to recover, so the goal is reflecting on the influences and deciding what to keep. Happiness becomes having enough freedom to negotiate the definition, which is already a social question.
- Cast: `vier` (`reflection`)
- Dialogue:
  - `vier` — member-endorsed (Brainstorm 365–373) — `reflection`
    > This makes me question whether freedom from society's definition is even possible. The things I want are still shaped by my family, culture, friends, media, and the opportunities available to me. So maybe the goal isn't to find some completely authentic definition that exists outside society. It is being able to reflect on these influences and decide what I actually want to keep.
  - `vier` — member-endorsed (Brainstorm 373–377) — `reflection`
    > Which makes it less about the correct definition and more about having enough freedom to negotiate one. Pero ibig sabihin niyan, partly social question din pala siya. Kung yung kakayahan ng tao na piliin yung buhay niya ay nakadepende sa pera, oras, healthcare, education, or working conditions — hindi lahat may kakayahang i-pursue yung sarili nilang version ng happiness.
- Narrator:
  > Which is the sentence that turns this essay. Vier starts from freedom and arrives at conditions. The next two chapters are about conditions.
- Sources/concepts: agency; ideology
- Visual purpose: a figure sorting inherited shapes into keep and set-down piles.
- Static description: Vier kneels over the four template shapes from `s031`. Two are in a pile beside him, two are still in his hands. None of them has been destroyed.
- Optional detail: none.
- Transition: the chapter closes on Vier's handover to conditions, and chapter 4 begins with the people in them.
- Provenance: Brainstorm 365–377, Vier's own argument and Taglish retained.
- Status: drafted

---

## `c4` — How do relationships help, and when does care become pressure?

Moves from the pleasure of company to the ordinary work of belonging, then to its limits.

#### `s045` — Someone to tell the small things to
- Beat purpose: TJ's point that he wants people with whom achievements, disappointments, and ordinary thoughts can be shared, and that connection does not need an occasion.
- Cast: `tj` (`joy`), `bob` (`joy`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 159) — `joy`
    > Hindi lang achievements yung gusto ko. Gusto ko may mga taong pwedeng pagsabihan ng achievements, disappointments, at ordinary thoughts. Hindi kailangan ng huge occasion para may value yung connection.
- Narrator:
  > The smallest unit of this is not a milestone. It is telling someone a thing that did not matter, and having them answer.
- Sources/concepts: —
- Visual purpose: an unremarkable exchange drawn at the same scale as a milestone.
- Static description: Two panels at identical size. In one, a figure receives a diploma. In the other, a figure says something trivial to a friend who is listening. Neither panel is larger.
- Optional detail: none.
- Transition: the narrator brings in where TJ first saw the question posed.
- Provenance: Brainstorm 159, TJ's own wording and Taglish retained.
- Status: drafted

#### `s046` — An outside account, kept outside
- Beat purpose: a public reflection about being single, used for the question it raises — who can receive the small things in a day — and explicitly not converted into anyone's biography or a requirement for partnership.
- Cast: `narrator` `tj` (`reflection`)
- Narrator:
  > TJ's notes point to a post on r/OffMyChestPH by someone writing about being single. He took one question out of it.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 161) — `reflection`
    > Yung relatable na tanong doon is not "must everyone have a partner?" It's "who can receive the small things in my day?" Friendship can answer that too.
- Visible caveat:
  > We could not open that post while writing this, so the question above is TJ's reading of it in his notes, not ours. One stranger's post would be one stranger's account anyway. It is not any of our histories, and it is not a finding about single people.
- Sources/concepts: `R14`; external accounts boundary
- Visual purpose: a quoted panel drawn with a visible border, outside the cast's space.
- Static description: An empty bordered panel sits to one side, clearly separated by its frame. The cast stands outside it. Nothing is drawn inside the panel.
- Optional detail: none.
- Transition: the narrator names the lens the group took from class.
- Provenance: `R14`, `not-accessed`; see `docs/research.md`. TJ's question from Brainstorm 161.
- Status: drafted

#### `s047` — Ethics in the ordinary
- Beat purpose: explain the ordinary-ethics lens — that everyday speech and action, not only dramatic moral decisions, are where ethics lives — at the level of support actually available for it.
- Cast: `narrator` `koj` `tj` (`curiosity`)
- Narrator:
  > A phrase from class: ordinary ethics. The lens says that ethics is not reserved for the one dramatic decision — it is already in how people speak to each other and what they do on an ordinary day. Lambek's edited volume is described by its publisher as making "the cumulative argument that ethics is profoundly 'ordinary,' pervasive". Das's book is described as developing "ordinary ethics as attentiveness to the other".
- Visible caveat:
  > Those are the publishers' descriptions. We could not get hold of either book, so we have not read a sentence of what Lambek or Das actually argues, and we are not going to put words in their mouths. What follows is our use of the idea, not their claim.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 165) — `curiosity`
    > What I like about this link: a good life can be partly built through repeated small acts. How we reply, or make room for someone, affects whether they feel they belong.
- Sources/concepts: `R15`, `R16`; ordinary ethics
- Visual purpose: small repeated gestures accumulating into something with shape.
- Static description: A column of very small marks — a reply, a remembered name, a kept promise — stacking upward until together they form a visible shape a figure is standing on.
- Optional detail: none.
- Transition: the narrator inverts the same mechanism.
- Provenance: `R15` and `R16`, both `verified-locator` — publisher descriptions only. Class link recorded at Brainstorm 163. TJ's line from Brainstorm 165.
- Status: drafted

#### `s048` — The same ordinariness can harm
- Beat purpose: a joke, repeated exclusion, a dismissed request. Intent matters and is not the whole explanation; context matters, and awkwardness alone is not violence.
- Cast: `tj` (`sadness`), `bob` (`frustration`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 167) — `sadness`
    > Same with harm. A joke. Repeated exclusion. Dismissing someone's time. Intent matters pero hindi siya ang buong explanation. Context matters too — awkwardness alone doesn't automatically mean violence.
- Narrator:
  > If small repeated acts can build belonging, small repeated acts can take it apart. The mechanism does not care which direction you point it.
- Sources/concepts: ordinary ethics
- Visual purpose: the same accumulation as `s047`, inverted.
- Static description: The stack from the previous scene, now being removed one mark at a time. The figure standing on it is lower in each panel.
- Optional detail: none.
- Transition: the narrator widens the circle of people who count.
- Provenance: Brainstorm 167, TJ's own wording and Taglish retained.
- Status: drafted

#### `s049` — The people who are not your closest
- Beat purpose: the weak-ties finding with its actual design and measure visible, used to widen the question past finding a best friend.
- Cast: `narrator` `bob` (`curiosity`)
- Narrator:
  > Sandstrom and Dunn looked at interactions with weak ties — acquaintances, the people around you who are not close friends or family. In their first study, "students experienced greater happiness and greater feelings of belonging on days when they interacted with more classmates than usual", and the pattern held when they broadened to all daily interactions.
  >
  > Which is a relief, because most people do not have a spare best friend available on a Tuesday.
- Visible caveat:
  > Abstract read, not the full paper. This is a day-to-day association, not evidence that adding acquaintances will make you happy. The first study used students, which is close enough to our own situation that we should be careful rather than confident.
- Sources/concepts: `R17`; weak ties
- Visual purpose: a map of familiar faces at varying distances.
- Static description: Bob at the centre of a loose scatter of figures at different distances. The nearest two are drawn in detail; the rest are simpler but still have faces.
- Optional detail: none.
- Transition: the narrator introduces a finding that is often misused here.
- Provenance: `R17`, verified at abstract level. TJ's use of this source is his own (Brainstorm 169).
- Status: drafted

#### `s050` — A different outcome, named as different
- Beat purpose: the mortality meta-analysis, explicitly identified as a health outcome rather than a happiness outcome, and the fact that "just socialise" skips whether welcoming spaces exist.
- Cast: `narrator` (`curiosity`)
- Narrator:
  > You will see this one quoted a lot. Holt-Lunstad, Smith and Layton pooled 148 studies covering 308,849 participants and found a 50% greater likelihood of survival for people with stronger social relationships — strongest for complex measures of social integration, weakest for simply living with other people rather than alone.
- Visible caveat:
  > Survival is not happiness. This is a mortality finding and we are not going to quietly swap it in for a well-being one. It is also observational, so it cannot show that adding relationships causes longer life. And it still skips the question we actually care about: whether people have somewhere welcoming to go.
- Sources/concepts: `R18`; measurement limits
- Visual purpose: two differently labelled measuring instruments, clearly not interchangeable.
- Static description: Two instruments side by side with completely different shapes, one labelled "how long" and one labelled "how it feels". A crossed-out arrow runs between them.
- Optional detail: Source panel gives the full citation, the number of studies and participants, the odds ratio with its confidence interval, and the fact that the outcome is mortality. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: the narrator moves to a report that does measure well-being.
- Provenance: `R18`, verified at abstract level. The outcome-substitution warning is required by `docs/research.md` and by TJ's own note (Brainstorm 171).
- Status: drafted

#### `s051` — How people live together
- Beat purpose: a specific chapter of the 2025 report on caring and sharing, used for what it examines about shared meals, households, and kindness rather than for country rankings.
- Cast: `narrator` (`reflection`)
- Narrator:
  > The World Happiness Report 2025 took caring and sharing as its theme. Its third chapter is about something almost embarrassingly ordinary: eating with other people. Using the Gallup World Poll across 142 countries, it reports that "sharing one more meal per week is associated with an average increase of roughly 0.2 points on a scale from 0 to 10", and that people who shared even one meal in the past week had higher life evaluations than people who ate every meal alone.
- Visible caveat:
  > The chapter says plainly that it does not know which way this runs: "it remains unclear whether sharing meals leads to greater wellbeing or whether greater wellbeing leads to more shared meals." Probably both, a bit. We are citing one chapter of this report, not its country rankings — a ranking would not answer our question.
- Sources/concepts: `R19`; caring and sharing
- Visual purpose: a shared table rather than a leaderboard.
- Static description: A table with several figures around it, mid-meal. In the corner, a numbered league table is drawn small and faded.
- Optional detail: Source panel gives the chapter authors, the surveys and years, the sample sizes, and the chapter's own two stated limitations. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: the narrator asks who arranged the meal.
- Provenance: `R19`, Chapter 3 verified in full. TJ's preference for the report's chapters over its rankings is his own (Brainstorm 173).
- Status: drafted

#### `s052` — Who does the remembering
- Beat purpose: friendship maintenance as actual effort — remembering, reaching out, keeping in touch — and the question of whether that work is shared.
- Cast: `tj` (`fatigue`)
- Narrator:
  > A blogger writing about her own year of friendship puts the work in plain terms: remembering birthdays — "I still remember them to this date" — showing up when she would rather not, and the fact that "adulthood makes it more challenging to actually schedule meet ups."
- Visible caveat:
  > One person's blog post. It shows that someone describes friendship as effort. It cannot tell us how that effort is distributed in general.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 175) — `fatigue`
    > Simple pero may effort. Sino ba usually yung nagre-reach out, and shared ba yung work of maintaining the relationship?
- Sources/concepts: `R20`; gray literature boundary; care labour
- Visual purpose: messages travelling mostly in one direction.
- Static description: Two figures with a line of small messages between them. Almost every message is moving from left to right. A few move back.
- Optional detail: none.
- Transition: the narrator introduces a lens from closer to home.
- Provenance: `R20`, verified in full at the specific post identified during the audit, replacing the register's original category-index locator. TJ's question from Brainstorm 175.
- Status: drafted

#### `s053` — Kapwa: starting from our own language
- Beat purpose: explain the Sikolohiyang Pilipino lens accurately, as a way of beginning from our own relationships rather than adding family as a variable to an individual account.
- Cast: `narrator` `vier` (`curiosity`)
- Narrator:
  > Sikolohiyang Pilipino — defined by Pe-Pua and Protacio-Marcelino as "the psychology born out of the experience, thought and orientation of Filipinos, based on the full use of the Filipino culture and language" — gives us a concept that does not translate cleanly: kapwa. Literally "the other person", but it "has no exact translation in European languages". It covers both the outsider and the one-of-us, and the levels between them. Sharing an inner self with your kapwa means treating them as deserving equal dignity. Pakikipagkapwa is the practice built on it.
  >
  > The useful part is where it starts. It does not begin with an individual and then add family as an extra variable. The other person is already inside the account of who you are.
- Visible caveat:
  > We could not get access to the Pe-Pua and Protacio-Marcelino article itself. Everything above comes from an open-access paper by Bautista and Aguilar that quotes it with page numbers, so we are relying on a work that quotes the original rather than on the original.
- Sources/concepts: `R21` (via `R31`); kapwa
- Visual purpose: the self drawn as overlapping with others rather than bounded.
- Static description: A figure whose outline is not closed. Where it would close, it runs into the outlines of two other figures, and the three share a continuous line.
- Optional detail: none.
- Transition: the narrator questions the lens it just introduced.
- Provenance: `R21` is `not-accessed`; `R31` verified in full and quotes it at pp. 49 and 56, with Enriquez (1984, p. 24) for the outsider/one-of-us range. TJ's use of this lens is his own (Brainstorm 177).
- Status: drafted

#### `s054` — Collective does not automatically mean supportive
- Beat purpose: question the lens. Family and community can carry expectation, conformity, and exclusion; boundaries can be part of living well; no single Filipino personality follows from the concept.
- Cast: `koj` (`frustration`), `vier` `tj` (`reflection`)
- Narrator:
  > Here is where the lens has to be handled carefully. The paper we read moves, within one paragraph, from kapwa as a concept to "Filipinos believe that everyone deserves a good quality of life." That slide — from a concept in a language to a claim about how millions of people behave — is exactly the move to avoid.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 179–181) — `reflection`
    > Pero collective doesn't automatically mean supportive. Family and community can carry expectations, conformity, or exclusion. Boundaries can be part of living well too. Can we value connection without prescribing one life arrangement?
- Visible caveat:
  > A concept from a language is not a personality test for everyone who speaks it. Treating kapwa as proof that Filipinos are naturally caring would flatten the people it came from.
- Sources/concepts: `R21` (via `R31`); kapwa; boundaries
- Visual purpose: the same overlap, with one figure pressed out of shape by it.
- Static description: The three overlapping figures from `s053` again. One of them is now compressed where the others overlap it, its outline bent inward.
- Optional detail: none.
- Transition: the narrator introduces someone the previous scene would get wrong.
- Provenance: `R31`, verified in full — the generalising sentence is in its own abstract. TJ's qualification from Brainstorm 179–181. The caution against one Filipino personality is required by `docs/research.md`.
- Status: drafted

#### `s055` — Ivy, who is not lonely
- Beat purpose: introduce Ivy to hold open solitude as a chosen good, so connection is valued without prescribing one life arrangement — no requirement to marry, have children, be extroverted, or stay near a harmful relationship.
- Cast: `ivy` (`joy`, `reflection`)
- Narrator:
  > This is Ivy. Ivy is made up too.
  >
  > Ivy spends most of her evenings alone and would like to keep it that way. She is not waiting for anyone, she is not recovering from anything, and nothing in this chapter is a diagnosis of her.
  >
  > Nobody has to marry, have children, be extroverted, or stay near a relationship that is hurting them in order to count as living well. A chapter about connection that cannot make room for Ivy is a chapter with a prescription hidden in it.
- Sources/concepts: boundaries
- Visual purpose: a figure alone and at ease, drawn with the same warmth as the group scenes.
- Static description: Ivy sits alone with her shoulders loose, drawn with the same open lines used for the group scenes. The space around her is empty and does not read as a gap.
- Optional detail: none.
- Transition: the narrator names what all of this costs.
- Provenance: Ivy is a fictional illustration (`docs/cast.md`). The refusal to prescribe one arrangement comes from TJ's own question (Brainstorm 181) and `docs/content-plan.md`, chapter 4.
- Status: drafted

#### `s056` — Care takes time that comes from somewhere
- Beat purpose: close the chapter by naming care as labour — listening, remembering, showing up — which leads directly into the conditions chapter.
- Cast: `narrator` `tj` (`reflection`)
- Narrator:
  > Everything in this chapter costs something. Listening takes attention. Remembering takes attention. Showing up takes fare, a free evening, and enough energy to be good company when you get there.
  >
  > Which means an argument about relationships turns into an argument about time and money faster than it looks like it should. So let us go there.
- Sources/concepts: care labour
- Visual purpose: the repeated gestures from `s047` with a visible cost attached to each.
- Static description: The stack of small marks from `s047` returns. Beside each mark, a small weight is now drawn. The stack is the same height; it is simply heavier.
- Optional detail: none.
- Transition: the chapter ends on cost, and chapter 5 opens with an invitation.
- Provenance: Care as labour from TJ's notes (Brainstorm 149) and `docs/content-plan.md`, chapter 4.
- Status: drafted

---

## `c5` — Who has room for happiness?

The assignment's third part. Reveals the conditions behind situations the reader has already
enjoyed, then examines our own position.

#### `s057` — Tara, gala
- Beat purpose: an ordinary invitation, stated as simply as it is usually stated.
- Cast: `bob` (`joy`), `tj` (`joy`)
- Narrator:
  > Bob sends a message. Tara, gala. Saturday.
  >
  > That is the whole scene. Four words and a day.
- Sources/concepts: —
- Visual purpose: a message with three friends attached to it.
- Static description: A short message in a bubble. Below it, three figures turning toward it. Nothing else is in the frame.
- Optional detail: none.
- Transition: the identical frame is redrawn with more in it.
- Provenance: TJ's "tara gala" example (Brainstorm 143). Bob is a fictional illustration.
- Status: drafted

#### `s058` — The invitation, seen again
- Beat purpose: the same invitation with fare, schedule, energy, and obligation now drawn in. Having friends is not the same as having time and energy to see them.
- Cast: `bob` `tj` (`fatigue`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 141–143) — `fatigue`
    > Having friends isn't the same as having time and energy to see them. Yung "tara gala" sounds simple until schedules, pamasahe, energy, and obligations enter. Hindi enough na available yung activity — kailangan available ka rin para ma-enjoy siya.
- Narrator:
  > Same four words. Same Saturday. Now look at what has to be true for anyone to say yes.
- Sources/concepts: time
- Visual purpose: the identical composition as `s057`, with previously invisible conditions made visible.
- Static description: The same message and the same three figures, redrawn exactly. Underneath each figure, previously invisible objects have appeared: a fare, a shift, a sleeping relative, a flat battery.
- Optional detail: none.
- Transition: the narrator follows one of those figures home.
- Provenance: Brainstorm 141–143, TJ's own wording and Taglish retained. The same-composition reveal is the method named in `docs/art-direction.md`, "Scenes that carry meaning".
- Status: drafted

#### `s059` — Nessa's free evening
- Beat purpose: introduce Nessa; a calendar evening marked free that already contains travel, chores, caregiving, and unfinished requirements.
- Cast: `nessa` (`fatigue`), `tj` (`reflection`)
- Narrator:
  > This is Nessa. Also made up.
  >
  > Nessa's Saturday evening is free. Here is what is inside free: two hours of travel, a load of laundry, the person she looks after, and the thing she did not finish on Thursday.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 141) — `reflection`
    > A free evening on the calendar can still contain travel, chores, caregiving, and unfinished requirements.
- Visible caveat:
  > Nessa is a drawing. She is here to make something visible, not to stand in for anyone's actual life — including ours.
- Sources/concepts: time; care labour
- Visual purpose: an empty calendar block filled in with what was always inside it.
- Static description: A calendar cell marked free. In the next panel the same cell is drawn larger and is full of small objects, none of which are optional.
- Optional detail: none.
- Transition: the narrator turns to the thing that moves most of these obstacles.
- Provenance: Nessa is a fictional illustration (`docs/cast.md`). The contents of the free evening come from TJ's note at Brainstorm 141.
- Status: drafted

#### `s060` — What money actually buys
- Beat purpose: TJ's correction to "money can't buy happiness" — food, housing, transport, a working device, an emergency buffer, the ability to refuse something harmful. Wanting more things and wanting to stop worrying are different wants.
- Cast: `tj` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 117) — `reflection`
    > Money can mean food, housing, transport, a working device, an emergency buffer, or the ability to say no to something harmful. Hindi lang luxury. May difference between "I want more stuff" and "I want to stop worrying about basic things."
  - `tj` — member-endorsed (Brainstorm 119) — `frustration`
    > Ang dali sabihin na appreciate the little things kapag secure yung big things. Appreciation can help, pero hindi niya mababayaran yung bill.
- Sources/concepts: money
- Visual purpose: money drawn as a set of specific removable worries.
- Static description: A figure with several small clouds overhead, each labelled with a specific worry. A coin removes one cloud. The rest stay.
- Optional detail: none.
- Transition: the narrator sets a classroom line against the research.
- Provenance: Brainstorm 117–119, TJ's own wording and Taglish retained.
- Status: drafted

#### `s061` — What we say in class, and what the research says
- Beat purpose: name the classroom shorthand, then state the actual finding with outcome, population, and year visible, and mark that the exact classroom wording is not independently available to us.
- Cast: `narrator` `tj` (`curiosity`)
- Narrator:
  > In class we remember the line that money does not raise the happiness baseline. The research is messier than that.
  >
  > Kahneman and Deaton found different income patterns for the two measures they had separated. Life evaluation kept rising steadily with log income. Everyday emotional well-being also rose — but in their data there was "no further progress beyond an annual income of ∼$75,000". They also found that low income "exacerbates the emotional pain associated with such misfortunes as divorce, ill health, and being alone".
- Visible caveat:
  > We are working from our own memory of a class discussion. We do not have the exact wording that was used, so we are not treating it as a finding — just as the shorthand we are checking.
- Sources/concepts: `R02`; money; classroom shorthand
- Visual purpose: a short statement beside a longer one that does not fit inside it.
- Static description: A single short sentence in a small box. Beside it, a much longer and more tangled statement that visibly overflows a box of the same size.
- Optional detail: none.
- Transition: the narrator continues the story of that finding.
- Provenance: `R02`, verified in full. Classroom shorthand recorded at Brainstorm 121; its unavailability is recorded in `docs/research.md`.
- Status: drafted

#### `s062` — The reanalysis
- Beat purpose: the later joint reanalysis, with the subgroup pattern stated precisely rather than as "money does or does not buy happiness".
- Cast: `narrator` (`curiosity`)
- Narrator:
  > Then it got more interesting. A later study by Killingsworth with Kahneman and Mellers was an adversarial collaboration: two researchers who had published contradictory answers went back to the data together.
  >
  > What they found was that the flattening was "confirmed only for the least happy people". Among happier people, happiness kept increasing steadily with log income, and in the happiest group it accelerated. They also concluded that the earlier paper had overstated the flattening, partly because its measures "could not discriminate among degrees of happiness because of a ceiling effect".
  >
  > So the honest sentence is not "money buys happiness" or "money stops working". It is that income relates differently to different parts of the distribution.
- Visible caveat:
  > Abstract read, not the full paper. Still US data, still people reporting on themselves.
- Sources/concepts: `R09`; money; measurement limits
- Visual purpose: one curve replaced by several that behave differently.
- Static description: A single flattening curve is drawn and then crossed out. In its place, three curves from the same origin: one flat, one steadily rising, one rising faster at the end.
- Optional detail: Source panel gives both PNAS citations, the years, and what an adversarial collaboration is. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: TJ blocks the conversion everyone wants to make.
- Provenance: `R09`, verified at abstract level. TJ's use of this source is his own (Brainstorm 121).
- Status: drafted

#### `s063` — No universal number, no peso conversion
- Beat purpose: refuse the conversion explicitly — different respondents, different measures, and the same salary does not mean the same available choices once debt, prices, and household responsibility are counted.
- Cast: `tj` (`frustration`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 123) — `frustration`
    > Hindi ito one universal salary kung saan humihinto yung happiness. US respondents, ibang measures, ibang patterns. Hindi pwedeng i-convert sa piso tapos ideklara na "ito na yung enough para sa bawat Pilipino."
  - `tj` — member-endorsed (Brainstorm 125) — `reflection`
    > An income association also doesn't tell us that the same pay increase changes everyone's life the same way. May debt, prices, household responsibilities, insecurity. Same salary is not the same available choices.
- Sources/concepts: `R02`, `R09`; money; measurement limits
- Visual purpose: a single figure on a price tag, crossed out.
- Static description: A large price tag with a single number on it, struck through. Beneath it, four figures holding the identical number, each standing in a visibly different situation.
- Optional detail: none.
- Transition: the narrator brings in the one study here that was run in the Philippines.
- Provenance: Brainstorm 123–125, TJ's own wording and Taglish retained.
- Status: drafted

#### `s064` — Koronadal: joy and deprivation in the same survey
- Beat purpose: the local study, identified as a local survey and not a national statement, held together with the refusal to use reported happiness as proof that poverty is acceptable.
- Cast: `narrator` `koj` (`reflection`), `tj` (`frustration`)
- Narrator:
  > One study here did run in the Philippines. In November 2019, Palanca-Tan surveyed 522 households across all 27 barangays of Koronadal City in Mindanao. Mean self-rated happiness came back at 6.75 out of 10 — comfortably above the midpoint — in a sample where average monthly household income was PHP 19,444 and more than a third of households — 35.44% — were below the provincial and regional poverty thresholds. In that sample, happiness rose with income up to roughly PHP 20,000 a month and then stopped rising.
- Visible caveat:
  > One city, 522 people, one month in 2019. That 35.44% is measured against the provincial and regional thresholds, not the national one, and the paper notes the sample's poverty incidence is much higher than the national 21.6% — so it is not a picture of the Philippines. The PHP 20,000 figure belongs to that sample — it is not a national price for happiness, and the highest income band in it holds only 30 people.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 129) — `frustration`
    > Ayokong gamitin yung happiness score as "see, okay lang maging mahirap." We can take someone's joy seriously and also take their lack of security seriously.
- Sources/concepts: `R10`; money; local sample limits
- Visual purpose: a smile and an unpaid bill in one frame, neither erasing the other.
- Static description: One figure, smiling honestly, holding an unpaid bill. Both are drawn at full weight; neither is faded out.
- Optional detail: Source panel gives the full citation, the survey month, the sampling method, the sample size, the happiness scale, and the income bands with their respondent counts. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: the narrator asks what "enough" was even supposed to mean.
- Provenance: `R10`, verified in full. TJ's refusal from Brainstorm 129, his own wording.
- Status: drafted

#### `s065` — Enough for whom?
- Beat purpose: an external discussion of how much is enough, used for the variety of baselines it shows — renting alone, supporting a household, health expenses, being supported — and labelled as external accounts.
- Cast: `narrator` `tj` (`curiosity`)
- Narrator:
  > TJ found the question put directly in an r/adultingph thread: how much money do we need to be happy?
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 133) — `curiosity`
    > Enough for whom? One person renting alone. Another helping a whole household. Someone with health expenses. Someone who is financially supported. "Contentment" can mean very different things under those conditions.
  - `tj` — member-endorsed (Brainstorm 135) — `reflection`
    > Take ko: money isn't the whole definition of happiness, pero lack of money can shrink the space where happiness is possible. Financial security can remove certain worries without supplying every relationship or sense of purpose.
- Visible caveat:
  > We could not open that thread while writing this, so we are not reporting what anyone in it said. The question is what we are keeping, and the four situations above are TJ's, not quotations.
- Sources/concepts: `R11`; external accounts boundary; money
- Visual purpose: the same question answered at four different heights.
- Static description: One question written across the top. Four figures beneath it, each with a bar of a different height rising to meet a line that is in a different place for each of them.
- Optional detail: none.
- Transition: the narrator turns from how much to what is done with it.
- Provenance: `R11`, `not-accessed`; see `docs/research.md`. TJ's framing from Brainstorm 133–135.
- Status: drafted

#### `s066` — Spending on others
- Beat purpose: the generosity finding with its design visible, and the distinction between allocatable generosity and being required to give until nothing is left.
- Cast: `narrator` `koj` (`joy`)
- Narrator:
  > What people do with money matters too. Dunn, Aknin and Norton found that spending more of your income on other people predicted greater happiness in a nationally representative survey and in a study of windfall spending — and, in an experiment, people randomly assigned to spend on others ended up happier than people assigned to spend on themselves.
- Visible caveat:
  > Abstract read, not the full paper. Every one of those designs studies money a person has to allocate. None of them is about remittances, obligation, or being expected to give until there is nothing left — which, for a lot of people here, is the actual shape of the question.
- Sources/concepts: `R12`; money; care labour
- Visual purpose: giving drawn from a full container and from a nearly empty one.
- Static description: Two panels. In the first, a hand pours from a full container into another and the first stays mostly full. In the second, the same pour empties the container completely.
- Optional detail: none.
- Transition: the narrator follows money into time.
- Provenance: `R12`, verified at abstract level. TJ's use of this source is his own (Brainstorm 137); the generosity-versus-depletion distinction is also his.
- Status: drafted

#### `s067` — Buying time, and whose time it was
- Beat purpose: the time-saving finding with design and outcome visible, immediately followed by affordability and by the person who performs the task instead.
- Cast: `narrator` `nessa` (`fatigue`), `tj` (`reflection`)
- Narrator:
  > Whillans and colleagues looked at buying time rather than things. Across samples from the United States, Canada, Denmark and the Netherlands totalling 6,271 people, those who spent money on time-saving services reported greater life satisfaction, and a field experiment found working adults happier after a time-saving purchase than after a material one.
  >
  > What money buys there is room in the day. Which is a real finding, and immediately raises two questions.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 147–149) — `reflection`
    > Pero buying time assumes extra money. Kung paid service lang ang sagot sa time pressure, yung mga hindi kayang bayaran, stuck pa rin. And who does the work that lets someone else rest? May care work, cleaning, organising, emotional labour. Kapag ibang tao ang may dala, hindi naman nawala yung workload — lumipat.
- Visible caveat:
  > Abstract read, not the full paper. All four countries in it are high-income, and none of them is this one.
- Sources/concepts: `R13`; time; care labour
- Visual purpose: an hour moving from one person's day into another's.
- Static description: Two rows of blocks representing two days. One block is lifted out of the upper row and set down into the lower one. Neither row has fewer blocks in total.
- Optional detail: none.
- Transition: the narrator introduces someone money would not have helped.
- Provenance: `R13`, verified at abstract level. TJ's qualifications from Brainstorm 147–149, his own wording and Taglish retained.
- Status: drafted

#### `s068` — Marco, and a service that exists on paper
- Beat purpose: introduce Marco; the capabilities distinction between a resource existing and being usable from where someone actually stands — hours that clash with work, a space that is unsafe or unreachable.
- Cast: `marco` `tj` (`frustration`)
- Narrator:
  > This is Marco. Made up, like the others.
  >
  > There is a service Marco is entitled to. It is open on weekdays until five. Marco works weekdays until six. The service exists. It has never once existed for him.
  >
  > The capability approach is the name for taking that seriously: it separates what a person is actually able to do and be from what is nominally available to them, because "resources and goods alone do not ensure that people are able to convert them into actual doings and beings." People differ in what they can turn a resource into.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 225) — `frustration`
    > May public space on paper pero unsafe or inaccessible for someone. May service pero nag-cclash yung oras niya sa trabaho. Availability isn't the same as actual access.
- Visible caveat:
  > This argument comes from Sen's Development as Freedom. We could not get the book, so we read a peer-reviewed encyclopedia entry on the capability approach instead and are telling you that rather than quoting Sen.
- Sources/concepts: `R30` (via `R32`); capabilities/real freedom
- Visual purpose: an open door with no route to it.
- Static description: An open, well-lit door stands at the back of the frame. Between it and Marco there is no path drawn — just blank ground with a fence line across it.
- Optional detail: none.
- Transition: the narrator names what that gap is called when it is systematic.
- Provenance: `R30` is `not-accessed`; `R32` verified in full, Introduction and Section 1.1. Marco is a fictional illustration (`docs/cast.md`). TJ's examples from Brainstorm 225.
- Status: drafted

#### `s069` — Structural violence, used carefully
- Beat purpose: explain the concept, apply it to one concrete barrier with named affected people and a mechanism, and state the limit — ordinary discomfort is not automatically violence.
- Cast: `narrator` `vier` (`curiosity`)
- Narrator:
  > Galtung gave this a harder name. His definition: "violence is present when human beings are being influenced so that their actual somatic and mental realizations are below their potential realizations." The test is avoidability — "when the potential is higher than the actual is by definition avoidable and when it is avoidable, then violence is present."
  >
  > And it does not need anyone doing it. "There may not be any person who directly harms another person in the structure. The violence is built into the structure and shows up as unequal power and consequently as unequal life chances."
  >
  > Apply it to Marco. The barrier is opening hours set against the shift he cannot change. The people affected are everyone whose work ends after five. The mechanism is that the schedule was designed around someone else's day. Nobody turned him away.
- Visible caveat:
  > This concept is easy to over-apply, and Galtung knew it — he calls "potential realizations" highly problematic for anything beyond the physical. Ordinary discomfort, awkwardness, or an annoying day is not structural violence. If we cannot name the barrier, the people, and the mechanism, we should not use the word.
- Sources/concepts: `R27`; structural violence
- Visual purpose: the gap between what is possible and what is allowed, drawn as a measurable distance.
- Static description: Two horizontal lines, one above the other, with the vertical gap between them marked and measured. A figure stands on the lower line. No other figure is in the frame.
- Optional detail: Source panel gives the 1969 citation, the page numbers of the quoted definitions, and Galtung's own warning against directing all attention to structural violence at the expense of personal violence. Keyboard: Enter or Space opens, Escape closes and returns focus. Static equivalent: printed in the full reading view.
- Transition: the narrator moves from structure to relationship.
- Provenance: `R27`, verified in full at an alternate host after the register's link refused access — pp. 168, 169 and 171. TJ's use of this source is his own (Brainstorm 223).
- Status: drafted

#### `s070` — Poverty as a relationship
- Beat purpose: the relational account of how poverty persists through power, exploitation, and exclusion, used against explaining hardship as a lack of resourcefulness.
- Cast: `narrator` (`reflection`)
- Narrator:
  > Mosse argues for a relational approach: one that "views persistent poverty as the consequence of historically developed economic and political relations", and that treats poverty and inequality as "an effect of social categorisation and identity". He also argues for a conception of power that includes "agenda-setting power" — the power that decides what even gets argued about.
  >
  > Which is useful against the idea that someone is poor because they lack diskarte. Nobody's position was formed on their own.
- Visible caveat:
  > Abstract read, not the full paper, and its grounding is in the experience of adivasi and dalit communities in India. Bringing the frame here is our move, and it only works if we can point at an actual mechanism rather than relabelling every hardship.
- Sources/concepts: `R28`; relational poverty
- Visual purpose: positions connected by lines rather than standing alone.
- Static description: Several figures at different heights on a slope. Lines connect them to each other. Removing any one figure would change where the others are standing.
- Optional detail: none.
- Transition: the narrator looks at the story told about all of this.
- Provenance: `R28`, verified at abstract level. TJ's use of this source is his own (Brainstorm 227).
- Status: drafted

#### `s071` — Manage yourself like an enterprise
- Beat purpose: the political-economic lens on market freedom and responsibility, with the hustle-culture connection marked explicitly as our reading rather than the author's claim. Wellness advice offered while workload stays untouched.
- Cast: `narrator` `vier` `tj` (`frustration`)
- Narrator:
  > Harvey's book characterises neoliberalism as "the doctrine that market exchange is an ethic in itself, capable of acting as a guide for all human action", and traces its spread from around 1970.
- Visible caveat:
  > We only had the publisher's description of that book, not a chapter of it. So the next paragraph is ours, not Harvey's. We are not claiming he wrote about Filipino students.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 229–231) — `frustration`
    > Pinapatanong niya sa akin yung idea na dapat i-manage ng lahat yung sarili nila parang enterprise: always competitive, always improving, always responsible for their own outcome. Connecting that to hustle culture is our reading. An organisation can offer wellness tips while leaving overwhelming demands intact. Nakakatulong siguro yung tip — pero bakit yung workload mismo hindi kasama sa usapan?
- Sources/concepts: `R29`; neoliberalism; group interpretation
- Visual purpose: a person drawn as a small business with its own targets.
- Static description: A figure drawn with a small signboard, a target chart, and a growth arrow attached to its back. It is otherwise an ordinary stickman.
- Optional detail: none.
- Transition: the narrator lays out who is standing where.
- Provenance: `R29`, `verified-abstract` at book level only. The hustle-culture connection is explicitly marked as the group's reading in TJ's own note (Brainstorm 231) and in `docs/research.md`.
- Status: drafted

#### `s072` — Different starting positions
- Beat purpose: working student, caregiver, breadwinner, person with a disability, person living alone, person with financial support — different options, with feelings explicitly not predetermined by position.
- Cast: `nessa` `marco` `ivy` `dino` `tj` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 235) — `reflection`
    > Hindi tayo lahat nagsisimula sa parehong lugar. A working student, a caregiver, a breadwinner, a person with a disability, a person living alone, a person with financial support — iba-iba yung conditions na haharapin nila. Hindi predetermined yung feelings nila by those positions, pero pwedeng magkaiba yung options.
- Narrator:
  > That second sentence is the one we keep having to repeat to ourselves. Nessa is not sad because she is a caregiver. Dino is not happy because he is comfortable. The positions change what is available, not what anyone feels about it.
- Sources/concepts: conditions; standpoint
- Visual purpose: several figures at different distances from the same door.
- Static description: One door. Six figures at six different distances from it, with different obstacles between each of them and it. Their faces are not uniform — some look fine.
- Optional detail: none.
- Transition: the narrator turns the question on the three of us.
- Provenance: Brainstorm 235, TJ's own wording and Taglish retained. All four named figures are fictional illustrations (`docs/cast.md`).
- Status: drafted

#### `s073` — Our own position
- Beat purpose: the second inward turn. UP access, peers, and resources shape where our definition came from; this does not mean every student has an easy life, and it does mean there are advantages we can overlook.
- Cast: `tj` `koj` `vier` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 237) — `reflection`
    > UP access is part of our position too. Education, peers, resources. Hindi ibig sabihin na madali ang buhay ng bawat UP student. Ibig sabihin, galing sa isang lugar yung definition namin ng magandang buhay — at may mga advantages kaming pwedeng hindi mapansin.
- Narrator:
  > Which cuts into things we have already said. We defended rest from productivity — easier to defend when the deadline is a grade. We argued that enjoyment needs no output — easier to argue when nobody is depending on your output. None of that makes the arguments wrong. It does mean they came from somewhere.
- Sources/concepts: standpoint
- Visual purpose: the three members drawn inside a frame they had not noticed.
- Static description: TJ, Koj and Vier mid-conversation. A rectangular frame has been drawn around all three. They are looking at each other, not at the frame.
- Optional detail: none.
- Transition: TJ turns the same suspicion on his own instinct about solutions.
- Provenance: Brainstorm 237, TJ's own wording and Taglish retained. The application to the essay's earlier arguments is this essay's, and answers the assignment's instruction to interrogate assumptions and name a baseline.
- Status: drafted

#### `s074` — What if may app?
- Beat purpose: TJ names his own tech bias and tests it — a directory or a calendar can help, and it cannot supply spare time, affordable transport, or a safe place to sit.
- Cast: `tj` (`curiosity`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 199) — `curiosity`
    > Tech bias ko: I like making things, so mabilis akong mapunta sa "what if may app?" Pero does another app change the problem, or does it just give people one more thing to manage?
  - `tj` — member-endorsed (Brainstorm 255) — `reflection`
    > A resource directory, a community calendar, easier access to assistance, ways to keep in touch — pwede. Pero a friendship app can't supply spare time, affordable transport, or safe public space.
- Sources/concepts: standpoint
- Visual purpose: an app icon placed over a gap it does not fill.
- Static description: A gap in the ground between two ledges. A small rounded app icon is laid across it. The icon is much narrower than the gap.
- Optional detail: none.
- Transition: the chapter closes with the answer to the assignment's third question.
- Provenance: Brainstorm 199 and 255, TJ's own wording and Taglish retained.
- Status: drafted

#### `s075` — Partly, and unequally
- Beat purpose: close the chapter with the explicit answer to the assignment's attainability question, and with the thesis that small joys are real while the chance to sustain them is unequally distributed.
- Cast: `narrator` `tj` (`reflection`)
- Narrator:
  > So: is happiness achievable in the society we have now?
  >
  > Our answer is yes, and unequally. People find pleasure, relationships, and purpose in this society every day, including people with very little. That part is not in doubt and we are not going to be precious about it.
  >
  > What is unequal is the chance to keep doing it. A stable shot at those things is harder when survival, uncertainty, and exclusion are already using up most of the available choices. Small joys are real. The conditions that let someone return to them are not evenly handed out.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 239) — `reflection`
    > Removing barriers won't guarantee happiness. Grief, conflict, uncertainty still exist. Pero hindi rin excuse yun para panatilihin yung mga barrier na pwede namang alisin.
- Sources/concepts: conditions
- Visual purpose: the same joy from `s016` with its supporting conditions now drawn underneath.
- Static description: Bob's basketball afternoon from `s016`, redrawn identically. Under the ground line, previously hidden, a layer of supports is now visible: fare, a free hour, a safe court, working legs.
- Optional detail: none.
- Transition: the chapter ends on the answer, and chapter 6 asks what would change it.
- Provenance: Thesis from TJ's notes (Brainstorm 221, 241) and `docs/brief.md`, "Working argument". TJ's line from Brainstorm 239.
- Status: drafted

---

## `c6` — What could change, and what do we still disagree about?

The assignment's fourth part, followed by what we have not settled.

#### `s076` — The question the assignment actually asked
- Beat purpose: restate the attainability and change questions in plain terms and commit to answering them directly rather than gesturing at complexity.
- Cast: `narrator` (`curiosity`)
- Narrator:
  > The question we were given had four parts. What do we think happiness is. What constitutes it. Whether our definition is achievable in the society we have. And if not, how it could be achieved — changed systems, new innovations, anything.
  >
  > We have answered the first three. Here is the fourth, in order of how far it is from any one person's hands. We are not going to hide behind "it's complicated" at the last step.
- Sources/concepts: —
- Visual purpose: the opening question from `s001`, returned to with more written under it.
- Static description: The large question from the landing, redrawn. Below it, three short answered lines and a fourth line still blank.
- Optional detail: none.
- Transition: the narrator starts with what a person can do alone, and immediately limits it.
- Provenance: Assignment wording from `docs/notes/2026-10-08-instructions.md`.
- Status: drafted

#### `s077` — Personal practices, not blame rules
- Beat purpose: room for leisure, everyday care, questioning inherited desires, permission for difficult feelings — offered as ways to live and explicitly not as rules that blame unhappy people.
- Cast: `tj` `koj` `vier` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 245) — `reflection`
    > Make room for friends and leisure. Be more deliberate about what I actually want. Practise everyday care. Allow sadness. Gusto ko ang mga ito bilang paraan ng pamumuhay — hindi bilang rules na sinisisi yung tao kapag hindi siya masaya.
- Narrator:
  > That last clause is the whole point of putting this first and keeping it short. Every item on that list is easier with time and money. Offering it as the answer would quietly hand the problem back to the person with the least room to solve it.
- Sources/concepts: —
- Visual purpose: offered, not imposed: items set down beside a figure rather than handed to it.
- Static description: Four small objects placed on the ground beside a figure, within reach. No hand is holding them out, and the figure is not being made to pick any of them up.
- Optional detail: none.
- Transition: the narrator moves one step outward.
- Provenance: Brainstorm 245, TJ's own wording and Taglish retained. The anti-blame framing is also his, and is required by `docs/content-plan.md`, chapter 6.
- Status: drafted

#### `s078` — Campus and community
- Beat purpose: affordable gatherings, places to sit without buying anything, accessible activities, groups that include people, support attentive to circumstances.
- Cast: `bob` `nessa` `marco` `tj` (`joy`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 247) — `joy`
    > Affordable gatherings. Places to sit without buying anything. Accessible activities. Study groups that actually include people. Support that pays attention to someone's circumstances.
- Narrator:
  > Dull list, cheap items, and every one of them is the difference between Bob's invitation reaching Nessa and not reaching her. A bench you can sit on without ordering something is a happiness intervention. We are aware of how that sounds.
- Sources/concepts: conditions
- Visual purpose: a bench that does not require a purchase.
- Static description: A plain bench with three figures on it — Bob, Nessa and Marco. Nobody is holding a cup. There is no counter in the frame.
- Optional detail: none.
- Transition: the narrator moves to the scale none of us controls.
- Provenance: Brainstorm 247, TJ's own list.
- Status: drafted

#### `s079` — Institutions and the direction we can defend
- Beat purpose: predictable work, manageable schedules, transport, healthcare, housing, and usable services — stated as a direction supported by the mechanisms already explained, not as evaluated policy.
- Cast: `narrator` `tj` (`reflection`)
- Narrator:
  > Then the scale none of us controls: decent and predictable work, manageable schedules, transport, healthcare, housing, and services that leave people with more real choices.
  >
  > We can defend the direction from what we have already shown you. If avoidable gaps between what people could do and what they can do are the thing to reduce, then reducing them is the work. If a resource people cannot convert into anything is not a real option, then services have to be usable from where people actually stand — the hours Marco works, the fare Nessa pays.
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 249) — `reflection`
    > Kailangan ng actual policy evaluation ang mga ito. Pero malinaw naman yung direction: bawasan yung avoidable insecurity at time pressure.
- Sources/concepts: `R27`, `R30` (via `R32`); conditions
- Visual purpose: the barriers from `c5` reduced rather than removed.
- Static description: The fence line from `s068` and the gap from `s074` return, both smaller. They are still drawn. A figure can now step over.
- Optional detail: none.
- Transition: the narrator turns our own tools on our own proposals.
- Provenance: Brainstorm 249, TJ's own wording. The direction is grounded in `R27` (verified in full) and `R32` (verified in full, standing in for `R30`).
- Status: drafted

#### `s080` — Who benefits, who pays
- Beat purpose: the utilitarian question from class applied to our own proposals — a better average is not enough if a smaller group carries the cost through harm or exclusion.
- Cast: `narrator` `koj` `tj` (`curiosity`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 251) — `curiosity`
    > Utilitarian question from class: sino yung nakikinabang, at sino yung nagdadala ng cost? A better average happiness score isn't enough kung may mas maliit na grupo na nagbabayad para doon through harm or exclusion.
- Narrator:
  > Bentham already put extent on the list — "the number of persons to whom it extends". The trouble is that an average hides distribution, and Mill's answer to disputes was to ask the people acquainted with both options, which only works if you ask everyone affected.
  >
  > So for every proposal above: who benefits, who carries the cost, who gets left out, and who did we not ask?
- Sources/concepts: `R05`, `R06`; utilitarianism
- Visual purpose: an average line drawn over a distribution with a visible tail.
- Static description: A spread of figures at different heights with a single horizontal line drawn through them labelled "average". Several figures sit well below the line and are drawn at full detail.
- Optional detail: none.
- Transition: the narrator names what we did not do.
- Provenance: Class link and question from Brainstorm 251, TJ's own wording. `R05` and `R06` both verified in full; the extent dimension and the competent-judges move are turned back on the group's own proposals.
- Status: drafted

#### `s081` — What we have not evaluated
- Beat purpose: state plainly that we have not assessed any specific local policy, and say what evidence would be needed before any of these directions became a recommendation.
- Cast: `narrator` (`reflection`)
- Narrator:
  > Now the honest part. We have not evaluated a single specific policy. Not one local programme, not one schedule change, not one service. We read about mechanisms, not about implementations.
  >
  > What would it take to turn any of this into a recommendation? Who is currently excluded and by what. What a change costs and who pays it. What happened where something similar was tried. And whether the people affected agree that it is the change they want. We have none of that, and we are not going to write as though we do.
- Visible caveat:
  > Everything in this chapter is a direction, not a tested proposal. Treat it as a list of what we think is worth looking into, from three students who have not looked into it.
- Sources/concepts: evidence limits
- Visual purpose: a proposal with an explicitly empty evidence column.
- Static description: A two-column layout. The left column is full of proposal items. The right column, headed "evidence", is drawn empty with its outline intact.
- Optional detail: none.
- Transition: the narrator refuses one more false choice.
- Provenance: `docs/research.md`, "Important unresolved evidence work". TJ's own note that these need actual policy evaluation is at Brainstorm 249.
- Status: drafted

#### `s082` — Care and collective action
- Beat purpose: friendship makes a hard situation bearable; organising can question why the situation exists. Not a choice between them.
- Cast: `tj` `vier` (`joy`, `frustration`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 253) — `reflection`
    > Care and collective action can go together. Friendship makes a hard situation bearable. Organising can challenge why that situation exists. Hindi kailangan one or the other.
  - `tj` — member-endorsed (Brainstorm 257) — `reflection`
    > Mas gusto ko yung gawing mas madali yung connection at pahinga kaysa i-score yung happiness ng lahat. Sino ba ang magdedesisyon kung ano yung itsura ng magandang buhay, at pwede bang hindi sumang-ayon ang tao sa version na yun?
- Sources/concepts: —
- Visual purpose: two kinds of effort pointed at the same obstacle.
- Static description: One obstacle in the centre. On one side, figures supporting each other over it. On the other, figures with their hands on the obstacle itself. Both groups are drawn the same size.
- Optional detail: none.
- Transition: the narrator stops proposing and starts listing what is unresolved.
- Provenance: Brainstorm 253 and 257, TJ's own wording and Taglish retained.
- Status: drafted

#### `s083` — What we still disagree about
- Beat purpose: name the unresolved tensions as tensions — meaning against pleasure, social shaping against agency, care against boundaries, gratitude against justified anger — without resolving them.
- Cast: `tj` `koj` `vier` (`frustration`, `curiosity`)
- Narrator:
  > Four things we did not settle.
  >
  > Koj thinks difficulty gives him something that ease does not. TJ thinks pleasure owes nobody a justification. Neither of us moved, and TJ flagged this as the useful tension before we started writing.
  >
  > Vier says our desires were handed to us and the honest move is to choose what to keep. But choosing what to keep uses judgement that was also handed to us. We do not have the bottom of that.
  >
  > Care is good and care is labour. Somebody does it. We said boundaries matter and we did not say where they go.
  >
  > And gratitude and anger. We said hold both. We did not say what to do on a day when one of them has to win.
- Sources/concepts: —
- Visual purpose: pairs of figures facing each other, neither moved.
- Static description: Four pairs of figures, each pair facing each other across a small gap. None of the gaps has closed, and no arrow points from one figure to the other.
- Optional detail: none.
- Transition: each member speaks for themselves.
- Provenance: Koj–TJ tension named by TJ at Brainstorm 273. Vier's regress is implicit in Brainstorm 365–373 and is drawn out here as an unresolved tension rather than attributed to him as a conclusion. Care and gratitude tensions from Brainstorm 149, 209–213, 179–181.
- Status: drafted

#### `s084` — What each of us is still sitting with
- Beat purpose: the third inward turn, in each member's own voice — whether we are turning our interests into universal needs, equating achievement with worth, treating care as endless self-sacrifice, and which happiness we are measuring.
- Cast: `tj` `koj` `vier` (`reflection`)
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 263–269) — `reflection`
    > Am I turning my own interests into universal needs? I like basketball, games, tech, gala. Someone else's good life can involve solitude, faith, care work, or things I haven't considered. Am I equating achievement with worth? Am I treating care as endless self-sacrifice — or individual freedom as if I don't depend on anybody?
  - `tj` — member-endorsed (Brainstorm 269) — `curiosity`
    > And which happiness are we even measuring? Income, daily emotion, satisfaction, virtue, autonomy, relationships — bawat lens may pinapakita at may natatabunan.
  - `koj` — member-endorsed (Brainstorm 61) — `reflection`
    > This still makes me question the assumption that the happiest life is necessarily the easiest or most pleasurable life.
  - `vier` — member-endorsed (Brainstorm 385–393) — `reflection`
    > Para sa akin, this makes happiness less about constantly feeling good and more about feeling na kaya kong lumahok sa sarili kong buhay. There will still be failure, uncertainty, and things outside my control — pero hindi ako basta sumusunod sa buhay na may ibang nagdesisyon na dapat magpasaya sa akin.
- Sources/concepts: standpoint; measurement limits
- Visual purpose: three figures each with an unanswered question above them instead of a nametag conclusion.
- Static description: TJ, Koj and Vier side by side. Above each head, where a conclusion would sit, there is a question mark instead. Their nametags are still there.
- Optional detail: none.
- Transition: the narrator goes back to the first afternoon.
- Provenance: Brainstorm 263–269 (TJ), 61 (Koj), 385–393 (Vier), each member's own wording. Koj's line is his own sentence from his notes, not a new position.
- Status: drafted

#### `s085` — Bob, again
- Beat purpose: return to the opening afternoon with its conditions now visible, echoing the first scene without claiming the conditions have been fixed.
- Cast: `bob` (`joy`), `nessa` `marco` (`reflection`)
- Narrator:
  > Bob is playing basketball. He is still losing and he is still enjoying it, and nothing we have written has made that less real.
  >
  > What has changed is what you can see around it. The court is free and open. He got there. He had the afternoon. Nessa did not come, because her Saturday was never free. Marco would have come if the gate were open past five.
  >
  > We did not fix anything. We just stopped being able to look at the afternoon without seeing what it rests on.
- Sources/concepts: —
- Visual purpose: the `s016` composition redrawn with the `s075` layer kept in place.
- Static description: Bob's afternoon exactly as first drawn, with the layer of supports from `s075` still visible underneath. At the edge of the frame, Nessa and Marco are drawn small, elsewhere, not on the court.
- Optional detail: none.
- Transition: the narrator asks the last question.
- Provenance: Return-to-the-joy structure from TJ's note on the overall route (Brainstorm 275) and `docs/content-plan.md`, chapter 6. Bob, Nessa and Marco are fictional illustrations.
- Status: drafted

#### `s086` — What do we owe one another
- Beat purpose: the closing question — if a good day depends on more than attitude, what do we owe one another so that more people can have one — left open rather than answered.
- Cast: `tj` `koj` `vier` `bob` `nessa` `dino` `ivy` `marco`
- Dialogue:
  - `tj` — member-endorsed (Brainstorm 259) — `reflection`
    > Closing question: if a good day depends on more than attitude, what do we owe one another so that more people can have one?
- Narrator:
  > We are not going to answer that for you. We could not agree on what happiness is, and we are not going to end by telling you what you owe anybody.
  >
  > What we will say is that the question is not rhetorical. Somebody's Saturday depends on it.
- Sources/concepts: —
- Visual purpose: the full cast facing outward toward the reader.
- Static description: All eight figures stand in a loose line facing out of the frame. The three members have nametags. The five invented ones do not. Their expressions are not matched.
- Optional detail: none.
- Transition: the last scene is the source note.
- Provenance: Brainstorm 259, TJ's own closing question.
- Status: drafted

#### `s087` — Where all of this came from
- Beat purpose: the reader-facing source note — what each kind of source can and cannot support here, and where our own notes and the assignment sit.
- Cast: `narrator`
- Narrator:
  > Everything we cited is listed with a link, and we have tried to be exact about what each one can carry.
  >
  > Published research and philosophical texts support the specific claims they are attached to, with their population and measure stated where there is one. Eleven we could only read at abstract level, and we said so each time. For three books we only had the publisher's own description — Lambek, Das, Harvey — and we said so, and marked what followed as ours.
  >
  > Five we could not open at all. Three of those are public threads, and nothing here rests on what is in them. The other two are not like that: Pe-Pua and Protacio-Marcelino on kapwa, and Sen on capabilities, are where two ideas in this essay come from, and we reached those ideas through other published work that quotes or explains them. We told you that in the scenes where it happened, and we are telling you again here.
  >
  > Blog posts and public threads are here as perspectives, never as evidence, and never on their own. The invented friends — Bob, Nessa, Dino, Ivy, Marco — are drawings. They show you an argument. They do not prove one.
  >
  > Our own positions come from our group notes. We did not put opinions into each other's mouths, and nothing here is anyone's autobiography.
- Sources/concepts: all retained source identifiers
- Visual purpose: a plain readable list, legible in print and offline.
- Static description: A plain list of sources with their links and one line each. No illustration. It reads identically on screen and on paper.
- Optional detail: Each entry expands to its full evidence record — citation, what was read, the supported claim, and the limitation. Keyboard: each entry is a button that opens with Enter or Space and closes with Escape, returning focus. Static equivalent: the full reading view and the printed output contain every expanded record in order, so nothing here is reachable only by interaction.
- Transition: end of the main path. Back returns to `s086`; chapter shortcuts remain available.
- Provenance: Source-identification requirement from `docs/notes/2026-10-08-instructions.md`. Status language mirrors `docs/research.md`.
- Status: drafted

---

## Handoff to the other packages

- **Foundation (`#3`).** Chapters, scenes, cast, expressions, and source identifiers above are the
  entities the content contract must express. Seven chapter entry points are listed in the chapter
  index. Scene identifiers are stable keys, not ordering. Main-path prose is everything inside a
  blockquote; it must appear in presentation view, full reading view, and print alike.
- **Artwork (`#4`).** Every scene states a visual purpose and a static description. The cast
  registry names eight drawn figures and six expression states; `nessa`, `dino`, `ivy` and `marco`
  have no concept art yet. Several scenes are deliberate redraws of an earlier composition with one
  layer added — `s058` of `s057`, `s075` of `s016`, `s085` of both, `s048` of `s047`, `s054` of
  `s053`, `s079` of `s068` and `s074` — and need the compositions to match.
- **Reader (`#5`).** Optional detail appears on `s007`, `s010`, `s020`, `s028`, `s038`, `s050`,
  `s051`, `s062`, `s064`, `s069` and `s087`. Each states its keyboard behaviour and its static
  equivalent. None carries the only statement of a perspective, and none gates Next.
- **Integration (`#6`).** This file plus [the cast registry](cast.md), [the research
  register](research.md), and [the coverage matrix](coverage.md) are the editorial inputs.

### Known limitation: who speaks in `c4` and `c5`

Member dialogue is not evenly distributed, and in two chapters it is not distributed at all.

| Chapter | Koj lines | TJ lines | Vier lines |
| --- | --- | --- | --- |
| `c1` | 3 | 3 | 6 |
| `c2` | 2 | 11 | 0 |
| `c3` | 0 | 9 | 8 |
| `c4` | 0 | 6 | 0 |
| `c5` | 0 | 17 | 0 |
| `c6` | 1 | 9 | 1 |

**`c4` and `c5` carry TJ's dialogue only.** That is a direct consequence of the source material:
relationships, care, money, and time appear in TJ's Brainstorm notes (lines 115–181) and nowhere in
Koj's or Vier's. Koj and Vier are present in those chapters as drawn figures and their positions are
cited through the narrator, but they do not speak.

We did not fix this by writing lines for them. Inventing a position for a member is the one thing
this project forbids outright, and redistributing TJ's positions into their mouths would be the same
act with extra steps — shared *research* can be explained by any avatar, but a *position* belongs to
whoever holds it.

**The remedy is a contribution, not an edit.** If Koj or Vier supply or endorse positions on
relationships, care, money, or time, they arrive as a delta under `docs/notes/deltas/` following
[the delta protocol](notes/README.md). Reconciling one adds dialogue to the existing `c4` and `c5`
scenes without new scene numbers; `s047`, `s052`, `s054`, `s055`, `s056`, `s060`, `s063`, `s065`,
`s068`, `s072` and `s074` all have an obvious place for a second voice. The dialogue standing rule
already accepts `(delta: <file>)` as a source, so nothing in the format has to change.

Until then the imbalance stands, and it is recorded here rather than hidden. It does not cost
coverage: every distinct Koj and Vier position in the notes is on the main path, as
[the coverage matrix](coverage.md) shows per position.
