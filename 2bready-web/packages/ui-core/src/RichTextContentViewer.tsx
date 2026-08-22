'use client';

import Box, { type BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

export interface RichTextContentViewerProps extends Omit<BoxProps, 'sx' | 'children'> {
  /** Editor-authored rich-text HTML (tiptap output) to display read-only */
  html: string;
  sx?: SxProps<Theme>;
}

/**
 * Renders editor-authored HTML with full element styling.
 *
 * Tailwind's preflight strips most browser typography defaults (list markers,
 * margins, heading sizes), and tables have no default borders at all — so
 * without this, editor content that LOOKS formatted in the tiptap editor
 * renders flat on read-only surfaces (SOP detail page, client reader dialog).
 * Keep covered elements in sync with RichTextEditor's extension list:
 * bold/italic/underline/strike, headings, lists, blockquote, code, tables,
 * horizontal rules, links, images, and inline alignment styles.
 */
export function RichTextContentViewer({ html, sx, ...boxProps }: RichTextContentViewerProps) {
  return (
    <Box
      {...boxProps}
      sx={{
        // ── Inline marks ────────────────────────────────────────────────
        '& strong, & b': { fontWeight: 700 },
        '& em, & i': { fontStyle: 'italic' },
        '& u': { textDecorationLine: 'underline', textUnderlineOffset: 2 },
        '& s, & del, & strike': { textDecorationLine: 'line-through' },

        // ── Headings & paragraphs ───────────────────────────────────────
        '& h1': { fontSize: '1.6rem', fontWeight: 700, mt: 2.5, mb: 1, lineHeight: 1.25 },
        '& h2': { fontSize: '1.35rem', fontWeight: 700, mt: 2.25, mb: 1, lineHeight: 1.3 },
        '& h3': { fontSize: '1.15rem', fontWeight: 700, mt: 2, mb: 0.75 },
        '& h4, & h5, & h6': { fontSize: '1rem', fontWeight: 700, mt: 1.75, mb: 0.75 },
        '& p': { my: 1, lineHeight: 1.7 },

        // ── Lists ───────────────────────────────────────────────────────
        '& ul': { listStyleType: 'disc', pl: 4, my: 1 },
        '& ol': { listStyleType: 'decimal', pl: 4, my: 1 },
        '& ul ul': { listStyleType: 'circle', my: 0.25 },
        '& ul ul ul': { listStyleType: 'square' },
        '& li': { mb: 0.5, lineHeight: 1.65 },
        '& li > p': { my: 0.25 },

        // ── Blockquote ──────────────────────────────────────────────────
        '& blockquote': {
          borderLeft: '3px solid',
          borderColor: 'divider',
          pl: 2,
          pr: 1,
          my: 1.5,
          color: 'text.secondary',
        },

        // ── Code ────────────────────────────────────────────────────────
        '& code': {
          fontFamily: 'mono',
          fontSize: '0.85em',
          bgcolor: 'action.selected',
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
        },
        '& pre': {
          bgcolor: 'action.selected',
          p: 1.5,
          borderRadius: 1.5,
          overflowX: 'auto',
          my: 1.5,
        },
        '& pre code': { bgcolor: 'transparent', p: 0, fontSize: 'inherit' },

        // ── Tables ──────────────────────────────────────────────────────
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          my: 1.5,
          display: 'block',
          overflowX: 'auto',
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          px: 1.25,
          py: 0.75,
          textAlign: 'left',
          verticalAlign: 'top',
        },
        '& th': { bgcolor: 'action.hover', fontWeight: 700 },

        // ── Misc ────────────────────────────────────────────────────────
        '& hr': { border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 2.5 },
        '& a': { color: 'primary.main', textDecoration: 'underline', textUnderlineOffset: 2 },
        '& img': { maxWidth: '100%', height: 'auto' },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}