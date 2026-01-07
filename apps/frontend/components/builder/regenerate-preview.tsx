'use client';

import { useState, useEffect } from 'react';
import { X, Check, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';

interface RegeneratePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (newContent: string) => void;
  onRegenerate: () => Promise<string>;
  currentContent: string;
  newContent: string;
  sectionLabel: string;
  isLoading?: boolean;
}

export function RegeneratePreview({
  isOpen,
  onClose,
  onAccept,
  onRegenerate,
  currentContent,
  newContent: initialNewContent,
  sectionLabel,
  isLoading: externalLoading = false,
}: RegeneratePreviewProps) {
  const [newContent, setNewContent] = useState(initialNewContent);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync newContent when prop changes
  useEffect(() => {
    setNewContent(initialNewContent);
  }, [initialNewContent]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const regenerated = await onRegenerate();
      setNewContent(regenerated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAccept = () => {
    onAccept(newContent);
    onClose();
  };

  const isLoading = externalLoading || isRegenerating;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black bg-gray-50">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
            Regenerate {sectionLabel}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Current Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400"></div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-600">
                  Current
                </h3>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-300 min-h-[200px] text-sm whitespace-pre-wrap">
                {currentContent || <span className="text-gray-400 italic">No current content</span>}
              </div>
            </div>

            {/* Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <div className="w-10 h-10 bg-white border border-black flex items-center justify-center">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* New Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500"></div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-green-700">
                  Regenerated
                </h3>
              </div>
              <div
                className={`p-4 bg-green-50 border border-green-300 min-h-[200px] text-sm whitespace-pre-wrap ${
                  isLoading ? 'animate-pulse' : ''
                }`}
              >
                {isLoading ? (
                  <span className="text-gray-400 italic">Generating...</span>
                ) : newContent ? (
                  newContent
                ) : (
                  <span className="text-gray-400 italic">No content generated</span>
                )}
              </div>
            </div>
          </div>

          {/* Changes Summary */}
          {!isLoading && newContent && currentContent !== newContent && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-sm">
              <span className="font-medium text-blue-800">Changes detected:</span>
              <span className="text-blue-700 ml-2">
                {currentContent.length} → {newContent.length} characters (
                {newContent.length > currentContent.length ? '+' : ''}
                {newContent.length - currentContent.length})
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-black bg-gray-50">
          <button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-black hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate Again
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={isLoading || !newContent}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Accept Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
