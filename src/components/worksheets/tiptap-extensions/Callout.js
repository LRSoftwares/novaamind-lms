import { Node, mergeAttributes } from '@tiptap/core';

export const CALLOUT_VARIANTS = ['info', 'warning', 'success', 'tip', 'important', 'example'];

// A wrapping block node (like blockquote) rather than a mark, so a callout can
// hold multiple paragraphs/lists — matches Notion/Confluence-style info boxes.
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-callout') || 'info',
        renderHTML: attributes => ({ 'data-callout': attributes.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'wsr-callout' }), 0];
  },

  addCommands() {
    return {
      setCallout: (variant = 'info') => ({ commands }) => commands.wrapIn(this.name, { variant }),
      unsetCallout: () => ({ commands }) => commands.lift(this.name),
      toggleCallout: (variant = 'info') => ({ editor, commands }) =>
        editor.isActive(this.name) ? commands.lift(this.name) : commands.wrapIn(this.name, { variant }),
    };
  },
});
