'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import JoditEditor to avoid SSR issues
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] border rounded-md flex items-center justify-center bg-muted/50">
      <p className="text-muted-foreground">Loading editor...</p>
    </div>
  ),
});

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  height = 400,
  className,
  readonly = false,
  minHeight = 300,
  maxHeight = 800,
}) {
  const editorRef = useRef(null);
  const [content, setContent] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal state with external value prop
  // Only sync when not focused to prevent typing issues
  useEffect(() => {
    if (!isFocused && value !== content) {
      setContent(value);
    }
  }, [value, isFocused]); // eslint-disable-line react-hooks/exhaustive-deps

  const config = useMemo(
    () => ({
      readonly,
      placeholder,
      height: height || minHeight,
      minHeight,
      maxHeight,
      toolbar: true,
      toolbarButtonSize: 'medium',
      toolbarAdaptive: true,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_as_html',
      buttons: [
        'source',
        '|',
        'bold',
        'italic',
        'underline',
        '|',
        'ul',
        'ol',
        '|',
        'outdent',
        'indent',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'image',
        'link',
        '|',
        'align',
        '|',
        'undo',
        'redo',
        '|',
        'hr',
        'eraser',
        'fullsize',
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
      style: {
        background: 'transparent',
      },
      editorCssClass: 'rich-text-editor-content',
      statusbar: true,
      spellcheck: true,
      language: 'en',
      direction: 'ltr',
    }),
    [placeholder, height, minHeight, maxHeight, readonly]
  );

  const handleChange = (newContent) => {
    // Always update internal state immediately for UI responsiveness
    // This prevents typing issues where text disappears
    if (newContent !== content) {
      setContent(newContent);
      
      // Call onChange callback if provided
      // This allows parent to update its state
      if (onChange) {
        onChange(newContent);
      }
    }
  };

  const handleBlur = (newContent) => {
    setIsFocused(false);
    // Ensure content is synced on blur
    if (newContent !== content) {
      setContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div
      className={cn(
        'rich-text-editor-wrapper border rounded-md overflow-hidden transition-all',
        isFocused && 'ring-2 ring-brand-600 ring-offset-2',
        className
      )}
    >
      <style jsx global>{`
        .rich-text-editor-content {
          min-height: ${minHeight}px;
          padding: 16px;
          font-family: inherit;
        }
        .rich-text-editor-content p {
          margin: 0.5em 0;
        }
        .rich-text-editor-content h1,
        .rich-text-editor-content h2,
        .rich-text-editor-content h3 {
          margin: 0.8em 0 0.4em 0;
          font-weight: 600;
        }
        .rich-text-editor-content ul,
        .rich-text-editor-content ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .jodit-container {
          border: none !important;
        }
        .jodit-toolbar-editor-collection {
          border-bottom: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--background)) !important;
        }
        .jodit-workplace {
          background: hsl(var(--background)) !important;
        }
        .jodit-statusbar {
          border-top: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--muted)) !important;
        }
        .jodit-toolbar-button {
          color: hsl(var(--foreground)) !important;
        }
        .jodit-toolbar-button:hover {
          background: hsl(var(--muted)) !important;
        }
        .jodit-toolbar-button_active {
          background: rgba(92, 100, 215, 0.1) !important;
          color: #5C64D7 !important;
        }
        .jodit-toolbar-button_active:hover {
          background: rgba(92, 100, 215, 0.15) !important;
        }
      `}</style>
      <JoditEditor
        ref={editorRef}
        value={content}
        config={config}
        tabIndex={1}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
      />
    </div>
  );
}

