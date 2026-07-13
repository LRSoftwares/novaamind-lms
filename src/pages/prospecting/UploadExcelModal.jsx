import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';

const TARGET_FIELDS = [
  { key: 'name', label: 'Name', aliases: ['name'] },
  { key: 'company', label: 'Company', aliases: ['company'] },
  { key: 'role', label: 'Role / Position', aliases: ['role', 'position', 'designation'] },
  { key: 'city', label: 'City', aliases: ['city'] },
  { key: 'country', label: 'Country', aliases: ['country'] },
  { key: 'industry', label: 'Industry', aliases: ['industry'] },
  { key: 'knownContext', label: 'Known Context', aliases: ['about', 'description', 'known context'] },
  { key: 'aspirations', label: 'Aspirations', aliases: ['aspirations'] },
  { key: 'email', label: 'Email', aliases: ['email'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'contact info'] },
  { key: 'internalNotes', label: 'Notes', aliases: ['notes'] },
  { key: 'linkedinUrl', label: 'LinkedIn URL', aliases: ['linkedin', 'linkedin url'] },
  { key: 'companyWebsite', label: 'Company Website', aliases: ['company website'] },
  { key: 'personalWebsite', label: 'Personal Website', aliases: ['personal website'] },
  { key: 'xUrl', label: 'X / Twitter URL', aliases: ['x', 'twitter'] },
  { key: 'youtubeUrl', label: 'YouTube URL', aliases: ['youtube'] },
  { key: 'instagramUrl', label: 'Instagram URL', aliases: ['instagram'] },
  { key: 'facebookUrl', label: 'Facebook URL', aliases: ['facebook'] },
  { key: 'githubUrl', label: 'GitHub URL', aliases: ['github'] },
  { key: 'mediumUrl', label: 'Medium URL', aliases: ['medium'] },
  { key: 'substackUrl', label: 'Substack URL', aliases: ['substack'] },
  { key: 'scholarUrl', label: 'Google Scholar URL', aliases: ['google scholar', 'scholar'] },
  { key: 'orcidUrl', label: 'ORCID URL', aliases: ['orcid'] },
  { key: 'otherUrl', label: 'Other Public URL', aliases: ['other url', 'other'] },
];

const selectClass = 'w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await file.text();
    const result = Papa.parse(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: true });
    const headers = result.meta.fields || [];
    return { headers, rows: result.data };
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const headers = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = (cell.value || '').toString().trim();
  });
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    headers.forEach((h, i) => {
      if (!h) return;
      const cell = row.getCell(i + 1);
      obj[h] = cell.value == null ? '' : (cell.value.text || cell.value.result || cell.value).toString();
    });
    rows.push(obj);
  });
  return { headers: headers.filter(Boolean), rows };
}

function autoDetectMapping(headers) {
  const mapping = {};
  const normalized = headers.map(h => ({ raw: h, norm: h.trim().toLowerCase() }));
  for (const field of TARGET_FIELDS) {
    const found = normalized.find(h => field.aliases.includes(h.norm));
    mapping[field.key] = found ? found.raw : '';
  }
  return mapping;
}

export default function UploadExcelModal({ open, onClose }) {
  const { prospects, bulkImportProspects } = useData();
  const fileRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload | mapping | done
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [excluded, setExcluded] = useState(new Set());
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const reset = () => {
    setStep('upload'); setHeaders([]); setRows([]); setMapping({}); setExcluded(new Set()); setError(''); setImportedCount(0);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    try {
      const { headers: h, rows: r } = await parseFile(file);
      if (!h.length || !r.length) {
        setError('Could not detect any columns or rows in this file.');
        return;
      }
      setHeaders(h);
      setRows(r);
      setMapping(autoDetectMapping(h));
      setStep('mapping');
    } catch (err) {
      console.error('[LMS] Prospect Excel parse error:', err);
      setError('Failed to read this file. Please check the format and try again.');
    }
    e.target.value = '';
  };

  const mappedRows = useMemo(() => {
    const usedHeaders = new Set(Object.values(mapping).filter(Boolean));
    return rows.map(row => {
      const prospect = {};
      for (const field of TARGET_FIELDS) {
        const header = mapping[field.key];
        prospect[field.key] = header ? (row[header] ?? '').toString().trim() : '';
      }
      const originalImportData = {};
      headers.forEach(h => {
        if (!usedHeaders.has(h) && row[h]) originalImportData[h] = row[h];
      });
      const isDuplicate = !!prospect.name && prospects.some(p => {
        const linkedin = prospect.linkedinUrl.toLowerCase();
        const email = prospect.email.toLowerCase();
        if (linkedin && (p.linkedinUrl || '').toLowerCase() === linkedin) return true;
        if (email && (p.email || '').toLowerCase() === email) return true;
        return (p.name || '').toLowerCase() === prospect.name.toLowerCase() && (p.company || '').toLowerCase() === prospect.company.toLowerCase();
      });
      return { prospect, originalImportData, isDuplicate };
    }).filter(r => r.prospect.name);
  }, [rows, mapping, headers, prospects]);

  const handleConfirmImport = async () => {
    const toImport = mappedRows
      .map((r, i) => ({ ...r, i }))
      .filter(r => !excluded.has(r.i))
      .map(r => ({ ...r.prospect, originalImportData: Object.keys(r.originalImportData).length ? r.originalImportData : null, researchStatus: 'Not Started', decisionStatus: 'Not Reviewed' }));
    if (!toImport.length) { setError('No rows selected to import.'); return; }
    setImporting(true);
    const result = await bulkImportProspects(toImport);
    setImporting(false);
    if (result.error) { setError(result.error); return; }
    setImportedCount(toImport.length);
    setStep('done');
  };

  const toggleExcluded = (i) => {
    setExcluded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upload Excel" wide={step !== 'upload'}>
      {step === 'upload' && (
        <div className="space-y-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
          >
            <UploadCloud className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Click to choose a .xlsx, .xls or .csv file</span>
            <span className="text-xs text-gray-400">Unmapped columns are preserved as original import data</span>
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Fields</h3>
            <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {TARGET_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="">Not mapped</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview (first 5 rows)</h3>
            <div className="rounded-lg border border-gray-200 overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left"></th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Company</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Role</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">City</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mappedRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className={r.isDuplicate ? 'bg-amber-50' : ''}>
                      <td className="px-2 py-2">
                        <input type="checkbox" checked={!excluded.has(i)} onChange={() => toggleExcluded(i)} />
                      </td>
                      <td className="px-2 py-2 text-gray-900">{r.prospect.name}</td>
                      <td className="px-2 py-2 text-gray-500">{r.prospect.company}</td>
                      <td className="px-2 py-2 text-gray-500">{r.prospect.role}</td>
                      <td className="px-2 py-2 text-gray-500">{r.prospect.city}</td>
                      <td className="px-2 py-2">
                        {r.isDuplicate && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <AlertTriangle className="w-3 h-3" /> Possible duplicate
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {mappedRows.length} row{mappedRows.length === 1 ? '' : 's'} detected, {mappedRows.length - excluded.size} selected for import.
              {mappedRows.some(r => r.isDuplicate) && ' Uncheck duplicates you don’t want to re-create.'}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              Back
            </button>
            <div className="flex gap-2">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || mappedRows.length === 0}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : `Confirm Import (${mappedRows.length - excluded.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-gray-700">Imported <span className="font-semibold">{importedCount}</span> prospect{importedCount === 1 ? '' : 's'}.</p>
          <button onClick={handleClose} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
