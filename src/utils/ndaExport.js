import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

function nodeText(node) {
  if (node.type === 'text') return node.text;
  if (!node.content) return '';
  return node.content.map(nodeText).join('');
}

// Flattens the TipTap document JSON into a simple block list shared by both
// the PDF and DOCX renderers, so heading/paragraph/list logic isn't duplicated.
function flattenNdaContent(content) {
  const blocks = [];
  (content?.content || []).forEach((node) => {
    if (node.type === 'heading') {
      blocks.push({ type: `h${node.attrs?.level || 2}`, text: nodeText(node) });
    } else if (node.type === 'paragraph') {
      const t = nodeText(node);
      if (t) blocks.push({ type: 'p', text: t });
    } else if (node.type === 'bulletList') {
      (node.content || []).forEach((li) => {
        blocks.push({ type: 'li', text: (li.content || []).map(nodeText).join(' ') });
      });
    }
  });
  return blocks;
}

export function ndaFileBaseName(record) {
  const clean = (s) => (s && s.trim() ? s.trim().replace(/[^a-zA-Z0-9]+/g, '') : 'Unknown');
  const sd = record.structuredData;
  if (sd) {
    const date = sd.effectiveDate || new Date(record.updatedAt).toISOString().slice(0, 10);
    return `NDA_${clean(sd.party1?.legalName)}_${clean(sd.party2?.legalName)}_${date}`;
  }
  return clean(record.title || record.name);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportNdaPdf(record) {
  const blocks = flattenNdaContent(record.content);
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

  blocks.forEach((block) => {
    let fontSize = 11;
    let fontStyle = 'normal';
    let indent = 0;
    let gapBefore = 6;
    let gapAfter = 6;
    if (block.type === 'h1') { fontSize = 16; fontStyle = 'bold'; gapBefore = 0; gapAfter = 12; }
    else if (block.type === 'h2') { fontSize = 13; fontStyle = 'bold'; gapBefore = 14; gapAfter = 6; }
    else if (block.type === 'li') { indent = 14; }

    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    y += gapBefore;
    const prefix = block.type === 'li' ? '•  ' : '';
    const lines = doc.splitTextToSize(prefix + block.text, maxWidth - indent);
    lines.forEach((line) => {
      ensureSpace(fontSize * 1.4);
      doc.text(line, margin + indent, y);
      y += fontSize * 1.4;
    });
    y += gapAfter;
  });

  doc.save(`${ndaFileBaseName(record)}.pdf`);
}

export async function exportNdaDocx(record) {
  const blocks = flattenNdaContent(record.content);
  const paragraphs = blocks.map((block) => {
    if (block.type === 'h1') return new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });
    if (block.type === 'h2') return new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
    if (block.type === 'li') return new Paragraph({ text: block.text, bullet: { level: 0 }, spacing: { after: 80 } });
    return new Paragraph({ children: [new TextRun(block.text)], spacing: { after: 120 } });
  });

  const file = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(file);
  downloadBlob(blob, `${ndaFileBaseName(record)}.docx`);
}
