'use client';

import { useRef, useMemo} from 'react';
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
      toolbarSticky: false, 
      toolbarStickyOffset: 0,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_as_html',
      useNativeTooltip: true, 
      disablePlugins: ['fullsize'], 
      allowResizeY: false, 
      iframe: false, 
      iframeCSSLinks: [],
      iframeStyle: '',
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'superscript',
        'subscript',
        'eraser',
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
        'table',
        '|',
        'align',
        '|',
        'undo',
        'redo',
        '|',
        'cut',
        'copy',
        'paste',
        'selectall',
        'print',
        'preview',
        'find',
        'replace',
        '|',
        'hr',
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
      style: {
        background: 'transparent',
        color: 'hsl(var(--foreground))',
      },
      editorCssClass: 'rich-text-editor-content',
      statusbar: true,
      spellcheck: false, 
      language: 'en',
      direction: 'ltr',
      zIndex: 10000, 
    }),
    [placeholder, height, minHeight, maxHeight, readonly]
  );

  const handleBlur = (newContent) => {
    if (onChange) {
      onChange(newContent);
    }
  };

  return (
    <div
      className={cn(
        'rich-text-editor-wrapper border rounded-md overflow-hidden transition-all bg-card',
        className
      )}
    >
      <style jsx global>{`
        .rich-text-editor-content {
          min-height: ${minHeight}px !important;
          padding: 16px !important;
          font-family: inherit !important;
          color: hsl(var(--foreground)) !important;
          font-size: 1rem !important;
          line-height: 1.6 !important;
        }
        
        .rich-text-editor-content p {
          margin: 0.5em 0 !important;
        }

        .rich-text-editor-content h1 {
          font-size: 2.25rem !important;
          line-height: 1.2 !important;
          margin: 1em 0 0.5em 0 !important;
          font-weight: 800 !important;
          color: hsl(var(--foreground)) !important;
        }

        .rich-text-editor-content h2 {
          font-size: 1.875rem !important;
          line-height: 1.3 !important;
          margin: 1em 0 0.5em 0 !important;
          font-weight: 700 !important;
          color: hsl(var(--foreground)) !important;
        }

        .rich-text-editor-content h3 {
          font-size: 1.5rem !important;
          line-height: 1.4 !important;
          margin: 1em 0 0.5em 0 !important;
          font-weight: 600 !important;
          color: hsl(var(--foreground)) !important;
        }

        .rich-text-editor-content h4 {
          font-size: 1.25rem !important;
          margin: 1em 0 0.5em 0 !important;
          font-weight: 600 !important;
          color: hsl(var(--foreground)) !important;
        }

        .rich-text-editor-content ul {
          list-style-type: disc !important;
          margin: 0.5em 0 !important;
          padding-left: 2em !important;
        }

        .rich-text-editor-content ol {
          list-style-type: decimal !important;
          margin: 0.5em 0 !important;
          padding-left: 2em !important;
        }

        .rich-text-editor-content li {
          /* display: list-item !important; - Let browser handle default display */
        }

        .rich-text-editor-content strong, 
        .rich-text-editor-content b {
          font-weight: 700 !important;
        }

        .rich-text-editor-content em, 
        .rich-text-editor-content i {
          font-style: italic !important;
        }

        .rich-text-editor-content u {
          text-decoration: underline !important;
        }

        /* Jodit Theme Overrides */
        .jodit-container {
          border: none !important;
          background: transparent !important;
        }
        .jodit-wysiwyg {
          background: transparent !important;
          color: hsl(var(--foreground)) !important;
        }
        .jodit-toolbar-editor-collection {
          border-bottom: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--card)) !important;
          z-index: 10 !important;
        }
        .jodit-workplace {
          background: transparent !important;
          border: none !important;
        }
        .jodit-statusbar {
          border-top: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--muted)) !important;
          color: hsl(var(--muted-foreground)) !important;
        }
        .jodit-toolbar-button {
          color: hsl(var(--foreground)) !important;
        }
        .jodit-toolbar-button:hover {
          background: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        .jodit-toolbar-button_active {
          background: hsl(var(--primary) / 0.1) !important;
          color: hsl(var(--primary)) !important;
        }
        .jodit-toolbar-button__text {
          color: inherit !important;
        }
        .jodit-popup {
          background: hsl(var(--popover)) !important;
          color: hsl(var(--popover-foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          z-index: 10000 !important; /* Ensure popups are above other elements */
        }
        .jodit-popup__content {
          background: transparent !important;
        }
        .jodit-ui-button_active {
             background-color: hsl(var(--primary)) !important;
             color: hsl(var(--primary-foreground)) !important;
        }
        /* Ensure dropdown items are visible */
        .jodit-ui-list {
          background: hsl(var(--popover)) !important;
          color: hsl(var(--popover-foreground)) !important;
        }
        .jodit-ui-list__item:hover {
          background: hsl(var(--accent)) !important;
        }
        .jodit-ui-list__item_active {
          background: hsl(var(--primary) / 0.1) !important;
          color: hsl(var(--primary)) !important;
        }
      `}</style>
      <JoditEditor
        ref={editorRef}
        value={value}
        config={config}
        tabIndex={1}
        onBlur={handleBlur}
        onChange={(newContent) => {}} // Empty onChange to allow internal Jodit state to manage typing without interruptions
      />
    </div>
  );
}
