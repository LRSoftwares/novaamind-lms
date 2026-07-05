// Vercel serverless function — Thought Lab AI features.
// Keeps OPENAI_API_KEY server-side only (never bundled into the Vite app).

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

async function callOpenAI(messages, { json = true } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY is not configured on the server');
    err.statusCode = 500;
    throw err;
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`OpenAI request failed: ${res.status} ${text}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function handleAnalyze({ title, contentText, category, pillar }) {
  const content = await callOpenAI([
    {
      role: 'system',
      content:
        'You are an editorial strategist for a personal Intellectual Operating System. ' +
        'Given a raw thought/note, assess how reusable it is across content formats (LinkedIn, newsletter, ' +
        'workshop, book chapter, etc.) and surface the sharpest atomic insights inside it. ' +
        'Respond ONLY with JSON: {"reuseScore": <0-100 integer>, "insights": [<2 to 4 short strings>]}.',
    },
    {
      role: 'user',
      content: `Title: ${title || 'Untitled'}\nCategory: ${category || 'Unknown'}\nPillar: ${pillar || 'None'}\n\nContent:\n${contentText || '(no content yet)'}`,
    },
  ]);

  const parsed = JSON.parse(content);
  const reuseScore = Math.max(0, Math.min(100, Math.round(Number(parsed.reuseScore) || 0)));
  const insights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 4).map(String) : [];
  return { reuseScore, insights };
}

async function handleGenerate({ title, contentText, format, tone }) {
  const formatGuides = {
    LinkedIn: 'a LinkedIn post (150-250 words, hook-first, line breaks for readability, ends with a question or CTA)',
    Newsletter: 'a newsletter section (short intro, 2-3 supporting points, a closing takeaway)',
    'Twitter Thread': 'a Twitter/X thread (5-8 numbered tweets, each under 280 characters)',
    Workshop: 'a workshop outline (objective, 3-4 exercises/discussion prompts, key takeaway)',
    Blog: 'a blog post outline with an intro paragraph and section headers',
  };
  const guide = formatGuides[format] || `content in the "${format}" format`;

  const content = await callOpenAI(
    [
      {
        role: 'system',
        content:
          `You write ${guide}${tone ? ` in a ${tone} tone` : ''}, based on the source thought provided. ` +
          'Respond ONLY with JSON: {"title": <string>, "body": <string>}.',
      },
      {
        role: 'user',
        content: `Source title: ${title || 'Untitled'}\n\nSource content:\n${contentText || '(no content yet)'}`,
      },
    ],
    { json: true }
  );

  const parsed = JSON.parse(content);
  return { title: String(parsed.title || ''), body: String(parsed.body || '') };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { action } = req.body || {};
    if (action === 'analyze') {
      const result = await handleAnalyze(req.body);
      res.status(200).json(result);
      return;
    }
    if (action === 'generate') {
      const result = await handleGenerate(req.body);
      res.status(200).json(result);
      return;
    }
    res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('[api/ai] error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal error' });
  }
}
