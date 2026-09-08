import { Alert, Card } from 'antd';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { RequirementChecklist } from '../../components/archive/RequirementChecklist';

export function ProjectPublicArchivePage() {
  const state = useAppStore();
  const requirements = state.archiveRequirements.filter((item) => item.ownerType === 'PROJECT_PUBLIC');
  const editable = canPerform(state.currentUser!, state.roles, 'archive.public.submit');
  return <>
    <PageHeader title="重点项目公共材料" description="来源于国家归档清单中项目牵头/承担单位责任项，由科研助理提交、项目技术负责人终审。" />
    <Alert type="info" showIcon message="同一清单项若项目和课题均有责任，将分别生成任务，不能用一份材料相互冲抵。" style={{ marginBottom: 16 }} />
    <Card><RequirementChecklist requirements={requirements} ownerType="PROJECT_PUBLIC" ownerId={state.project.id} editable={editable} /></Card>
  </>;
}
