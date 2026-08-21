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
  MenuButtonImageUpload,
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

interface RichTextEditorFieldProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditorField({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  minHeight = 220,
}: RichTextEditorFieldProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
    ],
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
  }, [value, editor]);

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
                  <MenuButtonImageUpload
                    onUploadFiles={async () => {
                      return [];
                    }}
                  />
                  <MenuButtonAddTable />
                  <TableMenuControls />
                  <MenuButtonHorizontalRule />
                  <MenuButtonRemoveFormatting />
                </MenuControlsContainer>
              </MenuBar>
            }
          />
          {placeholder && editor && editor.getText().trim().length === 0 && (
            <Box className="pointer-events-none -mt-14 px-3 text-sm text-gray-400">{placeholder}</Box>
          )}
        </RichTextEditorProvider>
      </Box>
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Box>
  );
}