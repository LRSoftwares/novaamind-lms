import { toEditableHtml } from '../lib/richTextUtils';

// Walks question HTML into a flat list of print-friendly blocks so worksheetExport.js
// can render paragraphs/headings/lists/quotes as distinct, correctly indented/prefixed
// lines — jsPDF has no HTML renderer, so this is the structure-preserving middle
// ground: inline styling, colors, images, and tables render as plain text (accepted
// tradeoff), but the block-level layout (the CR's actual complaint) survives.

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function textOf(node) {
  return (node.textContent || '').replace(/\s+/g, ' ').trim();
}

// Text belonging directly to a list item, excluding any nested list/content wrapper.
function directTextOf(container, excludeTags) {
  if (!container) return '';
  return Array.from(container.childNodes)
    .filter(n => n.nodeType === TEXT_NODE || (n.nodeType === ELEMENT_NODE && !excludeTags.includes(n.tagName)))
    .map(n => n.textContent)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function walkList(listEl, depth, blocks) {
  const isTask = listEl.getAttribute('data-type') === 'taskList';
  const ordered = listEl.tagName === 'OL';
  let index = 0;

  Array.from(listEl.children).forEach(li => {
    if (li.tagName !== 'LI') return;
    index += 1;

    if (isTask) {
      const checked = ['true', ''].includes(li.getAttribute('data-checked'));
      const contentDiv = Array.from(li.children).find(c => c.tagName === 'DIV');
      const text = directTextOf(contentDiv, ['UL', 'OL']);
      if (text) blocks.push({ type: 'checkItem', text, checked, depth });
      Array.from(contentDiv?.children || []).forEach(c => {
        if (c.tagName === 'UL' || c.tagName === 'OL') walkList(c, depth + 1, blocks);
      });
      return;
    }

    const text = directTextOf(li, ['UL', 'OL']);
    if (text) blocks.push({ type: ordered ? 'numberItem' : 'bulletItem', text, index, depth });
    Array.from(li.children).forEach(c => {
      if (c.tagName === 'UL' || c.tagName === 'OL') walkList(c, depth + 1, blocks);
    });
  });
}

function walkBlock(el, depth, blocks) {
  const tag = el.tagName;

  if (tag === 'P') {
    const text = textOf(el);
    if (text) blocks.push({ type: 'paragraph', text, depth });
  } else if (/^H[1-4]$/.test(tag)) {
    const text = textOf(el);
    if (text) blocks.push({ type: 'heading', level: Number(tag[1]), text, depth });
  } else if (tag === 'BLOCKQUOTE') {
    const text = textOf(el);
    if (text) blocks.push({ type: 'blockquote', text, depth });
  } else if (tag === 'UL' || tag === 'OL') {
    walkList(el, depth, blocks);
  } else if (tag === 'HR') {
    blocks.push({ type: 'divider', text: '', depth });
  } else if (tag === 'TABLE') {
    Array.from(el.querySelectorAll('tr')).forEach(tr => {
      const cells = Array.from(tr.children).map(cell => textOf(cell));
      if (cells.some(Boolean)) blocks.push({ type: 'tableRow', text: cells.join('  |  '), depth });
    });
  } else if (tag === 'DIV' && el.hasAttribute('data-callout')) {
    blocks.push({ type: 'calloutLabel', text: (el.getAttribute('data-callout') || 'info').toUpperCase(), depth });
    Array.from(el.children).forEach(child => walkBlock(child, depth + 1, blocks));
  } else if (tag === 'DETAILS') {
    const summary = el.querySelector('summary');
    if (summary) blocks.push({ type: 'heading', level: 4, text: textOf(summary), depth });
    Array.from(el.children).forEach(child => {
      if (child.tagName !== 'SUMMARY') walkBlock(child, depth + 1, blocks);
    });
  } else if (tag === 'FIGURE' || tag === 'IMG') {
    const caption = el.querySelector?.('figcaption');
    blocks.push({ type: 'paragraph', text: caption ? `[Image: ${textOf(caption)}]` : '[Image]', depth });
  } else if (el.children.length) {
    Array.from(el.children).forEach(child => walkBlock(child, depth, blocks));
  } else {
    const text = textOf(el);
    if (text) blocks.push({ type: 'paragraph', text, depth });
  }
}

export function htmlToBlocks(html) {
  const container = document.createElement('div');
  container.innerHTML = toEditableHtml(html);
  const blocks = [];
  Array.from(container.children).forEach(el => walkBlock(el, 0, blocks));
  return blocks;
}
