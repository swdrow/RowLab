/**
 * InlineEdit -- click-to-edit text field for profile name and bio.
 *
 * Display mode shows text; click activates edit mode with a subtle ring.
 * Blur or Enter saves; Escape cancels. Shows pencil icon on hover.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { IconPencil } from '@/components/icons';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  as?: 'h1' | 'p';
  className?: string;
  maxLength?: number;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit',
  as: Tag = 'p',
  className = '',
  maxLength,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Auto-focus on edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed !== value) {
      onSave(trimmed);
    }
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && Tag === 'h1') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel, Tag]
  );

  if (isEditing) {
    const isMultiline = Tag === 'p';
    const sharedClasses = `w-full bg-transparent outline-none ring-1 ring-accent-teal/30 rounded-md px-2 py-1 ${className}`;

    if (isMultiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) =>
            setEditValue(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)
          }
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${sharedClasses} resize-none`}
          rows={2}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) =>
          setEditValue(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)
        }
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={sharedClasses}
        maxLength={maxLength}
        placeholder={placeholder}
      />
    );
  }

  const displayValue = value || placeholder;
  const isEmpty = !value;

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`group inline-flex items-center gap-1.5 text-left rounded-md px-2 py-0.5 -mx-2 -my-0.5 transition-colors hover:bg-void-overlay ${className}`}
      aria-label={`Edit ${Tag === 'h1' ? 'name' : 'bio'}`}
    >
      <Tag className={isEmpty ? 'text-text-faint italic' : ''}>{displayValue}</Tag>
      <Pencil
        width={Tag === 'h1' ? 14 : 12} height={Tag === 'h1' ? 14 : 12}
        className="text-text-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      />
    </button>
  );
}
