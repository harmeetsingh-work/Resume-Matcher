"""
Prompt Registry - Manages default and custom prompts with preferences.
Supports: custom content, custom names, enabled/disabled state, token counting.
"""

import json
from pathlib import Path
from typing import Any

from app.prompts.templates import (
    PARSE_RESUME_PROMPT,
    EXTRACT_KEYWORDS_PROMPT,
    IMPROVE_RESUME_PROMPT,
    COVER_LETTER_PROMPT,
    OUTREACH_MESSAGE_PROMPT,
)
from app.prompts.enrichment import (
    ANALYZE_RESUME_PROMPT,
    ENHANCE_DESCRIPTION_PROMPT,
)
from app.prompts.sections import (
    REGENERATE_SUMMARY_PROMPT,
    REGENERATE_EXPERIENCE_PROMPT,
    REGENERATE_PROJECT_PROMPT,
    REGENERATE_SKILLS_PROMPT,
)

# File path for custom prompts (same location as config.json)
PROMPTS_FILE = Path(__file__).parent / "data" / "prompts.json"

# Simple token estimation: ~4 chars per token (rough approximation)
CHARS_PER_TOKEN = 4


def estimate_tokens(text: str) -> int:
    """Estimate token count for a text string."""
    return len(text) // CHARS_PER_TOKEN


# Registry of all available prompts with metadata
# These are the 7 core prompts users can customize
PROMPT_REGISTRY: dict[str, dict[str, Any]] = {
    "parse_resume": {
        "name": "Resume Parser",
        "description": "Converts uploaded resume text to structured JSON format",
        "category": "parsing",
        "default": PARSE_RESUME_PROMPT,
        "variables": ["schema", "resume_text"],
        "used_in": ["Upload Resume"],
    },
    "extract_keywords": {
        "name": "Keyword Extractor",
        "description": "Extracts requirements and keywords from job descriptions",
        "category": "analysis",
        "default": EXTRACT_KEYWORDS_PROMPT,
        "variables": ["job_description"],
        "used_in": ["Tailor Resume"],
    },
    "improve_resume": {
        "name": "Resume Tailor",
        "description": "Tailors resume content to match job description",
        "category": "generation",
        "default": IMPROVE_RESUME_PROMPT,
        "variables": [
            "job_description",
            "job_keywords",
            "original_resume",
            "schema",
            "output_language",
        ],
        "used_in": ["Tailor Resume"],
    },
    "cover_letter": {
        "name": "Cover Letter Generator",
        "description": "Generates personalized cover letters for job applications",
        "category": "generation",
        "default": COVER_LETTER_PROMPT,
        "variables": ["resume_data", "job_description", "output_language"],
        "used_in": ["Resume Builder"],
    },
    "outreach_message": {
        "name": "Outreach Generator",
        "description": "Generates networking/cold outreach messages",
        "category": "generation",
        "default": OUTREACH_MESSAGE_PROMPT,
        "variables": ["resume_data", "job_description", "output_language"],
        "used_in": ["Resume Builder"],
    },
    "analyze_resume": {
        "name": "Resume Analyzer",
        "description": "Identifies weak descriptions for AI enrichment",
        "category": "analysis",
        "default": ANALYZE_RESUME_PROMPT,
        "variables": ["resume_json"],
        "used_in": ["Enrichment"],
    },
    "enhance_description": {
        "name": "Description Enhancer",
        "description": "Generates improved bullet points from user answers",
        "category": "generation",
        "default": ENHANCE_DESCRIPTION_PROMPT,
        "variables": [
            "item_type",
            "title",
            "subtitle",
            "current_description",
            "answers",
        ],
        "used_in": ["Enrichment"],
    },
    "regenerate_summary": {
        "name": "Summary Regenerator",
        "description": "Regenerates the professional summary section",
        "category": "generation",
        "default": REGENERATE_SUMMARY_PROMPT,
        "variables": ["current_content", "context_instruction", "job_instruction"],
        "used_in": ["Resume Builder"],
    },
    "regenerate_experience": {
        "name": "Experience Regenerator",
        "description": "Regenerates individual experience entries",
        "category": "generation",
        "default": REGENERATE_EXPERIENCE_PROMPT,
        "variables": [
            "title",
            "company",
            "duration",
            "description",
            "context_instruction",
            "job_instruction",
        ],
        "used_in": ["Resume Builder"],
    },
    "regenerate_project": {
        "name": "Project Regenerator",
        "description": "Regenerates individual project entries",
        "category": "generation",
        "default": REGENERATE_PROJECT_PROMPT,
        "variables": [
            "title",
            "technologies",
            "description",
            "context_instruction",
            "job_instruction",
        ],
        "used_in": ["Resume Builder"],
    },
    "regenerate_skills": {
        "name": "Skills Regenerator",
        "description": "Reorganizes and improves the skills section",
        "category": "generation",
        "default": REGENERATE_SKILLS_PROMPT,
        "variables": ["current_content", "context_instruction", "job_instruction"],
        "used_in": ["Resume Builder"],
    },
}


def _load_prompts_file() -> dict[str, Any]:
    """Load the prompts configuration file."""
    if not PROMPTS_FILE.exists():
        return {"prompts": {}, "preferences": {}}
    try:
        with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure structure exists
            if "prompts" not in data:
                data["prompts"] = {}
            if "preferences" not in data:
                data["preferences"] = {}
            return data
    except (json.JSONDecodeError, IOError):
        return {"prompts": {}, "preferences": {}}


def _save_prompts_file(data: dict[str, Any]) -> None:
    """Save the prompts configuration file."""
    PROMPTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROMPTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_prompt(prompt_id: str) -> str:
    """Get prompt content by ID, with custom override support."""
    if prompt_id not in PROMPT_REGISTRY:
        raise ValueError(f"Unknown prompt ID: {prompt_id}")

    data = _load_prompts_file()
    custom_content = data["prompts"].get(prompt_id)

    if custom_content:
        return custom_content

    return PROMPT_REGISTRY[prompt_id]["default"]


def is_prompt_enabled(prompt_id: str) -> bool:
    """Check if a prompt is enabled (defaults to True)."""
    if prompt_id not in PROMPT_REGISTRY:
        return False

    data = _load_prompts_file()
    prefs = data["preferences"].get(prompt_id, {})
    return prefs.get("enabled", True)


def get_enabled_prompts() -> list[str]:
    """Get list of enabled prompt IDs."""
    data = _load_prompts_file()
    enabled = []
    for prompt_id in PROMPT_REGISTRY:
        prefs = data["preferences"].get(prompt_id, {})
        if prefs.get("enabled", True):
            enabled.append(prompt_id)
    return enabled


def get_all_prompts() -> dict[str, Any]:
    """Get all prompts with metadata, preferences, and token counts."""
    data = _load_prompts_file()
    result = {}

    for prompt_id, meta in PROMPT_REGISTRY.items():
        custom_content = data["prompts"].get(prompt_id)
        prefs = data["preferences"].get(prompt_id, {})

        content = custom_content if custom_content else meta["default"]

        result[prompt_id] = {
            "id": prompt_id,
            "name": prefs.get("custom_name", meta["name"]),
            "default_name": meta["name"],
            "description": meta["description"],
            "category": meta["category"],
            "variables": meta["variables"],
            "used_in": meta["used_in"],
            "is_custom": bool(custom_content),
            "is_enabled": prefs.get("enabled", True),
            "content": content,
            "default_content": meta["default"],
            "token_count": estimate_tokens(content),
            "default_token_count": estimate_tokens(meta["default"]),
        }

    return result


def update_prompt(
    prompt_id: str,
    content: str | None = None,
    custom_name: str | None = None,
    enabled: bool | None = None,
) -> dict[str, Any]:
    """
    Update a prompt's content, name, or enabled state.
    Returns the updated prompt data.
    """
    if prompt_id not in PROMPT_REGISTRY:
        raise ValueError(f"Unknown prompt ID: {prompt_id}")

    data = _load_prompts_file()

    # Update content if provided
    if content is not None:
        if content.strip():
            data["prompts"][prompt_id] = content
        elif prompt_id in data["prompts"]:
            # Empty content = reset to default
            del data["prompts"][prompt_id]

    # Update preferences if provided
    if custom_name is not None or enabled is not None:
        if prompt_id not in data["preferences"]:
            data["preferences"][prompt_id] = {}

        if custom_name is not None:
            if custom_name.strip():
                data["preferences"][prompt_id]["custom_name"] = custom_name.strip()
            elif "custom_name" in data["preferences"][prompt_id]:
                del data["preferences"][prompt_id]["custom_name"]

        if enabled is not None:
            data["preferences"][prompt_id]["enabled"] = enabled

    _save_prompts_file(data)

    # Return updated prompt
    return get_all_prompts()[prompt_id]


def reset_prompt(prompt_id: str) -> dict[str, Any]:
    """Reset a prompt to default content and name."""
    if prompt_id not in PROMPT_REGISTRY:
        raise ValueError(f"Unknown prompt ID: {prompt_id}")

    data = _load_prompts_file()

    # Remove custom content
    if prompt_id in data["prompts"]:
        del data["prompts"][prompt_id]

    # Remove custom name but keep enabled state
    if prompt_id in data["preferences"]:
        enabled = data["preferences"][prompt_id].get("enabled", True)
        data["preferences"][prompt_id] = {"enabled": enabled}

    _save_prompts_file(data)
    return get_all_prompts()[prompt_id]


def reset_all_prompts() -> None:
    """Reset all prompts to defaults (keeps enabled states)."""
    data = _load_prompts_file()

    # Clear custom content
    data["prompts"] = {}

    # Keep only enabled states in preferences
    new_prefs = {}
    for prompt_id, prefs in data["preferences"].items():
        if "enabled" in prefs:
            new_prefs[prompt_id] = {"enabled": prefs["enabled"]}
    data["preferences"] = new_prefs

    _save_prompts_file(data)


def get_prompt_usage_summary() -> dict[str, Any]:
    """Get summary of prompt usage and token counts for UI display."""
    prompts = get_all_prompts()

    total_tokens = sum(p["token_count"] for p in prompts.values() if p["is_enabled"])
    enabled_count = sum(1 for p in prompts.values() if p["is_enabled"])
    custom_count = sum(1 for p in prompts.values() if p["is_custom"])

    return {
        "total_prompts": len(prompts),
        "enabled_count": enabled_count,
        "custom_count": custom_count,
        "total_tokens_enabled": total_tokens,
        "prompts_by_category": {
            cat: [p for p in prompts.values() if p["category"] == cat]
            for cat in ["generation", "analysis", "parsing"]
        },
    }
