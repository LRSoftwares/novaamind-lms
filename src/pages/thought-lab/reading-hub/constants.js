export const STATUS_OPTIONS = [
  { value: 'want-to-read', label: 'Want to Read' },
  { value: 'currently-reading', label: 'Currently Reading' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'reference', label: 'Reference' },
  { value: 'favourite', label: 'Favourite' },
  { value: 'archived', label: 'Archived' },
];

export const CATEGORY_OPTIONS = ['Books', 'Reports', 'Research Papers', 'Whitepapers'];

// Subject/genre tagging (stored on item.tag) — suggested list, not exhaustive.
// Users can type any custom genre; these just seed the picker.
export const GENRE_OPTIONS = [
  'Business', 'Strategy', 'Leadership', 'Philosophy', 'Psychology',
  'Self-Help', 'Economics', 'Macroeconomics', 'Finance', 'History',
  'Biography', 'Technology', 'Spirituality', 'Politics',
];

// UI grouping only — underlying item.category values are untouched.
export const CATEGORY_GROUPS = ['Books', 'Reports', 'Research', 'Other'];

export function groupCategory(category) {
  if (category === 'Research Papers' || category === 'Whitepapers' || category === 'Research') return 'Research';
  if (category === 'Books' || category === 'Reports') return category;
  return 'Other';
}

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'author', label: 'Author A–Z' },
  { value: 'progress', label: 'Reading Progress' },
  { value: 'ideas', label: 'Most Ideas' },
];
