import { toEditableHtml } from '../../lib/richTextUtils.js';
import { sanitizeWorksheetHtml } from '../../lib/sanitizeHtml.js';

// Shared read-only rendering for question text across the admin submission-detail
// view, the participant player, and the participant results page — one place to
// keep the legacy-plain-text fallback and sanitization consistent everywhere.
export default function WorksheetRichTextRenderer({ html, className = '' }) {
  const safeHtml = sanitizeWorksheetHtml(toEditableHtml(html));
  if (!safeHtml) return null;
  return <div className={`worksheet-rich-content ${className}`} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
