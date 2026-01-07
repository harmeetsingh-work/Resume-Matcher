# LLM Integration Guide

> **Multi-provider AI support, JSON handling, prompt customization, and section regeneration.**

## Multi-Provider Support

Backend uses LiteLLM to support multiple providers through a unified API:

| Provider | Type | Notes |
|----------|------|-------|
| **Ollama** | Local | Free, runs on your machine |
| **OpenAI** | Cloud | GPT-4o, GPT-4o-mini |
| **Anthropic** | Cloud | Claude 3.5 Sonnet |
| **Google Gemini** | Cloud | Gemini 1.5 Flash/Pro |
| **OpenRouter** | Cloud | Access to multiple models |
| **DeepSeek** | Cloud | DeepSeek Chat |

## API Key Handling

API keys are passed directly to `litellm.acompletion()` via the `api_key` parameter (not via `os.environ`) to avoid race conditions in async contexts.

```python
# Correct
await litellm.acompletion(
    model=model,
    messages=messages,
    api_key=api_key  # Direct parameter
)

# Incorrect - don't use os.environ in async code
os.environ["OPENAI_API_KEY"] = key  # Race condition risk
```

## JSON Mode

The `complete_json()` function automatically enables `response_format={"type": "json_object"}` for providers that support it:

- OpenAI
- Anthropic
- Gemini
- DeepSeek
- Major OpenRouter models

## Retry Logic

JSON completions include 2 automatic retries with progressively lower temperature:

- Attempt 1: temperature 0.1
- Attempt 2: temperature 0.0

## JSON Extraction

Robust bracket-matching algorithm in `_extract_json()` handles:

- Malformed responses
- Markdown code blocks
- Edge cases
- Infinite recursion protection when content starts with `{` but matching fails

## Error Handling Pattern

LLM functions log detailed errors server-side but return generic messages to clients:

```python
except Exception as e:
    logger.error(f"LLM completion failed: {e}")
    raise ValueError("LLM completion failed. Please check your API configuration.")
```

## Adding Prompts

Add new prompt templates to `apps/backend/app/prompts/templates.py`.

### Prompt Guidelines

1. Use `{variable}` for substitution (single braces)
2. Include example JSON schemas for structured outputs
3. Keep instructions concise: "Output ONLY the JSON object, no other text"

### Example

```python
IMPROVE_BULLET = """
Improve this resume bullet point for a {job_title} position.

Current: {current_bullet}

Output ONLY the improved bullet point, no explanations.
"""
```

## Provider Configuration

Users configure their preferred AI provider via:

- Settings page: `/settings`
- API: `PUT /api/v1/config/llm-api-key`

## Health Checks

The `/api/v1/health` endpoint validates LLM connectivity.

> **Note**: Docker health checks must use `/api/v1/health` (not `/health`).

## Timeouts

All LLM calls have configurable timeouts:

| Operation | Timeout |
|-----------|---------|
| Health checks | 30s |
| Completions | 120s |
| JSON operations | 180s |

## Key Files

| File | Purpose |
|------|---------|
| `apps/backend/app/llm.py` | LiteLLM wrapper with JSON mode |
| `apps/backend/app/prompt_registry.py` | Custom prompt management |
| `apps/backend/app/prompts/templates.py` | Default prompt templates |
| `apps/backend/app/prompts/enrichment.py` | Enrichment-specific prompts |
| `apps/backend/app/prompts/sections.py` | Section regeneration prompts |
| `apps/backend/app/services/section_regenerator.py` | Section regeneration service |
| `apps/backend/app/config.py` | Provider configuration |

## Custom Prompts

Users can customize all AI prompts via Settings → AI Prompts (`/settings/prompts`).

### How It Works

1. All prompts are registered in `PROMPT_REGISTRY` in `prompt_registry.py`
2. Services use `get_prompt("prompt_id")` to retrieve the active prompt
3. If user has customized the prompt, custom version is returned
4. Otherwise, default prompt is used

### Prompt Features

- **View & Edit**: Collapsible editors for each prompt
- **Token Count**: Approximate token count displayed
- **Enable/Disable**: Toggle to prevent prompt from being used
- **Custom Names**: Rename prompts for clarity
- **Reset**: Reset individual or all prompts to defaults

### Storage

Custom prompts are stored in `apps/backend/data/prompts.json`:

```json
{
  "parse_resume": {
    "custom_content": "...",
    "custom_name": "My Parser",
    "enabled": true
  }
}
```

### Using Prompts in Services

```python
from app.prompt_registry import get_prompt

# Get prompt (returns custom if set, else default)
prompt = get_prompt("parse_resume")

# Format with variables
formatted = prompt.format(resume_text=text, schema=schema)
```

## Section Regeneration

Regenerate resume sections (Summary, Experience, Projects, Skills) with optional context.

### Supported Sections

| Section | Prompt ID | Notes |
|---------|-----------|-------|
| Summary | `regenerate_summary` | Text content |
| Experience | `regenerate_experience` | All items or single via `item_index` |
| Projects | `regenerate_project` | All items or single via `item_index` |
| Skills | `regenerate_skills` | Technical skills array |

> **Note**: Education is NOT supported (factual data).

### API Endpoint

```
POST /api/v1/resumes/{resume_id}/regenerate-section
```

Request:

```json
{
  "section_type": "summary",
  "context": {
    "job_description": "...",
    "target_role": "Senior Engineer"
  }
}
```

### Regeneration Service

Located in `apps/backend/app/services/section_regenerator.py`:

```python
from app.services.section_regenerator import regenerate_summary

new_summary = await regenerate_summary(
    current_summary="...",
    context={"target_role": "Senior Engineer"},
    job_description="..."
)
```

---

For complete documentation, see [70-features/custom-prompts.md](70-features/custom-prompts.md).
