import { Extension } from '@tiptap/core';

// Extends the existing textStyle mark (already used by Color/Highlight) with a
// fontSize attribute rendered as an inline style, following Tiptap's standard
// "extend TextStyle" pattern for attributes that don't warrant their own mark.
export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

export const FONT_SIZE_OPTIONS = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '15px' },
  { label: 'Medium', value: '18px' },
  { label: 'Large', value: '22px' },
  { label: 'X-Large', value: '28px' },
];
