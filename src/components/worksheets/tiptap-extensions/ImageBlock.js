import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

// Extends Tiptap's built-in Image node rather than writing a custom NodeView from
// scratch — v3 ships a tested drag-resize NodeView (`resize: { enabled: true }`,
// configured where this is registered) and we only need to add a caption on top.
// Width/height render as native img attributes; index.css caps them at 100% width
// so resized images stay responsive on mobile despite the fixed desktop size.
export const ImageBlock = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent(),
      caption: {
        default: null,
        parseHTML: element => element.closest('figure')?.querySelector('figcaption')?.textContent || null,
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const img = ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    if (!node.attrs.caption) return img;
    return ['figure', { class: 'wsr-image' }, img, ['figcaption', {}, node.attrs.caption]];
  },
});
