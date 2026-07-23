import { Node, mergeAttributes } from '@tiptap/core';

// Native <details>/<summary> rather than a Tiptap Pro "details" extension (the
// open-source summary/content sub-packages are still beta on the v3 line) — three
// small nodes: the <details> wrapper, its <summary>, and a content <div>.

const CollapsibleSummary = Node.create({
  name: 'collapsibleSummary',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'summary' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0];
  },
});

const CollapsibleContent = Node.create({
  name: 'collapsibleContent',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'details > div' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
});

const CollapsibleWrapper = Node.create({
  name: 'collapsible',
  group: 'block',
  content: 'collapsibleSummary collapsibleContent',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => element.hasAttribute('open'),
        renderHTML: attributes => (attributes.open ? { open: '' } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCollapsible: () => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: { open: true },
        content: [
          { type: 'collapsibleSummary', content: [{ type: 'text', text: 'Read More' }] },
          { type: 'collapsibleContent', content: [{ type: 'paragraph' }] },
        ],
      }),
    };
  },
});

export const CollapsibleExtensions = [CollapsibleWrapper, CollapsibleSummary, CollapsibleContent];
