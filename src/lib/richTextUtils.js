// Detects/repairs the transition from legacy plain-text questionText to the new
// rich-text HTML format so old worksheet rows keep rendering correctly.

const HTML_TAG_RE = /<[a-z][\s\S]*>/i;

export function looksLikeHtml(str) {
  return typeof str === 'string' && HTML_TAG_RE.test(str);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Legacy rows store plain text with real newlines that collapsed when rendered
// inside a single <p>. Turn each non-blank line into its own paragraph so the
// original multi-paragraph/bullet layout is restored.
export function legacyPlainTextToHtml(str) {
  const text = String(str || '');
  const lines = text.split(/\r\n|\r|\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  return lines.map(line => `<p>${escapeHtml(line)}</p>`).join('');
}

export function toEditableHtml(questionText) {
  if (!questionText) return '';
  return looksLikeHtml(questionText) ? questionText : legacyPlainTextToHtml(questionText);
}

// Plain-text preview of rich content, used for list rows and the personality-profile
// trait parser, which both need to work on un-tagged text regardless of storage format.
export function stripHtmlTags(html) {
  if (!html) return '';
  if (!looksLikeHtml(html)) return String(html).trim();
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}
