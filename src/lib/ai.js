async function callAi(payload) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`);
  return data;
}

export function analyzeThought(thought) {
  return callAi({
    action: 'analyze',
    title: thought.title,
    contentText: thought.contentText,
    category: thought.category,
    pillar: thought.pillar,
  });
}

export function generateVariant(thought, format, tone) {
  return callAi({
    action: 'generate',
    title: thought.title,
    contentText: thought.contentText,
    format,
    tone,
  });
}
