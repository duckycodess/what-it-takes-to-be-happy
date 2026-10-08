/*
 * Browser script for the essay.
 *
 * A classic script, not a module: the offline file is opened straight from
 * disk, where module loading is blocked by the browser's file:// origin rules.
 *
 * The whole essay is already in the markup. This script only chooses what is
 * on screen, so with scripting unavailable, in print, and in any view, the
 * complete argument is still there.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
  if (scenes.length === 0) return;

  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  var chapterLinks = Array.prototype.slice.call(document.querySelectorAll('[data-chapter-link]'));
  var beginLink = document.querySelector('[data-begin]');
  var backButton = document.querySelector('[data-back]');
  var nextButton = document.querySelector('[data-next]');
  var positionOutput = document.querySelector('[data-position-current]');
  var viewToggle = document.querySelector('[data-view-toggle]');
  var allDetails = Array.prototype.slice.call(document.querySelectorAll('details.detail'));

  var current = 0;
  var view = 'landing';

  function setDetailsOpen(open) {
    allDetails.forEach(function (element) {
      element.open = open;
    });
  }

  function chapterOf(scene) {
    return scene.closest('.chapter');
  }

  function applyChapterState() {
    var scene = scenes[current];
    var chapter = chapterOf(scene);
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

    var chapterId = chapter ? chapter.getAttribute('data-chapter') : null;
    chapterLinks.forEach(function (link) {
      if (view === 'beat' && link.getAttribute('data-chapter-link') === chapterId) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function applySceneState() {
    scenes.forEach(function (scene, index) {
      scene.toggleAttribute('data-current', index === current);
    });
    if (backButton) backButton.disabled = current === 0;
    if (nextButton) nextButton.disabled = current === scenes.length - 1;
    if (positionOutput) positionOutput.textContent = String(current + 1);
    applyChapterState();
  }

  function setView(next, options) {
    view = next;
    root.setAttribute('data-view', next);

    // Optional detail is a reveal while moving beat by beat, and plain text
    // in the continuous reading view.
    setDetailsOpen(next !== 'beat');

    if (viewToggle) {
      viewToggle.setAttribute('aria-pressed', next === 'reading' ? 'true' : 'false');
      viewToggle.textContent = next === 'reading' ? 'Back to the beats' : 'Read the whole thing';
    }

    applySceneState();

    if (next === 'reading' && options && options.scrollToCurrent) {
      scenes[current].scrollIntoView({ block: 'start' });
    }
  }

  function go(index, options) {
    var target = Math.min(Math.max(index, 0), scenes.length - 1);
    current = target;
    applySceneState();
    if (view === 'beat') {
      // Focus first without letting the browser scroll to it, then start the
      // beat at the top of the page the way a presented slide would.
      if (!options || options.focus !== false) scenes[current].focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  function enterBeat(index) {
    setView('beat');
    go(index);
  }

  function indexOfSceneId(id) {
    for (var i = 0; i < scenes.length; i += 1) {
      if (scenes[i].getAttribute('data-scene') === id) return i;
    }
    return -1;
  }

  if (beginLink) {
    beginLink.addEventListener('click', function (event) {
      event.preventDefault();
      enterBeat(0);
    });
  }

  chapterLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = (link.getAttribute('href') || '').replace(/^#/, '');
      var index = indexOfSceneId(id);
      if (index < 0) return;
      event.preventDefault();
      if (view === 'reading') {
        scenes[index].scrollIntoView({ block: 'start' });
        current = index;
        applySceneState();
        return;
      }
      enterBeat(index);
    });
  });

  if (backButton) backButton.addEventListener('click', function () { go(current - 1); });
  if (nextButton) nextButton.addEventListener('click', function () { go(current + 1); });

  if (viewToggle) {
    viewToggle.addEventListener('click', function () {
      if (view === 'reading') enterBeat(current);
      else setView('reading', { scrollToCurrent: view === 'beat' });
    });
  }

  document.addEventListener('keydown', function (event) {
    if (view !== 'beat') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    var tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current - 1);
    }
  });

  // Print always carries the whole argument, including optional detail.
  if (window.matchMedia) {
    window.addEventListener('beforeprint', function () { setDetailsOpen(true); });
    window.addEventListener('afterprint', function () { setDetailsOpen(view !== 'beat'); });
  }

  var requested = indexOfSceneId((window.location.hash || '').replace(/^#/, ''));
  if (requested >= 0) {
    enterBeat(requested);
  } else {
    setView('landing');
  }
})();
