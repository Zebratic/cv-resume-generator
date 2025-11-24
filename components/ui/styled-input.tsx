'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyledInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  showStyleControls?: boolean;
  required?: boolean;
}

export function StyledInput({
  value,
  onChange,
  placeholder,
  label,
  id,
  className,
  showStyleControls = true,
  required,
}: StyledInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const insertMarkdownFormatting = (marker: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let newText: string;
    if (selectedText) {
      newText = `${beforeText}${marker}${selectedText}${marker}${afterText}`;
    } else {
      newText = `${beforeText}${marker}${marker}${afterText}`;
    }

    onChange(newText);

    setTimeout(() => {
      if (input) {
        const newCursorPos = selectedText
          ? start + marker.length + selectedText.length + marker.length
          : start + marker.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
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
    const input = inputRef.current;
    if (!input) return;

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

    input.addEventListener('keydown', handleKeyDown);
    return () => input.removeEventListener('keydown', handleKeyDown);
  }, [value, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {showStyleControls && (
        <div className="flex items-center gap-1 p-2 border rounded-t-md bg-muted/50">
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
      )}
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={showStyleControls ? 'rounded-t-none' : ''}
        required={required}
      />
      {showStyleControls && (
        <p className="text-xs text-muted-foreground">
          Use Markdown: **bold**, *italic*, # Header, or use Ctrl+B/I shortcuts
        </p>
      )}
    </div>
  );
}

