export const STAGES = ['Idea', 'Research', 'Writing', 'Review', 'Ready', 'Published'];

export const CATEGORIES = [
  'Quick Thought', 'Observation', 'Framework', 'Story', 'Lesson',
  'Book Idea', 'Research', 'Case Study', 'Quote', 'Workshop', 'Whitepaper',
  'Newsletter', 'Podcast', 'LinkedIn', 'Twitter/X', 'Carousel', 'Video Script', 'Article', 'Blog',
];

export const PILLARS = [
  'AI Native Organizations', 'Leadership', 'Decision Intelligence', 'Digital Workforce',
  'AI Strategy', 'Enterprise AI', 'Future of Work', 'Business Systems', 'Organizational Memory',
  'AI Agents', 'Productivity', 'Education', 'Marketing', 'Sales', 'Personal', 'Books', 'Frameworks',
];

export const IMPORTANCE_LEVELS = ['Low', 'Medium', 'High'];

export const KNOWLEDGE_BASE_CATEGORIES = ['Research', 'Article', 'Book Idea', 'Podcast', 'Video Script', 'Whitepaper', 'Observation'];
export const FRAMEWORK_CATEGORIES = ['Framework'];
export const STORY_CATEGORIES = ['Story', 'Case Study'];

export const GENERATE_FORMATS = ['LinkedIn', 'Newsletter', 'Twitter Thread', 'Workshop', 'Blog'];

export const STAGE_COLORS = {
  Idea: 'bg-gray-100 text-gray-600',
  Research: 'bg-cyan-50 text-cyan-700',
  Writing: 'bg-blue-50 text-blue-700',
  Review: 'bg-amber-50 text-amber-700',
  Ready: 'bg-emerald-50 text-emerald-700',
  Published: 'bg-[var(--color-ios-primary)]/10 text-[var(--color-ios-primary)]',
  Archived: 'bg-red-50 text-red-600',
};

export const IMPORTANCE_COLORS = {
  Low: 'text-gray-400',
  Medium: 'text-amber-500',
  High: 'text-red-500',
};

// Shared between Thought Lab and Reading Hub — a thought's origin/subtype/
// development lifecycle, regardless of which surface captured it.
export const ORIGIN_TYPES = [
  { value: 'own_thought', label: 'My Own Thought' },
  { value: 'book', label: 'Book' },
  { value: 'report', label: 'Report' },
  { value: 'research', label: 'Research' },
  { value: 'article', label: 'Article' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'video', label: 'Video' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'ai_conversation', label: 'AI Conversation' },
  { value: 'other', label: 'Other' },
];

export const THOUGHT_SUBTYPES = [
  { value: 'thought', label: 'Thought' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'idea', label: 'Idea' },
  { value: 'perspective', label: 'Perspective' },
  { value: 'question', label: 'Question' },
  { value: 'framework_seed', label: 'Framework Seed' },
  { value: 'content_seed', label: 'Content Seed' },
  { value: 'quote', label: 'Quote' },
  { value: 'principle', label: 'Principle' },
  { value: 'contrarian_view', label: 'Contrarian View' },
];

export const DEVELOPMENT_STATUSES = [
  { value: 'captured', label: 'Captured' },
  { value: 'developing', label: 'Developing' },
  { value: 'ready_to_write', label: 'Ready to Write' },
  { value: 'converted', label: 'Converted' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export const DEVELOPMENT_STATUS_COLORS = {
  captured: 'bg-gray-100 text-gray-600',
  developing: 'bg-cyan-50 text-cyan-700',
  ready_to_write: 'bg-emerald-50 text-emerald-700',
  converted: 'bg-blue-50 text-blue-700',
  published: 'bg-[var(--color-ios-primary)]/10 text-[var(--color-ios-primary)]',
  archived: 'bg-red-50 text-red-600',
};
