# Happiness website: scene blueprint and opening sample

Status: outline and opening sample approved in chat on 10 October 2026. This document records the scene inventory and approved opening. The [full 45-scene script](happiness-full-scene-script.md) now supplies exact copy, source mapping, interface labels and art briefs. Final script approval and remaining generated assets are still needed before implementation.

Tracked by [issue #15](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/15), which remains unqueued. Existing implementation #6 is complete; workers and heartbeat are paused and #7 remains held.

## 1. What the original assignment requires

The document presents one happiness prompt with four parts, rather than four separate assignment choices. Its instructions require personal reflection and published research, multiple viewpoints, contextualized claims, examined assumptions, source identification and use of class material.

Source: [instruction snapshot](https://github.com/duckycodess/what-it-takes-to-be-happy/blob/71576db5d1672a33195e51766fe90c3bfeb1cdc3/docs/notes/2026-10-08-instructions.md). This is the captured original document; it does not claim to include later edits.

| Required part | Where this flow answers it | Answer the final script must state |
| --- | --- | --- |
| What do you think of happiness? | Sections 1–2; synthesis in section 8 | Preserve three endorsed positions: Koj's living well, TJ's life worth returning to with room for ordinary joy, and Vier's relationship with life and agency. Explain their overlap without forcing a universal definition. |
| What constitutes happiness? | Sections 2–6 | Pleasure, fulfillment, rest, relationships and agency; time and material security affect which activities and relationships people can sustain. Explain and question these, rather than present a universal checklist. |
| Is your definition achievable in present society? | Explicit answer in `s122`, grounded in section 6 | Happiness is possible, but opportunities to sustain it are unequal. Small joys in hardship are real; they do not justify deprivation. Removing barriers expands options without guaranteeing feelings. |
| If not, how could it be achieved? | Sections 7–8 | Name changes and actors at personal, relationship, school/community and institutional levels. Explain mechanisms, costs and exclusions. Identify proposals as proposals, not evaluated policies. |

| Grading criterion | Required treatment |
| --- | --- |
| Depth and thoroughness | Different definitions, mechanisms, counterexamples, source findings and meaningful limits. No catalogue of unexplained theory names. |
| Clear and logical argument | Move from ordinary experience to definitions, social expectations, relationships, material conditions and proposed changes. Each scene finishes one point. |
| Inward reflection | State the student standpoint and examine productivity, consumption and technology biases within the argument, not in an apologetic footer. |
| Class concepts and information | Explain relevant concepts, use them on a concrete situation, then test their limits. Preserve the distinct lenses from the notes without repeating entire explanations. |

## 2. Authoring and implementation boundary

This chat makes the editorial and visual decisions. Claude receives a locked handoff after approval, then makes engineering choices needed to render it. Claude must not invent dialogue, decide what a source proves, reinterpret a drawing's purpose or add bridging narration.

Review order:

1. Approved outline, already confirmed.
2. One complete opening sample: exact copy, inspected generated art, desktop/phone placement and accessible reading order.
3. Complete script and art set following the approved sample. The full script draft is written; remaining drawings are specified but not yet generated.
4. Scene-by-scene coverage/source/copy review.
5. Explicit implementation authorization before any worker resumes on this rewrite.

Approximate reading target: 15–20 minutes. The inventory below proposes 45 scenes, not a fixed count. Measure actual visible prose after writing; consolidate repetition without deleting distinct arguments or required depth. A planning range around 3,500–4,000 main-path words is a budget, not a word cap. Interactions add variable reading time and must not be presented as a precisely timed experience.

The old scenes end at `s087`. Proposed new scenes use `s088`–`s132` to avoid silently assigning old identifiers new meanings. Source IDs remain the existing `R01`–`R32`; a new work must receive a new source ID.

## 3. Fields every final scene card must lock

- Stable scene ID and section.
- The one point the scene finishes; its assignment/rubric role.
- Exact reader-facing title, narration, each speaker's dialogue, essential caveat, interaction labels and any caption. An empty field means omit it, not invent it.
- Exact text order. Dialogue may precede explanation when the argument needs it.
- Endorsed-position provenance for member dialogue. Reconstructed dialogue is not a claim that these words were spoken during an actual event.
- Source IDs, claim-to-source links, audited evidence level, retained meaning-changing limit, and final numbered citation mapping.
- Generated asset ID/path, inspected selected output, cast identities, expressions, poses and explanatory purpose.
- Browser-text name positions and the art/text arrangement at desktop and phone widths. No burned-in lettering or framed illustration panel.
- Exact optional interaction states: initial state, action labels, changed art/text, keyboard behavior, reduced-motion equivalent and continuous/print equivalent.
- Motion: `none` unless an expression or pose change explains the point. No generic entrance animation.
- Concise alt text describing the explanatory drawing; no compulsory visible drawing-description essay.
- Next/Back destinations, chapter anchor and reading order.
- Verification conditions and owner-approval status.

No `TODO`, "write something about", unexplained asset placeholder or unresolved reader-facing copy may remain in the implementation-ready handoff. Claude must report a missing field rather than fill it editorially.

The content format may retain JSON internally. The approved Markdown remains the copy authority, and transfer checks must prove that rendering preserves its text, citations and order. All additional visible bridge prose must be approved in Markdown too.

## 4. Proposed scene inventory

All rows below are writing plans, not final site copy. Source IDs identify audited material to consult; they do not authorize stronger claims than its evidence record. Full bibliographic and audit detail belongs on Sources & Credits; short limits that affect an argument remain beside that argument.

### Section 1: One afternoon, three different answers

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s088 | Ordinary enjoyment does not require a milestone or output. Opening sample below. | Generated TJ, Koj and Vier sharing an informal afternoon; names as browser text. Still art. | TJ's endorsed ordinary-hangout and pleasure notes. Imagined illustration, not a dated group memory. |
| s089 | The three members mean different things by happiness. | Same cast; different expressions. Their definitions appear together as readable dialogue. | Koj: living well; TJ: room for joy and a life worth returning to; Vier: agency/relationship with life. Do not manufacture consensus. |
| s090 | Our student standpoint shapes which examples and opportunities we notice. | Cast beside ordinary student objects, without inventing family income or hardship. | Group notes and existing standpoint record. Name assumptions about available time, connection and access. |
| s091 | A difficult day does not automatically make a life unhappy. | One recognizable person in two emotional states; no implication of two different people. | Koj and Vier's endorsed positions. Illustration is an example, not psychological measurement. |

### Section 2: Feeling good or living well?

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s092 | Feeling good now and evaluating one's life are different questions. | Two perspectives on the same person. Browser headings identify the two questions. | R02: distinct self-report measures in US data. No claim that one score captures every definition. |
| s093 | Koj's living-well view resembles flourishing across a life, not constant pleasure. | Meaningful effort with an expression showing difficulty rather than permanent smiling. | R01 and Koj's notes. Distinguish philosophical account from empirical proof; external circumstances matter. |
| s094 | Vier connects happiness with being able to participate in his life, despite regret or dissatisfaction. | Vier considering more than one possible response; no predetermined happy ending. | Vier's endorsed notes. Do not attribute his argument to an uncited theorist. |
| s095 | Contentment, no regrets and meaning can themselves become standards that exclude ordinary lives. | Three browser-text labels beside simple generated situations; no scoreboard. | Vier's criticisms. Present them as his reasoning, not research findings. |
| s096 | Autonomy, competence and relatedness help describe valued activities without exhausting happiness. | A hobby contains choice, learning and company at once. Optional viewpoint switch; all explanations readable without it. | R03: a theory's proposal about psychological needs, not a universal happiness checklist. |

### Section 3: Must joy be productive?

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s097 | Chosen challenge can fulfill; forced hardship is not made good by being difficult. | Compare freely chosen study with an illustrative obligation. Do not assign hardship to a member. | Koj's study/Netflix comparison and TJ's chosen-challenge distinction. |
| s098 | Rest and play need not justify themselves through later productivity. | TJ resting or laughing; no productivity meter, reward badge or achievement banner. | TJ's position; R07 only as supplemental personal reflection, never prevalence evidence. |
| s099 | Bentham asks about pleasure, pain and everyone affected. | Apply the questions to the afternoon; no invented numerical happiness calculator. | R05. Clearly distinguish original framework from the group's application. |
| s100 | Ranking pleasures raises a question about who gets authority to judge. | Studying and gaming both show effort, imagination or company. | R06 plus TJ's criticism. Do not claim Mill himself concedes TJ's objection. |
| s101 | Needs matter without creating a rigid staircase that forbids connection until survival is solved. | Needs shown together rather than stacked as a mandatory sequence. | R08. The familiar pyramid is not Maslow's original figure; arbitrary illustrations are not data. |
| s102 | Pleasure, fulfillment, growth and rest can coexist without one winning activity. | Return to the cast with different activities represented together. | Member synthesis grounded in earlier distinctions. No happiness formula or prescription that everyone needs the same mix. |

### Section 4: Whose idea of happiness are we following?

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s103 | Grades, school, relationships and income can become the only accepted success template. | Vier beside browser-text milestones; show learned expectations, not a literal compulsory life route. | Vier's notes; class-note social-expectation/habitus lens. Do not pretend the original habitus text was read. |
| s104 | A purchase can open a valued activity or become a way of keeping up; TJ is inside this tension. | Device enabling a hobby contrasted with status pressure. | R04 and TJ's consumer-interest reflection. Abstract-level evidence; objects/experiences are not clean moral categories. |
| s105 | Online connection and comparison can coexist. | Same phone opens a friendly exchange and a milestone feed. Optional comparison does not hide the explanation. | R23/R24. Associations, different measures/populations and small average effects do not establish a universal rule. |
| s106 | Expecting someone never to feel sad can add pressure. | Character receiving a cheerful demand while already struggling; emotion remains legible. | R25. Specific perceived expectations, Australian/Japanese samples; not a claim that cheerful company is harmful. |
| s107 | Gratitude can coexist with anger about conditions; adaptation is not guaranteed. | Same person appreciates a small joy while naming an unresolved barrier. | TJ's notes and R26's limited adaptation revision. Do not use resilience to justify deprivation. |
| s108 | Agency involves negotiating social influences, not discovering a self untouched by society. | Vier keeps some influences and questions others. No escape portal or society-free avatar. | Vier's endorsed argument. Reflection states the position rather than ending with empty uncertainty. |

### Section 5: When does connection become pressure?

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s109 | Ordinary listening, replying and inclusion can carry ethical weight. | A small everyday response changes who is included in the imagined group. | Class ordinary-ethics lens; R15/R16 are publisher descriptions, R20 a personal reflection. Do not attribute unread book passages or make prevalence claims. |
| s110 | Belonging can include acquaintances and repeated shared meals, not only one intimate relationship. | Casual familiar faces and a shared meal. | R17/R19: associations, not guaranteed causes. If R18 is mentioned, survival must remain distinct from happiness. |
| s111 | Kapwa is a relational lens, not proof that all Filipinos behave alike. | Shared space with room for different relationships. | R31 is the read secondary source; R21 was not accessed. Avoid national-personality claims. |
| s112 | Someone supplies the work that keeps connection going. | Reveal scheduling, remembering and care behind the same invitation. | Illustrative case and member reflection; R20 cannot establish the general distribution of labor. |
| s113 | Boundaries and chosen solitude can belong in a good life. | An invented friend chooses quiet while still connected to others. | TJ's notes; R03 may support the autonomy lens. Do not portray solitude as an automatic deficit. |

### Section 6: Who has room to choose?

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s114 | The same invitation offers different real choices to different people. | Return to the afternoon; optional comparison shows travel, schedules and care obligations. | Fictional illustrative situations, not member biography or a population sample. |
| s115 | A free evening can contain unpaid work; buying time transfers a task and assumes money. | Show who performs the task after a time-saving purchase. | R13: abstract-level, high-income-country evidence; affordability and labor transfer are the group's critique. |
| s116 | Money and well-being depend on the measure and distribution; there is no universal happiness salary. | Resources remove specific worries; avoid a money-to-smile graph. | R02/R09: US, correlational, distinct measures. No peso conversion or universal threshold. |
| s117 | Joy in a poor community is real and does not make poverty acceptable. | Ordinary joy shown alongside an unresolved constraint. | R10: one 2019 city sample, not national representation or a Filipino happiness price. |
| s118 | An available resource may still be unusable in someone's circumstances. | Service exists but hours, fare or accessibility prevents an invented friend reaching it. | R32's capability distinction; not a quotation from the unaccessed R30 book. |
| s119 | Structural violence requires a concrete avoidable barrier, affected people and mechanism. | One named access barrier and its consequence, rather than a decorative theory label. | R27. Do not label every difficulty structural violence; acknowledge the evaluative definition. |
| s120 | Poverty and responsibility can involve social relations and power, not only mindset. | Show unequal rules or obligations shaping options. | R28: abstract/Indian grounding; R29: publisher description. Local/hustle-culture application is the group's interpretation. |
| s121 | Conditions shape options without predetermining feelings; an app cannot supply time, fare or care. | Compare fictional circumstances without automatically smiling the comfortable character or saddening the poor one. | TJ's notes and standpoint critique. Do not offer a happiness score or automatic technology fix. |

### Section 7: What should change?

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s122 | State the present-society answer directly: happiness is possible, but sustaining conditions are unequal. | Earlier cast/situations remain recognizable; no universally happy ending. | Synthesis of the earlier argument. This explicitly answers assignment part three. |
| s123 | Personal practices create room within circumstances; they are not rules for blaming someone who struggles. | Rest, ordinary care and permission for difficult emotions without a checklist. | Group proposals; no treatment or guaranteed outcome claim. |
| s124 | Schools and communities can make connection easier through accessible, affordable space and usable schedules. | Concrete gathering space with browser-text hours/access conditions. | Proposal grounded in the access argument; not an evaluated campus policy. |
| s125 | Institutional changes must address the conditions people cannot individually rearrange. | Predictable schedules, transport or usable services, selected to match earlier barriers. | Proposed directions, not evidence that a specific policy succeeds. Do not introduce an unsupported innovation promise. |
| s126 | Every proposal needs a check on who benefits, pays and performs the work. | Same proposal from beneficiary and worker perspectives; all reasoning remains visible. | R05/R06 as class lenses and the group's application. An average benefit does not settle distribution. |
| s127 | Give a concrete worked proposal and its limits, not merely a list of wishes. | School/community actor changes one earlier access barrier; show maintenance and inclusion costs. | Author a specific proposal, causal rationale and evaluation questions. State that the group has not evaluated its effectiveness. |

### Section 8: What can we conclude?

| ID | One point / reader purpose | Art or optional behavior | Evidence / boundary |
| --- | --- | --- | --- |
| s128 | State shared conclusions about happiness without erasing the three definitions. | Three members alongside concise browser-text conclusions. | Actual endorsed overlap; no invented unanimous formulation. |
| s129 | Name the supported constituents and sustaining conditions, without turning them into a universal checklist. | Earlier visual elements gathered into one uncluttered composition. | Synthesis, not a second lecture repeating every study. |
| s130 | Meaning, pleasure and agency still receive different emphasis from each member. | Same cast, different expressions and concise final positions. | Endorsed positions only. This is substantive disagreement, not an excuse to refuse a conclusion. |
| s131 | Examine which assumptions the group changed and which standpoint remains. | Return to student examples and TJ's consumption/technology preferences. | Original notes; no invented personal transformation or claim of representing everyone. |
| s132 | Return to the ordinary afternoon with its conditions visible; finish with one reflection question. | Reuse approved opening artwork, adding already-approved contextual assets if necessary. | The argument has answered all four parts before the reader question. No new research claim or "we cannot answer for you" ending. |

## 5. Scripted opening sample: s088

Copy status: owner-approved opening sample. This is reconstructed prose/dialogue grounded in the notes, not a transcript of a historical hangout. Asset status: generation and browser inspection complete; sample approved on 10 October 2026.

Section: One afternoon, three different answers.

One point: ordinary enjoyment does not require a milestone or output.

### Exact reader-facing copy

Title: **No special occasion**

Narrator:

> Imagine an ordinary afternoon with friends: a game, a few jokes, time to talk. Nothing gets finished. Nobody earns a grade.

TJ:

> Masaya lang tumawa with friends. Bakit kailangan may lesson or output pa?

Narrator:

> TJ values that kind of joy. Koj puts more weight on living well. Vier asks whether he has a say in his life. Their answers overlap, but they do not mean the same thing by happiness.

Visible caveat: none. No empirical claim is made in this opening.

Visible drawing caption: none. Fictional-scene framing is carried by "Imagine"; provenance belongs in the authoring record and Sources & Credits.

Citation links: none for this member-position introduction. Internal provenance: TJ's Brainstorm lines 67–85, Koj's lines 17–47, Vier's lines 295–307. Research enters at the relevant following scene, not as decorative opening references.

Text order: title, first narration, TJ dialogue, final narration.

### Exact visual specification

Asset ID: `rewrite-opening-v1`.

Selected asset: [opening.png](/home/tj/.local/share/agent-flow/art-worktrees/what-it-takes-to-be-happy/rewrite-opening-v1/assets/generated/rewrite-opening-v1/opening.png). Built-in generation and one targeted transparency cleanup are complete. [Manifest and exact prompt records](/home/tj/.local/share/agent-flow/art-worktrees/what-it-takes-to-be-happy/rewrite-opening-v1/assets/generated/rewrite-opening-v1/manifest.json) retain dimensions, checksums, original generation and reference provenance. Owner approved this sample on 10 October 2026. Sample approval does not authorize implementation.

Review renders: [desktop](/mnt/c/users/t7045/documents/codex/2026-10-08/grill-me-home-tj-agents-skills-2/work/opening-review/desktop.png) and [phone](/mnt/c/users/t7045/documents/codex/2026-10-08/grill-me-home-tj-agents-skills-2/work/opening-review/phone-framed.png). The phone drawing and text occupy a verified 360 CSS-pixel iframe; the screenshot includes its surrounding capture canvas. These are internal review fixtures, not a revived offline deliverable or deployed website.

Browser verification: Futura and the 1536 × 1024 image loaded; no horizontal overflow at actual desktop width 1262 and phone width 360. Exact opening/dialogue/closing copy and logical order were recorded in [browser inspection](/mnt/c/users/t7045/documents/codex/2026-10-08/grill-me-home-tj-agents-skills-2/work/opening-review/inspection.json). Both rendered compositions were visually inspected: no frame or surrounding glow, browser names above the correct heads, and no names overlapping faces. Physical phones, whole-site navigation, screen readers and print pagination were not verified by this sample.

Cast: TJ on left with small crown tuft; Koj at center with curl; Vier on right with angular tuft. Use the original generated concept sheet as the identity and style reference. Big rounded white heads, compact bodies, short legs, slightly irregular dark outlines, restrained pink on joyful cheeks.

Imagined situation: the three share an informal afternoon around a small basketball. TJ enjoys it; Koj is calm and reflective; Vier is curious. No trophies, achievement symbols, grades, text, names, logos, background rectangle or scene frame. Actual alpha transparency around the figures; white head interiors remain opaque.

Desktop arrangement: title and first narration above the shared composition. Art remains in the page flow rather than inside a bordered side panel. Browser name labels sit above their respective heads. TJ's browser-text dialogue sits near his figure with clear space, followed by the last narrator block. No text laid over outlines or faces.

Phone arrangement: title, first narration, uncropped artwork with browser name labels, TJ dialogue, final narration. Use this logical order instead of shrinking desktop absolute positions. Text remains at a readable width and figures need not share a fixed 480×300 frame.

Accessible reading order: same as text order above. Character name labels are browser text, not part of the bitmap.

Alt text: "TJ, Koj and Vier share a casual afternoon around a basketball; TJ smiles while Koj looks reflective and Vier looks curious."

Motion: none. Reduced-motion equivalent: same still composition. Interaction: none beyond standard navigation. Continuous reading and print: identical essential copy and drawing, no duplicate dialogue.

Back: landing. Next: `s089`. Chapter anchor: section 1.

Sample checks: recognizable cast, opaque white heads on transparent surroundings, no embedded lettering/frame, browser labels aligned without overlap, exact copy preserved, one concise alternative description, no added renderer narration, phone reading order maintained.

## 6. Optional interaction contract

Candidates: needs within a hobby (`s096`), connection/comparison (`s105`), unequal choices behind one invitation (`s114`), and beneficiary/worker perspectives (`s126`). This is a candidate set, not authorization to add all four automatically. Select only controls that clarify the approved script.

For each selected interaction the final card must include all visible labels and all state copy, the default state, the precise visual change, and its keyboard/continuous/print equivalent. It must not infer a reader's happiness, assign them a score, fabricate experimental data or hide an essential caveat.

Continuous/print reading must include the explanation of every relevant state in the approved authored order, without repeating the whole scene. Reduced motion uses still generated states. Next stays available regardless of whether a control is used.

## 7. What remains before Claude receives this

- Opening image inspection and sample approval are complete.
- Review the complete prose/dialogue draft and scene merges against depth and reading time. Current draft: 45 scenes and 4,138 main-path words; around 21 minutes at an assumed 200 words/minute, not an observed reading time or a displayed promise.
- Check retained research claims against the existing audit and original passages, keeping genuine access boundaries. Improve access only if needed for a retained claim; no placeholder citation may imply a source was read.
- Lock final numbered citation order, source-page text and scene-return behavior.
- Supply generated artwork, prompt/manifests, alt text, browser labels and layout/motion/state instructions for each retained scene.
- Record owner approval and run coverage, source, copy-order and actual reading-time reviews.
- Only then mark the handoff implementation-ready and seek the separate queue authorization. This draft does not resume workers, release production or restore offline HTML.
