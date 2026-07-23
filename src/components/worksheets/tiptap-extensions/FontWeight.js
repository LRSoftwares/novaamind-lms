import { Extension } from '@tiptap/core';

// Separate from the bold toggle mark — lets a creator pick a specific weight
// (e.g. Medium/Semibold) rather than only on/off bold, per CR-01's "Font Weight" item.
export const FontWeight = Extension.create({
  name: 'fontWeight',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: element => element.style.fontWeight || null,
            renderHTML: attributes => {
              if (!attributes.fontWeight) return {};
              return { style: `font-weight: ${attributes.fontWeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontWeight: fontWeight => ({ chain }) => chain().setMark('textStyle', { fontWeight }).run(),
      unsetFontWeight: () => ({ chain }) => chain().setMark('textStyle', { fontWeight: null }).removeEmptyTextStyle().run(),
    };
  },
});

export const FONT_WEIGHT_OPTIONS = [
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
];
