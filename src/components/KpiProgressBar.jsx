import { calcProgress, getHealthColor } from '../data/kpiTemplates';

const colorMap = {
  green: { bar: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-700' },
  amber: { bar: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-700' },
  red: { bar: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-700' },
  gray: { bar: 'bg-gray-300', bg: 'bg-gray-100', text: 'text-gray-500' },
};

export default function KpiProgressBar({ baseline, current, target, direction, label, unit, compact }) {
  const progress = calcProgress(baseline, current, target, direction);
  const color = getHealthColor(progress);
  const c = colorMap[color];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-2 ${c.bg} rounded-full overflow-hidden`}>
          <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${progress ?? 0}%` }} />
        </div>
        <span className={`text-xs font-medium ${c.text} w-8 text-right`}>{progress ?? '-'}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          {current != null && <span className={`text-sm font-bold ${c.text}`}>{current}{unit ? ` ${unit}` : ''}</span>}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{progress ?? '-'}%</span>
        </div>
      </div>
      <div className="relative">
        <div className={`h-3 ${c.bg} rounded-full overflow-hidden`}>
          <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${progress ?? 0}%` }} />
        </div>
        {/* Baseline marker */}
        <div className="absolute top-0 h-3 w-0.5 bg-gray-400" style={{ left: '0%' }} title={`Baseline: ${baseline}`} />
        {/* Target marker */}
        <div className="absolute top-0 h-3 w-0.5 bg-gray-800" style={{ left: '100%' }} title={`Target: ${target}`} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Baseline: {baseline ?? '-'}{unit ? ` ${unit}` : ''}</span>
        <span>Target: {target ?? '-'}{unit ? ` ${unit}` : ''}</span>
      </div>
    </div>
  );
}
