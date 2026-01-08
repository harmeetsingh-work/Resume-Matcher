'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPrompts, type Prompt } from '@/lib/api/prompts';

/**
 * Swiss International Style Tailoring Options Component
 *
 * Provides controls for:
 * 1. Selecting a custom prompt for resume tailoring
 * 2. Toggling summary generation on/off
 *
 * Design follows brutalist aesthetics with hard shadows, square corners,
 * high contrast, and monospace typography.
 */

const STORAGE_KEY = 'tailor_options_preferences';

interface TailorOptionsProps {
  selectedPromptId: string;
  onPromptChange: (promptId: string) => void;
  generateSummary: boolean;
  onGenerateSummaryChange: (value: boolean) => void;
  disabled?: boolean;
}

interface StoredPreferences {
  promptId?: string;
  generateSummary?: boolean;
}

// Load preferences from localStorage
function loadPreferences(): StoredPreferences {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save preferences to localStorage
function savePreferences(prefs: StoredPreferences) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore localStorage errors
  }
}

export const TailorOptions: React.FC<TailorOptionsProps> = ({
  selectedPromptId,
  onPromptChange,
  generateSummary,
  onGenerateSummaryChange,
  disabled = false,
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Get selected prompt details
  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);

  // Load prompts on mount
  useEffect(() => {
    async function loadPrompts() {
      try {
        setIsLoading(true);
        const response = await fetchPrompts();
        // Filter to only show enabled generation prompts
        const generationPrompts = Object.values(response.prompts).filter(
          (p) => p.category === 'generation' && p.is_enabled
        );
        setPrompts(generationPrompts);
        setError(null);
      } catch (err) {
        console.error('Failed to load prompts:', err);
        setError('Failed to load prompts');
      } finally {
        setIsLoading(false);
      }
    }
    loadPrompts();
  }, []);

  const handlePromptSelect = (promptId: string) => {
    onPromptChange(promptId);
    setIsOpen(false);
  };

  return (
    <div
      className={cn(
        'bg-white border border-black',
        'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-black bg-gray-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Tailoring Options
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Prompt Selector */}
        <div className="space-y-2">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-gray-700">
            AI Prompt
          </label>

          {isLoading ? (
            <div className="flex items-center gap-2 p-3 border-2 border-gray-300 bg-gray-50">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="font-mono text-xs text-gray-500">Loading prompts...</span>
            </div>
          ) : error ? (
            <div className="p-3 border-2 border-red-300 bg-red-50">
              <span className="font-mono text-xs text-red-600">{error}</span>
            </div>
          ) : (
            <div className="relative">
              {/* Custom Select Button */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                  'w-full flex items-center justify-between',
                  'px-3 py-3 border-2 border-black bg-white',
                  'font-mono text-sm text-left',
                  'hover:bg-gray-50 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-1',
                  isOpen && 'ring-2 ring-blue-700'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 shrink-0 text-gray-500" />
                  <span className="truncate">
                    {selectedPrompt?.name || 'Resume Tailor (Default)'}
                  </span>
                  {selectedPrompt?.is_custom && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-100 text-blue-700 border border-blue-300">
                      Custom
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 shrink-0 text-gray-500 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute z-50 w-full mt-1 border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000] max-h-80 overflow-y-auto">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => handlePromptSelect(prompt.id)}
                      className={cn(
                        'w-full px-3 py-3 text-left',
                        'hover:bg-gray-100 transition-colors',
                        'border-b border-gray-200 last:border-b-0',
                        selectedPromptId === prompt.id && 'bg-blue-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{prompt.name}</span>
                            {prompt.is_custom && (
                              <span className="px-1 py-0.5 text-[9px] font-mono font-bold uppercase bg-blue-100 text-blue-700">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {prompt.description}
                          </p>
                        </div>
                        {selectedPromptId === prompt.id && (
                          <span className="w-2 h-2 bg-blue-700 shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prompt Description */}
          {selectedPrompt && (
            <p className="font-sans text-xs text-gray-500 leading-relaxed">
              {selectedPrompt.description}
            </p>
          )}
          {!selectedPrompt && !isLoading && !error && (
            <p className="font-sans text-xs text-gray-500 leading-relaxed">
              Tailors resume content to match job description
            </p>
          )}
        </div>

        {/* Summary Toggle */}
        <div className="pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={() => onGenerateSummaryChange(!generateSummary)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between py-2',
              'focus:outline-none group'
            )}
          >
            <div className="flex-1 text-left">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-gray-700">
                Generate Summary
              </div>
              <p className="font-sans text-xs text-gray-500 mt-0.5">
                {generateSummary
                  ? 'AI will create a new professional summary'
                  : 'No summary — resume starts with experience'}
              </p>
            </div>

            {/* Square Toggle Indicator */}
            <div
              className={cn(
                'relative w-12 h-6 border-2 border-black transition-colors',
                generateSummary ? 'bg-blue-700' : 'bg-gray-200',
                'group-focus:ring-2 group-focus:ring-blue-700 group-focus:ring-offset-1'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-4 h-4 bg-white border border-black',
                  'transition-transform duration-200',
                  generateSummary ? 'translate-x-6' : 'translate-x-0.5'
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wide">
          Preferences are saved automatically
        </p>
      </div>
    </div>
  );
};

// Hook for managing tailor options state
export function useTailorOptions() {
  const [selectedPromptId, setSelectedPromptId] = useState<string>('improve_resume');
  const [generateSummary, setGenerateSummary] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const prefs = loadPreferences();
    if (prefs.promptId) {
      setSelectedPromptId(prefs.promptId);
    }
    if (typeof prefs.generateSummary === 'boolean') {
      setGenerateSummary(prefs.generateSummary);
    }
    setIsInitialized(true);
  }, []);

  // Save preferences when they change (after initial load)
  useEffect(() => {
    if (isInitialized) {
      savePreferences({
        promptId: selectedPromptId,
        generateSummary,
      });
    }
  }, [selectedPromptId, generateSummary, isInitialized]);

  return {
    selectedPromptId,
    setSelectedPromptId,
    generateSummary,
    setGenerateSummary,
  };
}
