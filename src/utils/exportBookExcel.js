import ExcelJS from 'exceljs';

const COLUMNS = [
  { header: 'Book', key: 'book', width: 28 },
  { header: 'Author', key: 'author', width: 22 },
  { header: 'Chapter / Page', key: 'chapterPage', width: 18 },
  { header: 'Type', key: 'type', width: 14 },
  { header: 'Idea / Thought', key: 'idea', width: 46 },
  { header: 'My Perspective', key: 'perspective', width: 46 },
  { header: 'Suggested Use', key: 'suggestedUse', width: 18 },
  { header: 'Team Notes', key: 'teamNotes', width: 30 },
];

function chapterPageLabel(thought) {
  const parts = [];
  if (thought.sourceChapter) parts.push(thought.sourceChapter);
  if (thought.sourcePage) parts.push(`p. ${thought.sourcePage}`);
  return parts.join(', ');
}

function typeLabel(thought) {
  return thought.thoughtSubtype === 'perspective' ? 'Perspective' : 'Idea';
}

function sanitizeFileName(title) {
  return (title || 'Book').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function exportBookContentIdeasToExcel(book, bookThoughts) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Content Ideas', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' },
  };
  headerRow.alignment = { vertical: 'middle', wrapText: true };

  bookThoughts.forEach(thought => {
    sheet.addRow({
      book: book.title || '',
      author: book.author || '',
      chapterPage: chapterPageLabel(thought),
      type: typeLabel(thought),
      idea: thought.contentText || '',
      perspective: thought.myPerspective || '',
      suggestedUse: (thought.potentialUses || []).join(', '),
      teamNotes: '',
    });
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(book.title)}_Content_Ideas.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
