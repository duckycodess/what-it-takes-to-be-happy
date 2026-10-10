/*
 * Browser script for the essay.
 *
 * A classic script, not a module: the offline file is opened straight from
 * disk, where module loading is blocked by the browser's file:// origin rules.
 *
 * The whole essay is already in the markup. This script only chooses what is
 * on screen, so with scripting unavailable, in print, and in any view, the
 * complete argument is still there.
 *
 * Three rules it keeps:
 *
 *   The fragment is the state. Every move writes one, every fragment can be
 *   read back, and the browser's Back button therefore works without this
 *   script keeping a history of its own.
 *
 *   A move is announced once. Focus goes to the newly selected beat, which
 *   has an accessible name, and nothing else is a live region.
 *
 *   A panel a reader opened or closed stays that way. The view decides only
 *   what a reader has not decided for themselves.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
  if (scenes.length === 0) return;

  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  var chapterLinks = Array.prototype.slice.call(document.querySelectorAll('[data-chapter-link]'));
  var sourceLinks = Array.prototype.slice.call(document.querySelectorAll('[data-source-link]'));
  var sourcesLinks = Array.prototype.slice.call(document.querySelectorAll('[data-sources-link]'));
  var beginLink = document.querySelector('[data-begin]');
  var backButton = document.querySelector('[data-back]');
  var nextButton = document.querySelector('[data-next]');
  var returnButton = document.querySelector('[data-return-to-beats]');
  var returnWrapper = document.querySelector('.register-return');
  var positionOutput = document.querySelector('[data-position-current]');
  var whereOutput = document.querySelector('[data-position-where]');
  var boundaryOutput = document.querySelector('[data-position-boundary]');
  var viewToggle = document.querySelector('[data-view-toggle]');
  var register = document.getElementById('sources');
  var allDetails = Array.prototype.slice.call(document.querySelectorAll('details.detail'));

  var last = scenes.length - 1;
  var current = 0;
  var view = 'landing';

  /* --- Optional panels ---------------------------------------------------
     Each panel remembers whether a reader opened or closed it. Until they
     touch one, it follows the view: collapsed while moving beat by beat,
     where it is a reveal, and open in the continuous view, where it is just
     more text. After they touch one, their choice survives every view switch
     and every print. */

  var panels = allDetails.map(function (element) {
    return { element: element, chosen: null, applied: element.open };
  });

  /*
   * A `toggle` event does not say who caused it, and it is queued rather than
   * fired during the assignment, so a flag held across `element.open = x`
   * would already be down by the time the event arrived and every view switch
   * would be mistaken for a reader's choice. Comparing the panel's state
   * against the last value this script wrote does not depend on timing: if
   * they differ, something other than this script moved it.
   */
  panels.forEach(function (panel) {
    panel.element.addEventListener('toggle', function () {
      if (panel.element.open === panel.applied) return;
      panel.chosen = panel.element.open;
      panel.applied = panel.element.open;
    });
  });

  function writePanels(decide) {
    panels.forEach(function (panel) {
      var wanted = decide(panel);
      panel.applied = wanted;
      if (panel.element.open !== wanted) panel.element.open = wanted;
    });
  }

  function applyPanelsForView(nextView) {
    var fallback = nextView !== 'beat';
    writePanels(function (panel) {
      return panel.chosen === null ? fallback : panel.chosen;
    });
  }

  /* --- Identifiers -------------------------------------------------------
     The script reads the identifiers out of the markup it was given rather
     than carrying a second copy of the content. */

  function indexOfSceneId(id) {
    for (var i = 0; i < scenes.length; i += 1) {
      if (scenes[i].getAttribute('data-scene') === id) return i;
    }
    return -1;
  }

  function firstSceneOfChapter(chapterId) {
    for (var i = 0; i < scenes.length; i += 1) {
      if (scenes[i].getAttribute('data-chapter') === chapterId) return i;
    }
    return -1;
  }

  function chapterIndexOf(chapterId) {
    for (var i = 0; i < chapters.length; i += 1) {
      if (chapters[i].getAttribute('data-chapter') === chapterId) return i;
    }
    return -1;
  }

  /** Escapes an identifier for use inside a quoted attribute selector. */
  function cssValue(id) {
    return String(id).replace(/["\\]/g, '\\$&');
  }

  function isSourceId(id) {
    return !!(register && register.querySelector('[data-source="' + cssValue(id) + '"]'));
  }

  /**
   * What a fragment asks for. A beat identifier selects that beat; a chapter
   * identifier selects the chapter's first beat, which is what "revisit a
   * chapter" means; `sources` and any single source identifier open the
   * register in the continuous view, where the whole register is readable.
   */
  function resolve(id) {
    if (!id) return null;
    var scene = indexOfSceneId(id);
    if (scene >= 0) return { kind: 'beat', index: scene };
    var chapter = firstSceneOfChapter(id);
    if (chapter >= 0) return { kind: 'beat', index: chapter };
    if (id === 'sources' && register) return { kind: 'sources', sourceId: null };
    if (isSourceId(id)) return { kind: 'sources', sourceId: id };
    return null;
  }

  /* --- The fragment ------------------------------------------------------
     `appliedFragment` is the fragment this script believes the document is
     showing. A fragment change that matches it came from this script and is
     ignored; anything else is the reader navigating, including Back. */

  var appliedFragment = null;

  function readFragment() {
    var raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch (error) {
      return raw;
    }
  }

  /**
   * Records the fragment for the current state.
   *
   * `history.pushState` is tried first, for two reasons: Back returns to the
   * previous beat rather than leaving the essay, and the entry can carry how
   * the reader was reading, so Back out of the register restores the beats
   * rather than leaving them in the continuous view. It is wrapped because a
   * file:// document is exactly where a browser may refuse it with a
   * SecurityError, and the offline file is opened that way by design;
   * assigning `location.hash` still works there and still gives the reader a
   * usable Back, with the view inferred from the fragment instead.
   */
  function writeFragment(id, replace) {
    var samePlace = appliedFragment === id;
    appliedFragment = id;
    var target = '#' + encodeURIComponent(id);
    try {
      if (window.history && window.history.pushState) {
        // The same place read a different way updates the entry instead of
        // adding one, so switching views does not make Back stutter on the
        // same fragment — and so Back restores the view as well as the place.
        if (samePlace || replace) window.history.replaceState({ view: view }, '', target);
        else window.history.pushState({ view: view }, '', target);
        return;
      }
    } catch (error) {
      /* Falls through to the fragment assignment below. */
    }
    if (samePlace) return;
    try {
      window.location.hash = target;
    } catch (error) {
      /* A browser that allows neither keeps working; only Back is lost. */
    }
  }

  /* --- View and beat state ----------------------------------------------- */

  function applyChapterState() {
    var scene = scenes[current];
    var chapterId = scene.getAttribute('data-chapter');
    var chapter = chapters[chapterIndexOf(chapterId)] || null;
    var siblings = chapter ? Array.prototype.slice.call(chapter.querySelectorAll('[data-scene]')) : [];

    chapters.forEach(function (element) {
      if (element === chapter && view === 'beat') {
        element.setAttribute('data-current', '');
        element.toggleAttribute('data-show-opening', siblings[0] === scene);
        element.toggleAttribute('data-show-closing', siblings[siblings.length - 1] === scene);
      } else {
        element.removeAttribute('data-current');
        element.removeAttribute('data-show-opening');
        element.removeAttribute('data-show-closing');
      }
    });

    chapterLinks.forEach(function (link) {
      if (view === 'beat' && link.getAttribute('data-chapter-link') === chapterId) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Where the reader is, and whether they are at an end. The boundary line
   * says so in words because a disabled button is easy to miss and says
   * nothing about why it is disabled.
   */
  function applyProgress() {
    var scene = scenes[current];
    var chapterIndex = chapterIndexOf(scene.getAttribute('data-chapter'));
    var chapter = chapters[chapterIndex];
    var heading = chapter ? chapter.querySelector('.chapter-head h2') : null;

    if (positionOutput) positionOutput.textContent = String(current + 1);
    if (whereOutput) {
      // The chapter says whether the reader counts it. The opening is not one
      // of the shared questions, so it is named rather than numbered, and the
      // count is the number of questions rather than the number of sections.
      var number = chapter ? chapter.getAttribute('data-chapter-number') : null;
      var count = chapter ? chapter.getAttribute('data-chapter-count') : null;
      var title = heading ? heading.textContent : '';
      if (!chapter) whereOutput.textContent = '';
      else if (number) whereOutput.textContent = 'Chapter ' + number + ' of ' + count + ': ' + title;
      else whereOutput.textContent = title;
    }
    if (boundaryOutput) {
      boundaryOutput.textContent = current === 0
        ? 'This is the first beat.'
        : current === last ? 'This is the last beat.' : '';
    }
  }

  function applySceneState() {
    scenes.forEach(function (scene, index) {
      scene.toggleAttribute('data-current', index === current);
    });
    if (backButton) backButton.disabled = current === 0;
    if (nextButton) nextButton.disabled = current === last;
    applyProgress();
    applyChapterState();
  }

  function setView(nextView) {
    view = nextView;
    root.setAttribute('data-view', nextView);
    applyPanelsForView(nextView);

    if (viewToggle) {
      viewToggle.textContent = nextView === 'reading' ? 'Back to the beats' : 'Read the whole thing';
    }

    applySceneState();
  }

  function scrollToElement(element) {
    if (element && element.scrollIntoView) element.scrollIntoView({ block: 'start' });
  }

  /** The register's return control only makes sense if a beat was left behind. */
  function offerReturnToBeats(offer) {
    if (returnWrapper) returnWrapper.hidden = !offer;
  }

  /* --- Moves -------------------------------------------------------------
     Every move ends the same way: state applied, focus on what the reader
     asked for, fragment recorded. `focus: false` is for the one move the
     reader did not make — the page loading with a fragment already in the
     address bar, where taking focus would be rude rather than helpful. */

  function showBeat(index, options) {
    var settings = options || {};
    current = Math.min(Math.max(index, 0), last);
    setView('beat');
    offerReturnToBeats(true);
    // Every arrival at a beat puts that beat at the top of the window. The
    // page is taller than the beat — the draft notice and the chapter list
    // sit above it — so scrolling to the document's top would land a reader
    // on the banner instead of on the beat they asked for, whether they
    // pressed Next or followed a link.
    if (settings.focus !== false) scenes[current].focus({ preventScroll: true });
    scrollToElement(scenes[current]);
    if (settings.record !== false) writeFragment(scenes[current].getAttribute('data-scene'), settings.replace);
  }

  function showReading(options) {
    var settings = options || {};
    setView('reading');
    var target = settings.target || scenes[current];
    scrollToElement(target);
    if (settings.focus !== false && target && target.focus) target.focus({ preventScroll: true });
    if (settings.record !== false) writeFragment(scenes[current].getAttribute('data-scene'), settings.replace);
  }

  function showRegister(sourceId, options) {
    if (!register) return;
    var settings = options || {};
    if (view === 'beat') offerReturnToBeats(true);
    setView('reading');
    var entry = sourceId ? register.querySelector('[data-source="' + cssValue(sourceId) + '"]') : null;
    var target = entry || register;
    scrollToElement(target);
    if (settings.focus !== false && target.focus) target.focus({ preventScroll: true });
    if (settings.record !== false) writeFragment(sourceId || 'sources', settings.replace);
  }

  /**
   * Applies whatever the fragment currently asks for.
   *
   * A reader already in the continuous view who follows a beat fragment
   * stays in the continuous view and is taken to that beat within it. How
   * they are reading is their choice, and a fragment says where to go, not
   * how to read.
   *
   * `settings.view` overrides that: it is the view a history entry recorded,
   * which is what Back should restore. Without one — an entry written by
   * assigning the fragment, or a link a reader was sent — the current view
   * is kept.
   *
   * A fragment this script does not recognise is not an error and is not a
   * reason to move the reader. The document has landmarks of its own — the
   * skip link's `#essay`, the chapter list's `#chapters` — and following one
   * is a move *within* the page, which the browser already does correctly.
   * Throwing the reader back to the landing because they used the skip link
   * would lose the beat they were on.
   */
  function applyFragment(options) {
    var settings = options || {};
    var focus = settings.focus !== false;
    var id = readFragment();
    appliedFragment = id;
    var requested = resolve(id);
    var wanted = settings.view || view;

    if (!requested) {
      // An empty fragment is the top of the essay, and so is a first load
      // that named nothing this script knows. Afterwards, leave the view
      // alone: the reader is moving around the page they are already on.
      if (id !== '' && !settings.initial) return;
      setView('landing');
      offerReturnToBeats(false);
      window.scrollTo(0, 0);
      return;
    }
    if (requested.kind === 'sources') {
      showRegister(requested.sourceId, { record: false, focus: focus });
      return;
    }
    if (wanted === 'reading') {
      current = Math.min(Math.max(requested.index, 0), last);
      applySceneState();
      showReading({ record: false, focus: focus });
      return;
    }
    showBeat(requested.index, { record: false, focus: focus });
  }

  /* --- Wiring ------------------------------------------------------------ */

  if (beginLink) {
    beginLink.addEventListener('click', function (event) {
      event.preventDefault();
      showBeat(0);
    });
  }

  chapterLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('data-chapter-link');
      var index = firstSceneOfChapter(id);
      if (index < 0) return;
      event.preventDefault();
      // Revisiting a chapter from the continuous view keeps that view: the
      // reader asked to go somewhere, not to change how they are reading.
      if (view === 'reading') {
        current = index;
        applySceneState();
        showReading({ target: scenes[index] });
        return;
      }
      showBeat(index);
    });
  });

  sourceLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('data-source-link');
      if (!isSourceId(id)) return;
      event.preventDefault();
      showRegister(id);
    });
  });

  sourcesLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (!register) return;
      event.preventDefault();
      showRegister(null);
    });
  });

  if (returnButton) {
    returnButton.addEventListener('click', function () {
      showBeat(current);
    });
  }

  if (backButton) backButton.addEventListener('click', function () { showBeat(current - 1); });
  if (nextButton) nextButton.addEventListener('click', function () { showBeat(current + 1); });

  if (viewToggle) {
    viewToggle.addEventListener('click', function () {
      if (view === 'reading') showBeat(current);
      else showReading();
    });
  }

  /* --- Keyboard ----------------------------------------------------------
     Arrow keys move between beats only when the reader is reading, never
     when they are inside something that owns its own arrow behaviour. A
     disclosure summary, a link, a button, and a form field all do. */

  var OWNS_ARROWS = 'input, textarea, select, button, a[href], summary, details, [contenteditable]';

  function ownsArrowKeys(target) {
    if (!target || target.nodeType !== 1) return false;
    if (target.isContentEditable) return true;
    return !!(target.closest && target.closest(OWNS_ARROWS));
  }

  document.addEventListener('keydown', function (event) {
    if (view !== 'beat') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (ownsArrowKeys(event.target)) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showBeat(current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showBeat(current - 1);
    }
  });

  /* --- History ----------------------------------------------------------
     Both events, because which one fires depends on whether `pushState` was
     available. Either way the handler is idempotent. */

  function onNavigated(event) {
    if (readFragment() === appliedFragment) return;
    var state = event && event.state;
    applyFragment({ view: state && state.view });
  }

  window.addEventListener('hashchange', onNavigated);
  window.addEventListener('popstate', onNavigated);

  /* --- Print -------------------------------------------------------------
     Print carries the whole argument including every optional panel, and
     then gives the reader their own panel choices back. The stylesheet
     prints a collapsed panel open as well, so this is a second line of
     defence rather than the only one. */

  window.addEventListener('beforeprint', function () {
    writePanels(function () { return true; });
  });
  window.addEventListener('afterprint', function () {
    applyPanelsForView(view);
  });

  /* --- Start -------------------------------------------------------------
     A fragment in the address bar is a deep link and is honoured, but it is
     not a reason to steal focus from a reader who has just arrived; the page
     scrolls to it instead. From here on, every move is the reader's. */

  offerReturnToBeats(false);
  applyFragment({ focus: false, initial: true });
})();
