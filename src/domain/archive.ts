import type { ArchiveRequirement, ArchiveSubmission } from '../types';

export interface ArchiveCompletion {
  required: number;
  completed: number;
  rate: number;
}

export function archiveCompletion(
  requirements: ArchiveRequirement[],
  submissions: ArchiveSubmission[],
): ArchiveCompletion {
  const submissionByRequirement = new Map(submissions.map((item) => [item.requirementId, item]));
  const applicableRequirements = requirements.filter((requirement) => {
    if (requirement.requirementKind !== 'CONDITIONAL') return true;
    return submissionByRequirement.get(requirement.id)?.applicability === 'APPLICABLE';
  });
  const completed = applicableRequirements.filter(
    (requirement) => ['已通过', '已归档'].includes(submissionByRequirement.get(requirement.id)?.status ?? ''),
  ).length;
  const required = applicableRequirements.length;
  return {
    required,
    completed,
    rate: required === 0 ? 100 : Math.round((completed / required) * 100),
  };
}

export function validateNonApplicable(submission: Pick<ArchiveSubmission, 'applicability' | 'nonApplicableReason'>): boolean {
  return submission.applicability !== 'NOT_APPLICABLE' || Boolean(submission.nonApplicableReason?.trim());
}
