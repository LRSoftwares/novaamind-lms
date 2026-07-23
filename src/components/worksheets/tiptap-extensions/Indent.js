import { Extension } from '@tiptap/core';

// Paragraph/heading indent (distinct from list sink/lift, which Tiptap already
// handles natively via Tab/Shift+Tab on bullet/numbered lists).
const MAX_INDENT = 8;
const STEP_PX = 24;

function applyIndentDelta(types, delta, { state, tr, dispatch }) {
  const { from, to } = state.selection;
  let changed = false;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!types.includes(node.type.name)) return;
    const next = Math.min(MAX_INDENT, Math.max(0, (node.attrs.indent || 0) + delta));
    if (next === node.attrs.indent) return;
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
    changed = true;
  });
  if (changed && dispatch) dispatch(tr);
  return changed;
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return { types: ['paragraph', 'heading'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const match = /margin-left:\s*(\d+)px/.exec(element.getAttribute('style') || '');
              return match ? Math.min(MAX_INDENT, Math.round(Number(match[1]) / STEP_PX)) : 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent) return {};
              return { style: `margin-left: ${attributes.indent * STEP_PX}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const { types } = this.options;
    return {
      indent: () => (props) => applyIndentDelta(types, 1, props),
      outdent: () => (props) => applyIndentDelta(types, -1, props),
    };
  },
});
