/**
 * Section Regeneration API Client
 *
 * Provides functions for regenerating individual resume sections.
 */
import { apiPost } from './client';

export interface RegenerateSectionRequest {
  section_type: 'summary' | 'experience' | 'projects' | 'skills';
  item_index?: number;
  context?: string;
  job_description?: string;
}

export interface RegenerateSectionResponse {
  section_type: string;
  item_index: number | null;
  original_content: unknown;
  regenerated_content: unknown;
  prompt_used: string;
}

/**
 * Regenerate a specific section of the resume using AI.
 */
export async function regenerateSection(
  resumeId: string,
  request: RegenerateSectionRequest
): Promise<RegenerateSectionResponse> {
  const response = await apiPost(`/resumes/${resumeId}/regenerate-section`, request);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to regenerate section' }));
    throw new Error(error.detail || 'Failed to regenerate section');
  }
  return response.json();
}
