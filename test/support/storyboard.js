/**
 * Reads the editorial storyboard the way an editor does.
 *
 * `docs/storyboard.md` is the source of truth for the essay's prose: the
 * chapters, the beats, the exact narrator text, the exact dialogue with its
 * standing and its notes reference, and the caveats that must stay on the main
 * reading path. `content/content.json` is what the website is built from. This
 * parser exists so the two can be compared sentence by sentence rather than
 * trusted to have stayed in step.
 *
 * Everything inside a blockquote in a scene block is main-path prose. The
 * **order** the blockquotes appear in is editorial too: twenty beats answer
 * before the narrator explains, and five state a caveat before the line it
 * qualifies. That order is what `scenes[].mainPath` has to reproduce, so the
 * blocks are returned in document order rather than grouped by kind.
 *
 * Nothing here is clever. A field this parser cannot read is a field the test
 * reports rather than skips, because a comparison that quietly matched nothing
 * would pass for the wrong reason.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot } from '../helpers.js';

const STORYBOARD = join(repoRoot, 'docs/storyboard.md');

/** Strips the markdown emphasis the prose uses for the landing's question. */
const plain = (text) => text.replace(/\*\*/g, '').replace(/(^|\s)\*(\S[^*]*)\*/g, '$1$2').trim();

/** One blockquote, as the paragraphs it holds. A blank `>` line separates them. */
function quotedParagraphs(lines) {
  const paragraphs = [];
  let current = [];
  for (const line of lines) {
    const text = line.replace(/^\s*>\s?/, '');
    if (text.trim() === '') {
      if (current.length > 0) paragraphs.push(current.join(' '));
      current = [];
      continue;
    }
    current.push(text.trim());
  }
  if (current.length > 0) paragraphs.push(current.join(' '));
  return paragraphs.map(plain);
}

/** The figures a scene places, and the expression states named beside them. */
function parseCast(line) {
  const cast = [];
  // One cast line ends with a prose note after an em dash ("— mixed, including
  // joy, fatigue and reflection"). The names are what comes before it.
  const [names] = line.split('—');
  // `tj` `koj` (`reflection`), `vier` (`joy`) — names, then a bracketed state
  // that belongs either to the name before it or to the run of names before it.
  const tokens = names.matchAll(/`([a-z-]+)`(?:\s*\(([^)]*)\))?/g);
  let pending = [];
  for (const [, name, states] of tokens) {
    pending.push(name);
    if (states === undefined) continue;
    const expressions = [...states.matchAll(/`([a-z-]+)`/g)].map((match) => match[1]);
    for (const figure of pending) cast.push({ figure, expressions });
    pending = [];
  }
  for (const figure of pending) cast.push({ figure, expressions: [] });
  return cast.filter((entry) => entry.figure !== 'narrator');
}

/**
 * Every authored beat, in document order.
 *
 * @returns {Array<{
 *   id: string, chapter: string, title: string,
 *   cast: Array<{figure: string, expressions: string[]}>,
 *   blocks: Array<{kind: 'narration'|'dialogue'|'limitations', text: string,
 *                  speaker?: string, stance?: string, notes?: string, expression?: string}>,
 *   sources: string[], concepts: string, staticDescription: string,
 *   optionalDetail: string, transition: string, provenance: string, status: string,
 * }>}
 */
export function readStoryboard() {
  const lines = readFileSync(STORYBOARD, 'utf8').split('\n');
  const scenes = [];
  let chapter = null;
  let scene = null;
  let mode = null; // which blockquote section we are inside
  let buffer = [];
  let dialogueLine = null;

  const flush = () => {
    if (mode === 'narration' && buffer.length > 0) {
      for (const text of quotedParagraphs(buffer)) scene.blocks.push({ kind: 'narration', text });
    }
    if (mode === 'limitations' && buffer.length > 0) {
      for (const text of quotedParagraphs(buffer)) scene.blocks.push({ kind: 'limitations', text });
    }
    if (mode === 'dialogue' && dialogueLine && buffer.length > 0) {
      scene.blocks.push({ ...dialogueLine, kind: 'dialogue', text: quotedParagraphs(buffer).join(' ') });
      dialogueLine = null;
    }
    buffer = [];
  };

  for (const line of lines) {
    const chapterHeading = line.match(/^## `(c\d)` — (.*)$/);
    if (chapterHeading) {
      flush();
      mode = null;
      chapter = { id: chapterHeading[1], title: chapterHeading[2].trim() };
      continue;
    }

    const sceneHeading = line.match(/^#### `(s\d{3})` — (.*)$/);
    if (sceneHeading) {
      flush();
      mode = null;
      scene = {
        id: sceneHeading[1],
        chapter: chapter.id,
        chapterTitle: chapter.title,
        title: sceneHeading[2].trim(),
        cast: [],
        blocks: [],
        sources: [],
        concepts: '',
        staticDescription: '',
        optionalDetail: '',
        transition: '',
        provenance: '',
        status: '',
      };
      scenes.push(scene);
      continue;
    }

    if (scene === null) continue;
    if (/^---\s*$/.test(line) || /^## /.test(line)) {
      flush();
      mode = null;
      scene = null;
      continue;
    }

    const field = line.match(/^- ([A-Za-z/ ]+):\s?(.*)$/);
    if (field) {
      flush();
      const [, name, rest] = field;
      if (name === 'Narrator') mode = 'narration';
      else if (name === 'Visible caveat') mode = 'limitations';
      else if (name === 'Dialogue') mode = 'dialogue';
      else {
        mode = null;
        if (name === 'Cast') scene.cast = parseCast(rest);
        if (name === 'Sources/concepts') {
          scene.sources = [...rest.matchAll(/R\d{2}/g)].map((match) => match[0]);
          scene.concepts = rest;
        }
        if (name === 'Static description') scene.staticDescription = rest.trim();
        if (name === 'Optional detail') scene.optionalDetail = rest.trim();
        if (name === 'Transition') scene.transition = rest.trim();
        if (name === 'Provenance') scene.provenance = rest.trim();
        if (name === 'Status') scene.status = rest.trim();
      }
      continue;
    }

    // A dialogue line's own header: speaker, standing, notes, expression.
    const spoken = line.match(/^\s{2}- `([a-z-]+)` — ([a-z- ]+?)(?: \(([^)]*)\))? — `([a-z-]+)`\s*$/);
    if (spoken && mode === 'dialogue') {
      flush();
      mode = 'dialogue';
      dialogueLine = { speaker: spoken[1], stance: spoken[2].trim(), notes: spoken[3] ?? '', expression: spoken[4] };
      continue;
    }

    if (/^\s*>/.test(line)) {
      buffer.push(line);
      continue;
    }

    if (line.trim() === '') continue;
  }
  flush();

  return scenes;
}

/** The chapters, with their ordered scene identifiers. */
export function storyboardChapters(scenes = readStoryboard()) {
  const chapters = [];
  for (const scene of scenes) {
    let chapter = chapters.find((entry) => entry.id === scene.chapter);
    if (!chapter) {
      chapter = { id: scene.chapter, title: scene.chapterTitle, sceneIds: [] };
      chapters.push(chapter);
    }
    chapter.sceneIds.push(scene.id);
  }
  return chapters;
}
