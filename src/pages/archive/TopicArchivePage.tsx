import { Alert, Card, Select, Space } from 'antd';
import { useState } from 'react';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { RequirementChecklist } from '../../components/archive/RequirementChecklist';

export function TopicArchivePage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const availableTopics = user.role === '课题牵头单位' ? state.topics.filter((item) => item.id === user.topicId) : state.topics;
  const [topicId, setTopicId] = useState(availableTopics[0]?.id);
  const requirements = state.archiveRequirements.filter((item) => item.ownerType === 'TOPIC_NATIONAL');
  const editable = canPerform(user.role, 'archive.topic.submit') && topicId === user.topicId;
  return <>
    <PageHeader title="课题国家材料" description="每个课题独立生成国家归档任务，由课题牵头单位统一收集并提交。" />
    <Alert type="warning" showIcon message="课题参与单位不设置账号，其材料由课题牵头单位统一提交；终审通过后才计入完成率。" style={{ marginBottom: 16 }} />
    <Card title={<Space>查看课题<Select value={topicId} onChange={setTopicId} style={{ width: 360 }} options={availableTopics.map((topic) => ({ label: `${topic.code} ${topic.name}`, value: topic.id }))} /></Space>}>
      {topicId && <RequirementChecklist requirements={requirements} ownerType="TOPIC_NATIONAL" ownerId={topicId} topicId={topicId} editable={editable} />}
    </Card>
  </>;
}
