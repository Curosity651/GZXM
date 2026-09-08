import { Empty, Timeline, Typography } from 'antd';
import type { ApprovalRecord, User } from '../../types';

const { Text } = Typography;

export function ApprovalTimeline({ records, users }: { records: ApprovalRecord[]; users: User[] }) {
  if (!records.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无审批记录" />;
  const userMap = Object.fromEntries(users.map((user) => [user.id, user.name]));
  return <Timeline items={[...records].reverse().map((record) => ({
    color: record.decision === 'APPROVED' ? 'green' : 'red',
    children: <div><Text strong>{record.level === 'INITIAL' ? '初审' : '终审'} · {record.decision === 'APPROVED' ? '通过' : '退回修改'}</Text><div><Text type="secondary">{userMap[record.operatorId] ?? record.operatorId} · {record.operatedAt.replace('T', ' ').slice(0, 16)}</Text></div><div>{record.opinion || '无审批意见'}</div></div>,
  }))} />;
}
