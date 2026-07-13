import { useMemo, useState } from 'react';
import { Copy, Download, Send, RotateCw, Check } from 'lucide-react';
import { buildResearchPrompt, prospectPromptFilename } from '../../lib/prospectPrompt';

export default function ResearchPromptPanel({ prospect, onMarkSent }) {
  const [regenKey, setRegenKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prompt = useMemo(() => buildResearchPrompt(prospect), [prospect, regenKey]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = prospectPromptFilename(prospect);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Generated Research Prompt</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setRegenKey(k => k + 1)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RotateCw className="w-3.5 h-3.5" /> Regenerate Prompt
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Download Prompt
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy Prompt'}
          </button>
        </div>
      </div>

      <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">{prompt}</pre>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400">Copy this prompt into any research-capable LLM, then upload the returned .md file below.</p>
        <button
          onClick={onMarkSent}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" /> Mark as Sent for Research
        </button>
      </div>
    </div>
  );
}
