'use client';

import React, { useState, useCallback } from 'react';
import {
  ResumeData,
  PersonalInfo,
  AdditionalInfo,
  SectionMeta,
  SectionType,
  CustomSection,
} from '@/components/dashboard/resume-component';
import { PersonalInfoForm } from './forms/personal-info-form';
import { SummaryForm } from './forms/summary-form';
import { ExperienceForm } from './forms/experience-form';
import { EducationForm } from './forms/education-form';
import { ProjectsForm } from './forms/projects-form';
import { AdditionalForm } from './forms/additional-form';
import { SectionHeader } from './section-header';
import { GenericTextForm } from './forms/generic-text-form';
import { GenericItemForm } from './forms/generic-item-form';
import { GenericListForm } from './forms/generic-list-form';
import { AddSectionButton } from './add-section-dialog';
import { RegenerateButton } from './regenerate-button';
import { regenerateSection, RegenerateSectionRequest } from '@/lib/api/regenerate';
import {
  getSectionMeta,
  getAllSections,
  createCustomSection,
  DEFAULT_SECTION_META,
} from '@/lib/utils/section-helpers';

// Sections that support regeneration
const REGENERATABLE_SECTIONS = ['summary', 'workExperience', 'personalProjects', 'additional'];

// Map section keys to section types for API
const SECTION_TYPE_MAP: Record<string, 'summary' | 'experience' | 'projects' | 'skills'> = {
  summary: 'summary',
  workExperience: 'experience',
  personalProjects: 'projects',
  additional: 'skills',
};

interface ResumeFormProps {
  resumeData: ResumeData;
  onUpdate: (data: ResumeData) => void;
  resumeId?: string | null;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({ resumeData, onUpdate, resumeId }) => {
  // Regeneration state
  const [regenerating, setRegenerating] = useState<string | null>(null);

  // Get section metadata, falling back to defaults
  const allSections = getSectionMeta(resumeData);
  // Use getAllSections for form - shows ALL sections including hidden ones
  // (Hidden sections are editable but marked with visual indicator)
  const sortedAllSections = getAllSections(resumeData);

  // Handle regeneration request
  const handleRegenerate = useCallback(
    async (
      sectionKey: string,
      context?: {
        job_description?: string;
        target_role?: string;
        target_industry?: string;
        tone?: string;
        length?: string;
      }
    ): Promise<void> => {
      if (!resumeId) {
        throw new Error('Resume must be saved before regenerating sections');
      }

      const sectionType = SECTION_TYPE_MAP[sectionKey];
      if (!sectionType) {
        throw new Error(`Section ${sectionKey} does not support regeneration`);
      }

      setRegenerating(sectionKey);

      try {
        // Build context string from additional parameters
        const contextParts: string[] = [];
        if (context?.target_role) contextParts.push(`Target role: ${context.target_role}`);
        if (context?.target_industry)
          contextParts.push(`Target industry: ${context.target_industry}`);
        if (context?.tone) contextParts.push(`Tone: ${context.tone}`);
        if (context?.length) contextParts.push(`Length: ${context.length}`);

        const request: RegenerateSectionRequest = {
          section_type: sectionType,
          context: contextParts.length > 0 ? contextParts.join('. ') : undefined,
          job_description: context?.job_description,
        };

        const response = await regenerateSection(resumeId, request);

        // Apply the regenerated content to the resume data
        switch (sectionKey) {
          case 'summary':
            if (response.regenerated_content && typeof response.regenerated_content === 'string') {
              onUpdate({ ...resumeData, summary: response.regenerated_content });
            }
            break;
          case 'workExperience':
            if (response.regenerated_content && Array.isArray(response.regenerated_content)) {
              onUpdate({ ...resumeData, workExperience: response.regenerated_content });
            }
            break;
          case 'personalProjects':
            if (response.regenerated_content && Array.isArray(response.regenerated_content)) {
              onUpdate({ ...resumeData, personalProjects: response.regenerated_content });
            }
            break;
          case 'additional':
            if (response.regenerated_content && typeof response.regenerated_content === 'object') {
              onUpdate({
                ...resumeData,
                additional: response.regenerated_content as AdditionalInfo,
              });
            }
            break;
        }
      } finally {
        setRegenerating(null);
      }
    },
    [resumeId, resumeData, onUpdate]
  );

  // Check if section supports regeneration
  const canRegenerate = useCallback(
    (sectionKey: string): boolean => {
      return REGENERATABLE_SECTIONS.includes(sectionKey) && Boolean(resumeId);
    },
    [resumeId]
  );

  // Handle section metadata updates
  const handleSectionMetaUpdate = (sections: SectionMeta[]) => {
    onUpdate({
      ...resumeData,
      sectionMeta: sections,
    });
  };

  // Handle adding a new custom section
  const handleAddSection = (displayName: string, sectionType: SectionType) => {
    const newSection = createCustomSection(allSections, displayName, sectionType);

    // Initialize section metadata if not present
    const currentMeta = resumeData.sectionMeta?.length
      ? resumeData.sectionMeta
      : DEFAULT_SECTION_META;

    // Initialize custom section data
    const newCustomSection: CustomSection = {
      sectionType,
      text: sectionType === 'text' ? '' : undefined,
      items: sectionType === 'itemList' ? [] : undefined,
      strings: sectionType === 'stringList' ? [] : undefined,
    };

    onUpdate({
      ...resumeData,
      sectionMeta: [...currentMeta, newSection],
      customSections: {
        ...resumeData.customSections,
        [newSection.key]: newCustomSection,
      },
    });
  };

  // Handler for section rename
  const handleRename = (sectionId: string, newName: string) => {
    const updatedSections = allSections.map((s) =>
      s.id === sectionId ? { ...s, displayName: newName } : s
    );
    handleSectionMetaUpdate(updatedSections);
  };

  // Handler for section delete
  const handleDelete = (sectionId: string) => {
    const section = allSections.find((s) => s.id === sectionId);
    if (!section) return;

    if (section.isDefault) {
      // For default sections, just hide them
      handleToggleVisibility(sectionId);
    } else {
      // For custom sections, remove from both sectionMeta and customSections
      const updatedSections = allSections.filter((s) => s.id !== sectionId);
      const updatedCustomSections = { ...resumeData.customSections };
      delete updatedCustomSections[section.key];

      onUpdate({
        ...resumeData,
        sectionMeta: updatedSections,
        customSections: updatedCustomSections,
      });
    }
  };

  // Handler for section visibility toggle
  const handleToggleVisibility = (sectionId: string) => {
    const updatedSections = allSections.map((s) =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    handleSectionMetaUpdate(updatedSections);
  };

  // Handler for moving section up
  const handleMoveUp = (sectionId: string) => {
    const sorted = [...allSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === sectionId);
    if (index <= 0 || sorted[index - 1].id === 'personalInfo') return;

    const current = sorted[index];
    const above = sorted[index - 1];
    const updatedSections = allSections.map((s) => {
      if (s.id === current.id) return { ...s, order: above.order };
      if (s.id === above.id) return { ...s, order: current.order };
      return s;
    });
    handleSectionMetaUpdate(updatedSections);
  };

  // Handler for moving section down
  const handleMoveDown = (sectionId: string) => {
    const sorted = [...allSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === sectionId);
    if (index < 0 || index >= sorted.length - 1) return;

    const current = sorted[index];
    const below = sorted[index + 1];
    const updatedSections = allSections.map((s) => {
      if (s.id === current.id) return { ...s, order: below.order };
      if (s.id === below.id) return { ...s, order: current.order };
      return s;
    });
    handleSectionMetaUpdate(updatedSections);
  };

  // Render default section forms
  const renderDefaultSection = (section: SectionMeta, isFirst: boolean, isLast: boolean) => {
    const isPersonalInfo = section.id === 'personalInfo';

    // Render content based on section key
    const renderContent = () => {
      switch (section.key) {
        case 'personalInfo':
          return (
            <PersonalInfoForm
              data={resumeData.personalInfo || ({} as PersonalInfo)}
              onChange={(data) => onUpdate({ ...resumeData, personalInfo: data })}
            />
          );

        case 'summary':
          return (
            <SummaryForm
              value={resumeData.summary || ''}
              onChange={(value) => onUpdate({ ...resumeData, summary: value })}
            />
          );

        case 'workExperience':
          return (
            <ExperienceForm
              data={resumeData.workExperience || []}
              onChange={(data) => onUpdate({ ...resumeData, workExperience: data })}
            />
          );

        case 'education':
          return (
            <EducationForm
              data={resumeData.education || []}
              onChange={(data) => onUpdate({ ...resumeData, education: data })}
            />
          );

        case 'personalProjects':
          return (
            <ProjectsForm
              data={resumeData.personalProjects || []}
              onChange={(data) => onUpdate({ ...resumeData, personalProjects: data })}
            />
          );

        case 'additional':
          return (
            <AdditionalForm
              data={
                resumeData.additional || {
                  technicalSkills: [],
                  languages: [],
                  certificationsTraining: [],
                  awards: [],
                }
              }
              onChange={(data) => onUpdate({ ...resumeData, additional: data })}
            />
          );

        default:
          return null;
      }
    };

    // PersonalInfo is special - render without wrapper
    if (isPersonalInfo) {
      return renderContent();
    }

    // Create regeneration button for supported sections
    const regenerateButton = canRegenerate(section.key) ? (
      <RegenerateButton
        sectionType={SECTION_TYPE_MAP[section.key]}
        onRegenerate={(context) => handleRegenerate(section.key, context)}
        disabled={regenerating === section.key}
      />
    ) : undefined;

    // Other default sections get SectionHeader with visibility/reorder controls
    // The form components provide their own container styling
    return (
      <SectionHeader
        section={section}
        onRename={(name) => handleRename(section.id, name)}
        onDelete={() => handleDelete(section.id)}
        onMoveUp={() => handleMoveUp(section.id)}
        onMoveDown={() => handleMoveDown(section.id)}
        onToggleVisibility={() => handleToggleVisibility(section.id)}
        isFirst={isFirst}
        isLast={isLast}
        canDelete={true}
        extraActions={regenerateButton}
      >
        {renderContent()}
      </SectionHeader>
    );
  };

  // Render custom section forms
  const renderCustomSection = (section: SectionMeta, isFirst: boolean, isLast: boolean) => {
    const customSection = resumeData.customSections?.[section.key];

    const updateCustomSection = (updates: Partial<CustomSection>) => {
      onUpdate({
        ...resumeData,
        customSections: {
          ...resumeData.customSections,
          [section.key]: {
            ...customSection,
            sectionType: section.sectionType,
            ...updates,
          } as CustomSection,
        },
      });
    };

    const renderContent = () => {
      switch (section.sectionType) {
        case 'text':
          return (
            <GenericTextForm
              value={customSection?.text || ''}
              onChange={(value) => updateCustomSection({ text: value })}
              label="Content"
              placeholder={`Enter ${section.displayName.toLowerCase()} content...`}
            />
          );

        case 'itemList':
          return (
            <GenericItemForm
              items={customSection?.items || []}
              onChange={(items) => updateCustomSection({ items })}
              itemLabel="Entry"
              addLabel="Add Entry"
            />
          );

        case 'stringList':
          return (
            <GenericListForm
              items={customSection?.strings || []}
              onChange={(strings) => updateCustomSection({ strings })}
              label="Items"
              placeholder="Enter items, one per line"
            />
          );

        default:
          return <div className="text-gray-500">Unknown section type</div>;
      }
    };

    return (
      <SectionHeader
        section={section}
        onRename={(name) => handleRename(section.id, name)}
        onDelete={() => handleDelete(section.id)}
        onMoveUp={() => handleMoveUp(section.id)}
        onMoveDown={() => handleMoveDown(section.id)}
        onToggleVisibility={() => handleToggleVisibility(section.id)}
        isFirst={isFirst}
        isLast={isLast}
        canDelete={true}
      >
        {renderContent()}
      </SectionHeader>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {sortedAllSections.map((section, index) => {
        const isFirst = index === 0 || section.id === 'personalInfo';
        const isLast = index === sortedAllSections.length - 1;

        if (section.isDefault) {
          return <div key={section.id}>{renderDefaultSection(section, isFirst, isLast)}</div>;
        } else {
          return <div key={section.id}>{renderCustomSection(section, isFirst, isLast)}</div>;
        }
      })}

      {/* Add Section Button */}
      <AddSectionButton onAdd={handleAddSection} />
    </div>
  );
};
