import { Extension } from '@tiptap/core';

// Three presets rather than raw pixel input — matches CR-01's "Spacing Before/After
// Paragraph" bullets without exposing a numeric-px control that's easy to misuse.
export const SPACING_PRESETS = { compact: 2, normal: 8, relaxed: 16 };

function spacingFromPx(px) {
  if (px <= (SPACING_PRESETS.compact + SPACING_PRESETS.normal) / 2) return 'compact';
  if (px >= (SPACING_PRESETS.normal + SPACING_PRESETS.relaxed) / 2) return 'relaxed';
  return 'normal';
}

export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addOptions() {
    return { types: ['paragraph'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          spacing: {
            default: 'normal',
            parseHTML: element => {
              const match = /margin-top:\s*(\d+)px/.exec(element.getAttribute('style') || '');
              return match ? spacingFromPx(Number(match[1])) : 'normal';
            },
            renderHTML: attributes => {
              const px = SPACING_PRESETS[attributes.spacing] ?? SPACING_PRESETS.normal;
              return { style: `margin-top: ${px}px; margin-bottom: ${px}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setParagraphSpacing: spacing => ({ commands }) => commands.updateAttributes('paragraph', { spacing }),
    };
  },
});
