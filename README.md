![TJ, Koj and Vier sitting together around a basketball](assets/generated/rewrite-opening-v1/opening.png)

# What it takes to be happy?

### Read it here: [what-it-takes-to-be-happy.vercel.app](https://what-it-takes-to-be-happy.vercel.app)

*What it takes to be happy?* is an illustrated essay about a question that sounds simple until three friends try to answer it together. It starts on an ordinary afternoon and follows TJ, Koj and Vier as they disagree about whether happiness is pleasure, meaningful effort or the freedom to choose. Along the way it asks who actually has the time, security and company that a happy life seems to need.

It is meant to be read the way a picture book is paged through: one short illustrated passage at a time, with Next and Back. It works on phones and computers, and anyone can jump between chapters or print the whole essay.

## Why we made it

We made this essay for **Kert Tandog's Social Science 1 class**. The assignment asked what happiness means, what makes it up, whether it is achievable in present society, and what could change so that more people can reach it.

We did not want to reduce that to one tidy definition. The essay keeps our disagreements in view: Koj's case for difficulty that means something, TJ's defence of rest and pleasure that do not have to be productive, and Vier's attention to who gets to decide what a good life is. It then widens from our own student lives to workers, caregivers, different households and people who need time alone. Throughout, it tries to be honest about what our research can and cannot show.

The essay runs across eight chapters and 31 short parts:

1. An ordinary afternoon
2. A good day and a good life
3. Does enjoyment have to be useful?
4. The life we are told to want
5. Being with people, having room for yourself
6. Who can make time?
7. What would make room?
8. Back to the afternoon

Every claim that rests on research is numbered, and each number leads to the full citation on the **Sources & Credits** page, which lists 29 references.

## Made by

**Tristan Jovan Noval, John Ranview Vonne Olano and Koji Araneta Yamane**, who appear in the essay as TJ, Koj and Vier.

The friends who appear alongside us are fictional illustrations, there to make a point easier to picture. They are not evidence and do not stand for real people.

## Credits

This essay would not look, sound or feel the way it does without the generous, openly shared work of others.

**Inspiration:** Nicky Case's [*The Evolution of Trust*](https://ncase.me/trust/) showed us how an argument can be told with simple drawings, short pages and a handwritten voice. Our characters, scenes and argument are our own.

**From *The Evolution of Trust*** ([CC0](https://github.com/ncase/trust/blob/gh-pages/LICENSE), copied unchanged and listed in [`assets/ui/trust/`](assets/ui/trust/README.md)):

* The hand-drawn scribble that erases each page and reveals the next
* The two scratching sounds that go with it
* The three button click sounds
* The speaker icon that turns sound on and off

**Font:** [Futura Handwritten](https://www.dafont.com/futurahandwritten.font) by Billy Snyder, whose note reads *"Feel free to use this font for anything you want."* [DejaVu Sans](https://dejavu-fonts.github.io/) stands in wherever it cannot be used, under its own licence. Both are recorded in [`assets/fonts/`](assets/fonts/README.md).

**Illustrations:** original generated illustrations based on our own character study, with each character's name written above them as real text.

**Research:** the 29 sources listed on the essay's Sources & Credits page, from philosophy and psychology to studies of work, time and income.

## Built with

The site is deliberately small, with no frameworks and nothing to install:

* **HTML, CSS and plain JavaScript** for the reader itself, so the whole essay is still there with scripting off and when printed
* **Node.js** to turn one content file into the finished pages, and to check that the published words are exactly the approved essay
* **Node's built-in test runner and headless Chrome** for more than 250 automated checks of the reading experience on phone and desktop sizes
* **[Vercel](https://vercel.com/)** for hosting. Every change to `main` is published automatically.

## Working on it

You need Node.js 24. There are no packages to download.

```
npm run build     # build the site into dist/
npm run preview   # open the built site at http://localhost:4173
npm run check     # validate the essay, run every test, and build
```

How the project is organised, why each decision was made and how the essay was checked are written up in [`docs/`](docs/). Start with the [project brief](docs/brief.md) and the [decisions record](docs/decisions.md).

## Rights

© 2026 Tristan Jovan Noval, John Ranview Vonne Olano and Koji Araneta Yamane. The essay's writing and illustrations are not released under an open licence. Everything listed under Credits keeps its own terms.
