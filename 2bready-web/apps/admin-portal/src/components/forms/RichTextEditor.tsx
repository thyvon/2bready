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
                  <MenuButtonBold />
                  <MenuButtonItalic />
                  <MenuButtonUnderline />
                  <MenuButtonStrikethrough />
                  <MenuButtonBulletedList />
                  <MenuButtonOrderedList />
                  <MenuButtonBlockquote />
                  <MenuButtonCode />
                  <MenuButtonCodeBlock />
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