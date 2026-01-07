'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle, Sparkles, Code, FileText } from 'lucide-react';
import { PromptEditor } from '@/components/settings/prompt-editor';
import {
  Prompt,
  PromptSummary,
  PromptUpdateRequest,
  fetchPrompts,
  fetchPromptSummary,
  updatePrompt,
  resetPrompt,
  resetAllPrompts,
} from '@/lib/api/prompts';

// Group prompts by category
const PROMPT_CATEGORIES = {
  'Resume Parsing & Matching': ['parse_resume', 'extract_keywords'],
  'Resume Enhancement': ['improve_resume', 'analyze_resume', 'enhance_description'],
  'Outreach & Cover Letters': ['cover_letter', 'outreach_message'],
  'Section Regeneration': [
    'regenerate_summary',
    'regenerate_experience',
    'regenerate_project',
    'regenerate_skills',
  ],
} as const;

export default function PromptsSettingsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [summary, setSummary] = useState<PromptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResettingAll, setIsResettingAll] = useState(false);

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [promptsRes, summaryRes] = await Promise.all([fetchPrompts(), fetchPromptSummary()]);
      // Convert Record<string, Prompt> to Prompt[]
      setPrompts(Object.values(promptsRes.prompts));
      setSummary(summaryRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleUpdate = async (promptId: string, updates: PromptUpdateRequest) => {
    const updated = await updatePrompt(promptId, updates);
    setPrompts((prev) => prev.map((p) => (p.id === promptId ? updated : p)));
    // Refresh summary
    const summaryRes = await fetchPromptSummary();
    setSummary(summaryRes);
  };

  const handleReset = async (promptId: string) => {
    const result = await resetPrompt(promptId);
    setPrompts((prev) => prev.map((p) => (p.id === promptId ? result.prompt : p)));
    // Refresh summary
    const summaryRes = await fetchPromptSummary();
    setSummary(summaryRes);
  };

  const handleResetAll = async () => {
    if (!confirm('Reset ALL prompts to their defaults? This cannot be undone.')) {
      return;
    }
    setIsResettingAll(true);
    try {
      await resetAllPrompts();
      await loadPrompts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset prompts');
    } finally {
      setIsResettingAll(false);
    }
  };

  const getPromptsByCategory = (promptIds: readonly string[]) => {
    return prompts.filter((p) => promptIds.includes(p.id));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 w-1/3"></div>
          <div className="h-24 bg-gray-200"></div>
          <div className="h-48 bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 hover:bg-gray-100 border border-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold">AI Prompts</h1>
            <p className="text-gray-600 text-sm">
              Customize the AI prompts used throughout the application
            </p>
          </div>
        </div>
        <button
          onClick={handleResetAll}
          disabled={isResettingAll}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isResettingAll ? 'animate-spin' : ''}`} />
          Reset All
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={loadPrompts} className="ml-auto underline">
            Retry
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-black">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Code className="w-4 h-4" />
              Total Prompts
            </div>
            <div className="text-2xl font-bold font-mono">{summary.total_prompts}</div>
          </div>
          <div className="p-4 bg-white border border-black">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              Custom Prompts
            </div>
            <div className="text-2xl font-bold font-mono">{summary.custom_count}</div>
          </div>
          <div className="p-4 bg-white border border-black">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Enabled Tokens
            </div>
            <div className="text-2xl font-bold font-mono">
              ~{summary.total_tokens_enabled.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-1">About Prompt Customization</h3>
        <p className="text-sm text-blue-700">
          Customize prompts to change how the AI generates content. Variables like{' '}
          <code className="bg-blue-100 px-1">{'{resume_text}'}</code> are replaced with actual data
          during processing. Disabling a prompt prevents its associated feature from using AI.
        </p>
      </div>

      {/* Grouped Prompts */}
      <div className="space-y-8">
        {Object.entries(PROMPT_CATEGORIES).map(([category, promptIds]) => {
          const categoryPrompts = getPromptsByCategory(promptIds);
          if (categoryPrompts.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-medium border-b border-gray-300 pb-2">{category}</h2>
              <div className="space-y-3">
                {categoryPrompts.map((prompt) => (
                  <PromptEditor
                    key={prompt.id}
                    prompt={prompt}
                    onUpdate={(updates) => handleUpdate(prompt.id, updates)}
                    onReset={() => handleReset(prompt.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
