'use strict';
// Optional presentation enhancement. Without JS, reading paragraphs remain left aligned.
(() => {
  const paragraphs = [...document.querySelectorAll(
    '.section.expertise > div:last-child > p.reading-prose, ' +
    '.section.about > div:last-child > p.reading-prose, ' +
    '.legal-content section > p.reading-prose'
  )];
  const context = document.createElement('canvas').getContext('2d');
  if (!paragraphs.length || !context) {
    document.documentElement.dataset.typographyReady = 'true';
    return;
  }
  function uniformSpacing(paragraph, style) {
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    const lines = new Set([...range.getClientRects()].map(rect => Math.round(rect.y)));
    if (lines.size < 3) return false;
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    // Avoid stretching any space beyond 2.5 natural spaces or 0.8em.
    const limit = Math.min(context.measureText(' ').width * 2.5, parseFloat(style.fontSize) * 0.8);
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      for (const match of node.textContent.matchAll(/\s+/gu)) {
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        if ([...range.getClientRects()].some(rect => rect.width > limit + 0.1)) return false;
      }
    }
    return true;
  }
  let pending = false;
  function schedule() {
    document.documentElement.dataset.typographyReady = 'false';
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      for (const paragraph of paragraphs) {
        paragraph.classList.remove('has-uniform-spacing');
        paragraph.classList.add('try-justification');
        const style = getComputedStyle(paragraph);
        if (style.textAlign === 'justify' && uniformSpacing(paragraph, style)) {
          paragraph.classList.add('has-uniform-spacing');
        }
        paragraph.classList.remove('try-justification');
      }
      document.documentElement.dataset.typographyReady = 'true';
    });
  }
  // Observe widths only: changed paragraph heights must not create resize loops.
  if ('ResizeObserver' in window) {
    const widths = new WeakMap();
    const observer = new ResizeObserver(entries => {
      let changed = false;
      for (const entry of entries) {
        if (widths.get(entry.target) !== entry.contentRect.width) {
          widths.set(entry.target, entry.contentRect.width);
          changed = true;
        }
      }
      if (changed) schedule();
    });
    for (const parent of new Set(paragraphs.map(p => p.parentElement))) observer.observe(parent);
  }
  window.addEventListener('resize', schedule, {passive: true});
  if (document.fonts) {
    document.fonts.ready.then(schedule);
    document.fonts.addEventListener('loadingdone', schedule);
  } else schedule();
})();
