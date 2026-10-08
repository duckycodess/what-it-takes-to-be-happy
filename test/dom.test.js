/**
 * The test harness is itself code, and the reader suite is only worth as much
 * as this file. These checks pin down what `test/support/dom.js` claims to
 * support, so a harness that answers a question wrongly fails here rather
 * than quietly passing a reader test that should have failed.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHtml } from './support/dom.js';

const parse = (html) => parseHtml(`<html><body>${html}</body></html>`);

test('the parser keeps structure, attributes, and text', () => {
  const document = parse('<div class="a b" id="x" data-flag><p>one &amp; two</p><img src="y.png"></div>');
  const div = document.querySelector('#x');

  assert.equal(div.tagName, 'DIV');
  assert.deepEqual(div.children.map((child) => child.tagName), ['P', 'IMG']);
  assert.equal(div.getAttribute('class'), 'a b');
  assert.equal(div.getAttribute('data-flag'), '', 'a bare attribute is present with an empty value');
  assert.equal(div.hasAttribute('missing'), false);
  assert.equal(div.querySelector('p').textContent, 'one & two', 'entities are decoded');
  assert.equal(document.querySelector('img').children.length, 0, 'a void element takes no children');
});

test('raw-text elements keep their contents out of the tree', () => {
  const document = parse('<style>a > b { content: "<p>" }</style><script>if (1 > 0) go();</script><p>after</p>');
  assert.equal(document.querySelectorAll('p').length, 1, 'markup inside raw text is text, not elements');
  assert.match(document.querySelector('script').textContent, /1 > 0/);
  assert.equal(document.querySelector('p').textContent, 'after');
});

test('a quoted attribute value may contain the character that ends a tag', () => {
  const document = parse('<a href="https://example.org/?a=1&amp;b=2" title="x > y">link</a>');
  const link = document.querySelector('a');
  assert.equal(link.getAttribute('href'), 'https://example.org/?a=1&b=2');
  assert.equal(link.getAttribute('title'), 'x > y');
  assert.equal(link.textContent, 'link');
});

test('malformed markup fails loudly instead of being reshaped', () => {
  assert.throws(() => parse('<div><p></div>'), /Unbalanced markup/);
  assert.throws(() => parseHtml('<div><span>x</span>'), /Unclosed element/);
});

test('the supported selectors select, and an unsupported one throws', () => {
  const document = parse(`
    <section class="chapter" data-chapter="c1">
      <div class="chapter-head"><h2>Title</h2></div>
      <ol><li class="scene" data-scene="s1" data-current><h3>Beat</h3></li></ol>
    </section>
    <h2>Outside</h2>
    <details class="detail"><summary>S</summary></details>
    <button type="button" data-next>Next</button>`);

  assert.equal(document.querySelectorAll('[data-scene]').length, 1, 'attribute presence');
  assert.equal(document.querySelector('[data-chapter="c1"]').tagName, 'SECTION', 'attribute equality');
  assert.equal(document.querySelectorAll('.chapter').length, 1, 'class');
  assert.equal(document.querySelectorAll('h2').length, 2, 'tag');
  assert.equal(document.querySelectorAll('details.detail').length, 1, 'tag and class together');
  assert.equal(document.querySelectorAll('[data-scene][data-current]').length, 1, 'two attributes');
  assert.equal(document.querySelectorAll('summary, button').length, 2, 'a comma list');

  const chapter = document.querySelector('.chapter');
  assert.equal(chapter.querySelector('.chapter-head h2').textContent, 'Title', 'descendant, scoped to the chapter');
  assert.equal(chapter.querySelectorAll('h2').length, 1, 'a scoped search does not escape its root');

  assert.equal(document.querySelector('[data-scene="s1"] h3').textContent, 'Beat', 'identifier and descendant');

  assert.throws(() => document.querySelectorAll('li > h3'), /does not implement the selector/);
  assert.throws(() => document.querySelectorAll('.scene:focus'), /does not implement the selector/);
  assert.throws(() => document.querySelectorAll('li:nth-child(2)'), /does not implement the selector/);
});

test('closest walks up and stops at the first match', () => {
  const document = parse('<details class="detail"><summary id="s">Open</summary></details><li id="l"><h3 id="h">t</h3></li>');
  const summary = document.querySelector('#s');

  assert.equal(summary.closest('details').tagName, 'DETAILS');
  assert.equal(summary.closest('input, textarea, select, button, a[href], summary, details, [contenteditable]').tagName, 'SUMMARY');
  assert.equal(document.querySelector('#h').closest('button, a[href], summary'), null, 'plain content owns no arrow keys');
});

test('a details element queues its toggle event the way a browser does', () => {
  const document = parse('<details class="detail" open><summary>S</summary></details>');
  const panel = document.querySelector('details');
  const seen = [];
  panel.addEventListener('toggle', () => seen.push(panel.open));

  panel.open = false;
  assert.deepEqual(seen, [], 'the event has not arrived yet, exactly as in a browser');
  document.pendingToggles.shift()();
  assert.deepEqual(seen, [false]);

  panel.open = false;
  assert.equal(document.pendingToggles.length, 0, 'setting the state it already has changes nothing');
});

test('reflected properties read and write the attribute', () => {
  const document = parse('<button data-next disabled>Next</button><p class="register-return">x</p>');
  const button = document.querySelector('button');
  const paragraph = document.querySelector('p');

  assert.equal(button.disabled, true);
  button.disabled = false;
  assert.equal(button.hasAttribute('disabled'), false);

  assert.equal(paragraph.hidden, false);
  paragraph.hidden = true;
  assert.equal(paragraph.getAttribute('hidden'), '');
});
