// Detects and scores "personality profile"-style worksheets: Rating questions whose
// text is formatted as "Category — Trait: ...", grouped into categories for a
// game-like fill experience and a computed results breakdown (mirrors the standalone
// Personality Profile Assessment Game).

export const CATEGORY_COLORS = {
  Planner: '#e8b800',
  Connector: '#1a3fd4',
  Solver: '#18b84a',
  Explorer: '#e06b00',
};

const FALLBACK_COLORS = ['#e8b800', '#1a3fd4', '#18b84a', '#e06b00', '#8a3fd4', '#d43f7a'];

export const CATEGORY_SUMMARIES = {
  Planner: "You lead with structure and reliability. Your natural instinct is to create order, stick to commitments, and hold yourself and others to high standards. People lean on you because you always deliver — and you take that responsibility seriously.",
  Connector: "You move through the world through relationships. Empathy, communication, and collaboration are your core strengths. You read the room effortlessly and know how to bring people together — making you the glue in any group.",
  Solver: "You are driven by understanding. Whether it's a technical problem or an abstract concept, you go deep before you speak. Your independence and analytical mind make you exceptionally reliable when precision matters.",
  Explorer: "You thrive on novelty and possibility. Risk doesn't scare you — it energizes you. You bring contagious enthusiasm and a bias toward action, turning ideas into momentum and inspiring others to move faster.",
};

const SEPARATOR = /\s+—\s+/;

export function categoryColor(category, indexHint = 0) {
  return CATEGORY_COLORS[category] || FALLBACK_COLORS[indexHint % FALLBACK_COLORS.length];
}

export function parseTrait(questionText) {
  const parts = (questionText || '').split(SEPARATOR);
  if (parts.length < 2) return null;
  const category = parts[0].trim();
  const rest = parts.slice(1).join(' — ').trim();
  const trait = rest.split(':')[0].trim();
  if (!category || !trait) return null;
  return { category, trait };
}

export function isPersonalityWorksheet(questions) {
  if (!questions || questions.length < 4) return false;
  if (!questions.every(q => q.questionType === 'Rating')) return false;
  const parsed = questions.map(q => parseTrait(q.questionText));
  if (parsed.some(p => !p)) return false;
  const categories = new Set(parsed.map(p => p.category));
  return categories.size >= 2;
}

export function groupByCategory(questions) {
  const order = [];
  const map = new Map();
  questions.forEach(q => {
    const parsed = parseTrait(q.questionText);
    if (!parsed) return;
    if (!map.has(parsed.category)) {
      map.set(parsed.category, []);
      order.push(parsed.category);
    }
    map.get(parsed.category).push({ ...q, trait: parsed.trait });
  });
  return order.map((category, i) => ({ category, color: categoryColor(category, i), questions: map.get(category) }));
}

// answers: { [questionId]: numericValue }
export function computeCategoryScores(questions, answers) {
  const groups = groupByCategory(questions);
  return groups
    .map(({ category, color, questions: qs }) => {
      const traits = qs.map(q => ({ trait: q.trait, value: Number(answers[q.id]) || 0, questionId: q.id }));
      const total = traits.reduce((s, t) => s + t.value, 0);
      const max = qs.length * 5;
      return { category, color, traits, total, max, pct: max ? Math.round((total / max) * 100) : 0 };
    })
    .sort((a, b) => b.total - a.total);
}
