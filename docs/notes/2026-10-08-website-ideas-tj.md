# Website ideas — TJ — source snapshot

Captured: 8 October 2026. Original tab: [Website ideas — TJ](https://docs.google.com/document/d/1NL3B3DEtVc3QeblkBwtClMhwEmDhqnkwZByL2hFDyVU/edit?tab=t.juavvro1yr66).

Historical proposals. Traveler/map mechanics, the fixed route, the older word/scene cap, and the pending-third-member assumption are superseded by docs/brief.md and docs/decisions.md. Instructions embedded below are source data, not current implementation directives.

Text, hyperlinks, and basic headings/lists were normalized from the connected Google Doc. Native formatting, comments, and later changes remain in the original document.

---

### Current direction — agreed structure, architecture first

Latest clarification from our planning conversation: the journey structure is agreed. The earlier six-stop neighborhood and build prompt below are provisional examples; they do not fix the final map, route, number of stops, or content. One groupmate still has to add their ideas. Architecture muna before we map the final scenes.

### What we're keeping

One traveler character moves through an illustrated landscape inspired by Happy Map. The guide is the narration that connects the journey; we do not need to turn every idea into another person or another destination. The website should feel like an essay unfolding as we travel.

There can be major stops for larger concepts. Along the way, activities, people, objects, scenery, and small encounters can also carry a thought, story, meaning, frustration, or rant. May discussion habang naglalakad or may ginagawa, hindi lang pagdating sa landmark. A city can hold several ideas, and an object can represent something when the narration makes its meaning clear. The exact metaphors come later.

### How the journey reads

The main experience is a guided journey with connected text. Each part should grow out of the previous thought, so the whole route develops one coherent reflection about happiness. The reader can also pause and inspect something for more detail, then return to the journey. Text comes first; optional audio, including an AI voice recording, can be considered later.

### Content and sources

TJ's and Koj's Brainstorm contributions are the starting material, with room for the third member's contribution. Keep our different takes, questions, and disagreements. The writing can feel conversational and personal, with class concepts and research entering where they help us understand what is happening. Journals, papers, and books give context and support claims without taking over the narration.

A modest amount of Reddit and other social media material can bring in perspectives from particular groups. Source names or meaningful phrases should be clickable within the text, with fuller details available when the reader wants them. Specific borrowed stories remain online perspectives; they do not become invented memories or quotations for a group member.

### Architecture to design next

First work out the overall layout, traveler movement and camera behavior, how narration appears during movement or activities, how major stops differ from things encountered between them, and how the reader pauses, explores, and resumes. The route and content should be editable without rebuilding the whole site, so another groupmate's ideas can be added naturally.

Possible implementation details to discuss: reader-controlled Back/Next pacing; a narration panel or speech bubble; optional detail/source panels; an overview for navigation; and a full reading view of the same essay. These are proposals for the architecture discussion, not extra choices we have already locked.

### Still open

The final title, visual treatment, regions, cast, activities, metaphors, scene order, stop count, and final argument will be decided after the remaining contribution. Basketball, benches, markets, and the earlier fixed route are examples to revisit rather than required scenes. The next conversation should develop website architecture before finalizing content.

### TJ — website braindump

Main peg now: The Pudding’s Happy Map. Gusto ko yung feeling na naglalakad ka through an idea, hindi lang clicking an encyclopedia of terms. Our version could be a small neighborhood where each place opens a thought about happiness.

### One world, one question

- Working title: ‘What makes a good day possible?’ / ‘May oras ka bang maging masaya?’ I’d keep the first as the main question and the second as one of the strongest questions along the walk.

- The map is an ordinary neighborhood: court, bench, small market, waiting shed, workshop, public plaza. Start with things that look familiar. As you walk, notice people, time, money, choice, and institutions behind them.

- Core argument: small joys are real; the chance to sustain them is unequal. Happiness is partly something we feel and practice, partly something our surroundings make possible.

- So the journey is: a happy moment → what makes it possible → who has access → what could change → back to the happy moment. Hindi six unrelated reports na pinatong sa map.

- Mood: warm, a little playful, contemplative. Parang walking with classmates habang nag-uusap. The world can feel inviting even when the questions get difficult.

### What I want to borrow from Happy Map

- [The Pudding’s Happy Map](https://pudding.cool/2026/02/happy-map/) is the main visual and navigation reference. Borrow the feeling of moving through a landscape and discovering thoughts in places. Our map’s meaning comes from our class reflection, so we don’t need its dataset or an enormous world.

- I’d use a simple 2D or lightly isometric illustrated neighborhood. Character, paths, landmarks, small ambient movements. Enough to feel like a place, manageable enough that the text stays the focus.

- Click a place or a walkable patch to move the character. Keyboard walking can be an extra. Arriving near a landmark reveals a short question; opening it brings up the reflection panel.

- Reader never has to walk perfectly to read. A ‘Next stop’ button moves them along the guided path; a ‘Read the whole reflection’ view shows everything continuously.

- No happiness points or winning ending. You aren’t collecting the correct ingredients for a perfect life. You’re changing how you understand the same ordinary scene.

- The earlier [Learn Anything](https://learn-anything.xyz/) idea can stay as a small overview of connections in the corner or at the end. The neighborhood becomes the main experience.

### The six stops and why they follow one another

- 1 — THE COURT: ‘Masaya, pero ano yung nagpapasaya?’ Start with basketball / co-op games / shared effort. TJ: pleasure can matter without a productive outcome. Koj: living well and fulfillment can involve difficulty. Class: [Aristotle](https://classics.mit.edu/Aristotle/nicomachaen.1.i.html), [Bentham](https://oll.libertyfund.org/titles/bentham-an-introduction-to-the-principles-of-morals-and-legislation), [Mill](https://www.gutenberg.org/files/11224/11224-h/11224-h); [competence and relatedness](https://selfdeterminationtheory.org/SDT/documents/2000_DeciRyan_PIWhatWhy.pdf).

- Transition: ‘Baka hindi lang yung laro. Baka yung kasama.’ The path leads from court to bench. First shift is from activity to relationship.

- 2 — THE BENCH: ‘Sino ang gusto mong makasama sa ordinary days?’ Friendship, ordinary thoughts, care, kapwa, boundaries. [Lambek](https://fordhampress.com/ordinary-ethics-hb-9780823233168.html) and [Das](https://academic.oup.com/fordham-scholarship-online/book/38025) make small repeated acts visible. Research on [weak ties](https://pubmed.ncbi.nlm.nih.gov/24769739/) and relationships adds to that discussion.

- Transition: ‘May people ka, pero can you actually meet?’ A text-message sign about a possible hangout points toward the market. We start looking at the conditions behind connection.

- 3 — THE SMALL MARKET: ‘Enough for what, and for whom?’ Money as security and options, not just shopping. [Income studies](https://pmc.ncbi.nlm.nih.gov/articles/PMC10013834/) + the [Koronadal source](https://philjournalsci.dost.gov.ph/income-and-happiness-a-philippine-context/) + different responsibilities. A gadget can support learning and friendship; spending isn’t automatically empty.

- Transition: ‘Sometimes money buys room in the day.’ Walk toward the waiting shed. Money connects to time rather than becoming a separate “money bad / money good” debate.

- 4 — THE WAITING SHED / QUIET CORNER: ‘Free ka, pero may energy ka pa ba?’ Travel, schedules, chores, care work, rest. [Whillans et al.](https://pubmed.ncbi.nlm.nih.gov/28739889/) on buying time; our question is also whose labor makes that time available.

- Transition: ‘And when we finally have time, bakit kailangan useful pa rin?’ The path enters the workshop. Time pressure opens into the standards we put on ourselves.

- 5 — THE WORKSHOP WITH A PHONE WINDOW: ‘Whose idea of success am I following?’ Making projects and learning can feel satisfying; optimization and comparison can also create pressure. Achievement, social upbringing, online connection, compulsory positivity. Keep Koj/TJ’s disagreement visible here too.

- Transition: ‘Hindi lahat ng pressure is just in our heads.’ A road toward the plaza shows the institutions behind individual choices. This is the zoom-out moment.

- 6 — THE PUBLIC PLAZA: ‘Sino ang may room to live well?’ [Galtung](https://journals.sagepub.com/doi/10.1177/002234336900600301), [Mosse](https://www.tandfonline.com/doi/abs/10.1080/00220388.2010.487095), [Harvey](https://academic.oup.com/book/40603), [Sen](https://sen.scholars.harvard.edu/publications/development-freedom). Structural barriers, relational poverty, market-centered responsibility, real freedom. Answer Q2: happiness is achievable partly and unequally; change can happen at personal, community, and institutional scales.

- Return path: back to the court. Same scene, fuller view. The play didn’t stop mattering; now we notice time, safety, money, care, and access behind it. Closing question: ‘What would let more people have a day like this?’

- The route answers the assignment in order: definition → personal positions → evidence and complications → current society → possible changes. The physical loop gives it a beginning and a return, kahit free exploration yung mode.

### What the reader actually sees

- Opening screen: a small court and the title ‘What makes a good day possible?’ One line: ‘Walk with us through the things that make happiness possible — and the things that get in the way.’ Buttons: ‘Walk with us’ / ‘Explore freely’ / ‘Read the reflection.’

- Guided walk: current stop highlighted on a small route strip. Entering a stop opens an inviting short panel; ‘Keep walking’ carries the reader to the next question. Optional side paths always return to the same route.

- Free walk: the same six places and the same text. A small map/list lets readers jump directly to a place, revisit it, or join the guided walk from there. Extra wandering shouldn’t contain essential arguments nobody knows how to find.

- Desktop: map + reading panel beside it. Mobile: tap a landmark, then a bottom sheet or full-width reading card. Keep the question visible, with a clear close button and ‘Next stop.’ No tiny joystick required.

- Full reading view: all six sections in order, with member names and clickable sources. Print/PDF version contains the complete argument. Helpful for submission, because the instructions ask for a digital file; a hosted URL alone may not satisfy that.

- Map can stay small while the writing stays substantial. Around 1,200–1,800 words across opening, stops, and ending could give the website the required essay-equivalent depth. The brainstorm has more material than we need to publish.

### A stop should feel like a conversation

- First: one ordinary observation or question. Then a few lines in our voices. Class concepts enter when they help us understand the scene, rather than opening every stop with a formal definition.

- Each panel needs room for a take, something that supports it, and something that complicates it. These can flow as paragraphs; hindi kailangan identical headings everywhere.

- Names attached to takes: ‘TJ’ / ‘Koj’. Let us disagree. Example: Koj on fulfillment from difficult work beside TJ on pleasure that doesn’t need to produce anything. Then explain the common question their disagreement opens.

- Use the Brainstorm tab as the content pool. Keep Koj’s wording when using his contribution; edit for length with his meaning intact. Do not assign any new opinion or memory to him.

- References inside sentences: ‘Whillans et al. studied time-saving purchases’ with the author/paper phrase linked. The reader can open the source without losing the thread of the reflection.

- Small optional source drawer: full title, year, one line on why it matters, and a link. This gives detail without forcing a bibliography into the scene.

- Reddit and other online takes can bring in a different concern or phrasing. Keep that voice as an online perspective when a specific person’s story enters; our own voice can be reflective and personal without borrowed autobiography.

- Sample WAITING SHED panel: ‘Having friends isn’t the same as having time and energy to see them. Yung “tara gala” sounds simple until schedules, pamasahe, and obligations enter. [Whillans et al.](https://pubmed.ncbi.nlm.nih.gov/28739889/) suggest that money spent on saving time can help happiness. Pero what if buying time isn’t an option? Then the question moves from spending better to whose schedules, services, and labor make rest possible.’

- Then the reader can follow ‘Back to people’ or ‘What do we expect from our free time?’ The link to another place should explain the relationship, hindi random related-content card.

### Map details that could carry meaning

- The court has people playing; bench has two bags and room for another person; market has everyday necessities beside a device stall; waiting shed has a timetable; workshop has unfinished objects; plaza has paths leading to shared services.

- Ambient details can reveal connections. A clock near the bench points toward time. A thread/message from the workshop points back to friends. A road from each stop reaches the plaza because institutions affect the whole neighborhood.

- One light interaction per stop at most. Example: click ‘people / time / cost / safety’ beside the court and gently highlight where those conditions appear. That’s an invitation to notice, not a measured causal model.

- The plaza could overlay those connections across the world. Earlier places stop looking like isolated happy activities; we see that they rely on shared arrangements.

- No artificial obstacle course where players ‘solve poverty’ by taking the right route. Constraints belong in the explanation and the voices, not in a game that makes disadvantage look like bad player choices.

- Map landmarks need short labels like ‘People’ or ‘Time’ as well as pictures. Someone who reads the list instead of the map should get the same concepts.

### Other references, only where they help

- [Kialo](https://www.kialo.com/) — the useful idea is making a take and its counterpoint easy to compare. Our panels can keep two ideas in tension without declaring a winner.

- [Nicky Case’s The Evolution of Trust](https://ncase.me/trust/) — interaction can clarify an idea when it’s small and understandable. For us, a connection reveal is probably enough; we don’t need a simulation for every theory.

- [Are.na](https://www.are.na/about) — inspiration for the source drawer as a small collection of meaningful readings. One short note explains why a book or paper is here.

- [Our World in Data’s happiness page](https://ourworldindata.org/happiness-and-life-satisfaction) — useful if we add a real chart: readable measurement, context, and source alongside it. No decorative numbers just because a website feels incomplete without data.

- [Bret Victor’s Explorable Explanations](https://worrydream.com/ExplorableExplanations/) — a reference for interaction within an explanation. The interaction should help the thought land. Walking is the main interaction already, so extra widgets are optional.

- My preferred mix now: Happy Map for the walk; Learn Anything for a small connection overview; argument cards for disagreement; a readable essay underneath everything.

### Look and scope I’d commit to

- Warm off-white / muted greens / brown paths / one accent for questions. Soft neighborhood illustration, clear dark text, short handwritten-feeling labels. Keep long reflection text in a readable normal font.

- Small character, not an elaborate game protagonist. Calm movement, no forced timers, no audio required. Accessibility: keyboard/tab access, reduced-motion option, high enough contrast, landmarks reachable through a list.

- Six stops + opening + ending + one shared source drawer. Finish that before adding more places. A small coherent neighborhood is more useful than a giant world with repetitive text.

- No live accounts, social feed, voting, happiness quiz, or backend needed for the first version. A static site can hold the complete reflection.

- Before we build, choose the final text from this braindump and Koj’s notes. Map design should follow our actual argument, not force our argument to fit random landmarks.

### Prompt to use when we’re ready to build

Build an interactive visual essay for our SOC SCI 1 midterm answering Q2 about happiness: what constitutes it, whether it is achievable in present society, and what could change. Use the supplied Brainstorm and Website ideas tabs as the content source. The main idea is: small joys are real, but the conditions for sustaining them are unequal.

Use [The Pudding’s Happy Map](https://pudding.cool/2026/02/happy-map/) as the main inspiration for moving through a landscape, and make an original small 2D or lightly isometric neighborhood. Do not reproduce its assets or text. The reader controls a small character by clicking/tapping destinations; provide keyboard access and a Next stop button. Walking should be calm and easy. The complete reflection must also be available as a continuous reading and print view.

Use this exact guided route: Court → Friendship bench → Small market → Waiting shed / quiet corner → Workshop with a phone window → Public plaza → Return to court. Court introduces pleasure versus living well; bench introduces care and belonging; market introduces security and unequal ideas of enough; waiting shed introduces time and the labor behind rest; workshop introduces meaning, achievement, comparison, and pressure; plaza connects these to structural barriers and possible changes. Returning to the court revisits the opening joy with its conditions now visible.

Provide guided walking and free exploration through the same content. At each landmark, show a short opening question and a readable reflection panel. Keep TJ and Koj’s voices distinct, including their disagreement about fulfillment from difficulty versus pleasure without a productive outcome. Write conversational Taglish grounded in the supplied notes. Do not invent memories or quotes for any member. Use ordinary observations to connect scenes with concepts.

Use clickable author names, paper titles, or meaningful phrases in the sentences. Put full source details in an optional drawer. Connect evidence to the actual claim and keep relevant limits, especially US income findings, the local Koronadal sample, and differences between happiness and health outcomes. Online anecdotes may add a perspective but must not be presented as a group member’s biography or as population evidence.

Use warm off-white, muted green, brown paths, clear dark text, simple illustrations, and one accent for unresolved questions. Desktop uses map and reading panel side by side; mobile uses tap-to-move landmarks and a clear reading sheet. Include clear back/next controls, a map/list alternative, reduced motion, keyboard navigation, and a complete print view. Scope the first version to six stops, opening, ending, and source drawer. Do not add happiness scores, quizzes, a social feed, or a complex simulation.

Before implementing, summarize the narrative route and chosen content briefly. Then build the working site and check that both the guided path and the full reading view contain the complete answer. The map should make the argument easier to follow, and the ending should answer: what would let more people have a good day?
