/*
 * Browser script for the essay and its Sources & Credits page.
 *
 * A classic script, not a module: the retained single-file export is opened
 * straight from disk, where module loading is blocked by the browser's file://
 * origin rules.
 *
 * The whole essay is already in the markup. This script only chooses what is
 * on screen, so with scripting unavailable, in print, and in the continuous
 * view, the complete argument is still there.
 *
 * Four rules it keeps:
 *
 *   The fragment is the place and the query is the mode. Every move records
 *   both, and the browser's own Back button therefore works without this
 *   script keeping a history of its own.
 *
 *   A move is announced once. Focus goes to the newly selected scene, which
 *   has an accessible name, and nothing else is a live region.
 *
 *   A control switches between drawings that are both already on the page. It
 *   never hides a sentence, and it never animates, so reduced motion and
 *   ordinary motion mean the same thing here.
 *
 *   Leaving for a source remembers where the reader was and how they were
 *   reading, and coming back restores both.
 */
(function () {
  'use strict';

  var root = document.documentElement;

  /** Reads one parameter out of a query string without URLSearchParams. */
  function param(search, name) {
    var pairs = String(search || '').replace(/^\?/, '').split('&');
    for (var i = 0; i < pairs.length; i += 1) {
      var pair = pairs[i].split('=');
      if (decodeURIComponent(pair[0]) === name) return decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
    }
    return null;
  }

  /* --- The Sources & Credits page ---------------------------------------
     A separate page, so returning needs the scene and the reading mode the
     reader left from. The citation link carried both in its query; the
     return control is rewritten from them. A reader who arrived here
     directly, or with no script, is offered the essay itself, which is
     where "Back to reading" can honestly lead without a place to return to. */

  if (root.getAttribute('data-page') === 'sources') {
    var back = document.querySelector('[data-return]');
    if (back) {
      var from = param(window.location.search, 'from');
      var mode = param(window.location.search, 'view');
      if (from && /^s\d{3}$/.test(from)) {
        back.setAttribute('href', 'index.html'
          + (mode === 'continuous' ? '?view=continuous' : '')
          + '#' + encodeURIComponent(from));
      }
    }
    // A reader who followed [9] should arrive at entry 9, not at the top of a
    // long register. The browser scrolls to the fragment on its own; moving
    // focus there as well is what makes the next Tab continue from the entry.
    var landed = window.location.hash ? document.querySelector(window.location.hash.replace(/[^#\w-]/g, '')) : null;
    if (landed && landed.focus) landed.focus({ preventScroll: true });
    return;
  }

  var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
  if (scenes.length === 0) return;

  var chapterLinks = Array.prototype.slice.call(document.querySelectorAll('[data-chapter-link]'));
  var citations = Array.prototype.slice.call(document.querySelectorAll('.citation'));
  var comparisons = Array.prototype.slice.call(document.querySelectorAll('.art-comparison'));
  var beginLink = document.querySelector('[data-begin]');
  var backButton = document.querySelector('[data-back]');
  var nextButton = document.querySelector('[data-next]');
  var readAgain = document.querySelector('[data-read-again]');
  var viewToggle = document.querySelector('[data-view-toggle]');
  var printButton = document.querySelector('[data-print]');
  var landing = document.getElementById('landing');

  /* Every link to Sources & Credits, with the address it was written with.
     The shared control has to carry where the reader is, exactly as a
     numbered citation does, or the register's "Back to reading" has nowhere
     to return to -- which is most visible at the end of the essay, where the
     shared control is the only way there. The base is read from the markup
     rather than retyped, so the hosted page and the single-file export each
     keep their own. */
  var sourcesLinks = Array.prototype.slice.call(document.querySelectorAll('[data-sources]'))
    // Not the landing's own copy: a reader who has not started has no place
    // to be brought back to, and that link is only reachable from there.
    .filter(function (link) { return !landing || !landing.contains(link); })
    .map(function (link) { return { link: link, base: link.getAttribute('href') || '' }; });

  var last = scenes.length - 1;
  var current = 0;
  var view = 'landing';

  /** The two view-switch labels, taken from the markup rather than retyped. */
  var toggleLabels = { scene: viewToggle ? viewToggle.textContent : '', continuous: '' };
  if (viewToggle) toggleLabels.continuous = viewToggle.getAttribute('data-scene-label') || '';

  /* --- Optional comparisons ----------------------------------------------
     Two drawings that are both in the markup. In the scene view one is shown
     at a time and the buttons say which; in the continuous view, in print,
     and with no script both are shown with their labels in order. The
     paragraphs never move, so no part of the argument depends on a control.
     Enter and Space need no handler: these are buttons. */

  comparisons.forEach(function (figure) {
    var buttons = Array.prototype.slice.call(figure.querySelectorAll('[data-art-state]'));
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var state = button.getAttribute('data-art-state');
        figure.setAttribute('data-active', state);
        buttons.forEach(function (other) {
          other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
        });
      });
    });
  });

  /* --- Identifiers ------------------------------------------------------- */

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

  function readFragment() {
    var raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch (error) {
      return raw;
    }
  }

  /* --- Where a citation leads -------------------------------------------
     Each link already names the scene it sits in. Only the reading mode can
     change while the page is open, so only that is rewritten, and only on the
     linked hosted page: the single-file export keeps the register inside
     itself and its citations are ordinary fragments. */

  function applyCitationMode() {
    citations.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.indexOf('?') < 0) return;
      link.setAttribute('href', href.replace(/([?&]view=)[^&#]*/, '$1' + (view === 'reading' ? 'continuous' : 'scene')));
    });
  }

  /* --- The fragment ------------------------------------------------------ */

  var appliedFragment = null;

  function writeFragment(id, replace) {
    var samePlace = appliedFragment === id;
    appliedFragment = id;
    var target = '#' + encodeURIComponent(id);
    try {
      if (window.history && window.history.pushState) {
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

  /* --- State ------------------------------------------------------------- */

  function applySceneState() {
    scenes.forEach(function (scene, index) {
      scene.toggleAttribute('data-current', index === current && view === 'beat');
    });
    chapterLinks.forEach(function (link) {
      var chapterId = scenes[current].getAttribute('data-chapter');
      if (view === 'beat' && link.getAttribute('data-chapter-link') === chapterId) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // The first scene's Back is the way out to the landing, and the last
    // scene has no Next: it offers Read again instead. Saying so by changing
    // what is offered is clearer than a disabled button that explains nothing.
    if (backButton) backButton.hidden = view !== 'beat';
    if (nextButton) {
      nextButton.hidden = view !== 'beat' || current === last;
    }
    if (readAgain) readAgain.hidden = !(view === 'beat' && current === last);

    // The approved landing carries the title, the opening drawing, Begin and
    // Sources & Credits, and nothing else. Reading controls belong to a
    // reader who has started reading: offered on the landing they would let
    // someone print or switch view before meeting the essay at all. The
    // landing's own Begin and Sources & Credits are in the page, not here.
    if (viewToggle) viewToggle.hidden = view === 'landing';
    if (printButton) printButton.hidden = view === 'landing';
  }

  function setView(nextView) {
    view = nextView;
    root.setAttribute('data-view', nextView);
    if (viewToggle) {
      viewToggle.textContent = nextView === 'reading' ? toggleLabels.continuous : toggleLabels.scene;
    }
    applyCitationMode();
    applySceneState();
    writeSourcesLinks();
  }

  function scrollToElement(element) {
    if (element && element.scrollIntoView) element.scrollIntoView({ block: 'start' });
  }

  /**
   * Points the shared Sources & Credits links at the place being read.
   *
   * On the landing there is no place to come back to, so the link stays as
   * authored. In the single-file export the register is in the same document
   * and the address is a fragment, so nothing is added to it: the reader
   * never leaves the page and so never loses their position.
   */
  function writeSourcesLinks() {
    var scene = scenes[current] ? scenes[current].getAttribute('data-scene') : '';
    sourcesLinks.forEach(function (entry) {
      if (entry.base.charAt(0) === '#') return;
      if (view === 'landing' || scene === '') {
        entry.link.setAttribute('href', entry.base);
        return;
      }
      entry.link.setAttribute('href', entry.base
        + '?from=' + encodeURIComponent(scene)
        + '&view=' + (view === 'reading' ? 'continuous' : 'scene'));
    });
  }

  /* --- Moves -------------------------------------------------------------
     Every move ends the same way: state applied, focus on what the reader
     asked for, place recorded. `focus: false` is for the one move the reader
     did not make — the page loading with a fragment already in the address
     bar, where taking focus would be rude rather than helpful. */

  function showLanding(options) {
    var settings = options || {};
    setView('landing');
    window.scrollTo(0, 0);
    if (settings.focus !== false && landing) {
      var heading = document.getElementById('landing-title');
      if (heading && heading.focus) heading.focus({ preventScroll: true });
    }
    if (settings.record !== false) writeFragment('', settings.replace);
  }

  function showScene(index, options) {
    var settings = options || {};
    if (index < 0) { showLanding(); return; }
    current = Math.min(Math.max(index, 0), last);
    setView('beat');
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

  /**
   * Applies whatever the address bar asks for.
   *
   * A reader already reading continuously who follows a scene fragment stays
   * in the continuous view and is taken to that scene within it: a fragment
   * says where to go, not how to read. `settings.view` overrides that — it is
   * the mode a history entry recorded, or the one a return from the sources
   * page carried, and restoring it is the point of both.
   *
   * A fragment this script does not recognise is not an error and not a
   * reason to move the reader: the skip link's `#essay` and the chapter
   * menu's `#chapters` are landmarks the browser already handles.
   */
  function applyFragment(options) {
    var settings = options || {};
    var focus = settings.focus !== false;
    var id = readFragment();
    appliedFragment = id;
    var wanted = settings.view || view;

    var index = indexOfSceneId(id);
    if (index < 0) index = firstSceneOfChapter(id);
    if (index < 0) {
      if (id !== '' && !settings.initial) return;
      setView(wanted === 'reading' ? 'reading' : 'landing');
      if (wanted !== 'reading') window.scrollTo(0, 0);
      return;
    }
    if (wanted === 'reading') {
      current = index;
      applySceneState();
      showReading({ record: false, focus: focus });
      return;
    }
    showScene(index, { record: false, focus: focus });
  }

  /* --- Wiring ------------------------------------------------------------ */

  if (beginLink) {
    beginLink.addEventListener('click', function (event) {
      event.preventDefault();
      showScene(0);
    });
  }

  chapterLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var index = firstSceneOfChapter(link.getAttribute('data-chapter-link'));
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
      showScene(index);
    });
  });

  if (backButton) {
    backButton.addEventListener('click', function () {
      if (current === 0) showLanding();
      else showScene(current - 1);
    });
  }
  if (nextButton) nextButton.addEventListener('click', function () { showScene(current + 1); });

  if (readAgain) {
    readAgain.addEventListener('click', function (event) {
      event.preventDefault();
      showScene(0);
    });
  }

  if (viewToggle) {
    viewToggle.addEventListener('click', function () {
      if (view === 'reading') showScene(current);
      else showReading();
    });
  }

  if (printButton) {
    printButton.addEventListener('click', function () { window.print(); });
  }

  /* --- Keyboard ----------------------------------------------------------
     Arrow keys move between scenes only while reading scene by scene, and
     never when the reader is inside something that owns its own arrow
     behaviour. A link, a button, and a form field all do. */

  var OWNS_ARROWS = 'input, textarea, select, button, a[href], summary, details, [contenteditable]';

  document.addEventListener('keydown', function (event) {
    if (view !== 'beat') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    var target = event.target;
    if (target && target.nodeType === 1 && (target.isContentEditable || (target.closest && target.closest(OWNS_ARROWS)))) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (current < last) showScene(current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (current === 0) showLanding();
      else showScene(current - 1);
    }
  });

  /* --- History ----------------------------------------------------------- */

  function onNavigated(event) {
    if (readFragment() === appliedFragment) return;
    var state = event && event.state;
    applyFragment({ view: state && state.view });
  }

  window.addEventListener('hashchange', onNavigated);
  window.addEventListener('popstate', onNavigated);

  /* --- Start -------------------------------------------------------------
     A fragment in the address bar is a deep link and is honoured, but it is
     not a reason to steal focus from a reader who has just arrived. A
     `view=continuous` query is a reader coming back from the sources page
     having been reading continuously, so that is the mode they come back to. */

  var returning = param(window.location.search, 'view') === 'continuous' ? 'reading' : null;
  applyFragment({ focus: false, initial: true, view: returning });
})();
