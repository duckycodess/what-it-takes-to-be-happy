/**
 * A small DOM for running the real browser script against the real markup.
 *
 * The project has no dependencies, and a headless browser cannot be assumed
 * on every machine that runs `npm test`. This file is the always-available
 * half of the reader's verification: it parses the document the renderer
 * actually produced and runs `src/runtime/reader.js` unmodified against it.
 * `test/browser.test.js` is the other half and runs the same journeys in
 * Chrome when one is installed.
 *
 * It is deliberately a subset, and the subset is the point. What it supports
 * is exactly what the browser script asks for, and `test/dom.test.js` pins
 * that down so this file cannot quietly answer a question wrongly:
 *
 *   Parsing      Well-formed markup with the HTML void elements, quoted or
 *                bare attribute values, comments, and raw text in <script>,
 *                <style>, and <pre>. No implied end tags, no error recovery.
 *   Selectors    Comma-separated lists of compound selectors built from a tag
 *                name, `#id`, `.class`, `[attr]`, and `[attr="value"]`,
 *                joined by descendant combinators. Nothing else; an
 *                unsupported selector throws rather than silently matching
 *                nothing.
 *   Events       Listeners fire on the node they were registered on. There is
 *                no bubbling and no capture, because no listener in the
 *                browser script relies on either: they sit on the element
 *                itself, on `document` (keydown), or on `window`.
 *   Layout       None. `scrollIntoView` and `scrollTo` are recorded, not
 *                performed, and nothing here knows what a stylesheet says.
 *                What a view actually hides is a question for the browser.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { repoRoot } from '../helpers.js';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT = new Set(['script', 'style', 'pre', 'textarea', 'title']);

/* --- Nodes --------------------------------------------------------------- */

class TextNode {
  constructor(data) {
    this.nodeType = 3;
    this.data = data;
    this.parentNode = null;
  }

  get textContent() {
    return this.data;
  }
}

class Element {
  constructor(tagName, attributes) {
    this.nodeType = 1;
    this.tagName = tagName.toUpperCase();
    this.localName = tagName.toLowerCase();
    this.attributes = new Map(attributes);
    this.childNodes = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.ownerDocument = null;
    this.scrollCalls = 0;
    this.focusCalls = 0;
  }

  /* --- Attributes --- */

  getAttribute(name) {
    const value = this.attributes.get(name.toLowerCase());
    return value === undefined ? null : value;
  }

  setAttribute(name, value) {
    this.attributes.set(name.toLowerCase(), String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name.toLowerCase());
  }

  hasAttribute(name) {
    return this.attributes.has(name.toLowerCase());
  }

  toggleAttribute(name, force) {
    const wanted = force === undefined ? !this.hasAttribute(name) : !!force;
    if (wanted) this.setAttribute(name, '');
    else this.removeAttribute(name);
    return wanted;
  }

  get classList() {
    const element = this;
    const read = () => (element.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    return {
      contains: (name) => read().includes(name),
      add: (name) => {
        const list = read();
        if (!list.includes(name)) element.setAttribute('class', [...list, name].join(' '));
      },
      remove: (name) => element.setAttribute('class', read().filter((entry) => entry !== name).join(' ')),
    };
  }

  /* --- Reflected properties the browser script uses --- */

  get hidden() { return this.hasAttribute('hidden'); }

  set hidden(value) { this.toggleAttribute('hidden', value); }

  get disabled() { return this.hasAttribute('disabled'); }

  set disabled(value) { this.toggleAttribute('disabled', value); }

  get isContentEditable() { return this.hasAttribute('contenteditable'); }

  /**
   * `<details open>`. A real browser queues the `toggle` event rather than
   * firing it inside the assignment, and the browser script is written to
   * survive that, so this queues it too; a synchronous event here would let a
   * timing bug pass.
   */
  get open() { return this.hasAttribute('open'); }

  set open(value) {
    const wanted = !!value;
    if (wanted === this.open) return;
    this.toggleAttribute('open', wanted);
    if (this.localName !== 'details') return;
    const queue = this.ownerDocument ? this.ownerDocument.pendingToggles : null;
    if (queue) queue.push(() => this.dispatchEvent({ type: 'toggle' }));
    else this.dispatchEvent({ type: 'toggle' });
  }

  /* --- Tree --- */

  get children() {
    return this.childNodes.filter((node) => node.nodeType === 1);
  }

  get textContent() {
    return this.childNodes.map((node) => node.textContent).join('');
  }

  set textContent(value) {
    this.childNodes = [];
    if (value !== '') this.appendChild(new TextNode(String(value)));
  }

  appendChild(node) {
    node.parentNode = this;
    if (node.nodeType === 1) node.ownerDocument = this.ownerDocument;
    this.childNodes.push(node);
    return node;
  }

  /* --- Selection --- */

  matches(selector) {
    return parseSelector(selector).some((steps) => matchesCompound(this, steps[steps.length - 1]) && matchesAncestry(this, steps));
  }

  closest(selector) {
    const groups = parseSelector(selector);
    for (let node = this; node; node = node.parentNode) {
      if (node.nodeType !== 1) continue;
      if (groups.some((steps) => matchesCompound(node, steps[steps.length - 1]) && matchesAncestry(node, steps))) return node;
    }
    return null;
  }

  /** `node.contains(node)` is true in a browser, so it is true here. */
  contains(other) {
    for (let node = other; node; node = node.parentNode) {
      if (node === this) return true;
    }
    return false;
  }

  querySelectorAll(selector) {
    const groups = parseSelector(selector);
    const found = [];
    for (const node of descendants(this)) {
      if (groups.some((steps) => matchesCompound(node, steps[steps.length - 1]) && matchesAncestry(node, steps, this))) found.push(node);
    }
    return found;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  /* --- Events and behaviour --- */

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  dispatchEvent(event) {
    const handlers = this.listeners.get(event.type) || [];
    const full = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...event };
    if (!full.target) full.target = this;
    for (const handler of [...handlers]) handler.call(this, full);
    return !full.defaultPrevented;
  }

  focus() {
    this.focusCalls += 1;
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  scrollIntoView() {
    this.scrollCalls += 1;
    if (this.ownerDocument) this.ownerDocument.lastScrolledInto = this;
  }
}

function* descendants(root) {
  for (const child of root.childNodes) {
    if (child.nodeType !== 1) continue;
    yield child;
    yield* descendants(child);
  }
}

/* --- Selectors ------------------------------------------------------------ */

const SELECTOR_CACHE = new Map();

/**
 * `"a, .b c[d='e']"` becomes `[[compound], [compound, compound]]`, where a
 * compound is `{ tag, classes, attributes }`. Anything outside the supported
 * subset throws, so a selector this file cannot answer is never reported as
 * "nothing matched".
 */
function parseSelector(selector) {
  const cached = SELECTOR_CACHE.get(selector);
  if (cached) return cached;

  const groups = selector.split(',').map((group) => group.trim()).filter(Boolean).map((group) =>
    group.split(/\s+/).map((part) => {
      const compound = { tag: null, classes: [], attributes: [] };
      const tokens = part.match(/^[a-zA-Z][\w-]*|[.#][\w-]+|\[[^\]]*\]/g);
      if (!tokens || tokens.join('') !== part) {
        throw new Error(`test/support/dom.js does not implement the selector ${JSON.stringify(selector)}`);
      }
      for (const token of tokens) {
        if (token.startsWith('.')) compound.classes.push(token.slice(1));
        else if (token.startsWith('#')) compound.attributes.push({ name: 'id', value: token.slice(1) });
        else if (token.startsWith('[')) compound.attributes.push(parseAttributeToken(token, selector));
        else compound.tag = token.toUpperCase();
      }
      return compound;
    }));

  SELECTOR_CACHE.set(selector, groups);
  return groups;
}

function parseAttributeToken(token, selector) {
  const body = token.slice(1, -1);
  const present = body.match(/^([\w-]+)$/);
  if (present) return { name: present[1], value: null };
  const equals = body.match(/^([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^"'\s]+))$/);
  if (!equals) throw new Error(`test/support/dom.js does not implement the selector ${JSON.stringify(selector)}`);
  const raw = equals[2] ?? equals[3] ?? equals[4];
  return { name: equals[1], value: raw.replace(/\\(.)/g, '$1') };
}

function matchesCompound(element, compound) {
  if (compound.tag && element.tagName !== compound.tag) return false;
  for (const name of compound.classes) {
    if (!element.classList.contains(name)) return false;
  }
  for (const attribute of compound.attributes) {
    if (!element.hasAttribute(attribute.name)) return false;
    if (attribute.value !== null && element.getAttribute(attribute.name) !== attribute.value) return false;
  }
  return true;
}

/** Walks the descendant combinators to the left of the matched compound. */
function matchesAncestry(element, steps, boundary) {
  let node = element.parentNode;
  for (let i = steps.length - 2; i >= 0; i -= 1) {
    let matched = false;
    while (node && node.nodeType === 1) {
      if (node === boundary) break;
      if (matchesCompound(node, steps[i])) { matched = true; node = node.parentNode; break; }
      node = node.parentNode;
    }
    if (!matched) return false;
  }
  return true;
}

/* --- Parsing -------------------------------------------------------------- */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", mdash: '—', middot: '·', nbsp: ' ' };

const decode = (text) => text.replace(/&(#?\w+);/g, (whole, name) => (name in ENTITIES ? ENTITIES[name] : whole));

/**
 * Parses the renderer's output. It assumes well-formed markup: the renderer
 * closes everything it opens, so there is no error recovery here, and a
 * malformed document is better reported as a parse failure than silently
 * reshaped into something the browser would never build.
 */
export function parseHtml(html) {
  const document = new HtmlDocument();
  const rootHolder = new Element('#root', []);
  rootHolder.ownerDocument = document;
  const stack = [rootHolder];
  let index = 0;

  const top = () => stack[stack.length - 1];

  while (index < html.length) {
    const open = html.indexOf('<', index);
    if (open < 0) {
      pushText(top(), html.slice(index));
      break;
    }
    if (open > index) pushText(top(), html.slice(index, open));

    if (html.startsWith('<!--', open)) {
      const end = html.indexOf('-->', open);
      index = end < 0 ? html.length : end + 3;
      continue;
    }
    if (html.startsWith('<!', open)) {
      const end = html.indexOf('>', open);
      index = end < 0 ? html.length : end + 1;
      continue;
    }
    if (html.startsWith('</', open)) {
      const end = html.indexOf('>', open);
      const name = html.slice(open + 2, end).trim().toLowerCase();
      if (top().localName !== name) {
        throw new Error(`Unbalanced markup: </${name}> closes <${top().localName}>`);
      }
      stack.pop();
      index = end + 1;
      continue;
    }

    const end = findTagEnd(html, open);
    const source = html.slice(open + 1, end);
    const [, name, rest = ''] = source.match(/^([a-zA-Z][\w-]*)([\s\S]*)$/) || [];
    if (!name) throw new Error(`Unparsable tag at offset ${open}`);
    const element = new Element(name, parseAttributes(rest));
    element.ownerDocument = document;
    top().appendChild(element);
    index = end + 1;

    const selfClosed = rest.trimEnd().endsWith('/');
    if (VOID.has(element.localName) || selfClosed) continue;

    if (RAW_TEXT.has(element.localName)) {
      const closing = html.indexOf(`</${element.localName}`, index);
      const stop = closing < 0 ? html.length : closing;
      if (stop > index) element.appendChild(new TextNode(html.slice(index, stop)));
      index = stop < html.length ? html.indexOf('>', stop) + 1 : stop;
      continue;
    }
    stack.push(element);
  }

  if (stack.length !== 1) throw new Error(`Unclosed element <${top().localName}>`);

  document.documentElement = rootHolder.children.find((child) => child.localName === 'html') || rootHolder;
  document.root = rootHolder;
  document.body = document.documentElement.children.find((child) => child.localName === 'body')
    || document.documentElement;
  document.activeElement = document.body;
  return document;
}

/** The first `>` that is not inside a quoted attribute value. */
function findTagEnd(html, open) {
  let quote = null;
  for (let i = open + 1; i < html.length; i += 1) {
    const character = html[i];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return i;
    }
  }
  throw new Error(`Unterminated tag at offset ${open}`);
}

function parseAttributes(source) {
  const attributes = [];
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const [, name, doubled, singled, bare] = match;
    if (name === '/') continue;
    attributes.push([name.toLowerCase(), decode(doubled ?? singled ?? bare ?? '')]);
  }
  return attributes;
}

function pushText(parent, text) {
  if (text === '') return;
  parent.appendChild(new TextNode(decode(text)));
}

/* --- Document, window, and the script under test -------------------------- */

class HtmlDocument {
  constructor() {
    this.nodeType = 9;
    this.documentElement = null;
    this.body = null;
    this.root = null;
    // A browser never answers `null` here: with nothing focused the answer is
    // the body, which is what `test/browser.test.js` measures in Chrome. The
    // parser sets it as soon as there is a body to point at.
    this.activeElement = null;
    this.lastScrolledInto = null;
    this.listeners = new Map();
    this.pendingToggles = [];
  }

  getElementById(id) {
    for (const node of descendants(this.root)) {
      if (node.getAttribute('id') === id) return node;
    }
    return null;
  }

  querySelectorAll(selector) { return this.root.querySelectorAll(selector); }

  querySelector(selector) { return this.root.querySelector(selector); }

  addEventListener(type, handler) { Element.prototype.addEventListener.call(this, type, handler); }

  dispatchEvent(event) { return Element.prototype.dispatchEvent.call(this, event); }
}

/**
 * Loads a rendered document and runs the real browser script against it.
 *
 * @param {string} html the renderer's output
 * @param {{hash?: string, history?: boolean|'throws', narrow?: boolean}} [options]
 *   `history` models the two ways a browser can refuse the History API on a
 *   file:// document: `false` removes `pushState` altogether, and `'throws'`
 *   keeps it but makes every call raise a `SecurityError`, which is what a
 *   browser that dislikes the document's origin actually does. The script has
 *   to reach the same fallback either way.
 *
 *   `narrow` is the one thing the script asks the *stylesheet*: whether the
 *   window is narrow enough that the chapter rail is being presented as a
 *   drawer. There is no layout here to measure, so the answer is given rather
 *   than computed, and `page.resizeTo(narrow)` changes it afterwards the way a
 *   rotated phone or a dragged window edge would. What the two arrangements
 *   then look like is a question for `test/browser.test.js`.
 */
export function openDocument(html, options = {}) {
  const document = parseHtml(html);
  const scriptSource = readFileSync(join(repoRoot, 'src/runtime/reader.js'), 'utf8');

  const page = {
    document,
    hashChanges: [],
    historyEntries: [],
    scrollPositions: [],
    historyRefusals: 0,
    prints: 0,
    mediaQueries: [],
  };

  const location = {
    _hash: options.hash || '',
    // A citation link carries the originating scene and reading mode in a
    // query, and the Sources & Credits page reads them back from here. The
    // essay writes it too: the fragment is where the reader is and the query
    // is how they are reading, so a reloaded or shared URL opens both.
    search: options.search || '',
    pathname: options.pathname || '/index.html',
    get hash() { return this._hash; },
    set hash(value) {
      const next = String(value).startsWith('#') ? String(value) : `#${value}`;
      if (next === this._hash) return;
      this._hash = next;
      page.hashChanges.push(next);
      // Assigning the fragment adds a history entry too; that is the whole
      // reason it is a usable fallback when `pushState` is refused.
      // Assigning the fragment carries no state object, which is exactly
      // why the script has to be able to infer the view without one.
      page.historyEntries.push({ hash: next, search: this.search, state: null });
      window.dispatchEvent({ type: 'hashchange' });
    },
  };

  const history = {
    pushState(state, title, url) { apply(url, state, false); },
    replaceState(state, title, url) { apply(url, state, true); },
  };

  /**
   * What `pushState`/`replaceState` do to the address.
   *
   * A browser resolves the given URL against the current one and updates the
   * whole address, not only its fragment: `?view=continuous#s105` changes the
   * query *and* the fragment, and `/index.html#s105` clears the query. The
   * script relies on both, so this models both rather than treating every
   * argument as a fragment.
   */
  function apply(url, state, replace) {
    const next = String(url);
    const hashAt = next.indexOf('#');
    const hash = hashAt < 0 ? '' : next.slice(hashAt);
    const before = hashAt < 0 ? next : next.slice(0, hashAt);

    if (before.startsWith('?')) location.search = before;
    else if (before !== '') location.search = '';          // a path clears the query
    if (hash !== '' || before !== '') location._hash = hash;

    const entry = { hash: location._hash, search: location.search, state: state ?? null };
    if (replace) page.historyEntries[page.historyEntries.length - 1] = entry;
    else page.historyEntries.push(entry);
  }

  // Loading a document with a fragment is itself a history entry, so Back
  // from the first move returns to the deep link rather than to nothing.
  page.historyEntries.push({ hash: location._hash, search: location.search, state: null });

  if (options.history === false) {
    delete history.pushState;
    delete history.replaceState;
  } else if (options.history === 'throws') {
    // A real SecurityError is thrown by the call, not by its absence, so the
    // methods stay in place and feature detection still finds them.
    const refuse = () => {
      page.historyRefusals += 1;
      const error = new Error('Failed to execute \'pushState\' on \'History\': A history state object with URL of scheme file cannot be created in a document with origin \'null\'.');
      error.name = 'SecurityError';
      throw error;
    };
    history.pushState = refuse;
    history.replaceState = refuse;
  }

  /**
   * Width and motion queries have independent answers, as in a browser.
   *
   * A real `MediaQueryList` keeps answering as the window changes and tells
   * its listeners when the answer flips. So does this, which is what lets a
   * test turn a desktop window into a phone and watch what the script does
   * about it.
   */
  const media = {
    matches: options.narrow === true,
    listeners: [],
    addEventListener(type, handler) { if (type === 'change') this.listeners.push(handler); },
  };
  const motion = { matches: options.reduced === true, addEventListener() {} };

  const window = {
    document,
    location,
    history,
    addEventListener(type, handler) { Element.prototype.addEventListener.call(this, type, handler); },
    dispatchEvent(event) { return Element.prototype.dispatchEvent.call(this, event); },
    listeners: new Map(),
    scrollTo(x, y) { page.scrollPositions.push([x, y]); },
    print() { page.prints += 1; },
    matchMedia: (query) => {
      page.mediaQueries.push(query);
      return query === '(prefers-reduced-motion: reduce)' ? motion : media;
    },
  };

  page.window = window;
  page.location = location;

  runInNewContext(scriptSource, { window, document, location, history });

  /* --- Driving the page ------------------------------------------------- */

  /** Runs the `toggle` events a real browser would have queued by now. */
  page.settle = () => {
    while (document.pendingToggles.length > 0) document.pendingToggles.shift()();
  };

  page.click = (element) => {
    if (!element) throw new Error('Nothing to click');
    element.dispatchEvent({ type: 'click' });
    page.settle();
  };

  page.press = (key, target = document.activeElement || document.documentElement) => {
    document.dispatchEvent({ type: 'keydown', key, target, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false });
    page.settle();
  };

  /**
   * The browser's Back button. Both events are dispatched because which one a
   * real browser fires depends on whether the entry was pushed or came from
   * assigning the fragment, and the script has to cope with either.
   */
  page.goBack = () => {
    if (page.historyEntries.length <= 1) throw new Error('Back would leave the document');
    page.historyEntries.pop();
    const entry = page.historyEntries[page.historyEntries.length - 1];
    location._hash = entry.hash;
    if (entry.search !== undefined) location.search = entry.search;
    window.dispatchEvent({ type: 'popstate', state: entry.state });
    window.dispatchEvent({ type: 'hashchange' });
    page.settle();
  };

  /** A fragment typed into the address bar. */
  page.navigateTo = (hash) => {
    location.hash = hash;
    page.settle();
  };

  /** The window crossing the width at which the rail becomes a drawer. */
  page.resizeTo = (narrow) => {
    if (media.matches === narrow) return;
    media.matches = narrow;
    for (const handler of [...media.listeners]) handler({ matches: narrow });
    page.settle();
  };

  /* --- Reading the page -------------------------------------------------- */

  /** The address as a reader would copy it: query and fragment together. */
  page.address = () => `${location.search}${location.hash}`;
  page.view = () => document.documentElement.getAttribute('data-view');
  page.currentScene = () => document.querySelector('[data-scene][data-current]');
  page.currentSceneId = () => {
    const scene = page.currentScene();
    return scene ? scene.getAttribute('data-scene') : null;
  };
  page.scenes = () => document.querySelectorAll('[data-scene]');
  page.comparisons = () => document.querySelectorAll('.art-comparison');

  /** Whether the reader has the chapter rail open, as the script records it. */
  page.rail = () => document.documentElement.getAttribute('data-rail');

  /** The chapters whose parts are expanded, in rail order. */
  page.expandedChapters = () => document.querySelectorAll('[data-chapter-toggle]')
    .filter((button) => button.getAttribute('aria-expanded') === 'true')
    .map((button) => button.getAttribute('data-chapter-toggle'));

  /** The parts a reader could tab to: those of an expanded chapter. */
  page.visibleParts = () => document.querySelectorAll('[data-rail-parts]')
    .filter((list) => !list.hidden)
    .flatMap((list) => list.querySelectorAll('[data-part-link]'))
    .map((link) => link.getAttribute('data-part-link'));

  /** The part the rail marks as the one being read. */
  page.currentPart = () => {
    const link = document.querySelector('[data-part-link][aria-current]');
    return link ? link.getAttribute('data-part-link') : null;
  };

  /**
   * What holds focus, and what was last scrolled to, as short strings.
   *
   * Both answer with a name rather than an element on purpose. Comparing two
   * elements with `assert.equal` reads well until it fails, at which point
   * the runner formats a cyclic document into the diff and the test process
   * dies of heap exhaustion instead of reporting the mismatch. `'body'` is
   * what a browser reports when nothing is focused, which is the same answer
   * `probe.activeId()` collects from Chrome in `test/browser.test.js`.
   */
  const name = (element) => {
    if (!element) return null;
    if (element === document.body) return 'body';
    return element.getAttribute('id') || element.getAttribute('data-scene') || element.localName;
  };
  page.focused = () => name(document.activeElement);
  page.scrolledInto = () => name(document.lastScrolledInto);
  page.find = (selector) => document.querySelector(selector);
  page.text = (selector) => {
    const element = document.querySelector(selector);
    return element ? element.textContent.replace(/\s+/g, ' ').trim() : null;
  };

  page.settle();
  return page;
}
