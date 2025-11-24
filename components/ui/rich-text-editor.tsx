'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  label,
}: RichTextEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertMarkdownFormatting = (marker: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let newText: string;
    if (selectedText) {
      // If text is selected, wrap it with markdown markers
      newText = `${beforeText}${marker}${selectedText}${marker}${afterText}`;
    } else {
      // If no text selected, insert markers at cursor
      newText = `${beforeText}${marker}${marker}${afterText}`;
    }

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = selectedText
          ? start + marker.length + selectedText.length + marker.length
          : start + marker.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 0);
  };

  const handleBold = () => {
    insertMarkdownFormatting('**');
  };

  const handleItalic = () => {
    insertMarkdownFormatting('*');
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          handleBold();
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          handleItalic();
        }
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, [value, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="border rounded-md">
        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBold}
            className="h-7 w-7 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleItalic}
            className="h-7 w-7 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="border-0 focus-visible:ring-0"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use Markdown: **bold**, *italic*, # Header, or use Ctrl+B/I shortcuts
      </p>
    </div>
  );
}

