/**
 * Prompt Management API Client
 *
 * Provides functions for fetching, updating, and resetting AI prompts.
 */
import { apiFetch, apiPut, apiPost } from './client';

export interface Prompt {
  id: string;
  name: string; // Current display name (custom or default)
  default_name: string; // Original default name
  description: string;
  category: string;
  variables: string[];
  used_in: string[]; // Where this prompt is used
  is_custom: boolean; // True if content modified
  is_enabled: boolean; // True if prompt is active
  content: string;
  default_content: string;
  token_count: number; // Current content tokens
  default_token_count: number; // Default content tokens
}

export interface PromptsResponse {
  prompts: Record<string, Prompt>;
}

export interface PromptSummary {
  total_prompts: number;
  enabled_count: number;
  custom_count: number;
  total_tokens_enabled: number;
}

export interface PromptUpdateRequest {
  content?: string;
  custom_name?: string;
  enabled?: boolean;
}

export interface PromptResetResponse {
  prompt: Prompt;
  message: string;
}

/**
 * Fetch all prompts with metadata, preferences, and token counts.
 */
export async function fetchPrompts(): Promise<PromptsResponse> {
  const response = await apiFetch('/prompts');
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
}

/**
 * Fetch summary of prompt usage and token counts.
 */
export async function fetchPromptSummary(): Promise<PromptSummary> {
  const response = await apiFetch('/prompts/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch prompt summary');
  }
  return response.json();
}

/**
 * Fetch a specific prompt by ID.
 */
export async function fetchPrompt(promptId: string): Promise<Prompt> {
  const response = await apiFetch(`/prompts/${promptId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch prompt');
  }
  return response.json();
}

/**
 * Update a prompt's content, name, or enabled state.
 */
export async function updatePrompt(
  promptId: string,
  updates: PromptUpdateRequest
): Promise<Prompt> {
  const response = await apiPut(`/prompts/${promptId}`, updates);
  if (!response.ok) {
    throw new Error('Failed to update prompt');
  }
  return response.json();
}

/**
 * Reset a prompt to its default content and name.
 */
export async function resetPrompt(promptId: string): Promise<PromptResetResponse> {
  const response = await apiPost(`/prompts/${promptId}/reset`, {});
  if (!response.ok) {
    throw new Error('Failed to reset prompt');
  }
  return response.json();
}

/**
 * Reset all prompts to defaults (keeps enabled states).
 */
export async function resetAllPrompts(): Promise<{ message: string }> {
  const response = await apiPost('/prompts/reset-all', {});
  if (!response.ok) {
    throw new Error('Failed to reset all prompts');
  }
  return response.json();
}
