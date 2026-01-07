"""
Section-specific regeneration prompts.
These prompts are used to regenerate individual resume sections on-demand.
"""

REGENERATE_SUMMARY_PROMPT = """You are a professional resume writer. Rewrite the following professional summary to be more impactful and ATS-friendly.

Current Summary:
{current_content}

{context_instruction}
{job_instruction}

Guidelines:
- Keep it concise (2-4 sentences)
- Use strong action words
- Highlight key qualifications
- Make it memorable and unique
- Do NOT use em dashes ("—")

Return ONLY the new summary text, no explanations or formatting."""

REGENERATE_EXPERIENCE_PROMPT = """You are a professional resume writer. Improve the following job experience entry to be more impactful.

Current Entry:
Title: {title}
Company: {company}
Duration: {duration}
Description:
{description}

{context_instruction}
{job_instruction}

Guidelines:
- Use strong action verbs (Led, Built, Architected, Implemented, Optimized)
- Include quantified metrics where possible (%, $, numbers)
- Focus on achievements and impact, not just responsibilities
- Keep each bullet point to 1-2 lines
- Generate 3-5 bullet points
- Do NOT use em dashes ("—")

Return a JSON object with the improved description as an array of bullet points:
{{"description": ["bullet 1", "bullet 2", "bullet 3"]}}"""

REGENERATE_PROJECT_PROMPT = """You are a professional resume writer. Improve the following project entry.

Current Entry:
Title: {title}
Technologies: {technologies}
Description:
{description}

{context_instruction}
{job_instruction}

Guidelines:
- Highlight technical complexity and problem-solving
- Mention specific technologies and their purpose
- Quantify impact where possible
- Keep each bullet point concise
- Generate 2-4 bullet points
- Do NOT use em dashes ("—")

Return a JSON object with the improved description as an array of bullet points:
{{"description": ["bullet 1", "bullet 2", "bullet 3"]}}"""

REGENERATE_SKILLS_PROMPT = """You are a professional resume writer. Improve and organize the following skills list.

Current Skills:
{current_content}

{context_instruction}
{job_instruction}

Guidelines:
- Group related skills together
- Prioritize most relevant skills first
- Use industry-standard terminology
- Remove redundant or outdated skills
- Add relevant skills that might be missing based on context

Return a JSON object with categorized skills:
{{"skills": ["skill1", "skill2", "skill3"]}}"""
