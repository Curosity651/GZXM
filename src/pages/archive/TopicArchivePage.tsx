import { Card, Select, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, canViewAllTopicUnitData } from '../../domain/topic-access';
import { RequirementChecklist } from '../../components/archive/RequirementChecklist';

export function TopicArchivePage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const availableTopics = accessibleTopics(user, state.topics, state.topicMemberships);
  const [topicId, setTopicId] = useState(availableTopics[0]?.id);
  const members = state.topicMemberships.filter((item) => item.topicId === topicId && item.enabled);
  const visibleMembers = useMemo(() => canViewAllTopicUnitData(user, topicId ?? '', state.topicMemberships) ? members : members.filter((item) => item.unitId === user.unitId), [members, state.topicMemberships, topicId, user]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>();
  const unitId = visibleMembers.some((item) => item.unitId === selectedUnitId) ? selectedUnitId : visibleMembers[0]?.unitId;
  const requirements = state.archiveRequirements.filter((item) => item.ownerType === 'TOPIC_NATIONAL');
  const editable = canPerform(user, state.roles, 'archive.topic.submit') && unitId === user.unitId;
  const selectedMembership = visibleMembers.find((item) => item.unitId === unitId);
  return <>
    <Card title={<Space wrap>课题<Select value={topicId} onChange={(value) => { setTopicId(value); setSelectedUnitId(undefined); }} style={{ width: 360 }} options={availableTopics.map((topic) => ({ label: `${topic.code} ${topic.name}`, value: topic.id }))} />提交单位<Select value={unitId} onChange={setSelectedUnitId} style={{ width: 260 }} options={visibleMembers.map((member) => ({ label: state.units.find((item) => item.id === member.unitId)?.name ?? member.unitId, value: member.unitId }))} />{selectedMembership && <Tag color={selectedMembership.membershipType === 'LEAD' ? 'blue' : 'cyan'}>{selectedMembership.membershipType === 'LEAD' ? '牵头单位' : '承担单位'}</Tag>}</Space>}>
      {topicId && unitId && <RequirementChecklist requirements={requirements} ownerType="TOPIC_NATIONAL" ownerId={`${topicId}:${unitId}`} topicId={topicId} unitId={unitId} editable={editable} />}
    </Card>
  </>;
}
