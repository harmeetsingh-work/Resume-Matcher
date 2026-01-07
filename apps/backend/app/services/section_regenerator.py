"""
Service for regenerating individual resume sections.
"""

import logging
from typing import Any

from app.llm import complete, complete_json, get_llm_config
from app.prompt_registry import get_prompt

logger = logging.getLogger(__name__)


def _build_context_instruction(context: str | None) -> str:
    """Build context instruction string."""
    if not context:
        return ""
    return f"\nAdditional Context from User:\n{context}\n"


def _build_job_instruction(job_description: str | None) -> str:
    """Build job description instruction string."""
    if not job_description:
        return ""
    return f"\nTarget Job Description:\n{job_description}\n\nTailor the content to match this job's requirements."


async def regenerate_summary(
    current_summary: str,
    context: str | None = None,
    job_description: str | None = None,
) -> str:
    """Regenerate the professional summary."""
    config = get_llm_config()
    prompt = get_prompt("regenerate_summary").format(
        current_content=current_summary,
        context_instruction=_build_context_instruction(context),
        job_instruction=_build_job_instruction(job_description),
    )

    result = await complete(
        prompt=prompt,
        system_prompt="You are a professional resume writer.",
        config=config,
        max_tokens=512,
    )
    return result.strip()


async def regenerate_experience(
    title: str,
    company: str,
    duration: str,
    description: list[str],
    context: str | None = None,
    job_description: str | None = None,
) -> list[str]:
    """Regenerate an experience entry's description."""
    config = get_llm_config()
    prompt = get_prompt("regenerate_experience").format(
        title=title,
        company=company,
        duration=duration,
        description="\n".join(f"• {d}" for d in description),
        context_instruction=_build_context_instruction(context),
        job_instruction=_build_job_instruction(job_description),
    )

    result = await complete_json(
        prompt=prompt,
        system_prompt="You are a professional resume writer. Return valid JSON only.",
        config=config,
        max_tokens=1024,
    )
    return result.get("description", description)


async def regenerate_project(
    title: str,
    technologies: list[str],
    description: list[str],
    context: str | None = None,
    job_description: str | None = None,
) -> list[str]:
    """Regenerate a project entry's description."""
    config = get_llm_config()
    prompt = get_prompt("regenerate_project").format(
        title=title,
        technologies=", ".join(technologies) if technologies else "Not specified",
        description="\n".join(f"• {d}" for d in description),
        context_instruction=_build_context_instruction(context),
        job_instruction=_build_job_instruction(job_description),
    )

    result = await complete_json(
        prompt=prompt,
        system_prompt="You are a professional resume writer. Return valid JSON only.",
        config=config,
        max_tokens=1024,
    )
    return result.get("description", description)


async def regenerate_skills(
    current_skills: list[str],
    context: str | None = None,
    job_description: str | None = None,
) -> list[str]:
    """Regenerate and organize the skills list."""
    config = get_llm_config()
    prompt = get_prompt("regenerate_skills").format(
        current_content=", ".join(current_skills),
        context_instruction=_build_context_instruction(context),
        job_instruction=_build_job_instruction(job_description),
    )

    result = await complete_json(
        prompt=prompt,
        system_prompt="You are a professional resume writer. Return valid JSON only.",
        config=config,
        max_tokens=512,
    )
    return result.get("skills", current_skills)
