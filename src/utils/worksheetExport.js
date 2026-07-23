import { jsPDF } from 'jspdf';
import { htmlToBlocks } from './htmlToPdfBlocks';

const INDENT_STEP = 14;
const HEADING_SIZE_BY_LEVEL = { 1: 15, 2: 14, 3: 13, 4: 12 };

export function exportWorksheetSubmissionPdf({ worksheet, candidate, submission, questions, responses }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (lineHeight) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeText = (text, { fontSize = 11, fontStyle = 'normal', gapBefore = 0, gapAfter = 6, indent = 0, color = [17, 24, 39] } = {}) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    y += gapBefore;
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    lines.forEach((line) => {
      ensureSpace(fontSize * 1.4);
      doc.text(line, margin + indent, y);
      y += fontSize * 1.4;
    });
    y += gapAfter;
  };

  // Renders one block from htmlToBlocks (a question's HTML walked into
  // paragraph/heading/list/quote/etc. blocks) as an appropriately styled/indented line.
  const writeQuestionBlock = (block) => {
    const indent = INDENT_STEP + (block.depth || 0) * INDENT_STEP;
    switch (block.type) {
      case 'heading':
        writeText(block.text, { fontSize: HEADING_SIZE_BY_LEVEL[block.level] || 13, fontStyle: 'bold', gapBefore: 6, gapAfter: 3, indent: block.depth * INDENT_STEP });
        break;
      case 'blockquote':
        writeText(block.text, { fontSize: 11, fontStyle: 'italic', color: [107, 114, 128], indent: indent + INDENT_STEP, gapAfter: 3 });
        break;
      case 'bulletItem':
        writeText(`•  ${block.text}`, { fontSize: 11, indent, gapAfter: 2 });
        break;
      case 'numberItem':
        writeText(`${block.index}.  ${block.text}`, { fontSize: 11, indent, gapAfter: 2 });
        break;
      case 'checkItem':
        writeText(`${block.checked ? '[x]' : '[ ]'}  ${block.text}`, { fontSize: 11, indent, gapAfter: 2 });
        break;
      case 'tableRow':
        writeText(block.text, { fontSize: 10, indent, gapAfter: 2, color: [75, 85, 99] });
        break;
      case 'calloutLabel':
        writeText(`[${block.text}]`, { fontSize: 9, fontStyle: 'bold', indent: block.depth * INDENT_STEP, gapBefore: 4, gapAfter: 1, color: [107, 114, 128] });
        break;
      case 'divider':
        y += 6;
        break;
      case 'paragraph':
      default:
        writeText(block.text, { fontSize: 11, indent: block.depth * INDENT_STEP, gapAfter: 3 });
        break;
    }
  };

  writeText(worksheet.title, { fontSize: 18, fontStyle: 'bold', gapAfter: 4 });
  writeText('Novaamind LMS — Worksheet Submission', { fontSize: 10, color: [107, 114, 128], gapAfter: 16 });

  writeText(`Name: ${candidate.name}`, { fontSize: 10, gapAfter: 2 });
  writeText(`Email: ${candidate.email}`, { fontSize: 10, gapAfter: 2 });
  if (candidate.company) writeText(`Company: ${candidate.company}`, { fontSize: 10, gapAfter: 2 });
  if (submission.submittedAt) {
    writeText(`Submitted: ${new Date(submission.submittedAt).toLocaleString()}`, { fontSize: 10, gapAfter: 16 });
  }

  questions.forEach((q, idx) => {
    const resp = responses.find(r => r.questionId === q.id);
    let answer = resp?.answer;
    try { if (typeof answer === 'string') answer = JSON.parse(answer); } catch { /* leave as raw string */ }
    const answerText = Array.isArray(answer) ? answer.join(', ') : (answer ?? 'No answer');

    writeText(`Q${idx + 1}.`, { fontSize: 12, fontStyle: 'bold', gapBefore: 10, gapAfter: 2 });
    const blocks = htmlToBlocks(q.questionText);
    if (blocks.length) blocks.forEach(writeQuestionBlock);
    else writeText(' ', { fontSize: 11, gapAfter: 0 });
    writeText(String(answerText), { fontSize: 11, indent: 14, color: [55, 65, 81], gapBefore: 2 });
  });

  const fileBase = `${worksheet.title}_${candidate.name}`.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`${fileBase}.pdf`);
}
