'use client';

import { useState } from 'react';
import {
  RefreshCw,
  ChevronDown,
  Sparkles,
  FileText,
  Briefcase,
  Target,
  AlertCircle,
} from 'lucide-react';

type SectionType = 'summary' | 'experience' | 'projects' | 'skills';

interface RegenerateContext {
  job_description?: string;
  target_role?: string;
  target_industry?: string;
  tone?: string;
  length?: string;
}

interface RegenerateButtonProps {
  sectionType: SectionType;
  onRegenerate: (context?: RegenerateContext) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const SECTION_CONFIG = {
  summary: {
    label: 'Summary',
    icon: FileText,
    contextOptions: ['job_description', 'target_role', 'tone', 'length'],
  },
  experience: {
    label: 'Experience',
    icon: Briefcase,
    contextOptions: ['job_description', 'target_role', 'target_industry'],
  },
  projects: {
    label: 'Projects',
    icon: Target,
    contextOptions: ['job_description', 'target_role'],
  },
  skills: {
    label: 'Skills',
    icon: Sparkles,
    contextOptions: ['job_description', 'target_role', 'target_industry'],
  },
};

export function RegenerateButton({
  sectionType,
  onRegenerate,
  disabled = false,
  className = '',
}: RegenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showContextForm, setShowContextForm] = useState(false);
  const [context, setContext] = useState<RegenerateContext>({});
  const [error, setError] = useState<string | null>(null);

  const config = SECTION_CONFIG[sectionType];

  const handleQuickRegenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onRegenerate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextRegenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Only include non-empty context values
      const filteredContext: RegenerateContext = {};
      if (context.job_description?.trim()) {
        filteredContext.job_description = context.job_description.trim();
      }
      if (context.target_role?.trim()) {
        filteredContext.target_role = context.target_role.trim();
      }
      if (context.target_industry?.trim()) {
        filteredContext.target_industry = context.target_industry.trim();
      }
      if (context.tone?.trim()) {
        filteredContext.tone = context.tone.trim();
      }
      if (context.length?.trim()) {
        filteredContext.length = context.length.trim();
      }

      await onRegenerate(Object.keys(filteredContext).length > 0 ? filteredContext : undefined);
      setShowContextForm(false);
      setIsOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Split Button Container */}
      <div className="flex items-stretch">
        {/* Main Button */}
        <button
          onClick={handleQuickRegenerate}
          disabled={disabled || isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-black bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Regenerate ${config.label}`}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Regenerate
        </button>

        {/* Dropdown Toggle */}
        <button
          onClick={() => {
            if (!isLoading) {
              setIsOpen(!isOpen);
              if (!isOpen) setShowContextForm(false);
            }
          }}
          disabled={disabled || isLoading}
          className="flex items-center px-2 border-t border-r border-b border-black bg-white hover:bg-gray-50 disabled:opacity-50 -ml-[1px]"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-black shadow-lg z-50">
          {!showContextForm ? (
            <div className="p-2 space-y-1">
              <button
                onClick={() => setShowContextForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left"
              >
                <config.icon className="w-4 h-4" />
                Regenerate with context...
              </button>
              <button
                onClick={() => {
                  handleQuickRegenerate();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left"
              >
                <RefreshCw className="w-4 h-4" />
                Quick regenerate (no context)
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-600 border-b pb-2">
                Regeneration Context
              </div>

              {config.contextOptions.includes('job_description') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Job Description (optional)
                  </label>
                  <textarea
                    value={context.job_description || ''}
                    onChange={(e) =>
                      setContext((prev) => ({ ...prev, job_description: e.target.value }))
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Paste a job description to tailor the content..."
                    className="w-full h-20 px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black resize-none"
                  />
                </div>
              )}

              {config.contextOptions.includes('target_role') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Target Role (optional)
                  </label>
                  <input
                    type="text"
                    value={context.target_role || ''}
                    onChange={(e) =>
                      setContext((prev) => ({ ...prev, target_role: e.target.value }))
                    }
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
              )}

              {config.contextOptions.includes('target_industry') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Target Industry (optional)
                  </label>
                  <input
                    type="text"
                    value={context.target_industry || ''}
                    onChange={(e) =>
                      setContext((prev) => ({ ...prev, target_industry: e.target.value }))
                    }
                    placeholder="e.g., FinTech, Healthcare"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
              )}

              {config.contextOptions.includes('tone') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Tone (optional)</label>
                  <select
                    value={context.tone || ''}
                    onChange={(e) => setContext((prev) => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="">Default</option>
                    <option value="professional">Professional</option>
                    <option value="confident">Confident</option>
                    <option value="friendly">Friendly</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
              )}

              {config.contextOptions.includes('length') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Length (optional)</label>
                  <select
                    value={context.length || ''}
                    onChange={(e) => setContext((prev) => ({ ...prev, length: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="">Default</option>
                    <option value="concise">Concise (2-3 sentences)</option>
                    <option value="standard">Standard (3-4 sentences)</option>
                    <option value="detailed">Detailed (4-5 sentences)</option>
                  </select>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setShowContextForm(false);
                    setContext({});
                  }}
                  className="text-xs text-gray-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContextRegenerate}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  {isLoading ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
