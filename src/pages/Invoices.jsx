import { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Download, Receipt, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { numberToWordsIndian, formatINR } from '../utils/numberToWords';

const STORAGE_KEY = 'lms_invoice_history';

const emptyItem = () => ({ desc: '', qty: 1, rate: '' });

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function nextSeqFor(history, code, year) {
  const used = history
    .filter(h => h.code === code && h.year === year)
    .map(h => parseInt(h.seq, 10) || 0);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return String(next).padStart(3, '0');
}

export default function Invoices() {
  const { companies } = useData();
  const currentYear = String(new Date().getFullYear());

  const [history, setHistory] = useState(loadHistory);
  const [companyId, setCompanyId] = useState('');
  const [code, setCode] = useState('');
  const [year, setYear] = useState(currentYear);
  const [seq, setSeq] = useState(() => nextSeqFor(loadHistory(), '', currentYear));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [due, setDue] = useState('On Receipt');
  const [billName, setBillName] = useState('');
  const [billAddr, setBillAddr] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [notes, setNotes] = useState('Payment due on receipt of this invoice.\nServices rendered as per mutual agreement. Jurisdiction: Chennai, Tamil Nadu.');
  const [toast, setToast] = useState('');
  const [downloading, setDownloading] = useState(false);
  const sheetRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const applyCompany = (id) => {
    setCompanyId(id);
    const c = companies.find(co => co.id === id);
    if (!c) return;
    setBillName(c.name || '');
    setBillAddr([c.address, c.city, c.state].filter(Boolean).join(', '));
    const guess = (c.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    setCode(guess);
    setSeq(nextSeqFor(history, guess, year));
  };

  const handleCodeChange = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    setCode(clean);
    setSeq(nextSeqFor(history, clean, year));
  };

  const handleYearChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setYear(clean);
    setSeq(nextSeqFor(history, code, clean));
  };

  const invoiceNumber = `NM-${code || 'XXX'}-${year}-${seq}`;

  const subtotal = useMemo(() =>
    items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), 0),
    [items]);

  const updateItem = (idx, patch) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleDownload = async () => {
    if (!code) { showToast('Enter a 3-letter client code first'); return; }
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(sheetRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Invoice-${invoiceNumber}.pdf`);

      const record = { number: invoiceNumber, code, year, seq, date, billName, amount: subtotal };
      const updated = [record, ...history.filter(h => h.number !== invoiceNumber)].slice(0, 50);
      setHistory(updated);
      saveHistory(updated);
      setSeq(nextSeqFor(updated, code, year));
      showToast(`Downloaded ${invoiceNumber}`);
    } catch (err) {
      console.error('[Invoices] PDF generation failed:', err);
      showToast('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative pb-16">
      {toast && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
          <CheckCircle className="w-5 h-5" /><p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Receipt className="w-6 h-6 text-blue-700" /> Invoice Generator</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details below and download a PDF invoice for Novaamind AI Solutions Pvt. Limited.</p>
        </div>
        <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Download className="w-4 h-4" /> {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* ===== FORM PANEL ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bill to existing company</label>
            <select value={companyId} onChange={e => applyCompany(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">— Select or type manually below —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Client Code</label>
              <input value={code} onChange={e => handleCodeChange(e.target.value)} maxLength={3} placeholder="NAT" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Year</label>
              <input value={year} onChange={e => handleYearChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Seq</label>
              <input value={seq} onChange={e => setSeq(e.target.value.replace(/\D/g, '').slice(0, 3))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Invoice No: <span className="font-mono text-blue-700">{invoiceNumber}</span></p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Due</label>
              <input value={due} onChange={e => setDue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bill To — Company Name</label>
            <input value={billName} onChange={e => setBillName(e.target.value)} placeholder="Client company name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bill To — Address</label>
            <textarea value={billAddr} onChange={e => setBillAddr(e.target.value)} rows={2} placeholder="Client address" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Line Items</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-700 hover:bg-blue-50 px-2 py-1 rounded"><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 w-4">{idx + 1}.</span>
                    <input value={it.desc} onChange={e => updateItem(idx, { desc: e.target.value })} placeholder="Description" className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={() => removeItem(idx)} className="p-1.5 rounded hover:bg-red-50 flex-shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase mb-0.5">Qty</label>
                      <input type="number" min="0" value={it.qty} onChange={e => updateItem(idx, { qty: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-center bg-white focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase mb-0.5">Rate</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">₹</span>
                        <input type="number" min="0" step="0.01" value={it.rate} onChange={e => updateItem(idx, { rate: e.target.value })} placeholder="0.00" className="w-full pl-5 pr-2 py-1.5 border border-gray-300 rounded text-xs text-right bg-white focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                    </div>
                  </div>
                  <p className="text-right text-[11px] text-gray-400 pl-6">
                    Amount: <span className="font-semibold text-gray-600">{formatINR((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0))}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes &amp; Terms</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {history.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Invoices</p>
              <div className="space-y-1 max-h-40 overflow-auto">
                {history.slice(0, 8).map(h => (
                  <div key={h.number} className="flex justify-between text-xs text-gray-500">
                    <span className="font-mono">{h.number}</span>
                    <span>{formatINR(h.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== INVOICE PREVIEW ===== */}
        <div className="bg-gray-100 rounded-xl p-6 overflow-auto">
          <div ref={sheetRef} className="bg-white mx-auto" style={{ width: '760px', padding: '40px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#4f46e5', marginBottom: '8px' }}>NOVAAMIND AI SOLUTIONS PVT. LIMITED</h1>
                <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.8 }}>
                  No 1701, The Ace By Risland<br />
                  Corporation Road, Perungudi<br />
                  Chennai – 600096<br />
                  raghav@novaamind.com | +91-7639482343
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-1px' }}>INVOICE</p>
                <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#4f46e5', marginTop: '4px' }}>{invoiceNumber}</p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>Date: {date}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>Due: {due}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Bill To</p>
                <p style={{ fontSize: '14px', fontWeight: 700 }}>{billName || 'Client Company Name'}</p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{billAddr || 'Client address'}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Payment Details</p>
                <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.8 }}>
                  <strong>State Bank of India</strong><br />
                  Raghavendra KBVM<br />
                  A/C: 20273581073<br />
                  IFSC: SBIN0007993<br />
                  Branch: Velachery<br />
                  UPI: 7639482343@ybl
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e7ff' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', width: '40px' }}>#</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', width: '60px' }}>Qty</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', width: '120px' }}>Rate (₹)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', width: '120px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', color: '#999' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}><strong>{it.desc || 'Item description'}</strong></td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>{it.qty || 0}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>{formatINR(parseFloat(it.rate) || 0)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600 }}>{formatINR((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
              <div style={{ width: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                  <span style={{ color: '#666' }}>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: 700, borderTop: '2px solid #4f46e5', marginTop: '4px' }}>
                  <span>Total Due</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
                  Rupees {numberToWordsIndian(subtotal)} Only
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Notes &amp; Terms</p>
                <p style={{ fontSize: '11px', color: '#666', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{notes}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>For NOVAAMIND AI SOLUTIONS PVT. LIMITED</p>
                <p style={{ fontSize: '16px', fontWeight: 600, fontStyle: 'italic', color: '#4f46e5' }}>Raghav</p>
                <p style={{ fontSize: '11px', color: '#999' }}>Authorised Signatory</p>
              </div>
            </div>

            <p style={{ fontSize: '10px', color: '#bbb', textAlign: 'center', marginTop: '32px', fontStyle: 'italic' }}>
              This is a computer-generated invoice. No physical signature required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
