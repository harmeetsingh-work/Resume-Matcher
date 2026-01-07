'use client';

import { useState, useEffect } from 'react';
import { Prompt, PromptUpdateRequest } from '@/lib/api/prompts';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  Code,
  AlertCircle,
  Pencil,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface PromptEditorProps {
  prompt: Prompt;
  onUpdate: (updates: PromptUpdateRequest) => Promise<void>;
  onReset: () => Promise<void>;
}

export function PromptEditor({ prompt, onUpdate, onReset }: PromptEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState(prompt.content);
  const [customName, setCustomName] = useState(prompt.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when prompt prop changes
  useEffect(() => {
    setContent(prompt.content);
    setCustomName(prompt.name);
  }, [prompt]);

  const hasContentChanges = content !== prompt.content;
  const hasNameChanges = customName !== prompt.name;
  const hasChanges = hasContentChanges || hasNameChanges;
  const isModified = prompt.is_custom;

  // Estimate tokens for current content
  const currentTokens = Math.floor(content.length / 4);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updates: PromptUpdateRequest = {};
      if (hasContentChanges) updates.content = content;
      if (hasNameChanges) updates.custom_name = customName;
      await onUpdate(updates);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      await onUpdate({ enabled: !prompt.is_enabled });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle');
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset this prompt to its default? Your customizations will be lost.')) {
      return;
    }
    setIsResetting(true);
    setError(null);
    try {
      await onReset();
      setContent(prompt.default_content);
      setCustomName(prompt.default_name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset');
    } finally {
      setIsResetting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  return (
    <div
      className={`border bg-white ${prompt.is_enabled ? 'border-black' : 'border-gray-300 opacity-60'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 group">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isEditingName && setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isEditingName) setIsExpanded(!isExpanded);
            }
          }}
          className="flex-1 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
        >
          <Code className="w-5 h-5 text-gray-600" />
          <div className="flex-1">
            {/* Editable Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="font-medium px-2 py-1 border border-black focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      setIsEditingName(false);
                    }
                    if (e.key === 'Escape') {
                      setCustomName(prompt.name);
                      setIsEditingName(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(false);
                  }}
                >
                  <Check className="w-4 h-4 text-green-600" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomName(prompt.name);
                    setIsEditingName(false);
                  }}
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ) : (
              <div className="font-medium flex items-center gap-2">
                {prompt.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-100 p-1 rounded"
                >
                  <Pencil className="w-3 h-3 text-gray-500" />
                </button>
                {isModified && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">Modified</span>
                )}
                {prompt.name !== prompt.default_name && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800">Renamed</span>
                )}
              </div>
            )}
            <div className="text-sm text-gray-600">{prompt.description}</div>
            <div className="text-xs text-gray-500 mt-1">Used in: {prompt.used_in.join(', ')}</div>
          </div>
        </div>

        {/* Token Count Badge */}
        <div className="flex items-center gap-3 mr-4">
          <span className="text-xs font-mono px-2 py-1 bg-gray-100 border border-gray-300">
            ~{currentTokens.toLocaleString()} tokens
          </span>
        </div>

        {/* Enable/Disable Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleEnabled();
          }}
          className="p-2 hover:bg-gray-100"
          title={prompt.is_enabled ? 'Disable prompt' : 'Enable prompt'}
        >
          {prompt.is_enabled ? (
            <ToggleRight className="w-6 h-6 text-green-600" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {/* Expand/Collapse */}
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Variables Info */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Variables:</span>{' '}
            {prompt.variables.map((v) => (
              <code key={v} className="mx-1 px-1.5 py-0.5 bg-gray-100 text-xs font-mono">
                {`{${v}}`}
              </code>
            ))}
          </div>

          {/* Token comparison */}
          <div className="text-xs text-gray-500 flex items-center gap-4">
            <span>Current: ~{currentTokens.toLocaleString()} tokens</span>
            <span>Default: ~{prompt.default_token_count.toLocaleString()} tokens</span>
            {currentTokens !== prompt.default_token_count && (
              <span
                className={
                  currentTokens > prompt.default_token_count ? 'text-orange-600' : 'text-green-600'
                }
              >
                ({currentTokens > prompt.default_token_count ? '+' : ''}
                {currentTokens - prompt.default_token_count})
              </span>
            )}
          </div>

          {/* Editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-64 p-3 font-mono text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter prompt template..."
          />

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              disabled={isResetting || (!isModified && prompt.name === prompt.default_name)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              {isResetting ? 'Resetting...' : 'Reset to Default'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
