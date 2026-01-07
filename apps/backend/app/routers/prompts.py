"""
API endpoints for prompt management.
Supports: viewing, editing, renaming, enabling/disabling prompts.
"""

import logging

from fastapi import APIRouter, HTTPException

from app.prompt_registry import (
    get_all_prompts,
    update_prompt,
    reset_prompt,
    reset_all_prompts,
    get_prompt_usage_summary,
    PROMPT_REGISTRY,
)
from app.schemas.models import (
    PromptsListResponse,
    PromptResponse,
    PromptUpdateRequest,
    PromptResetResponse,
    PromptUsageSummary,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=PromptsListResponse)
async def list_prompts():
    """Get all prompts with metadata, preferences, and token counts."""
    try:
        prompts = get_all_prompts()
        return PromptsListResponse(prompts=prompts)
    except Exception as e:
        logger.error(f"Failed to list prompts: {e}")
        raise HTTPException(status_code=500, detail="Failed to load prompts")


@router.get("/summary", response_model=PromptUsageSummary)
async def get_prompts_summary():
    """Get summary of prompt usage and token counts."""
    try:
        summary = get_prompt_usage_summary()
        return PromptUsageSummary(**summary)
    except Exception as e:
        logger.error(f"Failed to get prompt summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to load summary")


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt_by_id(prompt_id: str):
    """Get a specific prompt by ID."""
    if prompt_id not in PROMPT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Prompt not found: {prompt_id}")

    try:
        prompts = get_all_prompts()
        return prompts[prompt_id]
    except Exception as e:
        logger.error(f"Failed to get prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load prompt")


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt_by_id(prompt_id: str, request: PromptUpdateRequest):
    """
    Update a prompt's content, name, or enabled state.
    All fields are optional - only provided fields are updated.
    """
    if prompt_id not in PROMPT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Prompt not found: {prompt_id}")

    try:
        updated = update_prompt(
            prompt_id=prompt_id,
            content=request.content,
            custom_name=request.custom_name,
            enabled=request.enabled,
        )
        return updated
    except Exception as e:
        logger.error(f"Failed to update prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save prompt")


@router.post("/{prompt_id}/reset", response_model=PromptResetResponse)
async def reset_prompt_by_id(prompt_id: str):
    """Reset a prompt to its default content and name (keeps enabled state)."""
    if prompt_id not in PROMPT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Prompt not found: {prompt_id}")

    try:
        updated = reset_prompt(prompt_id)
        return PromptResetResponse(
            prompt=updated, message=f"Prompt '{prompt_id}' reset to default"
        )
    except Exception as e:
        logger.error(f"Failed to reset prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset prompt")


@router.post("/reset-all")
async def reset_all():
    """Reset all prompts to defaults (keeps enabled states)."""
    try:
        reset_all_prompts()
        return {"message": "All prompts reset to defaults"}
    except Exception as e:
        logger.error(f"Failed to reset all prompts: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset prompts")
