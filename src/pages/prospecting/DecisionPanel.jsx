import { useState } from 'react';
import { DECISION_STATUS_COLORS } from './statusStyles';

const OPTIONS = ['Academy', 'Strategy', 'Both', 'Not a Fit', 'Needs More Research'];

export default function DecisionPanel({ prospect, onSave }) {
  const [decision, setDecision] = useState(prospect.decisionStatus !== 'Not Reviewed' ? prospect.decisionStatus : '');
  const [notes, setNotes] = useState(prospect.decisionNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!decision) return;
    setSaving(true);
    await onSave(decision, notes);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Your Decision</h3>

      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setDecision(opt)}
            className={`text-sm font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
              decision === opt ? `${DECISION_STATUS_COLORS[opt]} border-transparent` : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Decision Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Why this decision? (optional)"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        {prospect.decisionStatus !== 'Not Reviewed' && (
          <p className="text-xs text-gray-400">Current decision: <span className="font-semibold text-gray-600">{prospect.decisionStatus}</span></p>
        )}
        <button
          onClick={handleSave}
          disabled={!decision || saving}
          className="ml-auto px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Decision'}
        </button>
      </div>
    </div>
  );
}
