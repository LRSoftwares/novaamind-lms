import { jsPDF } from 'jspdf';

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

    writeText(`Q${idx + 1}. ${q.questionText}`, { fontSize: 12, fontStyle: 'bold', gapBefore: 10, gapAfter: 4 });
    writeText(String(answerText), { fontSize: 11, indent: 14, color: [55, 65, 81] });
  });

  const fileBase = `${worksheet.title}_${candidate.name}`.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`${fileBase}.pdf`);
}
