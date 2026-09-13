import type { ArchiveRequirement, ArchiveSubmission } from '../types';

export interface ArchiveCompletion {
  required: number;
  completed: number;
  rate: number;
}

export function isArchiveRequirementComplete(
  requirement: ArchiveRequirement,
  submission?: ArchiveSubmission,
): boolean {
  const uploadedCount = submission?.fileIds?.length ?? 0;
  const hasRequiredFiles = uploadedCount >= Math.max(requirement.requiredQuantity || 1, 1);
  if (!hasRequiredFiles) return false;
  if (requirement.ownerType === 'PROJECT_PUBLIC') {
    return ['已通过', '已归档'].includes(submission?.status ?? '');
  }
  return true;
}

export function archiveCompletion(
  requirements: ArchiveRequirement[],
  submissions: ArchiveSubmission[],
): ArchiveCompletion {
  const submissionByRequirement = new Map(submissions.map((item) => [item.requirementId, item]));
  const requiredRequirements = requirements.filter((requirement) => {
    if (requirement.requirementKind !== 'CONDITIONAL') return true;
    if (requirement.ownerType !== 'PROJECT_PUBLIC') return false;
    return submissionByRequirement.get(requirement.id)?.applicability === 'APPLICABLE';
  });
  const completed = requiredRequirements.filter((requirement) => isArchiveRequirementComplete(requirement, submissionByRequirement.get(requirement.id))).length;
  const required = requiredRequirements.length;
  return {
    required,
    completed,
    rate: required === 0 ? 100 : Math.round((completed / required) * 100),
  };
}

export function validateNonApplicable(submission: Pick<ArchiveSubmission, 'applicability' | 'nonApplicableReason'>): boolean {
  return submission.applicability !== 'NOT_APPLICABLE' || Boolean(submission.nonApplicableReason?.trim());
}
