import React, { useState, useRef, useEffect } from 'react';

interface UglyDraftEditorProps {
  content: string;
  onChange: (content: string) => void;
  uglyMode: boolean;
  fontFamily?: string;
  fontSize?: number;
  isRTL?: boolean;
}

const BACKSPACE_LIMIT = 20;

// Apple Notes font families
const FONT_FAMILIES = {
  'san-francisco': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  'new-york': '"New York", "Times New Roman", Georgia, serif',
  'monaco': 'Monaco, "Courier New", monospace',
  'helvetica': 'Helvetica, Arial, sans-serif',
};

export const UglyDraftEditor: React.FC<UglyDraftEditorProps> = ({
  content,
  onChange,
  uglyMode,
  fontFamily = 'san-francisco',
  fontSize = 17,
  isRTL = false,
}) => {
  const [backspaceCount, setBackspaceCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastContentRef = useRef(content);

  useEffect(() => {
    lastContentRef.current = content;
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!uglyMode) return;

    // ENFORCEMENT: Limited backspace in ugly mode
    if (e.key === 'Backspace') {
      if (backspaceCount >= BACKSPACE_LIMIT) {
        e.preventDefault();
        alert(`BLOCKED: Backspace limit reached (${BACKSPACE_LIMIT} characters). Move forward only.`);
        return;
      }
      setBackspaceCount((prev) => prev + 1);
    } else if (e.key.length === 1) {
      // Reset counter on new characters
      setBackspaceCount(0);
    }

    // BLOCKED: No formatting shortcuts
    if (e.metaKey || e.ctrlKey) {
      const blockedKeys = ['b', 'i', 'u', 'k']; // Bold, italic, underline, link
      if (blockedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        alert('BLOCKED: No formatting in ugly mode. Just write.');
      }
    }

    // BLOCKED: No cut/copy for rearranging (paste allowed for external content)
    if ((e.metaKey || e.ctrlKey) && (e.key === 'x' || e.key === 'c')) {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        e.preventDefault();
        alert('BLOCKED: No cutting/copying. No reordering. Forward only.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;

    if (uglyMode) {
      // ENFORCEMENT: Prevent deletion beyond backspace limit
      if (newContent.length < lastContentRef.current.length) {
        const deletedChars = lastContentRef.current.length - newContent.length;
        if (deletedChars > 1) {
          // Bulk delete attempt (e.g., highlight + delete)
          alert('BLOCKED: No bulk deletion. Use backspace only, within limit.');
          return;
        }
      }
    }

    onChange(newContent);
  };

  const getEditorStyle = (): React.CSSProperties => {
    if (uglyMode) {
      return {
        fontFamily: 'monospace',
        fontSize: '16px',
        direction: isRTL ? 'rtl' : 'ltr',
        lineHeight: '1.5',
      };
    }

    return {
      fontFamily: FONT_FAMILIES[fontFamily as keyof typeof FONT_FAMILIES] || FONT_FAMILIES['san-francisco'],
      fontSize: `${fontSize}px`,
      lineHeight: '1.5',
      direction: isRTL ? 'rtl' : 'ltr',
    };
  };

  return (
    <div className="ugly-draft-editor">
      {/* Apple Notes-style editor container */}
      <div className={`relative ${uglyMode ? 'border-2 border-red-500' : 'border border-gray-200'} rounded-lg overflow-hidden shadow-sm`}>
        {/* Paper texture background - Apple Notes style */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            uglyMode ? 'bg-gray-50' : 'bg-notes-paper'
          }`}
          style={{
            backgroundImage: uglyMode ? 'none' : 'linear-gradient(to bottom, #fefdfb 0%, #faf8f4 100%)',
          }}
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`
            relative w-full h-96 px-6 py-5 resize-none
            focus:outline-none bg-transparent
            ${uglyMode ? 'text-gray-900' : 'text-gray-800'}
            placeholder-gray-400
          `}
          placeholder={
            uglyMode
              ? 'UGLY MODE ACTIVE: No backspace abuse. No formatting. No reordering. Just write forward.'
              : isRTL ? '...ابدأ الكتابة' : 'Start writing...'
          }
          spellCheck={!uglyMode}
          style={getEditorStyle()}
        />
      </div>

      {uglyMode && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
            Ugly Mode Enforcements
          </div>
          <ul className="space-y-1 text-sm text-red-600">
            <li className="flex items-center gap-2">
              <span className="text-red-400">•</span>
              <span>Backspace: <strong>{backspaceCount}/{BACKSPACE_LIMIT}</strong> chars</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400">•</span>
              <span>Formatting: <strong>DISABLED</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400">•</span>
              <span>Cut/Copy: <strong>DISABLED</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400">•</span>
              <span>Spellcheck: <strong>DISABLED</strong></span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
