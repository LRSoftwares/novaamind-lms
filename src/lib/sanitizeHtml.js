import DOMPurify from 'dompurify';

// Question HTML is authored by trusted internal creators but rendered on
// unauthenticated public pages (WorksheetPlayer, WorksheetResult) — sanitize on
// save and again on render (defense in depth) rather than trusting either side alone.

const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'blockquote',
  'ul', 'ol', 'li', 'label',
  'a', 'strong', 'em', 'u', 's', 'sup', 'sub', 'mark', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img', 'figure', 'figcaption',
  'hr', 'code', 'pre', 'details', 'summary', 'input',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
  'colspan', 'rowspan', 'class', 'style',
  'data-callout', 'data-type', 'data-checked', 'data-color',
  'type', 'checked', 'disabled', 'open',
];

const ALLOWED_STYLE_PROPS = [
  'color', 'background-color', 'font-size', 'font-weight', 'font-family',
  'text-align', 'margin-left', 'margin-top', 'margin-bottom',
];

const UNSAFE_URL_RE = /^\s*(javascript:|data:text\/html)/i;

let hooksRegistered = false;
function ensureHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') {
      data.attrValue = data.attrValue
        .split(';')
        .map(decl => decl.trim())
        .filter(Boolean)
        .filter(decl => ALLOWED_STYLE_PROPS.includes((decl.split(':')[0] || '').trim().toLowerCase()))
        .join('; ');
    }
    if ((data.attrName === 'href' || data.attrName === 'src') && UNSAFE_URL_RE.test(data.attrValue)) {
      data.attrValue = '';
      data.keepAttr = false;
    }
  });
}

export function sanitizeWorksheetHtml(html) {
  if (!html) return '';
  ensureHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
