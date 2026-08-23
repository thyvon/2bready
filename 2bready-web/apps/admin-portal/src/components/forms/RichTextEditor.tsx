'use client';

import { useEffect } from 'react';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import {
  RichTextEditorProvider,
  RichTextField,
  MenuBar,
  MenuControlsContainer,
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonUnderline,
  MenuButtonStrikethrough,
  MenuButtonBulletedList,
  MenuButtonOrderedList,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuButtonBlockquote,
  MenuButtonHorizontalRule,
  MenuButtonEditLink,
  MenuButtonRedo,
  MenuButtonUndo,
  MenuButtonRemoveFormatting,
  MenuSelectHeading,
  MenuSelectFontFamily,
  MenuSelectTextAlign,
  MenuButtonAddTable,
  TableMenuControls,
} from 'mui-tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
// StarterKit does not bundle tables — required by MenuButtonAddTable /
// TableMenuControls, whose can().insertTable() checks crash without it.
import { TableKit } from '@tiptap/extension-table';
// StarterKit does not bundle text alignment either — required by the
// MenuButtonAlign* toolbar buttons.
import TextAlign from '@tiptap/extension-text-align';
// TextStyle is the mark carrier FontFamily writes into (span style="...").
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';

// Curated so every choice renders IDENTICALLY in the browser and in the
// Gotenberg PDF: each stack's final family is installed in the PDF container
// (Khmer OS Muol/Siemreap mounted, Caladea/Carlito/DejaVu ship with it).
// Web-safe fallbacks keep browser rendering sane before those names resolve.
const FONT_FAMILY_OPTIONS = [
  { label: 'Khmer OS Muol', value: "'Khmer OS Muol', KhmerOSmuol, serif" },
  { label: 'Khmer OS Siemreap', value: "'Khmer OS Siemreap', KhmerOSsiemreap, sans-serif" },
  { label: 'Serif (Cambria)', value: 'Caladea, Cambria, Georgia, serif' },
  { label: 'Sans (Calibri)', value: 'Carlito, Calibri, Arial, sans-serif' },
  { label: 'Monospace', value: '"DejaVu Sans Mono", "Courier New", monospace' },
];

interface RichTextEditorFieldProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
  /**
   * Bump to force the editor to re-apply `value`. Dialogs pass a nonce that
   * changes when the form resets for a different target — without this, the
   * editor would either go stale or (worse) sync on every keystroke and risk
   * a setContent/onUpdate feedback loop.
   */
  resetKey?: string | number;
}

export function RichTextEditorField({
  label,
  value,
  onChange,
  error,
  helperText,
  minHeight = 220,
  resetKey,
}: RichTextEditorFieldProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TableKit.configure({ table: { resizable: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
    ],
    // Tiptap treats content as initial only; current content is later driven by
    // the resetKey effect below for subsequent targets.
    content: value || '',
    onUpdate: ({ editor }) => {
      const isEmpty = editor.getText().trim().length === 0;
      onChange(isEmpty ? '' : editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor]);

  return (
    <Box>
      {label && <InputLabel sx={{ mb: 0.5 }}>{label}</InputLabel>}
      <Box
        className="rounded-md border"
        sx={{ borderColor: error ? 'error.main' : 'divider', minHeight }}
      >
        <RichTextEditorProvider editor={editor}>
          <RichTextField
            variant="outlined"
            sx={{ minHeight }}
            controls={
              <MenuBar>
                <MenuControlsContainer>
                  <MenuButtonUndo />
                  <MenuButtonRedo />
                  <MenuSelectHeading />
                  <MenuSelectFontFamily options={FONT_FAMILY_OPTIONS} />
                  <MenuButtonBold />
                  <MenuButtonItalic />
                  <MenuButtonUnderline />
                  <MenuButtonStrikethrough />
                  <MenuButtonBulletedList />
                  <MenuButtonOrderedList />
                  <MenuButtonBlockquote />
                  <MenuButtonCode />
                  <MenuButtonCodeBlock />
                  <MenuSelectTextAlign />
                  <MenuButtonEditLink />
                  <MenuButtonAddTable />
                  <TableMenuControls />
                  <MenuButtonHorizontalRule />
                  <MenuButtonRemoveFormatting />
                </MenuControlsContainer>
              </MenuBar>
            }
          />
        </RichTextEditorProvider>
      </Box>
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Box>
  );
}