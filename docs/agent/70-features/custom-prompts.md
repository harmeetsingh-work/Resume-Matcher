# Custom Prompts System

> **Customize AI prompts used throughout the application.**

## Overview

The Custom Prompts feature allows users to view, edit, enable/disable, and reset all AI prompts used in Resume Matcher. This gives advanced users control over how the AI generates content.

## Available Prompts

### Core Prompts (7)

| Prompt ID | Name | Category | Used In |
|-----------|------|----------|---------|
| `parse_resume` | Resume Parser | Parsing | Upload Resume |
| `extract_keywords` | Keyword Extractor | Matching | Tailor Resume |
| `improve_resume` | Resume Improver | Enhancement | Tailor Resume |
| `cover_letter` | Cover Letter Generator | Outreach | Cover Letter |
| `outreach_message` | Outreach Message | Outreach | Cold Outreach |
| `analyze_resume` | Resume Analyzer | Enrichment | Enrichment Wizard |
| `enhance_description` | Description Enhancer | Enrichment | Enrichment Wizard |

### Section Regeneration Prompts (4)

| Prompt ID | Name | Category | Used In |
|-----------|------|----------|---------|
| `regenerate_summary` | Summary Regenerator | Regeneration | Resume Builder |
| `regenerate_experience` | Experience Regenerator | Regeneration | Resume Builder |
| `regenerate_project` | Project Regenerator | Regeneration | Resume Builder |
| `regenerate_skills` | Skills Regenerator | Regeneration | Resume Builder |

## Features

### View & Edit Prompts
- Access via Settings → AI Prompts (`/settings/prompts`)
- Collapsible editors for each prompt
- Shows token count (approximate)
- Variables displayed with `{variable}` syntax

### Enable/Disable Prompts
- Toggle switch for each prompt
- Disabled prompts prevent associated features from using AI
- Visual indicator when prompt is disabled

### Custom Naming
- Rename prompts for clarity
- Original name preserved for reset
- "Renamed" badge shows when name differs from default

### Reset Functionality
- Reset individual prompt to default
- Reset all prompts at once
- Preserves enabled/disabled state on individual reset

## Architecture

### Backend

#### Prompt Registry (`apps/backend/app/prompt_registry.py`)

Central management for all prompts:

```python
from app.prompt_registry import get_prompt, update_prompt, reset_prompt

# Get prompt content (returns default if custom not set)
prompt = get_prompt("parse_resume")

# Update prompt
update_prompt("parse_resume", content="New prompt...", custom_name="My Parser")

# Reset to default
reset_prompt("parse_resume")
```

#### Prompts Router (`apps/backend/app/routers/prompts.py`)

API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/prompts` | GET | List all prompts with metadata |
| `/api/v1/prompts/summary` | GET | Get usage summary (counts, tokens) |
| `/api/v1/prompts/{id}` | GET | Get specific prompt |
| `/api/v1/prompts/{id}` | PUT | Update prompt (content, name, enabled) |
| `/api/v1/prompts/{id}/reset` | POST | Reset prompt to default |
| `/api/v1/prompts/reset-all` | POST | Reset all prompts |

#### Storage

Custom prompts are stored in `apps/backend/data/prompts.json` (gitignored):

```json
{
  "parse_resume": {
    "custom_content": "...",
    "custom_name": "My Custom Parser",
    "enabled": true
  }
}
```

### Frontend

#### API Client (`apps/frontend/lib/api/prompts.ts`)

```typescript
import { fetchPrompts, updatePrompt, resetPrompt } from '@/lib/api/prompts';

// Fetch all prompts
const { prompts } = await fetchPrompts();

// Update a prompt
await updatePrompt('parse_resume', { content: 'New prompt...' });

// Reset to default
await resetPrompt('parse_resume');
```

#### Components

| Component | Path | Purpose |
|-----------|------|---------|
| `PromptEditor` | `components/settings/prompt-editor.tsx` | Collapsible editor with controls |
| Prompts Page | `app/(default)/settings/prompts/page.tsx` | Main prompts management page |

## Section Regeneration

### Supported Sections

| Section | Prompt Used | Notes |
|---------|-------------|-------|
| Summary | `regenerate_summary` | Text content |
| Experience | `regenerate_experience` | All items or single item via `item_index` |
| Projects | `regenerate_project` | All items or single item via `item_index` |
| Skills | `regenerate_skills` | Technical skills array |

> **Note**: Education section does NOT support regeneration (factual data).

### API Endpoint

```
POST /api/v1/resumes/{resume_id}/regenerate-section
```

Request:
```json
{
  "section_type": "summary",
  "item_index": null,
  "context": {
    "job_description": "...",
    "target_role": "Senior Engineer",
    "tone": "professional"
  }
}
```

Response:
```json
{
  "section_type": "summary",
  "original_content": "...",
  "regenerated_content": "...",
  "prompt_used": "regenerate_summary"
}
```

### Frontend Integration

Regenerate button appears in section headers for supported sections:

```tsx
import { RegenerateButton } from '@/components/builder/regenerate-button';

<RegenerateButton
  sectionType="summary"
  onRegenerate={async (context) => {
    await regenerateSection(resumeId, { section_type: 'summary', context });
  }}
/>
```

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `app/prompt_registry.py` | Prompt storage, retrieval, updates |
| `app/routers/prompts.py` | API endpoints |
| `app/prompts/templates.py` | Default prompt content (core) |
| `app/prompts/enrichment.py` | Enrichment prompts |
| `app/prompts/sections.py` | Section regeneration prompts |
| `app/services/section_regenerator.py` | Regeneration service functions |
| `app/schemas/models.py` | Pydantic models for prompts |

### Frontend

| File | Purpose |
|------|---------|
| `lib/api/prompts.ts` | Prompts API client |
| `lib/api/regenerate.ts` | Regeneration API client |
| `components/settings/prompt-editor.tsx` | Prompt editor component |
| `components/builder/regenerate-button.tsx` | Regenerate split button |
| `components/builder/regenerate-preview.tsx` | Before/after preview modal |
| `app/(default)/settings/prompts/page.tsx` | Prompts settings page |

## Token Estimation

Token counts are approximated using:

```python
def estimate_tokens(text: str) -> int:
    return len(text) // 4  # ~4 chars per token
```

This is a rough estimate; actual token counts vary by model tokenizer.

## Adding New Prompts

1. Add default prompt to `app/prompts/templates.py` (or appropriate file)
2. Register in `PROMPT_REGISTRY` in `app/prompt_registry.py`:
   ```python
   "my_new_prompt": {
       "name": "My New Prompt",
       "description": "Does something useful",
       "category": "enhancement",
       "default": MY_NEW_PROMPT,
       "variables": ["input_text", "options"],
       "used_in": ["Some Feature"],
   },
   ```
3. Use `get_prompt("my_new_prompt")` in services
4. Update frontend category mapping if needed in prompts page
