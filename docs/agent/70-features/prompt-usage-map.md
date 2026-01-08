# Prompt Usage Map

> **Which prompt fires when? A complete mapping of user actions to prompts.**

## Quick Reference

| User Action | Prompt(s) Used | Files Involved |
|-------------|----------------|----------------|
| Upload Resume | `parse_resume` | `services/parser.py` |
| Tailor Resume | `extract_keywords` → `improve_resume` | `services/improver.py` |
| Generate Cover Letter | `cover_letter` | `services/cover_letter.py` |
| Generate Outreach | `outreach_message` | `services/cover_letter.py` |
| Enrichment Wizard (Analyze) | `analyze_resume` | `routers/enrichment.py` |
| Enrichment Wizard (Enhance) | `enhance_description` | `routers/enrichment.py` |
| Regenerate Summary | `regenerate_summary` | `services/section_regenerator.py` |
| Regenerate Experience | `regenerate_experience` | `services/section_regenerator.py` |
| Regenerate Projects | `regenerate_project` | `services/section_regenerator.py` |
| Regenerate Skills | `regenerate_skills` | `services/section_regenerator.py` |

---

## Detailed Flow Diagrams

### 1. Upload Resume → `parse_resume`

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Upload a PDF/DOCX resume                            │
│ Page: /dashboard or /builder                                     │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/v1/resumes/upload                                      │
│ File: routers/resumes.py → upload_resume()                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ services/parser.py → parse_resume_to_json()                      │
│                                                                  │
│ prompt = get_prompt("parse_resume")                              │
│ formatted = prompt.format(schema=RESUME_SCHEMA, resume_text=md)  │
│ result = await complete_json(formatted)                          │
└──────────────────────────────────────────────────────────────────┘

PROMPT: parse_resume
PURPOSE: Convert raw resume text (markdown) to structured JSON
INPUT: Resume markdown text
OUTPUT: JSON with personalInfo, summary, workExperience, education, etc.
```

---

### 2. Tailor Resume → `extract_keywords` + `improve_resume`

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Tailor" on a resume with a job description  │
│ Page: /tailor                                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/v1/resumes/improve                                     │
│ File: routers/resumes.py → improve_resume_endpoint()             │
└──────────────────────┬───────────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌─────────────────────┐   ┌─────────────────────────────────────────┐
│ STEP 1: Extract     │   │ STEP 2: Improve Resume                  │
│ Keywords            │   │                                         │
│                     │   │                                         │
│ services/improver.py│   │ services/improver.py                    │
│ extract_job_keywords│   │ improve_resume()                        │
│                     │   │                                         │
│ get_prompt(         │   │ get_prompt("improve_resume")            │
│   "extract_keywords"│   │ .format(                                │
│ )                   │   │   resume_text=...,                      │
│                     │   │   job_description=...,                  │
│                     │   │   keywords=...,                         │
│                     │   │   output_language=...                   │
│                     │   │ )                                       │
└─────────────────────┘   └─────────────────────────────────────────┘

PROMPT 1: extract_keywords
PURPOSE: Extract important keywords from job description
INPUT: Job description text
OUTPUT: JSON array of keywords (skills, requirements, qualifications)

PROMPT 2: improve_resume  
PURPOSE: Tailor resume content to match job requirements
INPUT: Original resume, job description, extracted keywords, language
OUTPUT: Improved resume JSON optimized for the job
```

---

### 3. Generate Cover Letter → `cover_letter`

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Generate" on Cover Letter tab                │
│ Page: /builder?id=xxx (Cover Letter tab)                         │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/v1/resumes/{id}/generate-cover-letter                  │
│ File: routers/resumes.py → generate_cover_letter_endpoint()      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ services/cover_letter.py → generate_cover_letter()               │
│                                                                  │
│ prompt = get_prompt("cover_letter")                              │
│ formatted = prompt.format(                                       │
│   resume_json=...,                                               │
│   job_description=...,                                           │
│   output_language=...                                            │
│ )                                                                │
│ result = await complete(formatted)                               │
└──────────────────────────────────────────────────────────────────┘

PROMPT: cover_letter
PURPOSE: Generate a professional cover letter
INPUT: Resume data (JSON), job description, target language
OUTPUT: Formatted cover letter text (markdown)
```

---

### 4. Generate Outreach Message → `outreach_message`

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Generate" on Outreach tab                    │
│ Page: /builder?id=xxx (Outreach tab)                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/v1/resumes/{id}/generate-outreach                      │
│ File: routers/resumes.py → generate_outreach_endpoint()          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ services/cover_letter.py → generate_outreach_message()           │
│                                                                  │
│ prompt = get_prompt("outreach_message")                          │
│ formatted = prompt.format(                                       │
│   resume_json=...,                                               │
│   job_description=...,                                           │
│   output_language=...                                            │
│ )                                                                │
│ result = await complete(formatted)                               │
└──────────────────────────────────────────────────────────────────┘

PROMPT: outreach_message
PURPOSE: Generate a cold outreach message for LinkedIn/email
INPUT: Resume data (JSON), job description, target language
OUTPUT: Short, personalized networking message
```

---

### 5. Enrichment Wizard (Analyze) → `analyze_resume`

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Open Enrichment Wizard, click "Analyze"             │
│ Page: /builder?id=xxx (Enrichment modal)                         │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/v1/enrichment/analyze                                  │
│ File: routers/enrichment.py → analyze_resume_endpoint()          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ routers/enrichment.py (inline)                                   │
│                                                                  │
│ prompt = get_prompt("analyze_resume")                            │
│ formatted = prompt.format(resume_json=...)                       │
│ result = await complete_json(formatted)                          │
└──────────────────────────────────────────────────────────────────┘

PROMPT: analyze_resume
PURPOSE: Analyze resume and identify weak bullet points
INPUT: Resume data (JSON)
OUTPUT: JSON with suggestions for each experience/project item
```

---

### 6. Enrichment Wizard (Enhance) → `enhance_description`

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Select suggestions, click "Enhance"                 │
│ Page: /builder?id=xxx (Enrichment modal)                         │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/v1/enrichment/enhance                                  │
│ File: routers/enrichment.py → enhance_descriptions_endpoint()    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ routers/enrichment.py (inline, called per item)                  │
│                                                                  │
│ prompt = get_prompt("enhance_description")                       │
│ formatted = prompt.format(                                       │
│   title=...,                                                     │
│   company_or_project=...,                                        │
│   current_bullets=...,                                           │
│   suggestions=...                                                │
│ )                                                                │
│ result = await complete_json(formatted)                          │
└──────────────────────────────────────────────────────────────────┘

PROMPT: enhance_description
PURPOSE: Rewrite bullet points based on AI suggestions
INPUT: Item title, company/project name, current bullets, suggestions
OUTPUT: JSON array of enhanced bullet points
```

---

### 7-10. Section Regeneration → `regenerate_*`

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Regenerate" button on a section              │
│ Page: /builder?id=xxx (Resume form)                              │
│ Sections: Summary, Experience, Projects, Skills                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/v1/resumes/{id}/regenerate-section                     │
│ File: routers/resumes.py → regenerate_resume_section()           │
│ Body: { section_type: "summary"|"experience"|"project"|"skills" }│
└──────────────────────┬───────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┬────────────┬────────────┐
          │            │            │            │            │
          ▼            ▼            ▼            ▼            │
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ summary     │ │ experience  │ │ project     │ │ skills      │
│             │ │             │ │             │ │             │
│ regenerate_ │ │ regenerate_ │ │ regenerate_ │ │ regenerate_ │
│ summary()   │ │ experience()│ │ project()   │ │ skills()    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
       │               │               │               │
       ▼               ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────┐
│ services/section_regenerator.py                                  │
│                                                                  │
│ prompt = get_prompt("regenerate_summary")  # or experience, etc. │
│ formatted = prompt.format(                                       │
│   current_content=...,                                           │
│   context=...,           # optional: job_description, role, tone │
│   job_description=...    # optional                              │
│ )                                                                │
│ result = await complete(formatted) or complete_json(formatted)   │
└──────────────────────────────────────────────────────────────────┘
```

| Prompt | Purpose | Input | Output |
|--------|---------|-------|--------|
| `regenerate_summary` | Rewrite professional summary | Current summary, context | New summary text |
| `regenerate_experience` | Rewrite experience bullets | Title, company, duration, bullets, context | New bullets array |
| `regenerate_project` | Rewrite project description | Title, technologies, bullets, context | New bullets array |
| `regenerate_skills` | Reorganize/enhance skills | Current skills, context | New skills array |

---

## File Reference

### Prompts Location

| Prompt | Default Location |
|--------|------------------|
| `parse_resume` | `app/prompts/templates.py` |
| `extract_keywords` | `app/prompts/templates.py` |
| `improve_resume` | `app/prompts/templates.py` |
| `cover_letter` | `app/prompts/templates.py` |
| `outreach_message` | `app/prompts/templates.py` |
| `analyze_resume` | `app/prompts/enrichment.py` |
| `enhance_description` | `app/prompts/enrichment.py` |
| `regenerate_summary` | `app/prompts/sections.py` |
| `regenerate_experience` | `app/prompts/sections.py` |
| `regenerate_project` | `app/prompts/sections.py` |
| `regenerate_skills` | `app/prompts/sections.py` |

### Service Files

| Service | File | Prompts Used |
|---------|------|--------------|
| Resume Parser | `app/services/parser.py` | `parse_resume` |
| Resume Improver | `app/services/improver.py` | `extract_keywords`, `improve_resume` |
| Cover Letter | `app/services/cover_letter.py` | `cover_letter`, `outreach_message` |
| Section Regenerator | `app/services/section_regenerator.py` | `regenerate_*` |
| Enrichment | `app/routers/enrichment.py` | `analyze_resume`, `enhance_description` |

---

## When Are Prompts NOT Used?

These actions do NOT trigger any AI prompts:

| Action | Why No Prompt |
|--------|---------------|
| View/Edit resume manually | Direct database read/write |
| Download PDF | Frontend rendering + Playwright screenshot |
| Save changes | Direct database update |
| Delete resume | Database delete |
| Change template/formatting | CSS/UI only |
| View JD Match keywords | Uses pre-extracted keywords, no new LLM call |

---

## Prompt Dependencies

Some features use multiple prompts in sequence:

```
Tailor Resume Flow:
  1. extract_keywords (get job keywords)
  2. improve_resume (tailor using keywords)
  3. [optional] cover_letter (if enabled)
  4. [optional] outreach_message (if enabled)

Enrichment Flow:
  1. analyze_resume (find weak points)
  2. enhance_description (improve selected items)
```

---

## Testing a Prompt Change

To verify your prompt modification works:

1. **Edit prompt** in Settings → AI Prompts
2. **Trigger the action** from the table above
3. **Check result** - the output should reflect your prompt changes

Example: Modify `parse_resume` → Upload a new resume → Check if parsed JSON matches your expected format
