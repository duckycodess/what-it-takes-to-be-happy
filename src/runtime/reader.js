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
  var partLinks = Array.prototype.slice.call(document.querySelectorAll('[data-part-link]'));
  var chapterToggles = Array.prototype.slice.call(document.querySelectorAll('[data-chapter-toggle]'));
  var partLists = Array.prototype.slice.call(document.querySelectorAll('[data-rail-parts]'));
  var citations = Array.prototype.slice.call(document.querySelectorAll('.citation'));
  var comparisons = Array.prototype.slice.call(document.querySelectorAll('.art-comparison'));
  var beginLink = document.querySelector('[data-begin]');
  var backButton = document.querySelector('[data-back]');
  var nextButton = document.querySelector('[data-next]');
  var readAgain = document.querySelector('[data-read-again]');
  var viewToggle = document.querySelector('[data-view-toggle]');
  var controls = document.querySelector('.reader-controls');
  var rail = document.getElementById('chapters');
  var railToggle = document.querySelector('[data-rail-toggle]');
  var railRestore = document.querySelector('[data-rail-restore]');
  var launcher = document.querySelector('.rail-launcher');
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

  /* --- The chapter rail ---------------------------------------------------
     One list of chapters and parts, in the markup, shown two ways. On a wide
     screen it stands beside the essay and can be collapsed to give the prose
     the whole window; at phone width the same element is a drawer the reader
     opens from the launcher and dismisses again. The stylesheet decides which
     of the two it is; this script only records whether the reader has it open,
     and asks the stylesheet which arrangement is in force before choosing the
     behaviour that differs between them.

     The only difference in behaviour is dismissal. A drawer covers what is
     being read, so choosing a part closes it and Escape closes it; a rail
     beside the essay hides nothing and stays where the reader put it. */

  var DRAWER_WIDTH = '(max-width: 59.99rem)';
  var drawerQuery = window.matchMedia ? window.matchMedia(DRAWER_WIDTH) : null;

  /** True while the stylesheet is presenting the rail as a drawer. */
  function isDrawer() {
    return !!(drawerQuery && drawerQuery.matches);
  }

  var railOpen = !isDrawer();

  /* A chapter's parts are expanded when the reader is reading that chapter,
     unless the reader has said otherwise about that chapter. Their own choice
     wins and is remembered; everything they have not touched follows the
     reading. That is what lets another chapter be opened without closing the
     current one, and what stops the rail growing to all 45 parts as the
     reader works through the essay. */
  var chapterChoice = {};

  var partsById = {};
  partLists.forEach(function (list) { partsById[list.getAttribute('data-rail-parts')] = list; });

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

  /* --- The address bar --------------------------------------------------- */

  var appliedFragment = null;

  /**
   * The query the address should carry, for the mode being read.
   *
   * The fragment says where the reader is; the query says how they are
   * reading. Both have to be in the URL, because a reader can reload it,
   * bookmark it or send it to someone, and a fragment alone would open the
   * scene view every time. Continuous reading records `view=continuous`;
   * leaving it clears that parameter rather than letting the old answer stand.
   *
   * Every other parameter is passed through untouched. This script owns one
   * name in the query and has no business editing the rest.
   */
  function queryForView() {
    var keep = [];
    String(window.location.search || '').replace(/^\?/, '').split('&').forEach(function (pair) {
      if (pair === '') return;
      if (decodeURIComponent(pair.split('=')[0]) === 'view') return;
      keep.push(pair);
    });
    if (view === 'reading') keep.push('view=continuous');
    return keep.length > 0 ? '?' + keep.join('&') : '';
  }

  function writeFragment(id, replace) {
    var samePlace = appliedFragment === id;
    appliedFragment = id;
    var query = queryForView();
    // A URL with no query has to be written as a path: handing `pushState` a
    // bare fragment keeps whatever query is already there, which is how a
    // stale `view=continuous` used to survive a return to the scene view.
    var target = (query === '' ? (window.location.pathname || '') : query) + '#' + encodeURIComponent(id);
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
      // Without `pushState` only the fragment can be written, so the mode
      // cannot be recorded in the address. The reader still moves and Back
      // still works; a URL copied from here opens at the right scene in the
      // scene view, which is the view it opens in by default anyway.
      window.location.hash = '#' + encodeURIComponent(id);
    } catch (error) {
      /* A browser that allows neither keeps working; only Back is lost. */
    }
  }

  /* --- State ------------------------------------------------------------- */

  /**
   * Marks the chapter and the part a reader is in, and opens that chapter.
   *
   * `aria-current` on the one part link is the whole indication: no counter,
   * no progress line, and no live region, because the move itself is already
   * announced by the focus it moves. `index` is -1 on the landing, where the
   * reader is in no part of the essay yet.
   */
  function applyPlace(index) {
    var sceneId = index < 0 ? '' : scenes[index].getAttribute('data-scene');
    var chapterId = index < 0 ? '' : scenes[index].getAttribute('data-chapter');

    chapterLinks.forEach(function (link) {
      if (chapterId !== '' && link.getAttribute('data-chapter-link') === chapterId) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    partLinks.forEach(function (link) {
      if (sceneId !== '' && link.getAttribute('data-part-link') === sceneId) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    chapterToggles.forEach(function (button) {
      var id = button.getAttribute('data-chapter-toggle');
      var open = Object.prototype.hasOwnProperty.call(chapterChoice, id)
        ? chapterChoice[id]
        : id === chapterId;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      // Hidden rather than styled shut, so a collapsed chapter's parts are
      // out of the tab order and out of the accessibility tree as well as off
      // the screen. With no script nothing is hidden and every part is listed.
      if (partsById[id]) partsById[id].hidden = !open;
    });
  }

  /** Where the reader is: the scene on screen, or the one being scrolled past. */
  function place() {
    if (view === 'landing') return -1;
    return view === 'reading' ? visibleSceneIndex() : current;
  }

  function applySceneState() {
    scenes.forEach(function (scene, index) {
      scene.toggleAttribute('data-current', index === current && view === 'beat');
    });
    applyPlace(place());

    // The first scene's Back is the way out to the landing, and the last
    // scene has no Next: it offers Read again instead, with the final passage
    // rather than in the footer. Saying so by changing what is offered is
    // clearer than a disabled button that explains nothing.
    if (backButton) backButton.hidden = view !== 'beat';
    if (nextButton) {
      nextButton.hidden = view !== 'beat' || current === last;
    }
    if (readAgain) readAgain.hidden = !(view === 'beat' && current === last);

    // The approved landing carries the title, the opening drawing, Begin and
    // Sources & Credits, and nothing else. The rail, its launcher and the
    // reading footer belong to a reader who has started reading: offered on
    // the landing they would let someone switch view, or meet a second copy
    // of Sources & Credits, before meeting the essay at all. The landing's
    // own Begin and Sources & Credits are in the page, where the script does
    // not touch them.
    if (viewToggle) viewToggle.hidden = view === 'landing';
    if (controls) controls.hidden = view === 'landing';
    if (rail) rail.hidden = view === 'landing';
    if (launcher) launcher.hidden = view === 'landing';
    // The view decides whether the drawer is covering anything, so the rail's
    // own state is reapplied with it. Reaching the landing with a drawer
    // still open -- the browser's Back button can do it -- would otherwise
    // leave the landing inert behind a rail nothing is showing.
    applyRailState();
  }

  /* --- Opening and dismissing the rail ------------------------------------ */

  /* What the drawer is laid over. Not the skip link, which sits above it and
     is still a reasonable way out. */
  var behindDrawer = [landing, document.querySelector('.essay-body'), controls]
    .filter(function (element) { return !!element; });

  function applyRailState() {
    root.setAttribute('data-rail', railOpen ? 'open' : 'closed');
    // Both controls answer for the same region, so both report the same
    // state; only one of them is ever on screen at a time.
    if (railToggle) railToggle.setAttribute('aria-expanded', railOpen ? 'true' : 'false');
    if (railRestore) railRestore.setAttribute('aria-expanded', railOpen ? 'true' : 'false');

    // Beside the essay the rail covers nothing and the reader can move
    // between the two freely. As a drawer it covers the reading column, so
    // what is behind it is made `inert`: out of the tab order and out of the
    // accessibility tree, which is the guard something modal owes. That is
    // the browser's own mechanism rather than a focus trap written here, so
    // there is no keyboard loop to get wrong and nothing to undo if the
    // drawer is dismissed in some way this script did not anticipate.
    var covered = railOpen && isDrawer() && view !== 'landing';
    behindDrawer.forEach(function (element) { element.toggleAttribute('inert', covered); });
  }

  /**
   * Opens or closes the rail.
   *
   * Focus follows the control that disappears: collapsing the rail moves it to
   * the launcher, which is where the way back now is, and opening it moves it
   * into the rail, onto the control that closes it again. Either way the
   * reader's focus is somewhere they can act from rather than lost to the
   * body.
   *
   * On a wide screen the reading column reflows when the rail comes or goes,
   * so the scene being read is brought back under the reader's eye afterwards.
   * A pixel offset would not survive the reflow; the scene is the thing worth
   * keeping.
   *
   * @param {boolean} open
   * @param {{focus?: boolean, anchor?: boolean}} [options]
   */
  function setRail(open, options) {
    var settings = options || {};
    if (railOpen === open) return;
    var anchor = view === 'landing' ? null : scenes[place()];
    railOpen = open;
    applyRailState();
    if (settings.focus !== false) {
      if (open && railToggle && railToggle.focus) railToggle.focus();
      if (!open && railRestore && railRestore.focus) railRestore.focus();
    }
    if (settings.anchor !== false && anchor) scrollToElement(anchor);
  }

  /** Closes the drawer before a move, so the reader is not navigating blind. */
  function dismissDrawer() {
    if (isDrawer() && railOpen) setRail(false, { focus: false, anchor: false });
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
   * The scene a reader is actually looking at.
   *
   * In the scene view that is `current`, because one scene is on screen. In
   * the continuous view the whole essay is on the page and the reader scrolls
   * through it without the script being told, so `current` is only where they
   * entered. The scene reported is the last one whose top has passed the
   * reading line, which is the one whose text fills the upper window.
   *
   * Reading layout is the browser's answer, and a document with no layout --
   * a test harness, a page measured before first paint -- has none to give.
   * There the entry point is still the best answer available, so it is used
   * rather than guessed at. Nothing here moves focus or scrolls: it only
   * reads positions.
   */
  function visibleSceneIndex() {
    if (view !== 'reading') return current;
    if (!scenes[0] || !scenes[0].getBoundingClientRect) return current;

    var line = (window.innerHeight || root.clientHeight || 0) * 0.3;
    var found = -1;
    for (var i = 0; i < scenes.length; i += 1) {
      var box = scenes[i].getBoundingClientRect();
      if (!box || (box.top === 0 && box.bottom === 0)) return current;
      if (box.top > line) break;
      found = i;
    }
    return found < 0 ? 0 : found;
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
    var here = scenes[visibleSceneIndex()];
    var scene = here ? here.getAttribute('data-scene') : '';
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
    // `setView` ran before the page had been scrolled, so the part it marked
    // was read from the old position. Now that the move has happened, the
    // rail is told again where the reader is.
    applyPlace(place());
    writeSourcesLinks();
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

  /**
   * Going to a place in the essay, from the rail.
   *
   * A chapter title leads to that chapter's first scene; a part leads to
   * itself. Either way the reading mode is left alone -- the reader asked to
   * go somewhere, not to change how they are reading -- and a drawer is
   * dismissed on the way, so the destination is not behind it when they
   * arrive.
   */
  function goTo(index) {
    if (index < 0) return;
    dismissDrawer();
    if (view === 'reading') {
      current = index;
      applySceneState();
      showReading({ target: scenes[index] });
      return;
    }
    showScene(index);
  }

  chapterLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var index = firstSceneOfChapter(link.getAttribute('data-chapter-link'));
      if (index < 0) return;
      event.preventDefault();
      goTo(index);
    });
  });

  partLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var index = indexOfSceneId(link.getAttribute('data-part-link'));
      if (index < 0) return;
      event.preventDefault();
      goTo(index);
    });
  });

  /* A chapter the reader opens or closes themselves stays that way. The
     expansion is recorded against the chapter rather than applied to the
     element here, so the one rule that decides what is expanded stays in
     `applyPlace`. */
  chapterToggles.forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.getAttribute('data-chapter-toggle');
      chapterChoice[id] = button.getAttribute('aria-expanded') !== 'true';
      applyPlace(place());
    });
  });

  if (railToggle) railToggle.addEventListener('click', function () { setRail(false); });
  if (railRestore) railRestore.addEventListener('click', function () { setRail(true); });

  /* The arrangement is the stylesheet's answer, so a window that crosses the
     width at which the rail becomes a drawer gets that arrangement's default:
     a rail beside the essay, or a drawer that is shut. Carrying the old answer
     across would leave a drawer standing open over the prose after a rotation,
     or an essay with no rail on a screen wide enough for one. */
  if (drawerQuery && drawerQuery.addEventListener) {
    drawerQuery.addEventListener('change', function () {
      // Written directly rather than through `setRail`: the reader did not
      // ask to be moved, the browser keeps the scroll position across a
      // resize on its own, and the state has to be reapplied even when the
      // open/closed answer happens to be the same one -- a drawer that was
      // open becomes a rail beside the essay, which covers nothing.
      railOpen = !isDrawer();
      applyRailState();
    });
  }

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
      // Leaving continuous reading goes to the passage on screen, not to the
      // scene the reader entered continuous reading at. They have scrolled
      // since, and the script was not involved in that, so `current` is only
      // where they came in; sending them back there would undo their reading.
      if (view === 'reading') showScene(visibleSceneIndex());
      else showReading();
    });
  }

  /* --- Keyboard ----------------------------------------------------------
     Arrow keys move between scenes only while reading scene by scene, and
     never when the reader is inside something that owns its own arrow
     behaviour. A link, a button, and a form field all do. */

  var OWNS_ARROWS = 'input, textarea, select, button, a[href], summary, details, [contenteditable]';

  document.addEventListener('keydown', function (event) {
    // Escape shuts the drawer and gives focus back to the control that opened
    // it. Only the drawer: a rail standing beside the essay covers nothing,
    // and Escape has no business collapsing it out from under a reader.
    if (event.key === 'Escape' && railOpen && isDrawer()) {
      event.preventDefault();
      setRail(false, { anchor: false });
      return;
    }
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

  /* --- Reading position ---------------------------------------------------
     In the continuous view the reader moves by scrolling, which the script is
     otherwise uninvolved in. Two things have to keep up with it: the shared
     Sources & Credits link, so that leaving for the register and coming back
     returns to the passage they left rather than to wherever the continuous
     view was entered, and the rail, so the part it marks is the part being
     read. This listens passively and writes attributes: no focus, no
     scrolling, no history entry. */

  var scrollPending = false;
  function refreshReadingPosition() {
    if (view !== 'reading' || scrollPending) return;
    scrollPending = true;
    // Coalesced on a timer rather than a frame. A scroll fires many events
    // per frame and this only writes a few attributes, so it does not need to
    // be frequent; it does need to happen in a document that is never painted,
    // which is exactly where `requestAnimationFrame` never runs.
    setTimeout(function () {
      scrollPending = false;
      writeSourcesLinks();
      applyPlace(place());
    }, 100);
  }

  window.addEventListener('scroll', refreshReadingPosition, { passive: true });

  // And once more as the link is used, for a reader whose browser coalesced
  // the last scroll frame away, or who reached it by keyboard.
  sourcesLinks.forEach(function (entry) {
    entry.link.addEventListener('mousedown', writeSourcesLinks);
    entry.link.addEventListener('click', writeSourcesLinks);
    entry.link.addEventListener('focus', writeSourcesLinks);
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

  applyRailState();
  var returning = param(window.location.search, 'view') === 'continuous' ? 'reading' : null;
  applyFragment({ focus: false, initial: true, view: returning });
})();
